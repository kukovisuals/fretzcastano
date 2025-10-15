uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse; 
// Fork of "vol vox box" by 01000001. https://shadertoy.com/view/wfySzh
// Integrated with spiky sphere shader
// 2025-06-15 03:41:53

const float pi = 3.14159;
const float pi2 = pi * 2.0;
const float eps = 1e-4;
float pc = 3.;
int lines = 26;
#define flines float(lines)

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
vec3 getHC( in vec3 c ){
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}
float sdCircle(vec3 p)
{   
    // Start with base sphere distance
    float t = length(p) - 1.049630;
    // Only apply displacement if we're near the surface
    if (t < 2.0) {  // spike height = 2.0
        vec3 q = p;
        q.xz = rotate2d(iTime * 0.105) * q.xz;
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
        t += v * 0.7320;  // 2.0 is spike height
    }
    return t;
}

float smin( float a, float b, float k )
{
    k *= log(2.0);
    float x = b-a;
    return a + x/(1.0-exp2(x/k));
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float map(vec3 p)
{ 
    float d1 = sdCircle(p - vec3(1.0, 0.0, 0.0)); 
    float d2 = sdCircle(p + vec3(1.1, 0.0, 0.0)); 
    //return d1;
    return smin(d1, d2, .1);
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

// Modified voxel function using your spiky sphere with full color system
vec3 voxel(vec3 p){
    /*
        FX
    */
    int fxMod = int(mod(iTime/2.0, 9.0));
    
    // Scale the position to fit within the voxel grid
    if ((fxMod & 1) == 0){
        p = floor(p);
    }
    
    vec3 scaledPos = (p / flines - 0.5) * 8.0;
    
    if(fxMod == 0) {
        scaledPos = (p / flines - 0.5) * 1.0;
    } else if(fxMod == 1) {
        scaledPos = (p / flines - 0.5) * 5.0;
    } else if(fxMod == 2) {
        scaledPos = (p / flines - 0.5) * 8.0;
    } else if(fxMod == 3) {
        scaledPos = (p / flines - 0.5) * 2.0;
    } else if(fxMod == 4) {
        scaledPos = (p / flines - 0.5) * 8.0;
    } else if(fxMod == 5) {
        scaledPos = (p / flines - 0.5) * 6.0;
    } else if(fxMod == 6) {
        scaledPos = (p / flines - 0.5) * 3.0;
    } else if(fxMod == 7) {
        scaledPos = (p / flines - 0.5) * 8.0;
    } else if(fxMod == 8) {
        scaledPos = (p / flines - 0.5) * 4.0;
    }
    
    // SDF
    float dt = map(scaledPos/2.3);
    float density = 1.0 - smoothstep(-0.9, 1.0, dt);
    
    if (dt > 0.0) {
        return vec3(0.0);
    }
    //return vec3(density);
    vec3 normal = getNormal(scaledPos);
    // Your lighting calculations
    float lightFx = sin(iTime * 0.5) * -20.5 - 0.5;
    float lightFx2 = 1.2 * sin(iTime * 0.5) * -0.5 - 0.5;
    vec3 sunDir = normalize(vec3(lightFx, lightFx2, 5.5));
    float diff = clamp(dot(normal, sunDir), 0.0, 1.0);
    float liq_pat = diff * 1.53205 + 0.55;
    
    // Distance-based oscillating brightness
    float distance_osc = cos(dt * pi * 2.0 * 3.0);
    float distance_fade = exp(-dt * 0.08);
    
    // Multi-layered base color with wave interaction
    vec3 base_color = hsv2rgb(vec3(0.5 + liq_pat * 0.242, 0.84, 1.0 + liq_pat * 0.5));
    
    // Create the "k" vector equivalent
    vec3 k = vec3(liq_pat);
    
    // Apply color mixing formula
    vec3 c = max(vec3(distance_osc) - vec3(dt * 0.05) - k * 0.3, vec3(0.0));
    
    // Add cyan tint
    c.gb += 0.15;
    
    // Complex color blending: c*.4 + c.brg*.6 + c*c
    vec3 final_color = c * 0.4 + c.brg * 0.6 + c * c;
    
    // Blend with original base color
    vec3 color = mix(base_color, final_color, 0.7);
    
    // Enhanced glow system
    float enhanced_glow = exp(-dt * 0.1) * (1.0 + distance_osc * 0.5);
    color *= enhanced_glow;
    
    // Pattern-based highlights with oscillation
    color += base_color * 0.258;
    
    // Enhanced Fresnel with color shift (use proper view direction)
    vec3 viewDir = normalize(scaledPos); // Approximate view direction from center
    float fresnel = 1.0 - abs(dot(normal, -viewDir));
    vec3 fresnel_color = vec3(0.3, 0.8, 1.0) * pow(fresnel, 2.0);
    color += fresnel_color * 1.0;
    
    // Add electric-like rim effects
    float rim = pow(fresnel, 8.0);
    color += vec3(1.0, 0.8, 0.4) * rim * 3.0 * (1.0 + sin(iTime * 4.0) * 0.5);
    
    // Depth-based color temperature shift
    float temp_shift = dt * 0.02;
    color.r *= 1.0 + temp_shift;
    color.b *= 1.0 - temp_shift * 0.5;
    
    // Apply density and scale for volume rendering
    return color * density * 4.0;
}

float planeRay(vec3 ro, vec3 rd, vec3 norm, float d){
    float a = dot(ro, norm)-d, b = dot(norm, -rd);
    if (b < 0. && a > 0.) return 1e9;
    return a / b;
}

float line(vec2 uv, vec2 a, vec2 b){
    float x = min(length(uv-a),length(uv-b));
    vec2 v = normalize(b-a);
    if (dot(v, uv-a) > 0. && dot(v, uv-a) < length(a-b)) x = min(x, abs(dot(uv-a, v.yx*vec2(-1,1)))); 
    return x;
}

void mainImage( out vec4 O, vec2 U ){

    vec2 r = iResolution.xy;
    vec2 uv = U/r;
    vec2 cuv = (2.*U-r)/r.y;
    vec2 muv = iMouse.xy == vec2(0)?vec2(iTime/5., -.2):(2.*iMouse.xy-r)/r.y;
    O = vec4(0);

    vec2 camM = muv*(pi/2. - 1e-3);
    vec3 camF = vec3(sin(camM.x)*cos(camM.y), cos(camM.x)*cos(camM.y), sin(camM.y));
    vec3 camR = normalize(cross(camF, vec3(0,0,1)));
    vec3 camU = cross(camR, camF);
    
    vec3 o = vec3(.5) - 2.5*camF;
    
    vec3[8] p;
    float vx,vy,vz;
    for (int i = 0; i < 8; i++){
        vx = dot(camR, vec3(i>>2, (i>>1)%2, i%2)-o);
        vy = dot(camU, vec3(i>>2, (i>>1)%2, i%2)-o);
        vz = dot(camF, vec3(i>>2, (i>>1)%2, i%2)-o);
        p[i] = vec3(vx,vy, vz/pc);
    } // vertex shader lol
    
    float d = 1e4;
    
    vec3 a,b;
    
    //*
    for (int z = 0; z <= lines; z+=lines){
        for (int x = 1; x < lines; x++){
            float fx = float(x)/flines;
            float fz = float(z)/flines;
            a = mix(mix(p[0], p[1], fz), mix(p[4], p[5], fz), fx);
            b = mix(mix(p[2], p[3], fz), mix(p[6], p[7], fz), fx);

            d = min(d, line(cuv, a.xy / a.z, b.xy / b.z));


            a = mix(mix(p[4], p[5], fz), mix(p[6], p[7], fz), fx);
            b = mix(mix(p[0], p[1], fz), mix(p[2], p[3], fz), fx);

            d = min(d, line(cuv, a.xy / a.z, b.xy / b.z));
        }
    }
    //*/
    
    float x = .1 * 
    //smoothstep(2./r.y, 0., d);
    exp(-pow(d / (2./r.y), 2.));
    // gaussian instead of smoothstep nearly eliminates moire

    d = 1e4;
    // Outlines
    //*
    d = min(d, line(cuv, p[0].xy / p[0].z, p[2].xy / p[2].z));
    d = min(d, line(cuv, p[2].xy / p[2].z, p[6].xy / p[6].z));
    d = min(d, line(cuv, p[6].xy / p[6].z, p[4].xy / p[4].z));
    d = min(d, line(cuv, p[4].xy / p[4].z, p[0].xy / p[0].z));
    
    d = min(d, line(cuv, p[1].xy / p[1].z, p[3].xy / p[3].z));
    d = min(d, line(cuv, p[3].xy / p[3].z, p[7].xy / p[7].z));
    d = min(d, line(cuv, p[7].xy / p[7].z, p[5].xy / p[5].z));
    d = min(d, line(cuv, p[5].xy / p[5].z, p[1].xy / p[1].z));
    
    d = min(d, line(cuv, p[0].xy / p[0].z, p[1].xy / p[1].z));
    d = min(d, line(cuv, p[2].xy / p[2].z, p[3].xy / p[3].z));
    d = min(d, line(cuv, p[6].xy / p[6].z, p[7].xy / p[7].z));
    d = min(d, line(cuv, p[4].xy / p[4].z, p[5].xy / p[5].z));
    //*/

    x = mix(x, .8, smoothstep(3./r.y, 0., d));
    
        
    vec3 norm, dir = camF + camR * cuv.x/pc + camU*cuv.y/pc;
    float t,dis,tempT,maxT,minT;
    vec4 v;

    maxT = 0.; minT = 1e9;
    for (int q = 0; q < 6; q++){
        norm *= 0.;
        norm[q%3] = q%6<3?-1.:1.;
        dis = q<3?0.:1.;
        tempT = planeRay(o, dir, norm, dis);
        if (dot(o, norm)-dis > 0.){
            maxT = max(maxT, tempT);
        } else {
            if (tempT > 0.) minT = min(minT, tempT);
        }
    }
    t = maxT * flines;
    
    if (minT - maxT > 0.) {
        
        float d;
        vec3 p,v=vec3(0);
        bvec3 sides = bvec3(dir.x > 0., dir.y > 0., dir.z > 0.);
        vec3 dists;

        for (int i = 0; i < 512; i++){
            p = o*flines + dir*t;

            if (
                   p.x > flines + eps
                || p.y > flines + eps
                || p.z > flines + eps
                || p.x < -eps 
                || p.y < -eps
                || p.z < -eps
            ) break; // prevents loop unrolling too. 

            vec3 vox = voxel(p);
            
            for (int q = 0; q < 3; q++){
                dists[q] = (sides[q]?ceil(p[q])-p[q]:floor(p[q])-p[q])/dir[q];
            }

            d = min(dists.x, min(dists.y, dists.z));

            t += d + max(t*1e-5, 1e-4);
            
            v += d * max(vec3(0), vox);

        }

        O.xyz += (1.-exp(-v*.02));

    }
    
    O += vec4(pow(x, 1./2.2));    
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
