uniform vec3 iResolution;
uniform float iTime; 

// Spikes from FabriceNeyret2 
// https://www.shadertoy.com/view/wsXGWM
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
float sdCircle(vec3 p)
{   
    // Start with base sphere distance
    float t = length(p) - 1.630;
    // Only apply displacement if we're near the surface
    if (t < 1.0) {  // spike height = 2.0
        vec3 q = p;
        q.xz = rotate2d(iTime * 0.05) * q.xz;
        q /= length(q);  // normalize to unit sphere
        
        q.x = atan(q.x, q.z);
        q.y = asin(q.y);

        float v = q.y/1.57; 
        #if 0       // some hills are truncated at equator
            q.x *= v; 
        #else       // avoid truncated hills         
            v = ceil(4.*abs(q.y)/1.57)/4.; v = 8.*sqrt(1.-v*v); // avoid disconts towards poles
            q.x *= floor(v+.1); // try +.0 or .5 or 1. or floor(.5*v+1.)*2.-1.
        #endif
        q.y *= 8.;
        q = sin(q * 1.0);
        v = q.x*q.y; 
        v *= abs(v);
        // Add displacement to the original sphere distance
        t += v * 0.320;  // 2.0 is spike height
    }
    return t;
}

float smin( float a, float b, float k )
{
    k *= log(2.0);
    float x = b-a;
    return a + x/(1.0-exp2(x/k));
}

float map(vec3 p)
{ 
    float d1 = sdCircle(p - vec3(1.2, 0.0, 0.0)); 
    float d2 = sdCircle(p + vec3(1.1, 0.0, 0.0)); 
    return smin(d1, d2, 0.1);
}


float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d < 0.001 || dt > 20.0) break;
    }
    return dt;
}

vec3 getNormal(vec3 p)
{
    float eps = 0.001;
    return normalize(vec3(
        map(p + vec3(eps, 0, 0)) - map(p - vec3(eps, 0, 0)),
        map(p + vec3(0, eps, 0)) - map(p - vec3(0, eps, 0)),
        map(p + vec3(0, 0, eps)) - map(p - vec3(0, 0, eps))
    ));
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.003);
    float pi = 3.14159;
    float pi2 = pi * 2.0;

    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayDirection(ro, rd);

    if(dt < 20.0)
    {
        vec3 p = ro + rd * dt;
        vec3 normal = getNormal(p);
        // Calculate the spike displacement value (same as before)
        float lightFx = sin(iTime * 0.5) * -20.5 - 0.5;
        float lightFx2 = 1.2 * sin(iTime * 0.5) * -0.5 - 0.5;
        vec3 sunDir = normalize(vec3(lightFx, lightFx2, 5.5));
        float diff = clamp(dot(normal, sunDir), 0.0, 1.0);

        float liq_pat = diff * 0.53205 + 0.55;

        // 1. Distance-based oscillating brightness (like cos(d*pi2) in reference)
        float distance_osc = cos(dt * pi2 * 6.0);
        float distance_fade = exp(-dt * 0.08);

        // 2. Multi-layered base color with wave interaction
        vec3 base_color = hsv2rgb(vec3(0.5 + liq_pat * 0.242, 0.84, 1.0 + liq_pat * 0.5));

        // 3. Create the "k" vector equivalent (wave distances for lighting)
        vec3 k = vec3(liq_pat);

        // 4. Apply the reference's color mixing formula
        vec3 c = max(vec3(distance_osc) - vec3(dt * 0.05) - k * 0.3, 0.0);

        // 5. Add cyan tint like c.gb += .1 in reference
        c.gb += 0.15;

        // 6. Apply the complex color blending: c*.4 + c.brg*.6 + c*c
        vec3 final_color = c * 0.4 + c.brg * 0.6 + c * c;

        // 7. Blend with original base color
        color = mix(base_color, final_color, 0.7);

        // 8. Enhanced glow system
        float enhanced_glow = exp(-dt * 0.1) * (1.0 + distance_osc * 0.5);
        color *= enhanced_glow;

        // 9. Pattern-based highlights with oscillation
        color += base_color * 0.258;

        // 10. Enhanced Fresnel with color shift
        float fresnel = 1.0 - abs(dot(normal, -rd));
        vec3 fresnel_color = vec3(0.3, 0.8, 1.0) * pow(fresnel, 2.0);
        color += fresnel_color * 1.0;

        // 11. Add electric-like rim effects
        float rim = pow(fresnel, 8.0);
        color += vec3(1.0, 0.8, 0.4) * rim * 3.0 * (1.0 + sin(iTime * 4.0) * 0.5);

        // 12. Depth-based color temperature shift
        float temp_shift = dt * 0.02;
        color.r *= 1.0 + temp_shift;
        color.b *= 1.0 - temp_shift * 0.5;
    }
    color = pow(color * 1.02, vec3(1.0/2.2));
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
