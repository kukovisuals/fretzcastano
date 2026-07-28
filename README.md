# KuKo Visuals — Shader Archive

A gallery site for your public Shadertoy shaders (currently 417). Vite + React, deploys to Vercel as a static site. It also hosts a small **Tutorials** section of standalone HTML explainers.

## How it works

- `scripts/prepare-data.mjs` splits your raw Shadertoy export into:
  - `public/data/index.json` — small metadata list the grid loads once (includes a `chars` field = total source length per shader)
  - `public/data/shaders/<id>.json` — full shader data, fetched **only when you click a shader**
- **Thumbnails are rendered locally** from each shader (a few warm-up frames on a hidden canvas), so nothing is fetched from Shadertoy's CDN. A one-at-a-time queue keeps the grid smooth.
- Clicking a card opens a sizable modal (max width 1280px, never full-screen). The canvas has a hard **3-megapixel budget** — on 4K/5K monitors it renders at a reduced internal resolution and scales up, so it stays fast everywhere.
- Multipass shaders (Buffer A–D + Common) run with ping-pong float buffers. Sound passes are skipped (visual only). **Texture channels load from a local `public/textures/` folder**, with a noise fallback if a slot has no image yet.
- The toolbar has **search**, a **tag dropdown** (every tag you've used), a **length filter** (by total source size), and **sort** options. A row of popular-tag chips gives one-click filtering.
- A top nav switches between **Home** (the gallery) and **Tutorials** (an auto-generated grid — see below).

## Adding tomorrow's shader (no rebuild)

Click **＋ Add shader** in the toolbar and pick a JSON file. Accepted formats:

- a single shader object — `{ ver, info, renderpass }`
- a Shadertoy API response — `{ "Shader": { ... } }`
- a full export — `{ "shaders": [ ... ] }` (only ids not already in the gallery are added)

Added shaders get a `local` chip, render their own thumbnail, and play like the rest. They live in that browser's localStorage — for a permanent deploy, drop the fresh export in the project root and re-run:

```bash
node scripts/prepare-data.mjs shaders_public.json
```

then commit `public/data` and push.

## Run locally

```bash
npm install
npm run prepare-data          # uses ./shaders_public.json (already done for you)
npm run dev
```

To refresh with a new export, drop the new file in the project root as `shaders_public.json` and re-run:

```bash
node scripts/prepare-data.mjs path/to/your-export.json
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or push the folder to GitHub and import the repo at vercel.com — it auto-detects Vite. No environment variables needed. The `public/data` and `public/textures` folders ship with the build, so commit them.

## Notes

- `npm run build` outputs to `dist/`.
- If a shader fails to compile in the browser (WebGL2 vs Shadertoy driver differences), the modal shows the first compiler error line and a link to open it on Shadertoy instead.

---

# Documentation

This section explains how the site is put together so anyone can change or extend it. Nothing here requires touching a backend — it's a static single-page app.

## Architecture at a glance

- **Static SPA.** Vite bundles a React app; Vercel serves the built files. No server, no database, no router.
- **Two views**, toggled by a single piece of state in `App.jsx`:
  - `home` — the shader gallery (search, filters, grid, player modal).
  - `tutorials` — an auto-generated grid of HTML tutorials.
- **Data is prepared at build time**, not at runtime. `prepare-data.mjs` turns one big export into many small files the browser can load on demand.

## Data pipeline — `scripts/prepare-data.mjs`

Run manually (`npm run prepare-data`) whenever the shader export changes. It:

1. Reads `shaders_public.json` (the raw Shadertoy export).
2. Writes `public/data/index.json` — one lightweight entry per shader: `id, name, description, date, viewed, likes, tags, passes, hasSound, chars`. The grid loads only this file first.
3. Writes `public/data/shaders/<id>.json` — the full shader, fetched lazily when opened.
4. **Rewrites every texture input** from a Shadertoy media path to a local slot (`/textures/textureN.ext`), so the app never calls Shadertoy.
5. Scaffolds `public/textures/` with a `manifest.json` and `README.txt` listing which slot replaced which original file. It never deletes textures you've added.

## File map

| File | Responsibility |
| --- | --- |
| `src/main.jsx` | React entry point; mounts `<App/>`. |
| `src/App.jsx` | Top-level state, nav menu, view switching, toolbar + filters, grid, wires the player modal. |
| `src/components/ShaderCard.jsx` | One grid tile: renders a local thumbnail, shows day/likes/views/char count, opens the modal. |
| `src/components/PlayerModal.jsx` | The player: lazy-loads full shader data, drives the renderer, prev/next, play/pause/restart, fps readout. |
| `src/components/Tutorials.jsx` | The tutorials grid; maps over auto-discovered HTML files. |
| `src/lib/shadertoyRenderer.js` | The WebGL2 runtime that actually plays a shader (see below). |
| `src/lib/thumbs.js` | Local thumbnail generator + a one-at-a-time render queue with caching. |
| `src/lib/localShaders.js` | "＋ Add shader" support: parse/store user shaders in localStorage, unified `loadShader(id)`. |
| `src/lib/tutorials.js` | Auto-discovers tutorial HTML files at build time and extracts their titles/descriptions. |
| `src/tutorials/*.html` | The tutorial pages themselves (standalone, self-styled). |
| `src/styles.css` | All app styling and the color/theme variables. |
| `scripts/prepare-data.mjs` | The build-time data pipeline described above. |
| `public/data/` | Generated shader metadata + per-shader files. |
| `public/textures/` | Local texture slots (+ manifest/README). |

## The Home view — `App.jsx`

All gallery behavior lives here. Key state:

- `view` — `"home"` or `"tutorials"`.
- `query` — the search box text.
- `tag` — the currently selected tag (or `null`).
- `charBucket` — the selected source-length bucket key (or `""` for any).
- `sort` — one of `newest / oldest / likes / views`.
- `openId` — the id of the shader open in the modal (or `null`).
- `locals`, `notice` — user-added shaders and the little status line.

Derived values:

- `allShaders` — user-added shaders merged with the static index.
- `allTags` — every unique tag with a count (feeds the tag dropdown); `topTags` is the first 14 (feeds the chip row).
- `visible` — `allShaders` after applying tag + length + search filters, then sorted.

The modal is rendered with `key={open.id}`. **This key matters:** it forces a fresh `<canvas>` for each shader so the WebGL context is never reused (reusing it was the old "next button" bug).

### Filtering & sorting

- **Search** matches name, description, and tags.
- **Tag** filter is an exact-tag match; the dropdown and the chips share the same `tag` state, so they stay in sync.
- **Length** filter uses `CHAR_BUCKETS` (defined at the top of `App.jsx`). To change the thresholds or labels, edit that object — nothing else needs to change.
- **Sort** functions live in the `SORTS` object at the top of `App.jsx`.

## The player & renderer

`PlayerModal` lazy-loads the full shader via `loadShader(id)`, then constructs a `ShadertoyRenderer` on its canvas. The renderer (`src/lib/shadertoyRenderer.js`) is a compact WebGL2 runtime. In plain terms it:

- Compiles each render pass and links the standard Shadertoy uniforms (time, frame, mouse, date, resolution, channel info).
- Runs **Buffer A–D** passes with **ping-pong** textures (each frame reads the previous frame's result) and injects the **Common** pass into every program.
- Loads **texture channels from the local `/textures` folder**; if a slot has no image, it uses a small procedural noise texture so the shader still runs.
- Enforces a **3-megapixel budget** so large displays don't tank performance.
- **Skips sound passes** — playback is visual only.
- Reports compile/link errors through an `onError` callback, which the modal surfaces as the first error line.

If you want to change the resolution budget, edit `MAX_PIXELS` in `PlayerModal.jsx`. If you want more warm-up frames for thumbnails, edit `WARMUP_FRAMES` in `thumbs.js`.

## Thumbnails — `thumbs.js`

- Every card asks `getLiveThumb(id)` when it mounts.
- A shared **queue renders one thumbnail at a time** on an off-screen canvas, snapshots it to a JPEG data URL, tears the context down, then moves on. This keeps a 400+ card grid from spawning hundreds of WebGL contexts.
- Results are **cached in memory** for the session; failures fall back to a "▶ run live" tile.

## The Tutorials view

- The grid is built **automatically** from whatever `.html` files sit in `src/tutorials/`.
- `src/lib/tutorials.js` uses Vite's `import.meta.glob` to discover those files at build time, reads each file's `<title>`, `<meta name="description">`, and optional `<meta name="tag">`, and produces a card entry with a link to the built page.
- **To add a tutorial:** drop a new `.html` into `src/tutorials/`, rebuild, and a card appears — no list to maintain. Cards open the page in a new tab.
- The nav "Tutorials ▾" dropdown lists the same files for direct access; clicking the word "Tutorials" shows the grid.

## Common changes (recipes)

- **Add a shader permanently:** put the export at project root, run `npm run prepare-data`, commit `public/data`.
- **Add a tutorial:** drop `foo.html` in `src/tutorials/`, rebuild. Give it a `<title>` and a description meta for a nicer card.
- **Add / replace a texture:** open `public/textures/README.txt`, find the slot name (e.g. `texture3.png`), drop an image with that exact filename into `public/textures/`. Missing slots render as noise.
- **Change the length-filter buckets:** edit `CHAR_BUCKETS` in `App.jsx`.
- **Change how many popular tag chips show:** edit the `slice(0, 14)` in `topTags` in `App.jsx`.
- **Change colors or fonts:** edit the theme variables in `src/styles.css` (`--ink`, `--surface`, `--line`, `--bone`, `--dim`, `--membrane`, `--rim`). Fonts are loaded in `index.html`.
- **Change the resolution budget:** edit `MAX_PIXELS` in `PlayerModal.jsx`.

## Styling

- The whole app is themed by a handful of CSS variables at the top of `src/styles.css`: `--ink` (background), `--surface`, `--line`, `--bone` (text), `--dim` (muted text), `--membrane` (accent), `--rim` (secondary accent).
- The grid, cards, toolbar, filters, nav dropdown, tutorial cards, and modal each have their own clearly-labelled section in `styles.css`.
- **Tutorial pages are standalone** — each `.html` in `src/tutorials/` carries its own inline styles and doesn't inherit the app's CSS.

## Gotchas

- **Texture filenames are exact**, including the extension — match the names in `public/textures/README.txt`.
- **User-added shaders live in localStorage**, so they're per-browser and temporary. Re-run the data pipeline to make any shader permanent.
- **One shader per canvas:** the modal deliberately remounts (`key={open.id}`) so each shader gets a clean WebGL context. Don't remove that key.
- **Re-running the pipeline is safe for textures** — it rewrites the manifest/README but never deletes images you've dropped in.
