uniform vec3 iResolution;
uniform float iTime; 

// 'Warp Speed' by David Hoskins 2013.
// I tried to find gaps and variation in the star cloud for a feeling of structure.
// Inspired by Kali: https://www.shadertoy.com/view/ltl3WS
// Fork Warp speed https://www.shadertoy.com/view/Msl3WH


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


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float time = (iTime+10.) * 15.0;

    float s = 0.0, v = 0.0;
    vec2 uv = (-iResolution.xy + 2.0 * fragCoord ) / iResolution.y;
	float t = time*0.005;
	uv.x += sin(t) * 0.3;
	float si = sin(t*1.5); // ...Squiffy rotation matrix!
	float co = cos(t);
	uv *= mat2(co, si, -si, co);
	vec3 col = vec3(0.0);
	vec3 init = vec3(0.25, 0.25 + sin(time * 0.001) * .1, time * 0.0008);
	float n = fractalNoiseTwo(init.zz * 0.1, 7);
    
    for (int r = 0; r < 100; r++) 
	{
        
        init.x = fractalNoiseTwo(uv * 0.37, 3);
		vec3 p = init + s * vec3(uv, 0.0143);
		p.z = mod(p.z, 3.0);
		for (int i=0; i < 10; i++)	p = abs(p * 1.304) / dot(p, p) - 0.675;
		v += length(p * p) * smoothstep(0.4, 0.5, 0.49 - s) * .0022;
		// Get a purple and cyan effect by biasing the RGB in different ways...
		col +=  vec3(v * 0.28, 0.21 - s * 0.5, .7 + v * 0.25) * v * 0.00713;
		s -= 0.01;
	}
	fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
