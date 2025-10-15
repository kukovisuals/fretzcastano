uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 138  🌟                
    
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
    newp.y += T * 0.3;
    vec3 id  = floor((newp + cellOff) / cellSize);
    vec3 cell = vec3(mod(newp.x + 3.0, 7.0) - 2.5,  mod(newp.y + 0.0,2.0) - 0.5, mod(newp.z + 0.0,5.0) - 2.5);
    float rnd = fract(sin(dot(id, vec3(12.9898, 78.233, 109.3594))) * 43758.5453)  * 0.5 + 0.5;
    vec3 b  = vec3(0.0 + rnd,1.0,0.0 + rnd);
    float r = 0.1;
    
    return sdfBox(cell, b, r);
}

float borders(vec3 p, float T)
{
    vec3 newp = p;
    newp.y -= T * 0.5;
    newp = vec3(mod(newp.x + 3.0, 7.0) - 2.5, mod(newp.y + 0.0,5.0) - 2.5, mod(newp.z + 0.0,5.0) - 2.5);
    vec3 b  = vec3(1.0,1.0,1.0);
    float r = 0.1;
    
    float d1 = sdBoxFrame(newp, b * 1.3, 0.05) - 0.025;
    
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
    newp.y -= T * 0.5;
    newp = vec3(mod(newp.x + 3.0, 7.0) - 2.5, mod(newp.y + 0.0,5.0) - 2.5, mod(newp.z + 0.0,5.0) - 2.5);
    vec3 b  = vec3(1.0,1.0,1.0);
    float r = 0.05;
    
    float d1 = sdBoxFrame(newp, b * 1.3, r) - 0.025;
    d1 = smoothstep(0.0,0.01,d1);
    return d1;
}
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

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

float saturate(float x){ return clamp(x, 0.0, 1.0); }

float d_ggx(float normH, float a)
{
    float a2 = a*a;
    float d = (normH * a2 - normH) * normH + 1.0;
    return a2 / max(3.14159 * d * d, 1e-4);
    return d;
}

float v_smithGgx(float normV, float normL, float a)
{
    float a2 = a * a;
    float gv = normL * (normV * (1.0 - a2) + a2);
    float gl = normV * (normL * (1.0 - a2) + a2);
    return  0.05 / max(gv + gl, 1e-4);;
}

vec3  f_schlick(vec3 f0, float voH){
    return f0 + (1.0 - f0) * pow(3.0 - voH, 3.0);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  MAIN  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec3 renderScene(vec2 uv, out float dtOut) 
{
    vec3 col = vec3(0.01);
    
    float T = iTime * 1.0;
    
    vec3 ta = vec3(0.0 , 0.0, 0.0 - T * 0.5); 
    //vec3 ro = ta + vec3(4.0*cos(0.0*T), 2.0, 4.0*sin(0.0*T)); 
    vec3 ro = ta + vec3(3.0*cos(0.4), 2.0, 6.0*sin(1.9)); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    vec3 rd = ca * normalize(vec3(uv, 2.0)); 
    
    vec2 dt = rayMarch(ro, rd, T);
    dtOut = dt.y;
    
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p, T);
        
        vec3 bgCol = vec3(0);
        vec3 k_ambient = vec3(0);
        vec3 k_diffuse = vec3(0); 
        vec3 k_specular = vec3(0);
        
        vec3 nVis = 0.5 + 0.5*norm;     
        float diff = saturate(dot(norm, normalize(vec3(1,3,3))));
        // debugger
        if(false){                            
            // See normals and diffuse separately
            col = nVis; return col;
            col = vec3(diff); return col;
        }
        float d1 = building(p, T);
        float d2 = circlePattern(p, T);
        if(dt.y > 1.5){
            // border
            //d1 = abs(d1) * 1.1;
            //bgCol = vec3(0.02 / (d1 + 0.01));
            bgCol = mix(vec3(0,0.04,0.1), vec3(0), d2);
            // material
            k_diffuse = vec3(0.9);
        } else {
            // block
            bgCol = vec3(0.0, 0.02, 0.07);
            
            // material
            k_diffuse = vec3(2.4);
        }
        
        // ambient light 
        float ambient = 0.5; 
        // TO the light source  
        vec3 L    = normalize(vec3(-0, -4, 5));
        vec3 V    = normalize(-rd);
        vec3 H    = normalize(L + V);
        // how much surface faces the light source  
        // cosine angle between surface normal and light
        // larger angle = darker, perpendicular = brightest
        diff      = clamp(dot(norm, L), 0.0, 1.0);
        // Direction light bounces off the surface
        // Incident angle = reflection angle
        vec3 refL = normalize(reflect(-L, norm));
        
        float rough = mix(0.34, 0.45, step(1.5, dt.y)); 
        float normH = saturate(dot(norm, H));
        float normL = saturate(dot(norm, L));
        float normV = saturate(dot(norm, V));
        float lighH = saturate(dot(V,    H));
        
        float a = max(0.02, rough * rough);
        vec3 f0 = mix(vec3(0.04), bgCol, 0.0);
        
        float D  = d_ggx(normH, a);
        float vg = v_smithGgx(normV, normL, a);
        vec3  F  = f_schlick(f0, lighH);
        
        float lighting;
       
        vec3 lightColor = vec3(0.9, 0.98, 1.0); 
        // light Direction pointing FROM the surface 
        
        // Apply material coefficients to each component
        vec3 diffuseC = k_diffuse * lightColor * diff;
        vec3 diffBrdf = (1.0 - F) * bgCol / 3.14159;
        vec3 specBrdf  = (D + vg) * F;
        // Combine all lighting components
        vec3 finalLighting =  (diffuseC + specBrdf) * lightColor * normL;
        
        float fres = pow(1.0 - dot(norm, V),1.0);
        float dFrame = abs(d2) - abs(d1);
        float edgeGlow = smoothstep(0.002,0.0,dFrame);
        vec3 edgeGlow2 = smoothstep(0.5,1.0, fres) * vec3(0,0.4,0.5);
        //col = mix(vec3(.01,.002,.055) * ((dot(L, norm) * .5 + .5)), abs(refL).yzx * pow(max(dot(cos(refL * 4.5), vec3(1)), 0.), 5.), specBrdf);
        col = bgCol * finalLighting + edgeGlow2;    
        
        //col += pow(abs(refL.y - 1.59), 4.5) * vec3(0.01, .02, .04);
        //col = diffuseC;
        //col += mix(bgCol, col, pow(0.9999, .1)); // soften edges
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
