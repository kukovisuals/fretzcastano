/**
 * thumbs.js
 * ---------
 * Guaranteed thumbnails, generated locally from the shader itself.
 *
 * The gallery first tries Shadertoy's CDN preview image. If that request is
 * blocked (hotlink protection, offline, etc.), the card asks this module for
 * a "live thumbnail": we fetch the shader JSON (~a few KB), render ~30 frames
 * at 480×270 on a hidden canvas, snapshot it to a JPEG data URL, tear the
 * context down, and hand the image back.
 *
 * One shared queue renders thumbnails strictly one at a time, so scrolling a
 * 393-card grid never spawns hundreds of WebGL contexts. Results are cached
 * in memory for the session.
 */
import { ShadertoyRenderer } from "./shadertoyRenderer.js";
import { loadShader } from "./localShaders.js";

const W = 480;
const H = 270;
const WARMUP_FRAMES = 30; // lets buffer/feedback shaders develop a bit

const cache = new Map(); // id -> dataURL | "failed"
const pending = new Map(); // id -> [resolve, ...]
const queue = [];
let busy = false;

/**
 * Get (or build) a locally rendered thumbnail for a shader id.
 * Resolves with a data URL, or null if the shader can't be rendered.
 */
export function getLiveThumb(id) {
  const hit = cache.get(id);
  if (hit) return Promise.resolve(hit === "failed" ? null : hit);

  return new Promise((resolve) => {
    if (pending.has(id)) {
      pending.get(id).push(resolve);
      return;
    }
    pending.set(id, [resolve]);
    queue.push(id);
    pump();
  });
}

async function pump() {
  if (busy) return;
  const id = queue.shift();
  if (!id) return;
  busy = true;

  let url = null;
  try {
    url = await renderThumb(id);
  } catch {
    url = null;
  }

  cache.set(id, url ?? "failed");
  for (const resolve of pending.get(id) ?? []) resolve(url);
  pending.delete(id);

  busy = false;
  // Yield to the main thread between jobs so scrolling stays smooth.
  setTimeout(pump, 16);
}

async function renderThumb(id) {
  const shader = await loadShader(id);
  if (!shader) return null;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  // Give it CSS size so the renderer's resize() keeps the same dimensions.
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.style.position = "fixed";
  canvas.style.left = "-9999px";
  document.body.appendChild(canvas);

  let renderer = null;
  try {
    let failed = false;
    renderer = new ShadertoyRenderer(canvas, shader, {
      manual: true,
      preserveDrawingBuffer: true,
      dpr: 1,
      maxPixels: W * H,
      onError: () => { failed = true; },
    });
    if (failed || !renderer.gl) return null;

    for (let i = 0; i < WARMUP_FRAMES; i++) renderer.step(1 / 60);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    renderer?.destroy();
    canvas.remove();
  }
}
