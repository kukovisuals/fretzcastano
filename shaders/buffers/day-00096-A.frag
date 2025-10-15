uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
uniform float     iTimeDelta; 

// Buffer A - Radial Vector Field with particle flux
// Based on myth0genesis particle system technique

const float tScale = 0.275;
const float scale = 3.5;
const float pVel = 0.58;           // Particle velocity
const float decay = 0.01;         // Tracer decay rate
const float spawnRate = 0.002;   // Particle spawn rate
const int smpDst = 6;             // Distance sampled around point
const float maxRadius = 2.0;      // Maximum radius for flux

const uvec4 shft = uvec4(14U, 15U, 16U, 17U);
const float imf = 1.0 / float(0xFFFFFFFFU);

float tm;
vec2 invRes;
float frmAdj;

// @myth0genesis 128-bit bijective hash https://www.shadertoy.com/view/mstXD2
vec4 bjhash128(vec4 p0) {
    uvec4 p = floatBitsToUint(p0);
    p ^= p >> shft;
    p *= uvec4(0xEAF649A9U, 0x6AF649A9U, 0x050C2D35U, 0xAAF649A9U);
    p ^= p.yzwx ^ p.zwxy;
    p ^= p >> shft.yzwx;
    p *= uvec4(0x21F0AAADU, 0x0D0C2D35U, 0xE8F649A9U, 0xD30332D3U);
    p ^= p.yzwx ^ p.zwxy;
    return vec4(p ^ p >> shft.wxyz) * imf;
}

// Radial velocity field function
vec2 radialField(vec2 pos) {
    vec2 center = 0.5 * iResolution.xy;
    vec2 dir = pos - center;
    float dist = length(dir);
    
    if (dist < 1.0) return vec2(0.0);
    
    // Normalize direction and apply strength based on distance
    vec2 normalizedDir = dir / dist;
    float maxDist = (sin(iTime * 0.4) * 0.6 + 0.8) * min(iResolution.x, iResolution.y);
    float strength = smoothstep(maxDist, 0.0, dist) * 2.0;
    
    return normalizedDir * strength;
}

// Particle search function (similar to sc() from original)
// wind flow map https://www.shadertoy.com/view/4sKBz3
vec2 sc(vec2 pos) {
    for(int i = -smpDst; i <= smpDst; i++) {
        for(int j = -smpDst; j <= smpDst; j++) {
            // These two lines subtract the current fragCoord's position (pos) from the sum
            // of the previous frame's pixel coordinate and its velocity at the sampled point (res)
            // which is stored in the .xy component of the buffer to get a velocity vector
            // relative to the sampled point, then checks whether that vector points to the
            // center of the current pixel or not.
            vec2 res = texture(iChannel0, (pos + vec2(i,j)) * invRes).xy;
            if(all(lessThan(abs(res - pos), vec2(0.5)))) return res;
        }
    }
    return vec2(0.0);
}

// Particle spawn and simulation (similar to ss() from original)
vec3 ss(vec2 pos, vec2 scr) {
    vec2 uv0 = pos * invRes.x;
    
    float frame = float(iFrame);
    vec4 hash = bjhash128(vec4(pos, frame, 1.738765));
    
    // Spawn particles at center with radial distribution
    vec2 center = 0.5 * iResolution.xy;
    float distToCenter = length(pos - center);
    
    // Spawn particles near center
    if (distToCenter < 20.0 && hash.w <= spawnRate * frmAdj * 800.0 / iResolution.x) {
        scr = pos + hash.xy * 10.0; // Small random offset
    } else {
        scr = (hash.w <= spawnRate * frmAdj * 800.0 / iResolution.x) ? scr : scr;
    }
    
    // Get radial velocity field
    vec2 v = radialField(scr) * pVel * frmAdj;
    
    // Apply boundary conditions - remove particles beyond max radius
    float maxDist = maxRadius * min(iResolution.x, iResolution.y);
    if (length(scr - center) > maxDist) {
        return vec3(0.0);
    }
    // This just adds the position and velocity of the particle that will move into the current pixel to its new velocity.
    // Every on-screen particle at this point except for the one occupying the bottom-leftmost pixel
    // will have a value greater than zero and thus will persist into the next frame,
    // and likewise the resulting sum of the particle's position and its velocity and the new velocity will
    // always be greater than 1.0, which, when put into a vector whose .b component is 1.0, makes it white.
    return (any(greaterThan(scr, vec2(0.0)))) ? vec3(scr + v, 1.0) : vec3(0.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    frmAdj = min(1.0, 140.0 * (iTimeDelta + 1.0));
    tm = iTime * tScale;
    invRes = 1.0 / iResolution.xy;
    vec2 uv = fragCoord * invRes;
    
    // Tracer state calculation with decay
    float r = texture(iChannel0, uv).z - decay * frmAdj;
    
    vec2 scRes = sc(fragCoord);
    r = (any(greaterThan(scRes, vec2(0.0)))) ? 1.0 : clamp(r, 0.0, 1.0);
    vec3 ssRes = ss(fragCoord, scRes);
    
    // The color of the tracer
    fragColor = vec4(ssRes + vec3(0.0, 0.0, r), 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
