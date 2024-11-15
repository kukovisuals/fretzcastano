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

/*
  Shader by kukovisuals
  Please do not copy, share, or redistribute this code.
  © kukovisuals 2024
  
  3D Julia Set Rendering with Enhanced Color and Brightness
*/

const int MAX_MARCHING_STEPS = 100;
const float MIN_DIST = 0.001;
const float MAX_DIST = 7.0;
const int MAX_ITERATIONS = 10;
const float BAILOUT = 4.0;

// Distance estimator for the 3D Julia Set
float DE_Julia(vec3 pos, mat3 rotY, out vec4 trap) {
    vec3 z = rotY * pos;
    float dr = 1.0;
    float r = 0.0;

    // Initialize trap to track minimum values
    trap = vec4(abs(z), dot(z, z));
    
    // Animate the Julia set constant 'c'
    vec3 c = vec3(
        -sin(0.4) * 1.8,
        -cos(iTime * 0.3) * 0.5,
        0.0
    );

    for (int i = 0; i < MAX_ITERATIONS; i++) {
        r = length(z);
        if (r > BAILOUT) break;

        // Precompute powers
        float r_power = pow(r, 8.0);
        float r_power_7 = r_power / r;

        // Precompute theta and phi multipliers
        float theta8 = 6.0 * acos(z.y / r);
        float phi8 = 6.0 * atan(z.z, z.x);

        // Calculate new position
        float sinTheta = cos(phi8);
        float cosTheta = sin(phi8);
        float sinPhi = cos(theta8);
        float cosPhi = sin(theta8);

        z = r_power * vec3(sinTheta * cosPhi, sinTheta * sinPhi, cosTheta) + c;

        // Update trap for color variation
        trap = min(trap, vec4(abs(z), dot(z, z)));

        // Compute derivative
        dr = r_power_7 * 8.0 * dr + 1.0;
    }

    return 0.5 * log(r) * r / dr;
}

// Calculate normal for lighting
vec3 getNormal(vec3 p, mat3 rotY) {
    float eps = 0.0001;
    vec2 e = vec2(1.0, -1.0) * eps;

    vec4 trap;
    float nx = DE_Julia(p + vec3(e.x, e.y, e.y), rotY, trap) - DE_Julia(p - vec3(e.x, e.y, e.y), rotY, trap);
    float ny = DE_Julia(p + vec3(e.y, e.x, e.y), rotY, trap) - DE_Julia(p - vec3(e.y, e.x, e.y), rotY, trap);
    float nz = DE_Julia(p + vec3(e.y, e.y, e.x), rotY, trap) - DE_Julia(p - vec3(e.y, e.y, e.x), rotY, trap);

    return normalize(vec3(nx, ny, nz));
}

// Main ray marching function
float rayMarch(vec3 ro, vec3 rd, out vec3 p, mat3 rotY, out vec4 trap) {
    float totalDist = 0.0;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        p = ro + rd * totalDist;
        float dist = DE_Julia(p, rotY, trap);
        if (dist < MIN_DIST || totalDist > MAX_DIST) break;
        totalDist += dist;
    }
    return totalDist;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalize pixel coordinates (from -1 to 1)
    vec2 uv = fragCoord.xy / iResolution.xy * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    // Camera setup
    vec3 ro = vec3(0.0, 0.0, -4.0); // Camera position
    vec3 rd = normalize(vec3(uv, 3.5)); // Ray direction

    // Define rotation matrix
    float angle = iTime * 0.05;
    mat3 rotY = mat3(
        cos(angle), 0.0, sin(angle),
        0.0,        1.0,        0.0,
        -sin(angle),0.0, cos(angle)
    );

    // Fixed light direction
    vec3 lightDir = normalize(vec3(1.0, 1.0, 3.7));

    // Ray marching with trap for color blending
    vec3 p;
    vec4 trap;
    float totalDist = rayMarch(ro, rd, p, rotY, trap);

    vec3 color = vec3(0.0);
    if (totalDist < MAX_DIST) {
        vec3 normal = getNormal(p, rotY);
        float diff = max(dot(normal, lightDir), 0.0);

        // Color blending based on trap values
        color = vec3(0.05);
        color = mix(color, vec3(0.702,0.667,0.671), clamp(trap.y, 0.0, 1.0));
        color = mix(color, vec3(0.906,0.898,0.902), clamp(trap.z * trap.z, 0.0, 1.0));
        color = mix(color, vec3(0.631,0.184,0.173), clamp(pow(trap.w, 6.0), 0.0, 1.0));
        color *= 1.5; // Increased brightness for visibility

        // Apply lighting with gradient
        color *= diff * 0.8 + 0.4; // Adjusted diffuse intensity
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
