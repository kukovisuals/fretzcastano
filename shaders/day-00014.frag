uniform vec3 iResolution;
uniform float iTime; 

// using for functions -> https://www.desmos.com/calculator
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

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

float simpleLine(vec2 uv, float dt){

    float frequency = 1.5;
    float lineWidth = 0.3683;
    float waveAmplitude = 0.01;
    float waveFrequency = 1.0;
    float moveDt = dt * 1.0;

    float n = fbm11(uv * 1.0 + dt * 0.029);   
    uv.y += sin(moveDt + uv.x * waveFrequency + 0.0) * waveAmplitude + n * 0.23;
    
    float xRepeat = mod(uv.y * frequency, 0.4);
    float line = smoothstep(0.0, 0.1, xRepeat) 
                - smoothstep(lineWidth - 0.01, lineWidth, xRepeat);

    return line;
}

void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    rgbColor = vec3(0.051,0.043,0.043);
    bg  = vec3(0.149,0.129,0.133);         
    
    // play to understand palette
    // rgbColor = pal(uv.y,vec3(0.0, 0.0, 0.2),vec3(1.0, 0.0,0.0),vec3(0.5, 0.9,0.1),vec3(0.3, 5.0, 0.5) );
    if(effectIndex == 0){
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.082,0.067,0.071),vec3(0.114,0.098,0.102),vec3(0.157,0.161,0.157) );
    }   else if(effectIndex == 1) {
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.373,0.,0.039),vec3(0.114,0.098,0.102),vec3(0.647,0.055,0.102) );
    }   else if(effectIndex == 2){
        bg = vec3(0.933,0.298,0.231);
        rgbColor = pal(uv.y,vec3(0.0017,0.0241,0.165),vec3(0.01133,0.0907,0.0619),vec3(0.57, 0.239, 0.232),vec3(0.1, 0.15, 0.3) );
    }   else if(effectIndex == 3){
        bg = vec3(0.922,0.275,0.188);
        rgbColor = pal(uv.y, vec3(0.275,0.173,0.208),vec3(0.13,0.033,0.003), vec3(0.384,0.212,0.188),vec3(0.31,0.173,0.184) );
    }   else if(effectIndex == 4){
        bg = vec3(0.333,0.373,0.49);
        rgbColor = pal(uv.y,vec3(0.063,0.035,0.176),vec3(0.094,0.09,0.325),vec3(0.094,0.067,0.298),vec3(0.333,0.373,0.49) );
    }   else {
        bg = vec3(0.631,0.847,0.969);
        rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }
}

int effectIndex = 0;


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    float dt = iTime;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;   // keep circle round

    float line = simpleLine(uv, dt);
    int effectIndex = int(mod(dt / 2.0, 6.0));

    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColor;
    colorPalette(effectIndex, uv, bg, rgbColor);

    vec3 col = mix(bg, rgbColor, line);  
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
