uniform vec3 iResolution;
uniform float iTime; 

// Fork of "grid segment" by yufengjie. https://shadertoy.com/view/3fG3zc
// 2025-05-27 13:50:18
#define T iTime

float hash11(float v) {
  return sin(v + T) * 0.5 + 0.5;
  // return fract(sin(v * 51345.2368 + 442.36 + T*0.1));
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
        amplitude *= 1.5;
        frequency *= 2.0;
    }
    
    return value / maxValue;
}

// iq article https://iquilezles.org/articles/smin/
float smin( float a, float b, float k )
{
    k *= 3.1;
    float r = exp2(-a/k) + exp2(-b/k);
    return -k*log2(r);
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(ba,pa)/dot(ba,ba), 0.1, 1.0 );
    return length( pa - ba*h );
}

void mainImage(out vec4 O, in vec2 I){
  vec2 R = iResolution.xy;
  vec2 uv = (I) / R.y;
  uv.x += T * 0.2;

  uv *= 5.;
  vec2 uvi = floor(uv);

  float up   = abs(uv.y-uvi.y-1.0);
  float down = abs(uv.y-uvi.y   );
  float d = min(up,down);
  float noise = fractalNoiseTwo(uv * (d * 1.1), 5);
  
  for(int x=-1;x<2;x++){
    vec2 nei = uvi + vec2(x,0.4);

    vec2 a = vec2(hash11(nei.x     + nei.y    ), 0);
    vec2 b = vec2(hash11(nei.x*2.1 + nei.y*4.3), 1);
    float l = sdSegment(uv, a + nei, b + nei);
    
    d = smin(d, l, 0.1);
    
    
    d += noise * 0.11;
  }
  
  // maybe use diff pow(d,1.0)
  vec3 c = sin(vec3(0.333,0.373,0.49) + pow(d,3.0))*80.;
  c = mix(vec3(0.333,0.373,0.49),vec3(0.063,0.035,0.176), c);
  O.rgb += d*c;
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
