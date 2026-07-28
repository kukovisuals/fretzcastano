/**
 * prepare-data.mjs
 * -----------------
 * Splits the raw Shadertoy export (shaders_public.json) into:
 *
 *   public/data/index.json          -> tiny metadata list used by the gallery grid
 *   public/data/shaders/<id>.json   -> the full shader (renderpasses etc.), fetched
 *                                      ONLY when the user opens that shader.
 *
 * This keeps first-page bandwidth small: the grid loads ~60 KB of metadata
 * instead of the full 3 MB export. Shader data itself is kept 100% as-is.
 *
 * Usage:  node scripts/prepare-data.mjs [path/to/shaders_public.json]
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const inputPath = process.argv[2] ?? resolve(root, "shaders_public.json");
if (!existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  console.error("Pass the path to your Shadertoy export as an argument.");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const shaders = raw.shaders ?? [];

const outDir = resolve(root, "public/data");
const shaderDir = resolve(outDir, "shaders");
rmSync(shaderDir, { recursive: true, force: true });
mkdirSync(shaderDir, { recursive: true });

const index = shaders.map((s) => {
  const info = s.info ?? {};
  const passes = s.renderpass ?? [];
  return {
    id: info.id,
    name: info.name,
    description: info.description ?? "",
    date: Number(info.date ?? 0), // unix seconds
    viewed: info.viewed ?? 0,
    likes: info.likes ?? 0,
    tags: info.tags ?? [],
    passes: passes.filter((p) => p.type === "buffer" || p.type === "image").length,
    hasSound: passes.some((p) => p.type === "sound"),
    // total source length across every renderpass — used by the length filter
    chars: passes.reduce((n, p) => n + (p.code?.length ?? 0), 0),
  };
});

// Newest first by default
index.sort((a, b) => b.date - a.date);

// --- Local texture remap -------------------------------------------------
// Shadertoy blocks cross-origin hotlinking of /media, so we don't fetch from
// them. Every texture input is repointed at a local slot: /textures/textureN.ext
// The same original file always maps to the same slot. Drop your own images
// into public/textures/ with these names to fill them in; any slot without a
// file simply renders as noise.
const slotByPath = new Map();
let slotN = 0;
function slotFor(filepath) {
  if (slotByPath.has(filepath)) return slotByPath.get(filepath);
  slotN++;
  const ext = (filepath.match(/\.([a-z0-9]+)$/i)?.[1] ?? "png").toLowerCase();
  const rec = { slot: slotN, file: `texture${slotN}.${ext}`, original: filepath };
  slotByPath.set(filepath, rec);
  return rec;
}

for (const s of shaders) {
  for (const p of s.renderpass ?? []) {
    for (const inp of p.inputs ?? []) {
      if (
        inp.type === "texture" &&
        typeof inp.filepath === "string" &&
        inp.filepath.startsWith("/")
      ) {
        inp.filepath = `/textures/${slotFor(inp.filepath).file}`;
      }
    }
  }
}

// Scaffold public/textures/ (never wipes images you've already added).
const texturesDir = resolve(root, "public/textures");
mkdirSync(texturesDir, { recursive: true });
const manifest = [...slotByPath.values()].sort((a, b) => a.slot - b.slot);
writeFileSync(
  resolve(texturesDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
writeFileSync(
  resolve(texturesDir, "README.txt"),
  [
    "Local textures",
    "==============",
    "",
    `This build references ${manifest.length} texture slot(s). To fill a slot,`,
    "drop an image here with the exact filename listed below. Missing slots",
    "render as noise — nothing breaks.",
    "",
    ...manifest.map((m) => `  ${m.file}   (was ${m.original})`),
    "",
  ].join("\n")
);

writeFileSync(
  resolve(outDir, "index.json"),
  JSON.stringify({ userName: raw.userName, numShaders: index.length, shaders: index })
);

for (const s of shaders) {
  writeFileSync(resolve(shaderDir, `${s.info.id}.json`), JSON.stringify(s));
}

console.log(`Wrote index.json (${index.length} entries) and ${shaders.length} shader files.`);
