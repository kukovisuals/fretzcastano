uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 119  🌟                
    
    ▓  AA practice using SMAA
    
    ▓  After two weeks of trying to understand AA I think 
    ▓  I found one that works for my capsule things 
    ▓  I'm happy with this one I think it could be improved
    ▓  fucking labor day sale is almost done so I can spend
    ▓  more time with the lovely shaders. 
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
#define FX sin(T * 0.3) * 0.5 + 0.4

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              💊  SDF, MAP  💊                
    
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float sdfCapsule(vec3 p, float id)
{
    p.x += sin(p.y * 4.5 - T) * .06;
    vec3 a = vec3(0.0, -10.0, 0.0);
    vec3 b = vec3(0.0, (0.3 * id) - FX, 0.0);
    vec3 pa = p - a, ab = b - a;
    
    float h = clamp( dot(pa, ab) / dot(ab, ab), 0.0,1.0);
    
    return length(pa - ab * h) - 0.15;
}
 
float map(vec3 p)
{
    vec2 cell = vec2(1.4, 1.0);
    p.z -= T * 0.4;
    vec2 id = floor(p.xz / cell);
    p.xz = mod(p.xz + 0.0, cell) - 0.5*cell;
       
    float s = mix(-1.1, 1.1, hash(id));  
    
    float d1 = sdfCapsule(p, s);
    float d2 = p.y + 3.0;
    return smin(d1, d2, 0.2);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓          💡  COLOR, RAYMARCH, NORMALS  💡                
    
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    
    for(int i=0; i<80; i++)
    {
        float d = map(ro + rd * dt);
        dt += d;
        if(d < 0.01 || dt > 10.0) break;
    }
    return dt;
}

vec3 calcNormal(vec3 p)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0)) - map(p - vec3(e,0,0)),
        map(p + vec3(0,e,0)) - map(p - vec3(0,e,0)),
        map(p + vec3(0,0,e)) - map(p - vec3(0,0,e))
    ));
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 renderScene(vec2 uv, out float dtOut) 
{
    float cam_up = sin(T * 0.2) * 0.7 - 0.54; 
    float cam_x = cos(T * 0.3) * 0.3;
    vec3 ro = vec3(0.0,cam_up,2.5);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayMarch(ro, rd);
    dtOut = dt;
    
    vec3 col = mix(vec3(0.1),vec3(0.0,0.4,0.8),vec3(uv.y + 0.1));
    if (dt < 10.0) 
    {
        vec3 p     = ro + rd * dt;
        vec3 norm  = calcNormal(p);
        vec3 ld    = normalize(vec3(0.3,5.0,2.0));
        float diff = max(dot(norm, ld), 0.0);
        
        float vdn  = dot(norm, -rd);
        float wRim = max(fwidth(vdn),0.9);
        float rim  = pow(smoothstep(0.0,wRim, 1.0 - vdn), 2.0);
        
        float t     = exp((p.y - 0.3 + FX) * 1.9) * 0.1 + 0.75;
        vec3 albedo = palette(t, vec3(0.55), vec3(0.5), vec3(1.0), vec3(0.5, 0.6, 0.065));
        
        float focDist  = 1.0;
        float aperture = 0.03719;
        float bright   = 0.3;
        float ambient  = 0.3;
        
        float coc   = clamp(aperture * abs(dt - focDist) / max(focDist, 1e-3), 0.0, 1.0);
        float sharp = exp(-10.0 * coc);
        vec3 grey   = vec3(dot(albedo, vec3(0)));
        
        vec3 albedoSoft = mix(grey, albedo, sharp);
        float softAmb   = bright + 0.15 * coc;
        
        float d0  = map(p);
        float wCov = max(fwidth(d0), 1e-1);
        float alpha = 1.0 - smoothstep(0.0, wCov, d0);
        
        float spe = pow(max(dot(reflect(-ld,norm), -rd), 0.0), 2.0);
        
        float light = softAmb + (diff + 2.6 * rim) * sharp;

        col = albedoSoft * (0.5*spe + light) * alpha;
        //col = norm; 
    }
    col = pow(col * 1.1, vec3(1.1/2.2));
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
