uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 139  🌟                
    
    ▓  Light practice, improving the light of the building 
    ▓  thing. I wanna play more with the building, 
    ▓  Make some different version of it, try different 
    ▓  types of light. 
    
    ▓              🌟  Rayz, normals  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  SDF, MAP  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 10.0
const float DOT_SPEED = 0.1; 

float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

// @iquilez 
float sdfBox(vec3 p, vec3 b, float r)
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}
// @iquilez 
// https://iquilezles.org/articles/distfunctions/
float sdBoxFrame( vec3 p, vec3 b, float e )
{
       p = abs(p  )-b;
  vec3 q = abs(p+e)-e;
  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

float plane(vec3 p)
{
    float d1 = p.y + 3.0;
    return d1;
}

float building(vec3 p, float T)
{
    vec3 newp = p + vec3(0,0.5,0);
    vec3 cellSize = vec3(7.0, 2.0, 5.0);
    vec3 cellOff  = vec3(3.0, 0.0, 0.0);
    
    vec3 id  = floor((newp + cellOff) / cellSize);
    vec3 cell = vec3(mod(newp.x + 3.0, 7.0) - 2.5,  mod(newp.y + 0.0,2.0) - 0.5, mod(newp.z + 0.0,5.0) - 2.5);
    float rnd = fract(sin(dot(id, vec3(12.9898, 78.233, 109.3594))) * 43758.5453)  * 0.5 + 0.5;
    vec3 b  = vec3(1.0,1.0,1.0);
    float r = 0.1;
    
    return sdfBox(p, b, r);
}

float borders(vec3 p, float T)
{
    vec3 newp = p;
    //newp.y -= T * 0.5;
    newp = vec3(mod(newp.x + 3.0, 7.0) - 2.5, mod(newp.y + 0.0,5.0) - 2.5, mod(newp.z + 0.0,5.0) - 2.5);
    
    vec3 b  = vec3(1.0,1.0,1.0);
    float r = 0.1;
    
    float d1 = sdBoxFrame(p, b * 1.3, 0.01) - 0.0925;
    
    return d1;
}

vec4 map(vec3 p, float T)
{
    float d1 = building(p, T);
    float d2 = borders(p, T);
    
    vec2 sdf = d1 < d2 ? vec2(smin(d1, d2,0.1), 1.0) : vec2(smin(d2, d1, 0.1), 2.0);
    
    return vec4(sdf, 0.0, 1.0);
}

float circlePattern(vec3 p, float T)
{
    vec3 color  = vec3(0);

    vec3 newp = p;
    newp = vec3(mod(newp.x + 3.0, 7.0) - 2.5, mod(newp.y + 0.0,5.0) - 2.5, mod(newp.z + 0.0,5.0) - 2.5);
    vec3 b  = vec3(1.0,1.0,1.0);
    float r = 0.05;
    
    float d1 = sdBoxFrame(p, b * 1.3, r) - 0.025;
    d1 = smoothstep(0.0,0.01,d1);
    return d1;
}

vec2 rayMarch(vec3 ro, vec3 rd, float T)
{
    float m = -1.0;
    float dt = 0.0;
    
    for(int i = 0; i < 140; i++)
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
    float e = 0.0001;
    return normalize(vec3(
        map(p + vec3(e,0,0), T).x - map(p - vec3(e,0,0), T).x,
        map(p + vec3(0,e,0), T).x - map(p - vec3(0,e,0), T).x,
        map(p + vec3(0,0,e), T).x - map(p - vec3(0,0,e), T).x
    ));
}

float nBox(vec3 p, vec3 size, float a, float b) {
    vec3 boxSize = size; 
    vec3 newP = p; 
    vec3 edgeDist = boxSize - abs(newP);
    float minEdgeDist = min(edgeDist.x, min(edgeDist.y, edgeDist.z));
    return 1.0 - smoothstep(a, b, minEdgeDist); 
    
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

float saturate(float x){ return clamp(x, 0.0, 1.0); }

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  MAIN  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec3 renderScene(vec2 uv, out float dtOut) 
{
    vec3 col = vec3(0.01);
    
    float T = iTime * 1.0;
    
    vec3 ta = vec3(0.0 , 0.0, 0.0); 
    vec3 ro = ta + vec3(4.0*cos(0.4*T), 2.0, 4.0*sin(0.4*T)); 
    //vec3 ro = ta + vec3(3.0*cos(0.4), 2.0, 6.0*sin(1.9)); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    vec3 rd = ca * normalize(vec3(uv, 2.0)); 
    
    vec2 dt = rayMarch(ro, rd, T);
    dtOut = dt.y;
    
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p, T);
        //vec3 norm = nBox(p, vec3(1)); 
        
        vec3 bgCol = vec3(0);
        vec3 k_ambient = vec3(0);
        vec3 k_diffuse = vec3(0); 
        vec3 k_specular = vec3(0);
        
        vec3 nVis = 0.5 + 0.5*norm;     
        
        if(dt.y > 1.5){
            // BORDER
            float d1 = circlePattern(p, T);
            d1 = abs(d1) * 1.1;
            bgCol = vec3(0.02 / (d1 + 0.01));
            bgCol = mix(vec3(0,0.03,0.2), vec3(0,0.8,0.8), d1);
            
        } else {
            // BLOCK
            bgCol = vec3(0.5);
        }
        
        float ambient = 0.5;
        
        vec3  L    = normalize(vec3(2, 1, 1));
        float diff = saturate(dot(norm, L));
        float fre  = clamp(1.2 + dot(norm, rd), 0., 1.);
        vec3  hal  = normalize(L - rd);
        float spec = saturate(dot(norm, hal));
        
        float edgeRim = nBox(p, vec3(1.46), 0.0, 0.08);
        float boxRim  = nBox(p, vec3(1.47), 0.5, 0.38);

        col += 55. * edgeRim * vec3(0, .4, .8);
        col += 25. * boxRim * vec3(0, .4, .8);

        // Debugger
        if(false)
        {                                
            //col = nVis; return col;
            //col = vec3(diff); return col;
            return vec3(fre);
        }
        
        col += 5. * vec3(.8, .5, .2) * pow(vec3(spec), vec3(30, 20, 10));
        //col += 10. * (1. - diff * diff) * pow(fre, 8.) * vec3(0, .2, .8);
        col += 2. * diff * vec3(.0, .1, .5);
        col *= .3 + .5 * texture(iChannel0, fract(.3 * p.xy)).xyz;
        
        // Fog
        col = mix( col, vec3(0.01), 1.0-exp( -0.0005*dt.x*dt.x*dt.x ) );
    }
    
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
