// shaders.js  (vanilla JS + Vite)
// Collect all ./shaders/day-*.frag as raw strings at build time.
const files = import.meta.glob('./day-*.frag', { as: 'raw', eager: true });


// turn "./shaders/day-00001.frag" -> "day-00001"
const toId = (p) => p.split('/').pop().replace('.frag', '');
const entries = Object.entries(files).map(([p, src]) => [toId(p), src]);

// Main map: { "day-00001": "<GLSL string>", ... }
export const fragmentMap = Object.fromEntries(entries);
console.log(fragmentMap)
// Helpers for ordering & navigation
const dayNum = (id) => Number((id.match(/day-(\d+)/) || [])[1] || 0);
export const idsAsc  = Object.keys(fragmentMap).sort((a, b) => dayNum(a) - dayNum(b));
export const idsDesc = [...idsAsc].reverse();
export const latestId = idsDesc[0];

export const get     = (id) => fragmentMap[id];
export const nextId  = (id) => {
  const i = idsAsc.indexOf(id);
  return i >= 0 && i < idsAsc.length - 1 ? idsAsc[i + 1] : null;
};
export const prevId  = (id) => {
  const i = idsAsc.indexOf(id);
  return i > 0 ? idsAsc[i - 1] : null;
};

// Optional: list form if you prefer arrays elsewhere
export const list = idsAsc.map((id) => ({ id, code: fragmentMap[id] }));
