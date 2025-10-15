uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 129  🌟                
    
    ▓  From the UFO shader I learned a ton from Iq's tutor.
    ▓  One thing is that light and material is harder 
    ▓  for me to grasp.
    
    ▓  Light practice with fresnel, I need to get better at 
    ▓  light and  color. I have a good idea now of what I 
    ▓  want to do but  I need  to be able to control the light 
    ▓  as I please. I need  to make light and color my 
    ▓  bitch instead of the other way around. 
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 20.0
#define SPEED_CAPSULE 1.0

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

vec2 sdfCapsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p - a, ba = b - a;
    
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    
    float d1 = length(pa - ba * h) - r;
    
    return vec2(d1, h);
}

float capsuleShape(vec3 p, float T)
{
    vec3 a = vec3(-20,0,0);
    vec3 b = vec3( 20,0,0);
    
    float r = 0.33;
    
    vec2 s1  = sdfCapsule(p, a, b, r);
    float d1 = s1.x;
    
    vec2 s2  = sdfCapsule(p, a, b, r);
    float d2 = s2.x - 0.4 * cos(100.0 * s2.y - T * SPEED_CAPSULE);
    
    return smin(d1, d2, 0.1);
}

float map(vec3 p, float T)
{
    vec3 p1 = p;
    p1 = vec3(p1.x, mod(p1.y + 1.0, 3.0) - 1.5, p1.z);
    
    float d1 = capsuleShape(p1 + vec3(0,0,2), T);
    
    return d1;
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  Rayz, normals  🌟                
    
    ▓  I'm gonna add comments first because as it grows it 
    ▓  gets messy really fast, and I'm like ooh I add 
    ▓  comments later and that never happens.
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float rayMarch(vec3 ro, vec3 rd, float T)
{
    float dt = 0.0;
    for(int i=0; i<100; i++)
    {
        float d = map(ro + rd * dt, T);
        dt += d;
        if(d < 0.001 || dt > FAR) break;
    }
    return dt;
}

vec3 calcNormal(vec3 p, float T)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0), T) - map(p - vec3(e,0,0), T),
        map(p + vec3(0,e,0), T) - map(p - vec3(0,e,0), T),
        map(p + vec3(0,0,e), T) - map(p - vec3(0,0,e), T)
    ));
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  fresnel, color  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// simple environment to reflect/refract
vec3 envColor(vec3 dir) 
{
    // vertical gradient sky
    float h      = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 horizon = vec3(0.355, 0.75, 0.90) * 0.36;
    vec3 zenith  = vec3(0.92, 0.497, 1.00);
    vec3 sky     = mix(horizon, zenith, smoothstep(0.0, 1.0, h));

    // tiny sun for highlight
    float sunFx = sin(iTime * 0.2) * 2.0;
    vec3 sunDir = normalize(vec3(0.25, sunFx, -1.916));
    float sun   = pow(max(0.0, dot(dir, sunDir)), 600.0);
    
    sky += vec3(1.0, 0.95, 0.85) * sun * 1.0;

    return sky;
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  MAIN  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec3 renderScene(vec2 uv, out float dtOut) 
{
    vec3 col = vec3(0);
    
    vec3 ro = vec3(0,0,5);
    vec3 rd = normalize(vec3(uv, -1.0));
    
    float T = iTime;
    float dt = rayMarch(ro, rd, T);
    dtOut = dt;
    
    if(dt < FAR)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p, T);
       
        float cosT = clamp(dot(norm, -rd), 0.0, 1.0);   // cosθ
        float F0   = 0.04;                              // glass baseline reflectance
        float F    = fresnelSchlick(cosT, F0);

        // Fresnel as grayscale
        //col = vec3(F);
        
        // mirror reflection
        vec3 rdir = reflect(rd, norm);
        vec3 refl = envColor(rdir);

        // thin-glass transmission cheat (no true refraction yet):
        // just look "through" to the environment along the view ray.
        vec3 trans = envColor(rd);

        // mix by Fresnel: more reflection on edges, more see-through head-on
        col = mix(trans, refl, F);

        // optional: a tiny rim boost so shapes read nicely
        col += 1.03 * pow(1.0 - cosT, 1.9);
    }
    return col;
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓          💡  SMAA, Antialiasing  💡                
    
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// SMAA-lite (single pass, no area/search textures)
vec3 smaaResolve(vec2 uv, vec3 C, float LC) 
{
    vec2 texel = 1.0 / iResolution.xy;

    // 1) Neighbor samples
    float d; // dummy
    vec3 Cr = renderScene(uv + vec2(texel.x, 0.0), d);
    vec3 Cl = renderScene(uv - vec2(texel.x, 0.0), d);
    vec3 Cu = renderScene(uv + vec2(0.0, texel.y), d);
    vec3 Cd = renderScene(uv - vec2(0.0, texel.y), d);

    float LR = luma(Cr), LL = luma(Cl), LU = luma(Cu), LD = luma(Cd);

    // 2) Edge detection (local contrast + threshold)
    float th = 0.05; // tune
    float horEdge = max(abs(LU - LC), abs(LD - LC));
    float verEdge = max(abs(LR - LC), abs(LL - LC));
    float edgeStrength = max(horEdge, verEdge);

    if (edgeStrength < th) return C; // no edge, keep original

    // Dominant orientation
    bool horizontal = (horEdge > verEdge);

    // 3) Short “search” along edge to estimate span (cheap stand-in for SMAA search tex)
    int maxSteps = 12; // tune: quality vs cost
    float spanNeg = 0.0, spanPos = 0.0;
    float Lref = LC;
    // adaptive threshold using local contrast
    float ath = th * (1.0 + 3.0*edgeStrength);

    // Horizontal edge => blend vertically (search up/down).
    if (horizontal) {
        // up
        for (int i=1; i<=maxSteps; ++i) {
            vec3 c = renderScene(uv + vec2(0.0, float(i)*texel.y), d);
            if (abs(luma(c) - Lref) < ath) { spanPos = float(i); break; }
            if (i==maxSteps) spanPos = float(i);
        }
        // down
        for (int i=1; i<=maxSteps; ++i) {
            vec3 c = renderScene(uv - vec2(0.0, float(i)*texel.y), d);
            if (abs(luma(c) - Lref) < ath) { spanNeg = float(i); break; }
            if (i==maxSteps) spanNeg = float(i);
        }

        // 4) Blend weight from span + edge strength (proxy for area tex)
        float span = spanNeg + spanPos;
        float w = clamp(edgeStrength * 4.0 * (span / float(maxSteps*2)), 0.0, 1.0);

        // sample across the edge normal (vertical)
        vec3 Cpos = renderScene(uv + vec2(0.0, 0.5*spanPos*texel.y), d);
        vec3 Cneg = renderScene(uv - vec2(0.0, 0.5*spanNeg*texel.y), d);
        vec3 Cavg = 0.5*(Cpos + Cneg);
        return mix(C, Cavg, w);
    }
    else {
        // Vertical edge => blend horizontally (search left/right).
        for (int i=1; i<=maxSteps; ++i) {
            vec3 c = renderScene(uv + vec2(float(i)*texel.x, 0.0), d);
            if (abs(luma(c) - Lref) < ath) { spanPos = float(i); break; }
            if (i==maxSteps) spanPos = float(i);
        }
        for (int i=1; i<=maxSteps; ++i) {
            vec3 c = renderScene(uv - vec2(float(i)*texel.x, 0.0), d);
            if (abs(luma(c) - Lref) < ath) { spanNeg = float(i); break; }
            if (i==maxSteps) spanNeg = float(i);
        }

        float span = spanNeg + spanPos;
        float w = clamp(edgeStrength * 4.0 * (span / float(maxSteps*2)), 0.0, 1.0);

        vec3 Cpos = renderScene(uv + vec2(0.5*spanPos*texel.x, 0.0), d);
        vec3 Cneg = renderScene(uv - vec2(0.5*spanNeg*texel.x, 0.0), d);
        vec3 Cavg = 0.5*(Cpos + Cneg);
        return mix(C, Cavg, w);
    }
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0*I - iResolution.xy)/iResolution.y;

    float dt;
    vec3 C = renderScene(uv, dt);
    float LC = luma(C);

    // SMAA-lite resolve
    vec3 outC = smaaResolve(uv, C, LC);

    O = vec4(outC, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
