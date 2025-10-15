uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
uniform float     iTimeDelta; 

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
#define T iTime

// Cycling world sampling function
vec4 cyclicLookup(vec2 coord) {
    vec2 R = iResolution.xy;
    coord = mod(coord, R); // wrap coordinates
    return texture(iChannel0, coord/R);
}

// Updated Field function with cycling
vec4 Field(vec2 p)
{
    vec2 velocityGuess = cyclicLookup(p).xy;
    vec2 positionGuess = p - velocityGuess * 0.8; // reduced for stability
    return cyclicLookup(positionGuess);
}

// Noise-based vortex centers that follow the noise pattern
vec2 getNoiseVortexCenter(int index, float time, vec2 basePos) {
    vec2 R = iResolution.xy;
    vec2 offset = vec2(float(index) * 37.0, float(index) * 73.0); // pseudo-random offset
    
    vec2 period = vec2(0.0);
    float alpha = time * 0.02;
    vec2 gradient;
    float n = noise((basePos + offset) * 0.08 + vec2(time * 0.05), period, alpha, gradient);
    
    // Place vortices in areas with specific noise characteristics
    vec2 center = basePos + gradient * 50.0 * sin(time * 0.3 + float(index));
    return mod(center, R); // ensure wrapping
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 R = iResolution.xy;
    
    // Adaptive timestep for stability
    float dt = iFrame < 10 ? 1.0/60.0 : min(iTimeDelta + 1.0, 1.0/30.0);
    
    if(iFrame < 1 )
    {
        O = vec4(0.01,0.0,0.0,0.0); // smaller initial values
        return;
    }
    
    O = Field(I);
    
    // Cycling world neighbors - no more boundary conditions needed
    vec4 px = Field(I + vec2(1,0));
    vec4 py = Field(I + vec2(0,1));
    vec4 nx = Field(I - vec2(1,0));
    vec4 ny = Field(I - vec2(0,1));
    
    // Add damping for stability
    O.xy *= 0.995;
    
    // Disorder energy diffusion
    O.b = (px.b + py.b + nx.b + ny.b) / 4.0;
    
    // Multi-scale noise for more detail
    vec2 period = vec2(0.0);
    vec2 totalNoiseForce = vec2(0.0);
    
    // Large scale structure
    float alpha1 = T * 0.5;
    vec2 gradient1;
    float n1 = noise(I * 0.004 + vec2(T * 0.072), period, alpha1, gradient1);
    vec2 largeFlow = vec2(-gradient1.y, gradient1.x) * 0.002;
    
    // Medium scale detail  
    float alpha2 = T * 0.0131;
    vec2 gradient2;
    float n2 = noise(I * 0.12 + vec2(T * 0.08), period, alpha2, gradient2);
    
    // Fine scale detail
    float alpha3 = T * 0.02;
    vec2 gradient3;
    float n3 = noise(I * 0.25 + vec2(T * 0.15), period, alpha3, gradient3);
    
    // Combine noise scales
    float combinedNoise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    vec2 combinedGradient = gradient1 * 0.5 + gradient2 * 0.3 + gradient3 * 0.2;
    
    // Create masks for different flow types
    float darkMask = smoothstep(0.1, -0.3, combinedNoise);
    float mediumMask = smoothstep(-0.1, 0.1, combinedNoise) * (1.0 - darkMask);
    
    // Potential flow in dark areas (waterfalls)
    vec2 potentialForce = vec2(0.0);
    if(darkMask > 0.01) {
        vec2 gradStep = vec2(1.5, 1.5);
        vec2 grad_temp;
        float n_right = noise(I * 0.12 + vec2(T * 0.08) + vec2(gradStep.x, 0.0), period, alpha2, grad_temp);
        float n_up = noise(I * 0.12 + vec2(T * 0.08) + vec2(0.0, gradStep.y), period, alpha2, grad_temp);
        
        potentialForce.x = (n_right - n2) / gradStep.x;
        potentialForce.y = (n_up - n2) / gradStep.y;
        potentialForce *= darkMask * 0.015;
    }
    
    // Curl flow for natural motion
    vec2 curl = vec2(-combinedGradient.y, combinedGradient.x) * 0.7;
    
    // Improved vortex system
    vec2 vortexForce = vec2(0.0);
    int numVortices = 4;
    
    for(int v = 0; v < numVortices; v++) {
        vec2 vortexPos = getNoiseVortexCenter(v, T, I);
        vec2 d = I - vortexPos;
        
        // Apply cycling world distance for seamless boundaries
        d = (fract(0.5 + d/R) - 0.5) * R;
        
        float l = dot(d, d);
        float minDist = 2.0; // minimum effective radius
        
        if(l > minDist) {
            // Smoother falloff for vortex strength
            float falloff = 1.0 / (1.0 + l * 0.0001);
            float strength = 40.0 * (1.8 + 0.2 * sin(T * 0.5 + float(v) * 2.0)) * falloff;
            
            // Biot-Savart circulation
            vec2 circulation = vec2(-d.y, d.x) * strength / (l + 1.0);
            
            // Apply vortex more in medium areas, less in dark waterfall areas
            float vortexMask = mediumMask * 0.8 + darkMask * 0.2;
            vortexForce += circulation * vortexMask;
        }
    }
    
    // Combine all forces with proper scaling
    vec2 totalForces = largeFlow + curl + potentialForce + vortexForce * 0.51;
    
    // Semi-Newton integration for stability
    O.xy += totalForces * dt;
    
    // Disorder creation from velocity divergence
    O.b += (nx.x - px.x + ny.y - py.y) / 4.0;
    
    // Gravity and mass conservation
    O.y -= O.w / 400.0;
    O.w += (nx.x * nx.w - px.x * px.w + ny.y * ny.w - py.y * py.w)/4.0;
    
    // Remove old boundary conditions - cycling world handles this automatically!
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
