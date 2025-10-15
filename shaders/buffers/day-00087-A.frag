uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
// Flow Field 101 - Buffer A
// Simple particle advection using noise

#define PI 3.14159265

// Simple hash function for randomness
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Simple 2D noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 pos = fragCoord;
    
    float res = iResolution.y / iResolution.x;
    
    // Read previous frame's particle density
    vec4 prevData = texelFetch(iChannel0, ivec2(pos), 0);
    float density = prevData.r;
    
    // Create flow field using noise
    float angle = noise(pos * 0.01 + iTime * 0.1) * PI * 2.0;
    
    // Convert angle to direction vector
    vec2 velocity = vec2(cos(angle), sin(angle)) * 1.5;
    
    // Move particle backwards to find where it came from
    vec2 sourcePos = pos - velocity;
    
    // Sample density from source position (with wrapping)
    vec2 wrappedSource = mod(sourcePos, iResolution.xy);
    vec4 sourceDensity = texelFetch(iChannel0, ivec2(wrappedSource), 0);
    
    // Add some particle injection at the bottom
    if (fragCoord.y < 10.0) {
        sourceDensity += vec4(0.01);
    } 
    
    // Fade over time
    sourceDensity *= 0.9995;
    
    fragColor = sourceDensity;
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
