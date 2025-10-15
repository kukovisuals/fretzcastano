// main.js
import * as THREE from 'three';
import { get, latestId, nextId, prevId } from './shaders/main.js';
import './style.css'

let currentId = latestId;

// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 1;

// Define uniforms for shader
const uniforms = {
  iResolution: { value: new THREE.Vector3() },
  iTime: { value: 0.0 }
};

// Update the resolution uniform
function updateUniforms() {
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
}
updateUniforms();
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  updateUniforms();
});


// Create ShaderMaterial
const material = new THREE.ShaderMaterial({
  fragmentShader: get(currentId),
  uniforms,
});

// Plane geometry to display shader
const geometry = new THREE.PlaneGeometry(2, 2);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Animation loop
function animate() {
  uniforms.iTime.value += 0.01; // Update time uniform
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function show(id){
  const code = get(id);
  if (!code) return;
  currentId = id;
  material.fragmentShader = code;
  material.needsUpdate = true;
}
document.getElementById('next')?.addEventListener('click', () => {
  const nid = nextId(currentId);
  if (nid) show(nid);
});
document.getElementById('prev')?.addEventListener('click', () => {
  const pid = prevId(currentId);
  if (pid) show(pid);
});

