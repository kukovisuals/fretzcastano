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

const float SPAWN_P  = 0.0001; // spawn particle 
const float REMOVE_P = 0.095; // remove particle
const float BRIGHT_Z = 1.0;    // brightness on fragcolor.z
const float SCALE_P  = 5.14;   // scale particle

vec2 velocityV(in vec2 p)
{
    vec2 v = vec2(0.0);
    v.x = sin(p.y * 2.) * cos(p.y * 5.);
    v.y = cos(p.x * 2.) * sin(p.x * 5.);
    return v;
}  


vec2 vField(vec2 I)
{
    vec2 R = iResolution.xy;
    for(int i=-1; i<=1; i++)
    {
        for(int j=-1; j<=1; j++)
        {
            // 1. 3x3 neighborhood check around the current position I
            // this creates a local particle search
            vec2 uv = (I + vec2(i,j)) / R.xy;
            // 2. Particle detection
            // Reads the previous frame particle data from iChannel0
            // if p = 0 there is no particle at this location
            vec2 p = texture(iChannel0, fract(uv)).xy;
            // 3. Paricle Spawning
            // When no particle exist randomly spawn one 
            if( p == vec2(0))
            {
                if( hash13(vec3(I + vec2(i,j), iFrame)) > SPAWN_P) continue;
                p = I + vec2(i,j) + hash21(float(iFrame)) - 0.5;
            }
            // 4. Particle Removal
            // randomly remove particles at rate to prevent overcorwding
            else if(hash13(vec3(I + vec2(i,j), iFrame)) < REMOVE_P )
            {
                continue;
            }
            // 5.Particle Movement
            // Get the velocity vector from the field function
            vec2 v = velocityV( uv * SCALE_P - vec2(0.5, 0.5 * R.x / R.y));
            p += v;
            // 6. Boundery condition
            // Particles wrap around horizontally but are removed if
            // they go off screan
            p.x = mod(p.x, R.x);
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

void mainImage(out vec4 O, in vec2 I) {
    vec2 uv = I.xy / iResolution.xy;
    
    // Find particle for this pixel
    O.xy = vField(I);
    
    // Trail fade: exactly like original (0.995 fade rate)
    O.z = 0.995 * texture(iChannel0, uv).z;
    
    // If particle exists, set trail to full brightness
    if (O.x > 0.0) O.z = BRIGHT_Z;
    
    // Keep w channel consistent
    //fragColor.w = 1.0;
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
