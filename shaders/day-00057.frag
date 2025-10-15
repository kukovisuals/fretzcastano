uniform vec3 iResolution;
uniform float iTime; 

// Spikes from FabriceNeyret2 
// https://www.shadertoy.com/view/wsXGWM

// colors from blackjero
// https://www.shadertoy.com/view/XtGGzG

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

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 6; i++) {
        value += amplitude * noise3D(p * frequency);
        amplitude *= 0.35;
        frequency *= 1.0;
    }
    return value;
}
vec3 viridis(float t) 
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
    return vec3(
        dot(x1, vec4(0.280268003, -0.143510503, 2.225793877, -14.815088879)) + dot(x2.xy, vec2(25.212752309, -11.772589584)),
        dot(x1, vec4(-0.002117546, 1.617109353, -1.909305070, 2.701152864)) + dot(x2.xy, vec2(-1.685288385, 0.178738871)),
        dot(x1, vec4(0.300805501, 2.614650302, -12.019139090, 28.933559110)) + dot(x2.xy, vec2(-33.491294770, 13.762053843))
    );
}
vec3 plasma_quintic( float t )
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
	return vec3(
		dot( x1.xyzw, vec4( +0.063861086, +1.992659096, -1.023901152, -0.490832805 ) ) + dot( x2.xy, vec2( +1.308442123, -0.914547012 ) ),
		dot( x1.xyzw, vec4( +0.049718590, -0.791144343, +2.892305078, +0.811726816 ) ) + dot( x2.xy, vec2( -4.686502417, +2.717794514 ) ),
		dot( x1.xyzw, vec4( +0.513275779, +1.580255060, -5.164414457, +4.559573646 ) ) + dot( x2.xy, vec2( -1.916810682, +0.570638854 ) ) );
}
mat2 rotate2d(float a){
    return mat2(cos(a),-sin(a),sin(a),cos(a));
}
float sdCircle(vec3 p)
{
    float d = length(p) - 1.4632;

    if(d < 2.0)
    {
        vec3 new_p = p; float v;
        
        vec3 orig_p = p;
        // Large scale bumps (like the virus bulges)
        float largeBumps = fbm(orig_p * 0.9652 + iTime * 0.3101) * 0.2323;
        float fineBumps = noise3D(orig_p * 1.80 - iTime * 0.32401) * 0.305;
        d -= largeBumps + fineBumps;

        new_p.xz = rotate2d(iTime * 0.1) * new_p.xz;
        new_p /= length(new_p);
        // new_p.z += cos(new_p.x * 1.5) * 0.4 + 1.5;
        new_p.x = atan(new_p.x, new_p.z); new_p.y = asin(new_p.y);
        #if 0
            q.x *= v;
        #else 
            v = ceil(3.0 * abs(new_p.y) / 1.57 ) / 4.0;
            v = 12.0 * sqrt(1.0 - v*v);
            new_p.x *= floor(v + 0.1);
        #endif
        new_p.y *= 12.0;
        new_p = sin(new_p * 2.0);
        v = new_p.x * new_p.y;
        // v *= abs(v);
        v *= v < 0. ? 0.0 : v;
        v += sin(new_p.y * new_p.x * 0.3) * 0.4 + 0.5; 
        v = smoothstep(0.0, 0.8, v); // Ensures bounded, smooth transitions
        d -= v * 0.136531;
    }
    return d;
}

float map(vec3 p)
{
    return sdCircle(p);
}

float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d<0.001 || dt>20.0) break;
    }
    return dt;
}

vec3 sdColor(vec3 ro, vec3 rd, float dt)
{
    vec3 color = vec3(0.0);
    vec3 p = ro + rd * dt;
    vec3 new_p = p;
    new_p /= length(new_p);
    float d = map(new_p);
    //float d = length(new_p);

    float colorV = sin(d * 20.0);
    float colorInit = (colorV + 0.46) * 0.45;

    int color_fx = int(mod(iTime / 3.0, 2.0));
    //color = viridis(colorInit); 
    if(color_fx == 0) { color = viridis(colorInit); }
    else if(color_fx == 1) { color = plasma_quintic(colorInit); }
    
    return color;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.0);
    
    float camFx =  sin(iTime * 0.9) * 0.3 + 0.5;
    vec3 ro = vec3(0.0,0.0, 2.0 + camFx);
    vec3 rd = normalize(vec3(uv,-1.0));
    
    float dt = rayDirection(ro, rd);
    if(dt < 20.0){
        color = sdColor(ro, rd, dt); // offset A
    }
    color = pow(color * 1.0, vec3(1.0/2.2));
    // color = vec3(dt * 0.2);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
