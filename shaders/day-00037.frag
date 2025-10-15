uniform vec3 iResolution;
uniform float iTime; 


vec2 grad( ivec2 z )
{
    int n = z.x + z.y * 11111; 

    n = (n<<13)^n;
    n = (n * ( n * n * 15731 + 789221) + 1376312589) >> 16;
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
        amplitude *= 1.0;
        frequency *= 2.0;
    }
    
    return value / maxValue;
}


void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.  * I - iResolution.xy) / iResolution.y;
    uv *= 2. - 1.0;
    float t = iTime;
    uv.x += t * 0.25;
    
    float clapTwo = mod(t, 10.);
    uv.y += cos(uv.x * 1.0 + clapTwo * 0.5) * cos(uv.y * 2.0 + clapTwo * 0.5) ;
    // shape 1 
    vec2 newUv = uv;
    float nTwo = fractalNoiseTwo(newUv, 4);
    newUv.y += cos(nTwo * newUv.y * 4. + t * 0.4);
    newUv = fract(newUv) * 2.;
    float d = smoothstep(.4, 0.0, newUv.y);

    // shape 2 
    vec2 newUvTwo = uv;
    float clap = mod(t, 2.0);
    float n = fractalNoiseTwo(newUvTwo, 4);
  
    newUvTwo.x += cos(n * newUvTwo.x * 20. + clap * 2.0);
    float circle = length(newUvTwo) - 0.1;
    circle = smoothstep(1.0, 0.0, circle);

    vec3 color = vec3(d);

    if(newUv.x > 1.0){
        //color = vec3(circle);
        color -= mix(vec3(1.0, 0.3, 0.4), vec3(circle), 0.5);
    } else {
        color *= mix(vec3(uv.x, uv.y, clap), vec3(d), 0.3);
    }

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
