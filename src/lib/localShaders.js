/**
 * localShaders.js
 * ---------------
 * Lets you add new shaders from the site itself — no rebuild needed.
 *
 * Click "＋ Add shader", pick a JSON file, done. Accepted formats:
 *   - a single shader object            { ver, info, renderpass }
 *   - a Shadertoy API response          { Shader: {...} }
 *   - a full export                     { shaders: [...] }  (only NEW ids are added)
 *
 * Added shaders live in this browser's localStorage, render their own
 * thumbnails, and play exactly like the built-in ones. For a permanent
 * deploy, re-run `npm run prepare-data` with a fresh export and push.
 */

const KEY = "kuko-local-shaders";

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

function toMeta(shader, local = true) {
  const info = shader.info ?? {};
  const passes = shader.renderpass ?? [];
  return {
    id: info.id,
    name: info.name ?? info.id,
    description: info.description ?? "",
    date: Number(info.date ?? Math.floor(Date.now() / 1000)),
    viewed: info.viewed ?? 0,
    likes: info.likes ?? 0,
    tags: info.tags ?? [],
    passes: passes.filter((p) => p.type === "buffer" || p.type === "image").length,
    hasSound: passes.some((p) => p.type === "sound"),
    chars: passes.reduce((n, p) => n + (p.code?.length ?? 0), 0),
    local,
  };
}

function isShaderObject(o) {
  return o && typeof o === "object" && Array.isArray(o.renderpass) && o.info?.id;
}

/**
 * Merge parsed JSON into the local store.
 * @returns {{added: string[], skipped: number, error?: string}}
 */
export function addFromJson(parsed, existingIds) {
  let list = [];
  if (isShaderObject(parsed)) list = [parsed];
  else if (isShaderObject(parsed?.Shader)) list = [parsed.Shader];
  else if (Array.isArray(parsed?.shaders)) list = parsed.shaders.filter(isShaderObject);

  if (list.length === 0) {
    return { added: [], skipped: 0, error: "No shader found in that file — expected a Shadertoy JSON export." };
  }

  const store = readStore();
  const added = [];
  let skipped = 0;
  for (const shader of list) {
    const id = shader.info.id;
    if (existingIds.has(id) || store[id]) {
      skipped++;
      continue;
    }
    store[id] = shader;
    added.push(shader.info.name ?? id);
  }

  try {
    writeStore(store);
  } catch {
    return { added: [], skipped, error: "Browser storage is full — remove some local shaders or redeploy with a fresh export." };
  }
  return { added, skipped };
}

/** Gallery metadata for all locally added shaders. */
export function localMeta() {
  return Object.values(readStore()).map((s) => toMeta(s, true));
}

/** Remove one locally added shader. */
export function removeLocal(id) {
  const store = readStore();
  delete store[id];
  writeStore(store);
}

/**
 * Unified shader loader used by the player and the thumbnail queue:
 * local store first, then the static /data files.
 */
export async function loadShader(id) {
  const local = readStore()[id];
  if (local) return local;
  const res = await fetch(`/data/shaders/${id}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
