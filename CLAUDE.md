# CLAUDE.md

Guidance for Claude Code when working in this repository. Read this on every run and follow it.

## Project

KuKo Visuals — a gallery site for a large collection of public Shadertoy shaders (400+). It is a static single-page app: Vite bundles a React app, Vercel serves the built files. No server, no database, no router. The visual quality and smooth playback ARE the product — treat frame rate and aesthetics as requirements, not extras.

It also hosts a small Tutorials section of standalone HTML explainers.

## Tech stack

- Language: JavaScript (ES modules), React.
- Build/dev: Vite.
- Rendering: a custom WebGL2 runtime (`src/lib/shadertoyRenderer.js`). This project does NOT use Three.js and does NOT use WebGPU — do not introduce either.
- Data: prepared at build time by a script into static JSON files. No runtime backend.
- Hosting: Vercel (auto-deploys on push/merge to `main`). No environment variables needed.

## Commands

- Install: `npm install`
- Prepare data: `npm run prepare-data` (turns the raw Shadertoy export into static JSON)
- Dev server: `npm run dev`
- Production build: `npm run build` (outputs to `dist/`)

Before opening a pull request, the build must pass (`npm run build`).

## How the data pipeline works

`scripts/prepare-data.mjs` runs manually whenever the shader export changes. It reads the raw export and writes a small `index.json` (metadata the grid loads once) plus one full `shaders/<id>.json` per shader (fetched lazily on click). It also rewrites texture paths to local slots and scaffolds `public/textures/`. Commit `public/data` and `public/textures` — they ship with the build.

To add a shader permanently: put the export at the project root, run `npm run prepare-data`, then commit `public/data`.

## Workflow: mockup before code

For any new feature or visual change, do this in two passes:

1. First pass — build a simple standalone HTML mockup or a short written plan of how it will look and behave. Open it as a draft PR for review. Do NOT write production code yet.
2. Second pass — only after a human approves the mockup, implement it for real.

This gate catches direction changes before real code is written. When unsure about intent, ask in a PR comment rather than guessing.

## Code style

- ES modules with named exports. `const` by default, `let` only for real reassignment, never `var`.
- Small, single-purpose functions and components. Split a file once it mixes unrelated concerns.
- Descriptive names. No single letters except loop counters and standard math (`x`, `y`, `z`, `uv`).
- Comment the *why*, not the *what*.
- Match the style already present in a file you edit. Consistency beats preference.

## Architecture (file map)

- `src/main.jsx` — React entry, mounts `<App/>`.
- `src/App.jsx` — top-level state, nav, view switching (`home` / `tutorials`), toolbar, filters, grid, wires the player modal. Filter buckets (`CHAR_BUCKETS`) and sort functions (`SORTS`) live at the top of this file.
- `src/components/ShaderCard.jsx` — one grid tile; renders a local thumbnail, opens the modal.
- `src/components/PlayerModal.jsx` — the player; lazy-loads full shader data, drives the renderer. Resolution budget is `MAX_PIXELS` here.
- `src/components/Tutorials.jsx` — the auto-generated tutorials grid.
- `src/lib/shadertoyRenderer.js` — the WebGL2 runtime that plays a shader.
- `src/lib/thumbs.js` — local thumbnail generator + one-at-a-time render queue. Warm-up count is `WARMUP_FRAMES` here.
- `src/lib/localShaders.js` — "Add shader" support (parse/store in localStorage) + unified `loadShader(id)`.
- `src/lib/tutorials.js` — auto-discovers tutorial HTML files at build time.
- `src/tutorials/*.html` — standalone, self-styled tutorial pages.
- `src/styles.css` — all app styling and the theme variables.

## Rendering rules (WebGL2) — do not break these

These are the hard-won rules that keep the gallery fast and stable. Treat them as invariants.

- ONE shader per canvas. The modal is rendered with `key={open.id}` on purpose, so each shader gets a fresh `<canvas>` and a clean WebGL context. Never remove that key — reusing a context was the old "next button" bug.
- Never allocate inside the render loop. Create objects once and reuse them.
- Enforce the pixel budget. The canvas has a hard 3-megapixel cap so 4K/5K displays stay fast — don't remove or raise it without reason. Change it via `MAX_PIXELS`.
- Multipass shaders (Buffer A–D + Common) run with ping-pong float buffers; each frame reads the previous frame's result. Sound passes are skipped — playback is visual only.
- Tear down WebGL contexts when done, especially in the thumbnail queue. A 400+ card grid must never spawn hundreds of live contexts — that is why thumbnails render one at a time on an off-screen canvas.
- Texture channels load from the local `public/textures/` folder; a missing slot falls back to procedural noise so the shader still runs.
- Surface compile/link errors through the renderer's `onError` callback; the modal shows the first error line.

## Aesthetics

- Motion should feel intentional and eased, never linear or jerky.
- Respect `prefers-reduced-motion` where it applies.
- Theme the app only through the CSS variables at the top of `src/styles.css` (`--ink`, `--surface`, `--line`, `--bone`, `--dim`, `--membrane`, `--rim`). Don't hardcode colors that duplicate these.
- Performance is part of the aesthetic. A beautiful shader at 20fps is a failure.

## Pull requests

Include a one-line summary of what changed and why, what you tested (which pages, which browsers), and a screenshot or short clip for any visual change. Keep PRs small and scoped to one feature or fix. A human reviews and merges — the agent never merges its own PR.

## Do not

- Do not introduce Three.js, WebGPU, or any rendering library. The custom WebGL2 runtime is the design.
- Do not remove `key={open.id}` from the player modal.
- Do not add a backend, database, or router — this is a static SPA.
- Do not commit secrets or `.env` files (there are none needed).
- Do not delete textures a user has added; the data pipeline rewrites the manifest but must never delete images.
- Do not leave `console.log` debugging in committed code.
- Do not refactor unrelated code in a feature PR.