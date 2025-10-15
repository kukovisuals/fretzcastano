uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
uniform float     iTimeDelta; 
// *** Change these to suit your range of random numbers..

// *** Use this for integer stepped ranges, ie Value-Noise/Perlin noise functions.
#define HASHSCALE1 .0973
#define HASHSCALE3 vec3(.1031, .1030, .0973)

//----------------------------------------------------------------------------------------
//  1 out, 2 in...
float hash12(vec2 p)
{
    vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

//----------------------------------------------------------------------------------------
//  1 out, 3 in...
float hash13(vec3 p3)
{
    p3  = fract(p3 * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

//----------------------------------------------------------------------------------------
//  2 out, 1 in...
vec2 hash21(float p)
{
    vec3 p3 = fract(vec3(p) * HASHSCALE3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx+p3.yz)*p3.zy);

}

float random(in vec2 p )
{
    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    // four corners in 2d tile
    float a = random( i );
    float b = random( i + vec2(1.0, 0.0));
    float c = random( i + vec2(0.0, 1.0));
    float d = random( i + vec2(1.0, 1.0));

    // cubic hermin curve 
    vec2 u = f * f * (3.0 - 2.0 * f);

    // mix 4 courenrs percentage 
    return mix(a, b, u.x) + 
        (c - a) * u.y * (1.0 - u.x) + 
        (d - b) * u.x * u.y;
}



vec2 grad( ivec2 z)
{
    // 2d to 1d
    int n = z.x + z.y * 11111;
    
    // Hugo elias hadh 
    n = (n<<13)^n;
    n = (n*(n*n*15731+789221)+1376312589)>>16;

#if 0     
    //simple random vectors 
    return vec2(cos(float(n)),sin(float(n)));
#else 
    // perlin style vectorss
    n &= 7;
    vec2 gr = vec2(n&1, n>>1) * 2.0 - 1.0;
    return ( n>=6 ) ? vec2(0.0, gr.x) :
           ( n>=4 ) ? vec2(gr.x, 0.0) :
           gr;
           
#endif
}


float noiseTwo(in vec2 p )
{
    ivec2 i = ivec2(floor(p));
    vec2  f = fract(p);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix( mix( dot(grad ( i + ivec2(0,0)), f - vec2(0.0, 0.0 )), 
                     dot(grad ( i + ivec2(1,0)), f - vec2(1.0, 0.0 )), u.x),
                mix( dot(grad ( i + ivec2(0,1)), f - vec2(0.0, 1.0 )),
                     dot(grad ( i + ivec2(1,1)), f - vec2(1.0, 1.0 )), u.x), u.y);
}

// Or using your gradient noise:
float fractalNoiseTwo(in vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for(int i = 0; i < octaves; i++) {
        value += noiseTwo(p * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value / maxValue;
}

const float SPAWN_P  = 0.000001; // spawn particle 
const float REMOVE_P = 0.0695; // remove particle
const float BRIGHT_Z = 0.0;    // brightness on fragcolor.z
const float SCALE_P  = 2.5;   // scale particle


vec2 velocityV(in vec2 p) {
    float n1 = noise(p * 3.0 - iTime * 0.5);
    float n2 = noise(p * 3.0 + vec2(1.0) + iTime * 0.5);
    return vec2(n1, n2) * 2.0 - 1.0;
}

vec2 velocityV1(in vec2 p) {
    float n1 = fractalNoiseTwo(p * 3.0, 2);
    float n2 = fractalNoiseTwo(p * 2.0, 1);
    return vec2(n2, n1);
}


vec2 vField(vec2 I)
{
    vec2 R = iResolution.xy;
    for(int i=-1; i<=1; i++)
    {
        for(int j=-1; j<=1; j++)
        {
            // 3x3 particle search around I
            vec2 uv = (I + vec2(i,j)) / R.xy;
            // Reads previous particle data from iCh
            // if p=0 there is no particle at this location
            vec2 p = texture(iChannel0, fract(uv)).xy;
            // 3. Paricle Spawning
            // When no particle exist randomly spawn one 
            if( p == vec2(0))
            {
                if( hash13(vec3(I + vec2(i,j), iFrame)) > SPAWN_P) continue;
                p = I + vec2(i,j) + hash21(float(iFrame)) - 0.5;
            }
            // Randomly remove particles 
            else if(hash13(vec3(I + vec2(i,j), iFrame)) < REMOVE_P )
            {
                continue;
            }
            // get velocity vector
            vec2 v = velocityV( uv * SCALE_P - vec2(0.5, 0.5 * R.x / R.y));
            p += v;
            // particles are wrapped horizontally 
            // but are remove if offscreen
            if(p.y < 0.0 || p.y > R.y) continue;
            // 7. Pixel assignment
            // If the particle current pixel is close enough to the current
            // pixel I. this pixel gets assign that particle position
            if(abs(p.x - I.x) < 1.0 && abs(p.y - I.y) < 0.5)
                return p;
        }
    }
    return vec2(0);
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = I.xy/iResolution.xy;
    
    O.xy = vField(I);                       // find particle for this pixel
    O.z = 0.995 * texture(iChannel0, uv).z; // trail fade
    if(O.x > 0.0) O.z = 0.9; // if particle exsit see trail
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
