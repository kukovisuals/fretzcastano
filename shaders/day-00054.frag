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
    float t = length(p) - 1.59530;
    //float t = length(p) - 0.159530; // fract
    // Only apply displacement if we're near the surface
    if (t < 1.0) {  // spike height = 2.0
        vec3 q = p;
        q.xz = rotate2d(iTime * 0.15) * q.xz;
        q /= length(q);  // normalize to unit sphere

        q.x = atan(q.x, q.z);
        q.y = asin(q.y);

        float v = q.y/1.57; 
        #if 0       // some hills are truncated at equator
            q.x *= v; 
        #else       // avoid truncated hills         
            v = ceil(4.*abs(q.y)/1.57)/4.; v = 8.*sqrt(1.-v*v); // avoid disconts towards poles
            q.x *= floor(v+0.1); // try +.0 or .5 or 1. or floor(.5*v+1.)*2.-1.
        #endif
        q.y *= 8.;
        q = sin(q * 1.0);
        v = q.x*q.y; 
        v *= (v);
        // Add displacement to the original sphere distance
        t -= v * 0.31320 ;
        // t -= v * 0.07131320 ;  // fract
    }
    return t;
}

float map(vec3 p)
{
    vec3 new_p = p;
    // new_p /= exp(new_p.x, 0.4 );
    // new_p *= 1.0;
    // new_p.z += iTime * 0.2;
    //new_p = fract(new_p * 0.5) - 0.5;
    return sdCircle(new_p);
}

float rayDirection(vec3 ro, vec3 rd)
{
    float td = 0.0;
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * td;
        float d = map(p);
        td += d;

        if(d < 0.001 || td > 20.) break;
    }
    return td;
}

vec3 hsv2rgb(vec3 c) 
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 sdColor(vec3 ro, vec3 rd, float td, float t)
{   
    vec3 color = vec3(0.0);
    vec3 p = ro + rd * td;
    vec3 q = p;
    q /= length(q);
    float d = map(q);  
    
    float colorValue = sin(d * 20.0 - t);
    float hue = colorValue * 0.139173 + 0.607;
    color = hsv2rgb(vec3(hue, 1.0, 1.0));
    return color;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    float t = iTime;
    vec3 color = vec3(0.0);

    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    float td = rayDirection(ro, rd);
    
    if(td < 10.0)
        color = sdColor(ro, rd, td, t);
    
    // color += vec3(td * 0.125);
    color = pow(color * 1.02, vec3(1.0/2.2)); // gamma correction
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
