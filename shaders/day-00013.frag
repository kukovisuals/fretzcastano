uniform vec3 iResolution;
uniform float iTime; 

// using for functions -> https://www.desmos.com/calculator
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}
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

float fbm( in vec2 x, in float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    float t = 0.0;
    int numOctaves = 10;
    for( int i=0; i<numOctaves; i++ )
    {
        t += a*noise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}
// fbm in [‑1,1] instead of [0,1]
float fbm11(vec2 p)
{
    return fbm(p, 0.9) * 1.9 - 1.0;
}

float rose(vec2 p, float a, float k, float stroke, float dt){
    float r = length(p);                 // actual radius
    float t = atan(p.y, p.x);            // angle θ
    float n = fbm11(p * 9.0 + dt * 0.5);   // ≈ soft, slow ripple
    float target = a * abs(sin(k*t)) + n * 0.2;    // desired rose radius (abs → always ≥0)
    return abs(r - target) - stroke;     // signed distance to the curve
}


int effectIndex = 0;


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    float dt = iTime;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;   // keep circle round

    // uv = fract(uv * 2.0) - 0.5;
    // uv = vec2(fbm(uv, 1.0), fbm(uv, 1.0));
    // uv = vec2(noise(uv), noise(uv));

    /*–‑‑ rose parameters –‑‑*/
    float petals  = 5.0;   // k  → odd: k     petals; even: 2k petals
    float radius  = 0.5;   // a  → overall size
    float stroke  = 0.2;  // line thickness

    /*–‑‑ distance to flower outline –‑‑*/
    uv += 0.5;
    uv = rotate2D(uv, dt * 0.2);
    uv -= 0.5;
    float d = rose(uv, radius, petals, stroke, dt);

    /*–‑‑ draw –‑‑*/
    int effectIndex = int(mod(dt / 3.0, 4.0));
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    vec3 rgbColor = vec3(0.0,0.0,0.0);
    if(effectIndex == 0)
        rgbColor = pal( uv.x,  vec3(0.5,0.5,1.2),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );
    else if(effectIndex == 1)
        rgbColor = pal( uv.x,  vec3(1.7,0.5,0.8),vec3(1.2,0.4,0.2),vec3(1.0,1.0,1.0),vec3(1.0,0.25,0.25) );
    else if(effectIndex == 3)
        rgbColor = pal( uv.x,  vec3(0.008,0.5286,0.8349), vec3(0.8,0.7,0.7), vec3(0.286,0.694,0.592) , vec3(0.012,0.549,0.549) );
    else {
        rgbColor = pal( uv.x,  vec3(0.8,0.5,0.4),vec3(0.2,0.4,0.2),vec3(2.0,1.0,1.0),vec3(0.0,0.25,0.25) );
    }

    float edge = smoothstep(0.0, -stroke, d);           // 1 inside line
    vec3 col   = mix(vec3(0.0), rgbColor, edge); // pink line

    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
