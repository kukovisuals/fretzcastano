uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 130  🌟                
    
    ▓  Light practice + translucent. I wanna make this 
    ▓  and do a checkboard version instead of a rectangle.
    ▓  I wanna save this version.
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 10.0
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

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b + r;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float capsuleShape(vec3 p, float T)
{
    vec3 a = vec3(-20,0,0);
    vec3 b = vec3( 20,0,0);
    
    float r = 0.33;
    
    vec3 trans = vec3(0,0,-1);
    
    vec2 s1  = sdfCapsule(p + trans, a, b, r);
    float d1 = s1.x;
    
    vec2 s2  = sdfCapsule(p + trans, a, b, r);
    float d2 = s2.x - 0.4 * cos(100.0 * s2.y - T * SPEED_CAPSULE);
    
    return smin(d1, d2, 0.1);
}

float buildings(vec3 p)
{
    vec3 b   = vec3(2.0,4.0,1.0); 
    float d1 = sdRoundBox(p, b, 0.5);
    return d1;
}

float plain(vec3 p)
{
    float d1 = p.y + 1.0;
    return d1;
}

vec4 map(vec3 p, float T)
{
    vec3 p1 = p;
    p1 = vec3(p1.x, mod(p1.y + 1.0, 3.0) - 1.5, p1.z);
    
    float d1 = capsuleShape(p, T);
    float d2 = buildings(p);
    
    vec2 sdf = d1 < d2 ? vec2(d1, 1.0) : vec2(d2, 2.0);
    
    return vec4(sdf, 0.0, 1.0);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  Rayz, normals  🌟                
    
    ▓  I'm gonna add comments first because as it grows it 
    ▓  gets messy really fast, and I'm like ooh I add 
    ▓  comments later and that never happens.
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec2 rayMarch(vec3 ro, vec3 rd, float T)
{
    float m = -1.0;
    float dt = 0.0;
    
    for(int i = 0; i < 100; i++)
    {
        vec4 d = map(ro + rd * dt, T);
        
        m = d.y; 
        dt += d.x;
        if(abs(d.x) < 0.001 || dt > 20.) break;
    }
    
    if(dt > 20.0){
        m  = -1.0;
        dt = -1.0;
    }
    
    return vec2(dt, m);
}

vec3 calcNormal(vec3 p, float T)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0), T).x - map(p - vec3(e,0,0), T).x,
        map(p + vec3(0,e,0), T).x - map(p - vec3(0,e,0), T).x,
        map(p + vec3(0,0,e), T).x - map(p - vec3(0,0,e), T).x
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
    float sunFx = 0.2;//sin(iTime * 2.2) * 2.0;
    vec3 sunDir = normalize(vec3(0.25, sunFx, -1.916));
    float sun   = pow(max(0.0, dot(dir, sunDir)), 200.0);
    
    sky += vec3(1.0, 0.95, 0.85) * sun * 1.0;

    return sky;
}

vec3 shadeBuilding(vec3 p, vec3 n, vec3 rd)
{
    vec3 L = normalize(vec3(-0.4, 0.7, 0.3));
    float ndl = max(0.0, dot(n, L));          // diffuse
    vec3 base = mix(vec3(0.05,0.09,0.16),     // deep blue
                    vec3(0.20,0.60,0.95),     // cyan
                    smoothstep(-4.0, 4.0, p.y));
    vec3 h = normalize(L - rd);               // Blinn half-vector
    float spec = pow(max(0.0, dot(n, h)), 64.0) * 0.25;
    return base * (0.15 + 0.85 * ndl) + spec;
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  Translucent stuff  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

// Step through the SDF till we're just outside the capsule (exit thickness).
float marchExit(vec3 p, vec3 rd, float T)
{
    float t = 0.0;
    for(int i=0;i<48;i++){
        float d = map(p + rd * t, T).x;      // negative inside the capsule
        t += max(0.001, abs(d));             // always step forward
        if(d > 0.0) break;                   // just outside
    }
    return t;
}

// Trace along rd from p, return color of first thing hit (or sky).
vec3 shadeHitAlong(vec3 p, vec3 rd, float T)
{
    vec2 h = rayMarch(p, rd, T);             // (t, id)
    if(h.y < 0.0) return envColor(rd);
    vec3 ph = p + rd * h.x;
    vec3 nh = calcNormal(ph, T);
    if(abs(h.y - 2.0) < 0.5) return shadeBuilding(ph, nh, rd); // building
    return envColor(rd);                      // anything else → fallback sky
}

vec3 reflectOnce(vec3 p, vec3 n, vec3 rd, float T)
{
    vec3 rdir = reflect(rd, n);
    // start just off the surface to avoid self-hit
    return shadeHitAlong(p + n*0.001, rdir, T);
}

vec3 transmitOnce(vec3 p, vec3 rd, float T)
{
    // thickness through glass
    float tExit = marchExit(p + rd*0.001, rd, T);   
    vec3 behind = shadeHitAlong(p + rd*(0.001 + tExit), rd, T);

    // Beer–Lambert absorption (aqua glass). 
    // numbers: a 0.6-unit thickness → roughly 86% R, 97% G, 99% B survives.
    vec3 sigmaA = vec3(0.25, 0.05, 0.02);
    vec3 transmittance = exp(-sigmaA * tExit);
    return behind * transmittance;
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
    vec2 dt = rayMarch(ro, rd, T);
    dtOut = dt.y;
    
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p, T);
        
        float cosT = clamp(dot(norm, -rd), 0.0, 1.0);   // cosθ
        
        // mirror reflection
        vec3 rdir = reflect(rd, norm);
        vec3 refl = envColor(rdir);
        
        if(dt.y > 1.5)
        {
            // Building
            col = shadeBuilding(p, norm, rd);
            
        } else {
            // CAPSULES
            // glass baseline reflectance
            float F0   = 0.04;                              
            float F    = fresnelSchlick(cosT, F0);

            // mirrors (includes building)
            vec3 refl = reflectOnce(p, norm, rd, T); 
            // see-through (includes building)
            vec3 trans= transmitOnce(p, rd, T);      
            
            // center=trans, rims=refl
            col = mix(trans, refl, F);               
            col += 0.33 * pow(1.0 - cosT, 3.0); 
        }
        
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
