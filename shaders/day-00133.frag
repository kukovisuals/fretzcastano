uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 133  🌟                
    
    ▓  Light practice, playing with @shane's shader on 
    ▓  transparency 
    
    ▓  https://www.shadertoy.com/view/Xd3SDs
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 20.0
const float SPEED_CAPSULE = 1.0;

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float plane(vec3 p)
{
    float d1 = p.y + 1.0;
    return d1;
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
    vec3 a = vec3(0,0, 20);
    vec3 b = vec3(0,0,-20);
    
    float r = 0.13;
    
    vec3 trans = vec3(0,0.5,-1);
    
    vec2 s1  = sdfCapsule(p + trans, a, b, r);
    float d1 = s1.x;
    
    vec2 s2  = sdfCapsule(p + trans, a, b, r);
    float d2 = s2.x - 0.3 * cos(150.0 * s2.y - T * SPEED_CAPSULE);
    
    return smin(d1, d2, 0.3);
}

vec4 map(vec3 p, float T)
{
    vec3 p1 = p;
    p1 = vec3(p1.x, mod(p1.y + 1.0, 3.0) - 1.5, p1.z);
    
    float d1 = capsuleShape(p, T);
    float d2 = plane(p);
    
    vec2 sdf = d1 < d2 ? vec2(d1, 1.0) : vec2(d2, 2.0);
    
    return vec4(sdf, 0.0, 1.0);
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

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 capsuleShade(vec3 p, float T)
{
    vec3 trans = vec3(0,0.5,-1);
    vec2 s2 = sdfCapsule(p + trans, vec3(0,0,20), vec3(0,0,-20), 0.13);
    float wave = 0.5 * cos(300.0 * s2.y - T * SPEED_CAPSULE * 4.0);
    float waveI = abs(wave) / 0.14; // 0 to 1

    vec3 baseTint = mix(vec3(20.3, 0.7, 0.7), vec3(0.0), clamp(waveI, 0.0, 1.0));
    return baseTint; 
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  Transparency light  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec3 sampleLighting(vec3 sp, vec3 sn, vec3 rd, vec3 lp, float lBoost)
{
    vec3 ld = lp - sp;
    float lDist = max(length(ld), 1e-3);
    ld /= lDist;

    // Classic terms + Fresnel
    float l  = max(dot(ld, sn), 0.0);
    float s  = pow(max(dot(reflect(-ld, sn), -rd), 0.0), 8.0);
    float fr = pow(max(1.0 - max(0.0, dot(-rd, sn)), 0.0), 5.0);

    // Distance attenuation 
    float atten = 1.0 / (1.0 + lDist*0.25 + lDist*lDist*0.05);

    return ((l + 0.02 + fr*0.10) + vec3(0.5, 0.7, 1.0) * s) * atten * lBoost;
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  MAIN  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec3 renderScene(vec2 uv, out float dtOut) 
{
    vec3 col = vec3(0.01);
    
    float T = iTime * 1.5;
    
    vec3 ta = vec3(0.0, 0.0, 0.0); 
    vec3 ro = ta + vec3(4.0*cos(0.1*T), 2.0, 4.0*sin(0.1*T)); 
    vec3 lp = ro + normalize(vec3(1.0, 3.0, 3.0)) * 5.0;
    
    mat3 ca = setCamera(ro, ta, 0.0);
    vec3 rd = ca * normalize(vec3(uv, 2.0)); 
    
    float dt    = 0.0;
    vec3  tOut  = vec3(0.0);
    float layer = 0.0;
    float thD   = 0.0125;
    
    for(int i=0; i<64; i++)
    {
        if(layer > 30.0 || dt > FAR) break;
        
        vec3 p = ro + rd * dt;
        vec4 d = map(p, T);  
        vec3 norm = calcNormal(p, T);
        float m = d.x;
        
        // We hit surface when distance is small
        if (d.y < 1.5)   
        {
            float aD = (thD - abs(m) * (31.0/32.0)) / thD;
            
             // Material type check
            if(aD > 0.0) 
            {
                vec3 baseTint = capsuleShade(p, T);
                
                vec3 transLight = sampleLighting(p, norm * sign(m), rd, lp, 0.25);
                
                col += transLight * aD * mix(vec3(1), baseTint, 0.645);
                
                layer += 1.0;
                dtOut = dt;  
            }
        }
        dt += max(abs(m) * 0.575, thD * 0.04125);
    }
    dtOut = dt; 
    
    // Fog effect
    col = mix(col, vec3(0.01), 1.0 - exp(-0.001 * dt * dt * dt));
    
    // Gamma correction
    col = pow(col * 1.0, vec3(1.1 / 2.2));
    
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
