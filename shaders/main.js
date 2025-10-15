// shaders/main.js  (same folder as day-*.frag and /buffers)
/** Image (final) passes */
const files = import.meta.glob('./day-*.frag', { as: 'raw', eager: true });

/** Buffer passes (A/B/C/D) */
const bufferFiles = import.meta.glob('./buffers/day-*-{A,B,C,D}.frag', { as: 'raw', eager: true });

/** turn "./day-00001.frag" -> "day-00001" */
const toId = (p) => p.split('/').pop().replace('.frag', '');

/** parse "./buffers/day-00001-A.frag" -> { dayId:"day-00001", letter:"A" } */
const parseBufferKey = (p) => {
  const name = p.split('/').pop();
  const m = name.match(/^day-(\d{5})-([ABCD])\.frag$/i);
  if (!m) return null;
  return { dayId: `day-${m[1]}`, letter: m[2].toUpperCase() };
};

/** Build image map */
const entries = Object.entries(files).map(([p, src]) => [toId(p), src]);
export const fragmentMap = Object.fromEntries(entries);

/** Build buffers map: { "day-00001": { A: "...", B: "...", ... } } */
const buffersMap = {};
for (const [p, src] of Object.entries(bufferFiles)) {
  const meta = parseBufferKey(p);
  if (!meta) continue;
  const { dayId, letter } = meta;
  (buffersMap[dayId] ||= {})[letter] = src;
}

console.log(buffersMap)
/** Existing exports (unchanged) */
const dayNum = (id) => Number((id.match(/day-(\d+)/) || [])[1] || 0);
export const idsAsc  = Object.keys(fragmentMap).sort((a, b) => dayNum(a) - dayNum(b));
export const idsDesc = [...idsAsc].reverse();
export const latestId = idsDesc[0];

export const get = (id) => fragmentMap[id];
export const nextId = (id) => { const i = idsAsc.indexOf(id); return i >= 0 && i < idsAsc.length - 1 ? idsAsc[i + 1] : null; };
export const prevId = (id) => { const i = idsAsc.indexOf(id); return i > 0 ? idsAsc[i - 1] : null; };
export const list = idsAsc.map((id) => ({ id, code: fragmentMap[id] }));

/** Buffers for a day (if any): e.g. {A:'...', C:'...'} */
export const getBuffers = (id) => buffersMap[id] || {};
