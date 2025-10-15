uniform vec3 iResolution;
uniform float iTime; 

// Spikes from FabriceNeyret2 
// https://www.shadertoy.com/view/wsXGWM

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

float sdCircle(vec3 p, float r)
{
    float d = length(p) - r;
    
    if(d < 2.0)
    {
        vec3 new_p; float v;
        new_p = p;
        float fineBumps = noise3D(new_p * 2.5 + iTime * 0.2) * 0.305;
        d -= fineBumps; // + fineBumps;
        new_p /= length(new_p); // normalize the length
        new_p.x = atan(new_p.x, new_p.z);
        new_p.y = asin(new_p.y);
        #if 0
            new_p.x *= v;
        #else 
            v = ceil(4.0 * abs(new_p.y) / 1.57) / 4.0;
            v = (8.0 * sqrt(1.0 - v*v));
            new_p.x *= floor(v + 0.1);
        #endif
        new_p.y *= 8.0;
        new_p = sin(new_p * 1.0);
        v = new_p.x * new_p.y;
        // v *= abs(v);
        v *= v < 0. ? 0.0 : v;
        v += sin(new_p.y * new_p.x * 1.4) * 0.5 + 0.3; 
        d -= v * 0.23;
    }

    return d;
}
mat2 rotate2d(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }

float map(vec3 p)
{
    vec3 new_p = p;
    new_p.yz = rotate2d(PI/1.990) * new_p.yz;
    new_p.xy = rotate2d(PI/1.990) * new_p.xy;
    new_p.xz = rotate2d(iTime * 0.05) * new_p.xz;
    return sdCircle(new_p, 1.50);
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
    vec2 e = vec2(0.0001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

vec3 sdColor(vec3 p)
{
    vec3 new_p = p;
    new_p /= length(new_p);
    float d = map(new_p);
    float colorValue = sin(d * 30.0 * 1.0) * 0.5 + 0.5; 
    return vec3(colorValue); // Black to white
}
// Add environment mapping function
vec3 getEnvironmentColor(vec3 reflectDir) {
    // Simple environment - you can replace with actual cubemap
    float sky = max(0.0, reflectDir.y);
    vec3 skyColor = mix(vec3(.9), vec3(0.0, 0.0, 0.0), sky);
    return skyColor;
}

// Enhanced lighting function
vec3 calculateLighting(vec3 p, vec3 norm, vec3 viewDir, vec3 lightDir) {
    // Strong specular highlight
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(0.0, dot(reflectDir, viewDir)), 128.0);
    // Environment reflection (main component for metallic look)
    vec3 envReflect = reflect(-viewDir, norm);
    vec3 envColor = getEnvironmentColor(envReflect);
    // Fresnel effect
    float fresnel = pow(1.7 - max(0.0, dot(norm, viewDir)), 2.50);
    // Combine components
    vec3 metallic = envColor * 0.8 + spec * 20.0;
    return mix(vec3(0.1), metallic, fresnel * .8 + 0.2);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.002);

    float movCamX = cos(iTime * 0.1) + 0.1;
    vec3 ro = vec3(movCamX,1.0,1.6);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayDirection(ro, rd);

    if(dt < 10.0)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        vec3 viewDir = normalize(ro - p);
        vec3 lightDir = normalize(vec3(2.0, 3.0, 3.0));
        // Calculate metallic lighting
        vec3 diff = calculateLighting(p, norm, viewDir, lightDir) * 2.0;
        // vec3 sunDir = normalize(vec3(2.0, 3.0, 3.0));
        // float diff = clamp(dot(norm, sunDir), 0.0, 1.0);
        color = sdColor(p) * diff;
    }
    color = pow(color * 1.0, vec3(1.0/2.2));
    // color = vec3(dt * 0.2);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
