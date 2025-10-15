uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
uniform float     iTimeDelta; 

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

// Buffer A - Simplified Linear Flow Field F(x,y) = (1,0)
const float V_LINEAR     = 3.0;
const float REMOVAL_RATE = 60e-3;
const float SPAWN_RATE   = 0.0001;
const float Z_BRIGHT     = 0.8;

//vector field
vec2 get_velocity(in vec2 p) {
    vec2 v = vec2(0.0, 1.); 
    v.x = sin(p.x * 6.) * cos(p.y * 1.0);
    return v;
}

vec2 field(vec2 I) {
    vec2 R = iResolution.xy;
    // Check 3x3 neighborhood for particles 
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            vec2 uv = (I + vec2(i,j)) / R.xy; 
            vec2 p = texture(iChannel0, fract(uv)).xy;
            
            if(p == vec2(0)) {
                // No particle here - spawn
                if (hash13(vec3(I + vec2(i,j), iFrame)) > SPAWN_RATE) continue;
                
                // Spawn particle
                p = I + vec2(i,j) + hash21(float(iFrame)) - 0.5;
                
            } else if (hash13(vec3(I + vec2(i,j), iFrame)) < REMOVAL_RATE) {
                // Remove particle 
                continue;
            }
            
            // Get velocity from our linear field
            vec2 v = get_velocity(uv * V_LINEAR - vec2(0.5, 0.5 * R.x/R.y));
            
            // Move particle: newPosition = position + velocity
            p = p + v;
            
            // Wrap horizontally (keep particles on screen)
            p.x = mod(p.x - 0.0, R.x);
            
            // Clamp vertically (remove particles that go off top/bottom)
            if(p.y < 0.0 || p.y > R.y) continue;
            
            // Check if this particle will be at our current pixel
            if(abs(p.x - I.x) < 1.0 && abs(p.y - I.y) < 0.5)
                return p;
        }
    }
    
    return vec2(0.0);  // No particlefound
}

void mainImage(out vec4 O, in vec2 I) {
    vec2 uv = I.xy / iResolution.xy;
    
    // Find particle for this pixel
    O.xy = field(I);
    
    // Trail fade: exactly like original (0.995 fade rate)
    O.z = 0.995 * texture(iChannel0, uv).z;
    
    // If particle exists, set trail to full brightness
    if (O.x > 0.0) O.z = Z_BRIGHT;
    
    // Keep w channel consistent
    //fragColor.w = 1.0;
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
