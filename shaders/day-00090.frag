uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 90  🌟                

    ▓  Learning Flow field simulation
    
    ▓  Great tutorial on:
    ▓  https://wyattflanders.com/MeAndMyNeighborhood.pdf
    
    ▓  Added Simplex Noise
    ▓  https://www.shadertoy.com/view/W3VGW3

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 x, vec2 period, float alpha, out vec2 gradient) {
    // Transform input point to simplex space
    vec2 uv = vec2(x.x + x.y * 0.5, x.y);
    vec2 i0 = floor(uv), f0 = fract(uv);
    
    // Find which simplex we're in
    float cmp = step(f0.y, f0.x);
    vec2 o1 = vec2(cmp, 1.0 - cmp);
    vec2 i1 = i0 + o1, i2 = i0 + 1.0;
    
    // Transform corners back to texture space
    vec2 v0 = vec2(i0.x - i0.y * 0.5, i0.y);
    vec2 v1 = vec2(v0.x + o1.x - o1.y * 0.5, v0.y + o1.y);
    vec2 v2 = vec2(v0.x + 0.5, v0.y + 1.0);
    
    // Compute displacement vectors
    vec2 x0 = x - v0, x1 = x - v1, x2 = x - v2;
    
    // Handle periodic tiling
    vec3 iu, iv;
    if(any(greaterThan(period, vec2(0.0)))) {
        vec3 xw = vec3(v0.x, v1.x, v2.x);
        vec3 yw = vec3(v0.y, v1.y, v2.y);
        if(period.x > 0.0) xw = mod(xw, period.x);
        if(period.y > 0.0) yw = mod(yw, period.y);
        iu = floor(xw + 0.5 * yw + 0.5);
        iv = floor(yw + 0.5);
    } else {
        iu = vec3(i0.x, i1.x, i2.x);
        iv = vec3(i0.y, i1.y, i2.y);
    }
    
    // Hash function to generate pseudo-random values
    vec3 hash = mod(iu, 289.0);
    hash = mod((hash * 51.0 + 2.0) * hash + iv, 289.0);
    hash = mod((hash * 34.0 + 10.0) * hash, 289.0);
    
    // Generate gradients with rotation
    vec3 psi = hash * 0.07482 + alpha;
    vec3 gx = cos(psi);
    vec3 gy = sin(psi);
    vec2 g0 = vec2(gx.x, gy.x);
    vec2 g1 = vec2(gx.y, gy.y);
    vec2 g2 = vec2(gx.z, gy.z);
    
    // Compute radial falloff
    vec3 w = 0.8 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2));
    w = max(w, 0.0);
    vec3 w2 = w * w;
    vec3 w4 = w2 * w2;
    
    // Compute gradients along displacement vectors
    vec3 gdotx = vec3(dot(g0, x0), dot(g1, x1), dot(g2, x2));
    
    // Sum contributions
    float n = dot(w4, gdotx);
    
    // Compute gradient (optional - for derivative information)
    vec3 w3 = w2 * w;
    vec3 dw = -8.0 * w3 * gdotx;
    vec2 dn0 = w4.x * g0 + dw.x * x0;
    vec2 dn1 = w4.y * g1 + dw.y * x1;
    vec2 dn2 = w4.z * g2 + dw.z * x2;
    gradient = 10.9 * (dn0 + dn1 + dn2);
    
    return 10.9 * n;
}



#define LOOKUP(COORD) texture(iChannel0, COORD/iResolution.xy)

void mainImage( out vec4 O, in vec2 I )
{
    vec4 field = LOOKUP(I);
    float vel =  length(field.xy);
    //O = vec4(vec3(vel),1.0); 
    O = vec4(field.y * 0.5 + 0.3, field.x*0.5+0.2, field.x *0.5+0.3, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
