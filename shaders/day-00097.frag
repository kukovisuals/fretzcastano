uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 97  🌟                

    ▓  Learning Vector Flow field
    
    ▓  Great tutorial on:
       https://github.com/anvaka/fieldplay
    
    ▓  Idea from 
    ▓  // https://www.shadertoy.com/view/DtKXWw

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define MAPRES vec2(64,64);
#define PI 3.1415926535897932384626433832795
#define HALFPI 1.57079632679

// Hash Part
#define ITERATIONS 4


// *** Change these to suit your range of random numbers..

// *** Use this for integer stepped ranges, ie Value-Noise/Perlin noise functions.
#define HASHSCALE1 .1031
#define HASHSCALE3 vec3(.1031, .1030, .0973)
#define HASHSCALE4 vec4(.1031, .1030, .0973, .1099)


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


void mainImage(out vec4 O, in vec2 I) {
    vec2 uv = I / iResolution.xy;
    vec4 data = texture(iChannel0, uv);
    float trail = data.z; 
    vec3 color = vec3(0.0, 0.7 * trail, trail);
    //O = vec4(color, 1.0);   
    //O = data.xzzz;
    // new color
    float speed = length(data.xy);
    vec3 hotColor = mix(vec3(0.1, 0.4, 0.5), vec3(0.4, 0.7, 0.7), smoothstep(0.0, 1.0, speed));
    hotColor = pow(hotColor * 1.3, vec3(1.1/2.2));
    O = vec4(hotColor * data.z, 1.0); 
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
