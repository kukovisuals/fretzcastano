uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 100!!!!  🌟                
    
    ▓  Vector fields 
    
    ▓  color idea from https://www.shadertoy.com/view/XfXGz4
    
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

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
    p3  = fract(p3 * 0.73);
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
float gradNoise(in vec2 p, int octaves) {
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


#define T (iTime/3e1)
#define H(a) (cos(radians(vec3(200, 90, 100))+(a)*3.545)*0.5+0.4)

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = I/iResolution.xy;
    vec4 delta = texture(iChannel0, uv);
    
    float trail = delta.z;           // Main trail data
    float redGlow = delta.x;         // Red channel as glow
    float greenGlow = delta.y;       // Green channel as glow
    
    vec3 color = vec3(0.0);
    
    float fadeIn = smoothstep(-1.0,1.1, trail);
 
    
    //O = vec4(vec3(greenGlow), 1.0);
    
    float t = T;
    
    // Enhanced trail colors (blue/white channel)
    if (trail > 0.001) {
        // Calculate flow direction using spatial gradients
        vec2 texSize     = 1.0 / iResolution.xy;
        float t_right = texture(iChannel0, uv + vec2(texSize.x, 0)).z;
        float t_left  = texture(iChannel0, uv - vec2(texSize.x, 0)).z;
        float t_up    = texture(iChannel0, uv + vec2(0, texSize.y)).z;
        float t_down  = texture(iChannel0, uv - vec2(0, texSize.y)).z;
        
        vec2 gradient = vec2(t_right - t_left, t_up - t_down);
        float gradLen = length(gradient);
        //if(gradient.y > 0.001 && gradient.x > -.8)
        if(gradLen > 0.458) {
            color += vec3(0.1);
        }
        else
        {
            // Create base trail color using enhanced hue function
            float hueInput = 1.3213 + trail * 2.371;
            
            /*
                Optionally Cycle throught different colors
            
                float time_i = floor(iTime / 5.0);
                float cycle = mod(time_i, 5.0);

                if(cycle < 2.0) hueInput = 1.3213 + trail * 2.371;
                else if(cycle < 4.0) hueInput = 0.3213 + trail * 2.371;
                else hueInput = 5.3213 + trail * 2.371;
           */
            
            
            vec3 trailColor = H(hueInput);

            // Enhance trail intensity
            float trailIntensity = smoothstep(-0.415, 1.415, trail);
            color += trailColor * trailIntensity;
        }
        
    }
    
    vec3 glowColor = vec3(0.0);
    if (greenGlow < 0.001) { 
        float greenIntensity = smoothstep(-0.0,0.1, greenGlow * 3.);
        glowColor.g *= greenIntensity * 0.05;
    }
    
    //color += greenGlow;
    color.gb += 0.04; // Boost green and blue slightly
    
    vec3 finalColor = color * .315 + color.brg * 0.5436 + color * color;
    
    vec2 center = uv - 0.5;
    float dist = length(center);
    finalColor *= (1.6 - dist * 1.3);
    
    // Enhance contrast and brightness
    finalColor = max(finalColor, vec3(0.0));
    finalColor = pow(finalColor, vec3(1.1)); // Slight gamma adjustment
    
    
    //float n1 = noise(p * 1. - iTime * 0.2);
    float n1 = gradNoise( delta.xz * 1. - vec2(0,iTime * 0.2), 1);
    //finalColor = min( vec3(abs(n1)), vec3(0.0));
    
    O = vec4(finalColor, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
