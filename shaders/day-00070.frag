uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 70                 ▓
    ▓                 SDF Circle                   ▓
    ▓                 Shapes id                    ▓
    ▓                    Map                       ▓
    ▓         Inspired by Wassily Kandinsky        ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
const int ARR_SIZE = 11;

float sdfCircle(vec2 p, float r){ return length(p) - r;}
vec2 opU(vec2 d1, vec2 d2){return (d1.x < d2.x) ? d1 : d2;}
mat2 rotate2D(float a){return mat2(cos(a), -sin(a), sin(a), cos(a));}

vec4 map(vec2 p)
{
    vec2 p_r1 = p;
    vec2 p_r2 = p;
    vec2 p_r3 = p;
    vec2 p_r4 = p;
    // rotation
    float r_speed = 0.4;
    p_r1 = rotate2D(T * (r_speed)) * p_r1;
    p_r2 = rotate2D(T * (r_speed/2.0)) * p_r2;
    p_r3 = rotate2D(T * (r_speed/3.0)) * p_r3;
    p_r4 = rotate2D(T * (r_speed/4.0)) * p_r4;
    // location 
    vec2 shape[ARR_SIZE];
    shape[0] = vec2(0.0,0.0);
    shape[1] = vec2(0.07,-0.08);
    shape[2] = vec2(-0.2,-0.3);
    shape[3] = vec2(-0.2,0.1);
    shape[4] = vec2(-0.08, 0.15);
    shape[5] = vec2(-0.25, 0.24);
    shape[6] = vec2(-0.14, 0.27);
    shape[7] = vec2(0.0, 0.4);
    shape[8] = vec2(0.2, 0.32);
    shape[9] = vec2(0.35, 0.2);
    shape[10] = vec2(0.0, 0.0);
    // sdfs
    float d1  = sdfCircle(p + shape[0], 0.4);
    float d2  = sdfCircle(p_r1 + shape[1], 0.3);
    float d3  = sdfCircle(p_r4 + shape[2], 0.1);
    float d4  = sdfCircle(p_r1 + shape[3], 0.07);
    float d5  = sdfCircle(p_r1 + shape[4], 0.04);
    float d6  = sdfCircle(p_r4 + shape[5], 0.12);
    float d7  = sdfCircle(p_r2 + shape[6], 0.08);
    float d8  = sdfCircle(p_r4 + shape[7], 0.08);
    float d9  = sdfCircle(p_r3 + shape[8], 0.015);
    float d10 = sdfCircle(p_r3 + shape[9], 0.015);
    float d11 = sdfCircle(p    + shape[10], 0.0);

    vec2 result = vec2(1e10, -1.0);
    
    result = opU(result, vec2(d11, 10.0));
    result = opU(result, vec2(d1, 0.0));
    // did it for overlay
    if(d2 < 0.001) result = vec2(d2, 1.0); 
    if(d3 < 0.001) result = vec2(d3, 2.0);
    if(d4 < 0.001) result = vec2(d4, 3.0);
    if(d5 < 0.001) result = vec2(d5, 4.0);
    if(d6 < 0.001) result = vec2(d6, 5.0);
    if(d7 < 0.001) result = vec2(d7, 6.0);
    if(d8 < 0.001) result = vec2(d8, 7.0);
    if(d9 < 0.001) result = vec2(d9, 8.0);
    if(d10 < 0.001) result = vec2(d10, 9.0);
    // add shape id + overlay
    float overlay = (d1 < 0.001) ? 1.0 : 0.0;
    return vec4(result.x, result.y, overlay, 0.0);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                  Noise, FBM                  ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
vec2 hash22(vec2 p){ return vec2(hash21(p), hash21(p+17.1)); }
float random (in vec2 st) {return fract(sin(dot(st.xy,vec2(12.9898,78.233)))* 43758.5453123);}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f*f*(3.0-2.0*f);

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

float fbm11(vec2 p){return fbm(p, 0.9) * 1.9 - 1.0;}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                 Noise background             ▓
    ▓                 Noise Sun?                   ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec3 noiseColor(vec2 uv)
{
    vec2 new_uv = uv;

    float n     = fbm11(uv * 1.0 + 2.85 * 1.0329); 
    float n_sun = fbm11(uv * 0.9 + T * 0.0329); 
    
    new_uv.x = sin(uv.x * 0.2 + T * 0.02) * 0.5 + n * 0.23923;
    
    float xRepeat = mod(new_uv.x * 0.9, 0.4);
    float line    = smoothstep(0.0, 0.1, xRepeat) - smoothstep(0.2 - 0.01, 0.2, xRepeat);

    float sun = sdfCircle(uv, 0.34) + n_sun * 0.2;
    sun = smoothstep(0.33,0.0,sun);
    vec3 sunColor = mix(vec3(0.0), vec3(0.6), sun);

    vec3 color = mix(vec3(0.094,0.094,0.094), vec3(0.145,0.141,0.122) ,line);
    color += sunColor;
    return color;
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                     Main                     ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 0.7;
    vec3 color = noiseColor(uv);

    vec4  d    = map(uv);
    float dist = d.x;
    int   id   = int(d.y);
    float back = d.z;

    vec3 colorId[ARR_SIZE];
    colorId[0] = vec3(0.063,0.122,0.337); // blue
    colorId[1] = vec3(0.0,0.0,0.0);       // black
    colorId[2] = vec3(0.69,0.435,0.459);  // pink
    colorId[3] = vec3(0.094,0.212,0.204); // green
    colorId[4] = vec3(0.1,0.3,0.5);
    colorId[5] = vec3(0.749,0.431,0.008); // orange
    colorId[6] = vec3(0.737,0.612,0.318); // yellow
    colorId[7] = vec3(0.1,0.3,0.5);
    colorId[8] = vec3(0.69,0.435,0.459);  // pink
    colorId[9] = vec3(0.0,0.0,0.0);
    colorId[10] = vec3(0.1);

    if(dist < 0.01)
    {
        color = colorId[id];
        if(id > 1 && back > 0.5)
        {
            color = mix(colorId[0], colorId[id], 0.9); 
        }
    }
    O = vec4(color, 1.0);
}

/*
    * Estoy caminando desde el mall la verdad me hace estar mas greatful 
    * del trababajo aprentemente fui poseido por el espiritud de la abuela 
    * de mi novia el sabado jaja. I'm glad that's over
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
