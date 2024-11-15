// main.js
import * as THREE from 'three';

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

// Shader code
const fragmentShader = `
uniform vec3 iResolution;
uniform float iTime;

const int MAX_MARCHING_STEPS = 100;
const float MIN_DIST = 0.001;
const float MAX_DIST = 100.0;
const int MAX_ITERATIONS = 10;
const float BAILOUT = 4.0;

float DE_Julia(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    vec3 c = vec3(-0.77, 0.112, 0.0);

    for (int i = 0; i < MAX_ITERATIONS; i++) {
        r = length(z);
        if (r > BAILOUT) break;

        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        float r_power = pow(r, 10.0);

        float sinTheta = sin(8.0 * theta);
        float cosTheta = cos(8.0 * theta);
        float sinPhi = sin(8.0 * phi);
        float cosPhi = cos(8.0 * phi);
        z = r_power * vec3(sinTheta * cosPhi, sinTheta * sinPhi, cosTheta) + c;

        dr = pow(r, 7.0) * 8.0 * dr + 1.0;
    }
    return 0.5 * log(r) * r / dr;
}

vec3 getNormal(vec3 p) {
    float eps = 0.0001;
    vec2 e = vec2(1.0, -1.0) * eps;

    float nx = DE_Julia(p + vec3(e.x, e.y, e.y)) - DE_Julia(p - vec3(e.x, e.y, e.y));
    float ny = DE_Julia(p + vec3(e.y, e.x, e.y)) - DE_Julia(p - vec3(e.y, e.x, e.y));
    float nz = DE_Julia(p + vec3(e.y, e.y, e.x)) - DE_Julia(p - vec3(e.y, e.y, e.x));

    return normalize(vec3(nx, ny, nz));
}

float rayMarch(vec3 ro, vec3 rd, out vec3 p) {
    float totalDist = 0.0;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        p = ro + rd * totalDist;
        float dist = DE_Julia(p);
        if (dist < MIN_DIST || totalDist > MAX_DIST) break;
        totalDist += dist;
    }
    return totalDist;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    vec3 ro = vec3(0.0, 0.35, -5.0);
    vec3 rd = normalize(vec3(uv, 30.0));

    float angle = iTime * 0.01;
    mat3 rotY = mat3(
        cos(angle), 0.0, sin(angle),
        0.0,        1.0,        0.0,
        -sin(angle),0.0, cos(angle)
    );
    ro = rotY * ro;
    rd = rotY * rd;

    vec3 p;
    float totalDist = rayMarch(ro, rd, p);

    vec3 color = vec3(0.0);
    if (totalDist < MAX_DIST) {
        vec3 normal = getNormal(p);
        vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
        float diff = max(dot(normal, lightDir), 0.0);

        vec3 darkColor = vec3(0.0);
        vec3 midColor = vec3(0.3, 0.7, 0.8);
        vec3 brightColor = vec3(0.8, 0.9, 1.0);

        if (diff < 0.3) {
            color = mix(darkColor, midColor, smoothstep(0.0, 0.3, diff));
        } else if (diff < 0.7) {
            color = mix(midColor, brightColor, smoothstep(0.3, 0.7, diff));
        } else {
            color = mix(brightColor, vec3(1.0), smoothstep(0.7, 1.0, diff));
        }
    }

    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

// Create ShaderMaterial
const material = new THREE.ShaderMaterial({
  fragmentShader,
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
