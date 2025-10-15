uniform vec3 iResolution;
uniform float iTime; 

// Spikes from FabriceNeyret2 
// https://www.shadertoy.com/view/wsXGWM

// colors from blackjero
// https://www.shadertoy.com/view/XtGGzG
vec3 hsv2rgb(vec3 c) 
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
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
vec3 inferno_quintic( float t )
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
	return vec3(
		dot( x1.xyzw, vec4( -0.027780558, +1.228188385, +0.278906882, +3.892783760 ) ) + dot( x2.xy, vec2( -8.490712758, +4.069046086 ) ),
		dot( x1.xyzw, vec4( +0.014065206, +0.015360518, +1.605395918, -4.821108251 ) ) + dot( x2.xy, vec2( +8.389314011, -4.193858954 ) ),
		dot( x1.xyzw, vec4( -0.019628385, +3.122510347, -5.893222355, +2.798380308 ) ) + dot( x2.xy, vec2( -3.608884658, +4.324996022 ) ) );
}
vec3 magma_quintic( float t )
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
	return vec3(
		dot( x1.xyzw, vec4( -0.023226960, +1.087154378, -0.109964741, +6.333665763 ) ) + dot( x2.xy, vec2( -11.640596589, +5.337625354 ) ),
		dot( x1.xyzw, vec4( +0.010680993, +0.176613780, +1.638227448, -6.743522237 ) ) + dot( x2.xy, vec2( +11.426396979, -5.523236379 ) ),
		dot( x1.xyzw, vec4( -0.008260782, +2.244286052, +3.005587601, -24.279769818 ) ) + dot( x2.xy, vec2( +32.484310068, -12.688259703 ) ) );
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
mat2 rotate2d(float a){ return mat2(cos(a),-sin(a), sin(a),cos(a)); }
float sdCircle(vec3 p)
{
    float phi = length(p) - 1.3;
    // displacement near center
    if(phi < 2.0)
    {
        vec3 new_p = p; float v;
        new_p.xz = rotate2d(iTime * 0.15) * new_p.xz;
        new_p /= length(new_p);
        new_p.x = atan(new_p.x, new_p.z); new_p.y = asin(new_p.y);
        #if 0
            q.x *= v;
        #else 
            v = ceil(4.0 * abs(new_p.y) / 1.57 ) / 4.0;
            v = 8.0 * sqrt(1.0 - v*v);
            new_p.x *= floor(v + 0.1);
        #endif
        new_p.y *= 8.0;
        new_p = sin(new_p * 1.0);
        v = new_p.x * new_p.y;
        v *= v < 0. ? 0.0 : v;
        v += sin(new_p.y * new_p.x * 1.5) * 0.4 + 1.5; 
        phi -= v * 0.231;
    }
    return phi;
}

float opSmoothUnion( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}


vec3 A = vec3(0.0, 0.0, 0.0);
vec3 B = vec3(1.0, 0.0, 0.0);
float map(vec3 p) 
{
    float d1 = sdCircle(p + A); 
    float d2 = sdCircle(p - B); 
    //return opSmoothUnion(d1, d2, 0.5); 
    return d1;
}

float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d<0.0001 || dt>20.0) break;
    }
    return dt;
}

vec3 sdColor(vec3 ro, vec3 rd, float dt, float t, vec3 offSet)
{
    vec3 color = vec3(0.0);
    vec3 p = ro + rd * dt;
    vec3 new_p = p + offSet;
    new_p /= length(new_p);
    float d = map(new_p);
    //float d = length(new_p);

    float colorV = sin(d * 5.0);
    float colorInit = (colorV + 0.6) * 0.5;

    int color_fx = int(mod(t / 4.0, 6.0));
    // color = viridis(viridisInput); 
    if(color_fx == 0) { color = viridis(colorInit); }
    else if(color_fx == 1) { color = inferno_quintic(colorInit); }
    else if(color_fx == 2) { color = magma_quintic(colorInit); }
    else if(color_fx == 3) { color = plasma_quintic(colorInit); }
    else if(color_fx == 4) { color = plasma_quintic(colorInit); }
    else {
        float hue = colorV * 0.13 + 0.6;
        color = hsv2rgb(vec3(hue, 1.0, 0.5));
    }
    return color;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.02);

    float t = iTime;

    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayDirection(ro, rd);

    if(dt < 10.0){
        color = sdColor(ro, rd, dt, t, A); // offset A
        //color += sdColor(ro, rd, dt, t, -B); // offset B
    }

    color = pow(color * 1.0, vec3(1.0/2.2));
    // color = vec3(dt * 0.2);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
