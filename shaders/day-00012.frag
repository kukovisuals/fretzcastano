uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;

#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

mat2 rotate2dAngle(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
// using for functions -> https://www.desmos.com/calculator
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
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

vec2 noiseGradient(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Corner values
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smoothstep derivative (used for cubic Hermite interpolation)
    vec2 du = 6.0 * f * (1.0 - f);  // derivative of u = f*f*(3-2*f)
    vec2 u = f*f*(3.0 - 2.0*f);

    // Partial derivatives
    float dx = (b - a) * (1.0 - u.y) + (d - c) * u.y;
    float dy = (c - a) * (1.0 - u.x) + (d - b) * u.x;

    return vec2(dx * du.x, dy * du.y);
}


float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
}

vec2 simulatedMouse(float time, float scale) {
    float x = sin(time * 0.07);
    float y = cos(time * 0.09);
    return vec2(x, y) * scale;
}

int effectIndex = 0;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    float dt = iTime;
    vec2 mouse = iMouse.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(0.0);
    
    float dc1 = modulatedSine(dt, 3.14, 0.01, 1.0, 1.0, 1.9);
    float dc2 = modulatedSine(dt, 0.32, 0.2, 1.76, 1.0, 2.9);
    float dc3 = modulatedSine(dt, 5.32, 0.5, 0.76, 1.0, 2.9);
    float dc4 = modulatedSine(dt, 1.32, 0.5, 0.76, 1.0, 2.9);
    float dc5 = modulatedSine(dt, 2.32, 1.0, 0.176, 0.50, 0.9);
    vec2 pos = vec2(0.0, 0.0);// * uv.x + 0.4;
    vec2 fakeMouse = simulatedMouse(dt, 1.0); // 0.3 controls how much it "moves"
    pos = (uv + fakeMouse) * dc5 * dc1;


    float grid = 0.6;
    vec2 cellId = floor((uv + 1.0) * grid);
    /*
        * Change to look at the shape pre noise 
    */
    // vec2 cellUV = uv; //fract((uv + 0.0) * grid);
    vec2 cellUV = vec2(noise(pos), noise(pos));
    // vec2 cellUV = noiseGradient(pos);
    // vec2 cellUV = rotate2D(noiseGradient(pos), PI) * 1.0;

    float frequency = 0.53145;
    float lineWidth = 0.09123;
    float waveAmplitude = 0.10341;
    float waveFrequency = 9.710;
    float moveDt = dt * 0.8;
    float edgeFade = smoothstep(0.0, 0.3, cellUV.y);

    int effectIndex = int(mod(dt / 10.0, 4.0));

    float angle = atan(cellUV.y, cellUV.x);
    float radius = length(cellUV);
    if(effectIndex == 0)
        cellUV.y += sin(moveDt + cellUV.x * waveFrequency) * waveAmplitude * dc3;
    else if(effectIndex == 1)
        cellUV.y -= sin(radius * (0.5 + dc4) + angle * 1.0 - moveDt);
        // cellUV.y += sin(moveDt + cellUV.x * waveFrequency) * waveAmplitude * dc3;
    else if(effectIndex == 2)
        cellUV.y += sin(moveDt + cellUV.x * waveFrequency) * waveAmplitude * dc3;
    else 
        // cellUV.y += sin(moveDt + cellUV.x * waveFrequency) * waveAmplitude * dc3;   
        cellUV.y += sin(radius * (0.5 + dc4) + angle * 1.0 - moveDt);

    vec3 lightD = normalize(vec3(dc2 + 0.2, 0.1905, 0.0));
    vec2 grad = noiseGradient(pos);
    vec3 normal = normalize(vec3(-grad.x, -grad.y, 1.0)); // z = 1.0 as fake depth
    float hitPoint = pow(dot(normal, lightD), 5.0);

    float xRepeat = mod(cellUV.y * frequency, 0.4);
    float line = smoothstep(0.0, 0.1, xRepeat) 
                - smoothstep(lineWidth - 0.01, lineWidth, xRepeat);
    
    float fade = 0.2;
    float verticalFade = smoothstep(fade, 0.0, cellUV.y) 
                    * (1.0 - smoothstep(1.0 - fade, 1.0, cellUV.y));
    line += hitPoint;

    float hue = mod(uv.y / grid + uv.x, 1.0);
    vec3 rgbColor = vec3(0.0,0.0,0.0);
    if(effectIndex == 0)
        rgbColor = pal( cellUV.x,  vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );
    else if(effectIndex == 1)
        rgbColor = pal( cellUV.x,  vec3(0.008,0.286,0.349), vec3(0.012,0.498,0.549), vec3(0.5,0.5,0.5) , vec3(0.012,0.549,0.549) );
    else if(effectIndex == 3)
        rgbColor = pal( cellUV.x,  vec3(0.008,0.5286,0.8349), vec3(0.8,0.7,0.7), vec3(0.286,0.694,0.592) , vec3(0.012,0.549,0.549) );
    else {
        rgbColor = pal( cellUV.x,  vec3(0.8,0.5,0.4),vec3(0.2,0.4,0.2),vec3(2.0,1.0,1.0),vec3(0.0,0.25,0.25) );
    }

    color = rgbColor * line; 
    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
