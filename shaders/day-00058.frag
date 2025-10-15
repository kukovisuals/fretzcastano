uniform vec3 iResolution;
uniform float iTime; 


#define PI 3.14159265
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

mat2 rotate2d(float a){return mat2(cos(a), -sin(a), sin(a), cos(a));}
float sdSpikes(vec3 p)
{
    float d = length(p) - 1.23;

    if(d < 2.0)
    {
        vec3 new_p = p; float v;
        
        vec3 orig_p = p;
        // Large scale bumps (like the virus bulges)
        // float largeBumps = fbm(orig_p * 0.9652 + itime * 0.3101) * 0.2323;
        float fineBumps = noise3D(orig_p * 4.5 + iTime * 0.2) * 0.305;
        d -= fineBumps; // + fineBumps;
        new_p.xz = rotate2d(-iTime * 0.1) * new_p.xz;
        new_p /= length(new_p);
        // new_p.z += cos(new_p.x * 1.5) * 0.4 + 1.5;
        new_p.x = atan(new_p.x, new_p.z); new_p.y = asin(new_p.y);
        #if 0
            q.x *= v;
        #else 
            v = ceil(2.0 * abs(new_p.y) / 1.57 ) / 6.0;
            v = 8.0 * sqrt(1.0 - v*v);
            new_p.x *= floor(v + 0.1);
        #endif
        new_p.y *= 8.0;
        new_p = sin(new_p * 1.0);
        v = new_p.x * new_p.y;
        // v *= abs(v);
        v *= v < 0. ? 0.0 : v;
        v += sin(new_p.y * new_p.x * 0.3) * 0.4 + 0.5; 
        v = smoothstep(0.0, 0.8, v); // Ensures bounded, smooth transitions
        d -= v * 0.25;
    }
    return d;
}

float sdCircle(vec3 p, float r){ return length(p) - r; }

float opSmoothUnion( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
float opSmoothSubtraction( float d1, float d2, float k )
{
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h);
}
float map(vec3 p)
{
    vec3 new_p = p;
    new_p.xy = rotate2d(PI/2.0 + iTime * 0.04) * new_p.xy;
    float sphere = sdCircle(new_p, 1.502);
    float sphereTwo = sdCircle(new_p, 1.2);
    float spike = sdSpikes(new_p);
    return  opSmoothUnion( opSmoothSubtraction(sphere, spike, 0.14), sphereTwo, 0.6) ;
}

vec3 viridis(float t) 
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
    return vec3(
        dot(x1, vec4(0.0280268003, -0.4143510503, 2.225793877, -14.815088879)) + dot(x2.xy, vec2(23.212752309, -3.772589584)),
        dot(x1, vec4(0.1002117546, 1.617109353, -1.909305070, 1.701152864)) + dot(x2.xy, vec2(-0.685288385, 0.7178738871)),
        dot(x1, vec4(0.1300805501, 2.614650302, -12.019139090, 28.933559110)) + dot(x2.xy, vec2(-30.491294770, 10.762053843))
    );
}

vec3 sdColor(vec3 ro, vec3 rd, float dt)
{
    vec3 color = vec3(0.0);
    vec3 p = ro + rd * dt;
    vec3 new_p = p;
    // new_p /= length(new_p);
    // float d = map(new_p);
    float d = length(new_p);

    float colorV = sin(d * 8.0 * 1.5);
    float colorInit = (colorV + 0.96) * 0.4;

    // int color_fx = int(mod(t / 4.0, 6.0));
    color = viridis(colorInit); 
    return color;
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

vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.1, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.0);

    vec3 ro = vec3(0.0, 0.9, 1.6);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayDirection(ro, rd);
    if(dt < 10.0){
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        vec3 sunDir = normalize(vec3(1.0, 2.0, 3.5));
        float diff = clamp(dot(norm, sunDir), 0.0, 1.0);
        color = sdColor(ro, rd, dt) * diff; 
    }
    color = pow(color * 1.0, vec3(1.0/2.2));
    // color = vec3(dt * 0.2);
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
