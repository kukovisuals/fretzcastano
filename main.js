// main.js
import * as THREE from 'three';
import { get, getBuffers, latestId, nextId, prevId, idsAsc, exists} from './shaders/main.js';
import './style.css'

const pad5 = (n) => String(n).padStart(5, '0');
const coerceToId = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (s.startsWith('day-')) return s;                 // already day-00042
  const digits = s.replace(/\D+/g, '');               // keep numbers only
  if (!digits) return null;
  return `day-${pad5(digits)}`;
};

//const exists = (id) => !!get(id);
const url = new URL(location.href);
let currentId =
coerceToId(url.searchParams.get('id')) ||
coerceToId(url.searchParams.get('day')) ||
coerceToId(location.hash.replace('#','')) ||
latestId;

console.log(exists(currentId))
if (!exists(currentId)) currentId = latestId;
                      // or any id
// const imageCode = get(currentId);                   // final pass code
// const { A, B, C, D } = getBuffers(currentId);      // any that exist for this day

console.log(currentId)
// Basic Three.js setup
const canvas  = document.createElement('canvas');
const context = canvas.getContext('webgl2');      // <-- WebGL2
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer();
const renderer = new THREE.WebGLRenderer({ canvas, context });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 1;

const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
scene.add(plane);

// Shared uniforms
const common = {
  iResolution: { value: new THREE.Vector3(innerWidth, innerHeight, 1) },
  iTime: { value: 0.0 },
  iFrame: { value: 0 }
};

// ---------- Buffers + Image wiring ----------
const VERT = `void main(){ gl_Position = vec4(position,1.0); }`;

function makeRT() {
  const type =
    (renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float'))
      ? THREE.FloatType
      : THREE.HalfFloatType; // fallback

  const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {
    type,
    // format: THREE.RGBAFormat,
    // depthBuffer: false,
    // stencilBuffer: false,
  });

  return rt;
}


let mats = null; // { A?,B?,C?,D?, image }
let rts  = null; // { A?,B?,C?,D? } plain render targets (no ping-pong; add if needed)
// state
let ping = null;   // { A:{read,write,mat}, B:{...}, ... }
let imgMat = null; 

/** Build materials/render targets for a given day */
// replace your rebuild signature + first lines with:
async function rebuild(dayId) {
  // dispose previous
  if (ping) Object.values(ping).forEach(p => { p?.mat?.dispose(); p?.read?.dispose(); p?.write?.dispose(); });
  imgMat?.dispose();

  // IMPORTANT: clear live refs so the loop knows to wait
  ping = {};
  imgMat = null;

  // async fetch (used to be sync)
  const [imageCode, buffers] = await Promise.all([ get(dayId), getBuffers(dayId) ]);
  const { A, B, C, D } = buffers;
  // ...keep the rest of rebuild body the same, but use imageCode/A/B/C/D variables...
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), null);
  scene.add(quad);

  // create buffers A..D if present (with ping-pong)
  for (const [letter, code] of Object.entries({ A, B, C, D })) {
    if (!code) continue;
    const read = makeRT();
    const write = makeRT();
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: code,
      uniforms: {
        ...common,
        // IMPORTANT: sample previous frame (read.texture), render to write
        iChannel0: { value: read.texture }
      }
    });
    
    ping[letter] = { read, write, mat };
  }

  // final image: read current buffer textures (will be set each frame)
  const imgUniforms = { ...common };
  ['A','B','C','D'].forEach((k, i) => {
    if (ping[k]) imgUniforms[`iChannel${i}`] = { value: ping[k].read.texture };
  });

  imgMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: imageCode,
    uniforms: imgUniforms
  });

  // stash refs needed by render loop
  rebuild.scene = scene;
  rebuild.camera = camera;
  rebuild.quad = quad;
}

//rebuild(currentId);
(async () => {
  await show(currentId);       // preload only latest on first paint
})();
// ---------- Frame loop ----------
renderer.setAnimationLoop(() => {
  if (!imgMat || !rebuild.scene) return;
  common.iTime.value = performance.now()*0.001;
  common.iFrame.value++;

  // 1) render each buffer to its WRITE target, sampling READ (prev frame)
  for (const k of ['A','B','C','D']) {
    const p = ping[k]; if (!p) continue;
    p.mat.uniforms.iChannel0.value = p.read.texture; // prev frame
    rebuild.quad.material = p.mat;
    renderer.setRenderTarget(p.write);
    renderer.render(rebuild.scene, rebuild.camera);
    renderer.setRenderTarget(null);
  }

  // 2) SWAP read/write so "read" holds the latest frame
  for (const k of ['A','B','C','D']) {
    const p = ping[k]; if (!p) continue;
    [p.read, p.write] = [p.write, p.read];
  }

  // 3) update image uniforms to point at current READ textures
  ['A','B','C','D'].forEach((k, i) => {
    const p = ping[k]; if (!p) return;
    const u = imgMat.uniforms[`iChannel${i}`];
    if (u) u.value = p.read.texture;
  });

  // 4) draw final image to screen
  rebuild.quad.material = imgMat;
  renderer.render(rebuild.scene, rebuild.camera);
});

async function show(id) {
  const code = await get(id);
  if (!code) return;
  currentId = id;
  history.replaceState(null, '', `?id=${id}`);  // <- keeps linkable
  await rebuild(id);
}

const $in  = document.getElementById('goto-input');
const $btn = document.getElementById('goto-btn');

function jump(raw){
  const id = coerceToId(raw);
  if (id && exists(id)) {
    // keep URL in sync for sharing/back button
    history.replaceState(null, '', `?id=${id}`);
    show(id);
    if ($in) $in.value = ''; // clear
  } else {
    // optional: snap to closest existing day
    // const nearest = idsAsc.reduce((best, x)=> Math.abs(+x.slice(4)-raw)<Math.abs(+best.slice(4)-raw)?x:best, idsAsc[0]);
    // show(nearest);
    console.warn('Day not found:', raw);
  }
}

console.log('idsAsc[0..3]', idsAsc.slice(0,4));
console.log('latestId', latestId);

// after computing currentId
console.log('start currentId', currentId, 'exists?', exists(currentId));

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  common.iResolution.value.set(innerWidth, innerHeight, 1);
  rebuild(currentId); // recreate RTs/materials for new size
});


$btn?.addEventListener('click', () => jump($in?.value));
$in?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') jump($in.value);
});

// Allow direct hash navigation like #day-00100
addEventListener('hashchange', async () => {
  const id = coerceToId(location.hash.replace('#',''));
  if (id && exists(id)) await show(id);
});

document.getElementById('next')?.addEventListener('click', async () => {
  const nid = nextId(currentId);
  if (nid) await show(nid);
});
document.getElementById('prev')?.addEventListener('click', async () => {
  const pid = prevId(currentId);
  if (pid) await show(pid);
});
