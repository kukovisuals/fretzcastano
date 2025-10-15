uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 88  🌟                

    ▓  Understanding arrow directions from noise:
    ▓  
    ▓  noise = 0.0   → ➡️ points RIGHT
    ▓  noise = 0.25  → ⬆️ points UP
    ▓  noise = 0.5   → ⬅️ points LEFT
    ▓  noise = 0.75  → ⬇️ points DOWN
    ▓  noise = 1.0   → ➡️ wraps back to RIGHT

    ▓  (noise * 2π) becomes angle → direction → arrowDir

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

const float GRID   = 7.0;
const float ARROWS = GRID * 2.; 
const float FX_T   = 0.02;

mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a) );}

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}


float arrow(vec2 p, vec2 dir, float size) 
{
    dir = normalize(dir);
    
    float a = atan(dir.y, dir.x);
    float c = cos(-a);
    float s = sin(-a);
    vec2 rotP = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    
    float shaft = step(-0.02, rotP.y) * step(rotP.y, 0.02) 
            * step(0.0, rotP.x) * step(rotP.x, size * 0.7);
            
    float head = step(abs(rotP.y) 
                - (size * 0.3 - rotP.x + size * 0.7), 0.0) 
                * step(size * 0.7, rotP.x) * step(rotP.x, size);
    
    return max(shaft, head);
}


void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = I / iResolution.y;
    
    uv.x += iTime * 0.002;
    
    float fx_r = iTime * FX_T;
    mat2 R = rotate2D(fx_r);
    
    float n_value = noise(R * (uv * GRID));
    vec3 color = vec3(n_value);
    
    vec2 gridUV     = uv * ARROWS; 
    vec2 gridID     = floor(gridUV);
    vec2 gridLocal  = fract(gridUV) - 0.5; 
    vec2 gridCenter = (gridID + 0.5) / ARROWS;           // Sample noise at grid center to determine arrow direction
    
    vec2 fx_r2       = R * (gridCenter * GRID);
    float n_angle    = noise(fx_r2) * 6.28318;           // 0 to 2π
    vec2  arrowDir   = vec2(cos(n_angle), sin(n_angle)); // Create arrow direction from noise
    float arrowShape = arrow(gridLocal, arrowDir, 0.3);  // Draw arrow
    
    color = mix(color, vec3(1.0, 0.0, 0.0), arrowShape); // Red arrows + noise
    
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
