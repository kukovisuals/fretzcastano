uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 128  🌟                
    
    ▓  UFO thang, Doing Iq's tutorial 
    ▓  https://www.youtube.com/watch?v=Cfe5UQ-1L9Q
    
    ▓  So I was trying to make it more fun but, I'm having a bit of 
    ▓  an issue with the colors hehe. I'll play with that next.
    
    ▓  Here is a video of an UFO that looks closer to what I have seen.
    ▓  https://www.youtube.com/watch?v=Dq1lLClmsQg
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

mat2 R2(float a){return mat2(cos(a), -sin(a), sin(a), cos(a));}

vec2 sdfCapsule(vec3 p, float r, vec3 a, vec3 b, vec3 c, vec2 rXy)
{    
    //vec2 rXy2 = R2(3.1416/3.) * (a - b).xy;
    vec3 co = b + vec3(rXy, (c - b).z);
    
    vec3 pa = p - a;
    vec3 ba = b - a;
    vec3 pb = p - b;
    vec3 bc = co - b;
    
    float h1 = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float h2 = clamp(dot(pb, bc) / dot(bc, bc), 0.0, 1.0);
    
    float d1 = length(pa - ba*h1) - r;
    float d2 = length(pb - bc*h2) - r;
    
    //return min(d1, d2);
    return d1 < d2 ? vec2(d1, h1) : vec2(d2, h2);
}

float sdEllipsoid( vec3 p, vec3 r )
{
  float k0 = length(p/r);
  float k1 = length(p/(r*r));
  return k0*(k0-1.0)/k1;
}

float ufo(vec3 p)
{
    float fxX = sin(iTime  *0.) * 0.5 + 0.0;
    float fxY = cos(iTime * 0.) * 0.2 - 0.5;
    
    float d1 = sdEllipsoid(p + vec3(fxX,-0.5 + fxY,-iTime * 0.0 + 3.0), vec3(0.6,0.1,0.6));
    float d2 = length(p + vec3(fxX,-0.7 + fxY, -iTime * 0.0 + 3.0)) - 0.2;
    
    return smin(d1, d2, 0.5);
}

// https://iquilezles.org/articles/smin
vec4 opU( vec4 d1, vec4 d2 )
{
	return (d1.x<d2.x) ? d1 : d2;
}

vec4 map(vec3 p, float T)
{
    float matId = 0.0;
    
    float fh = -0.6 + 0.16 * (sin(1.5 * p.x + T * 0.0) * sin(0.9 * p.z + T * 0.0));
    
    // UFO
    vec3 u_p  = p;
    u_p.z += iTime * 0.4;
    float u_cell = 3.0;
    u_p = vec3(mod((u_p.x) + 1.0, 6.0) - 1.5, u_p.y, mod(u_p.z + 1.0, 6.0) - 4.5);
    float d1  = ufo(u_p + vec3(0,-4.0,0));
    
    vec3 u_p2  = p;
    u_p2.x += iTime * 0.5;
    float u_cell2 = 3.0;
    u_p = vec3(mod((u_p2.x) + 1.0, 7.0) - 1.5, u_p2.y, mod(u_p2.z + 1.0, 4.0) - 4.5);
    float d5  = ufo(u_p + vec3(0,-2.6,0));
    
    float ufo = min(d1, d5);
    
    // tubes
    vec3 ca = vec3(0, -0, 10);
    vec3 cb = vec3(0,  0,-10);
    vec3 cc = vec3(0,-40,-10);
    
    vec2 rXy = R2(3.1416/2.) * (cc - cb).xy;
    
    vec3 tube_p = vec3(-5,-1,1);
    // tube right
    vec2 res4 = sdfCapsule(p + tube_p, 0.1, ca, cb, cc, rXy);
    float d4  = res4.x;
    
    // tube rings
    vec3 c_p = p;
    c_p.y = sin(c_p.x * 0.564) * 4.6; 
    vec2 res5 = sdfCapsule(p + tube_p, 0.05, ca, cb, cc, rXy);
    float d6  = res5.x - 0.2 * cos(200.0 * res5.y - iTime * 0.5); 
    
    float tubeRight = smin(d4, d6, 0.1);
    
    // tube left
    vec3 ca2 = vec3(0, -0, 10);
    vec3 cb2 = vec3(0,  0,-10);
    vec3 cc2 = vec3(0,-40,-10);
    
    vec2 rXy2 = R2(-3.1416/2.) * (cc2 - cb2).xy;
    
    vec3 tube_p2 = vec3(6,-2.5,1);
    
    vec2 res6 = sdfCapsule(p + tube_p2, 0.15, ca2, cb2, cc2, rXy2);
    float d7  = res6.x;
    
    // tube rings left
    vec3 c_p2 = p;
    c_p2.y = sin(c_p2.x * 0.564) * 1.6; 
    vec2 res7 = sdfCapsule(p + tube_p2, 0.1, ca2, cb2, cc2, rXy2);
    float d8  = res7.x - 0.25 * cos(100.0 * res7.y - iTime * 1.0); 
    
    float tubeLeft = smin(d7, d8, 0.01);
    
    // tube up
    vec3 ca3 = vec3(0,-10,  0);
    vec3 cb3 = vec3(0, 10,  0);
    vec3 cc3 = vec3(0,  0,  0);
    
    vec2 rXy3 = R2(0.0) * (cc3 - cb3).xy;
    
    vec3 tube_p3 = vec3(2, 2.5,1.5);
    
    vec2 res9 = sdfCapsule(p + tube_p3, 0.15, ca3, cb3, cc3, rXy3);
    float d9  = res9.x;
    
    // tube rings up
    vec3 c_p3 = p;
    c_p3.y = sin(c_p3.x * 0.564) * 1.6; 
    vec2 res10 = sdfCapsule(p + tube_p3, 0.1, ca3, cb3, cc3, rXy3);
    float d10  = res10.x - 0.3 * cos(60.0 * res10.y + iTime * 1.0); 
    
    float tubeUp = smin(d9, d10, 0.21);
    
    //float tube = min(d4, d6);
    float tube = min(min(tubeRight,tubeLeft),tubeUp);
    
    // plane
    float d2 = p.y - fh;
    
    float cell = 5.0;
    // bubbles
    vec3 q    = vec3(mod((p.x) + 1.0,cell) - 1.5, p.y, mod(p.z + 1.5, cell) - 1.5);
    vec2 id   = vec2(floor(abs(p.x) / cell), floor((p.z + 1.5) / cell ));
    float fid = id.x * 411.1 + id.y * 431.7;
    float fy  = fract(fid * 0.33312 + 0.3 + T * 0.0);
    float y   = -1.3 + 3.0 * fy;
    float siz = 5.0*fy*(1.0-fy);
    vec3 rad  = vec3(0.7, 1.5 + 0.5 * sin(fid *331.7), 1.0);
    
    rad -= 0.1 * (sin(p.x * 2.5) + sin(p.y * 5.4) + sin(p.y * 5.5 + T * 0.5));
    
    float d3 = sdEllipsoid(q - vec3(1.0, y, 0.0) , siz * rad);
    float fs = smoothstep(-0.1, 0.1, sin(2.0 * p.x) * sin(4.0 * p.z) * sin(9. * p.y));
    
    d3 -= fs * 0.03;
    
    float plane = smin(d2, d3, 0.7);
    
    float dist  = min(min(plane, ufo), tube);
    
    if(tube < plane && tube < ufo){
        matId = 3.0;
    } else if(plane < ufo){
        matId = 2.0;
    } else {
        matId = 1.0;
    }
    
    return vec4(dist, matId, 0.0, 1.0);
}

vec4 rayMarch(vec3 ro, vec3 rd, float T)
{
    vec4 res = vec4(-1.0,-1.0,0.0,1.0);

    float tmin = 0.5;
    float tmax = 30.0;
    
	#if 1
    // raytrace bounding plane
    float tp = (5.4 - ro.y) / rd.y;
    if( tp > 0.0 ) tmax = min(tmax, tp );
	#endif    
    
    // raymarch scene
    float t = tmin;
    for( int i=0; i<456 && t<tmax; i++ )
    {
        vec4 h = map( ro+rd*t, T );
        if(abs(h.x) < (0.0001 * t))
        { 
            res = vec4(t, h.yzw); 
            break;
        }
        t += h.x;
    }
    
    return res;
}

float castShadow(vec3 ro, vec3 rd, float T)
{
    float res = 1.0;
    float dt  = 0.001;
    
    for(int i=0; i<120; i++)
    {
        float d = map(ro + rd * dt, T).x;
        res = min(res, 20.0 * max(d, 0.0) / dt);
        
        if((res) < 0.001) break;
        dt += clamp(d, 0.0001, 0.1);
        
        if(dt > 20.0) break;
    }
    return clamp(res, 0.0, 1.0);
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

float calcOcclusion( in vec3 pos, in vec3 nor, float T )
{
	float occ = 0.0;
    float sca = 1.0;
    
    for(int i = 0; i<5; i++)
    {
        float h = 0.01 + 0.411 * float(i) / 4.0;
        float d = map(pos + h * nor, T).x;
        occ += (h-d) * sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 2.0 * occ, 0.0, 1.0 );
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    //vec3 col = vec3(0.0,0.5,0.9);
    vec3 col = mix( vec3(0.0), vec3(0.02,0.3,0.6), uv.y - 0.3);
    float mAngles = 10.0 * iMouse.x / iResolution.x;
    vec3  control = vec3(1.5 * sin(mAngles), 1, 1.5 * cos(mAngles));
    
    float T = iTime;
    vec3 ro = vec3(0, -0, 3.0 + T * 0.0) + control;
    vec3 rd = normalize(vec3(uv, -1.0));
    
    vec4 dt = rayMarch(ro, rd, T);
    
    col = mix(col, vec3(0.2,0.5,0.9), exp(-10.0 * rd.y));
    
    if(dt.y > 0.0)
    {
        vec3 p     = ro + rd * dt.x;
        vec3 norm  = calcNormal(p, T);
        float focc = dt.w;
        
        vec3 lightD  = normalize(vec3(2,6,4));
        float diff   = max(dot(lightD, norm), 0.0);
        float shadow = castShadow(p + norm* 0.001, lightD, T); 
        
        col = vec3(0.0, 0.4, 0.5);
        
        float ks;
        if(dt.y > 2.5){
            // tube
            float t = p.y * 0.5; //+ T * 1.1;
            col = vec3(0.2,0.2,0.4);
            ks = t * 0.9; 
        } else if(dt.y > 1.5){
            // Plane
            float f = -1.0 + 2.0 * smoothstep(-0.2, 0.25, sin(1.0 * p.x) * sin(0.5 * p.z) * sin(0.1 * p.y));
            col += f * 0.87 * vec3(0.0, 0.4, 0.2);
            ks = 1.0 + p.y * 1.9; 
        } else if(dt.y > 0.5){
            // UFO 
            float t = p.y * 1.06 + 0.5;
            vec3 albedo = palette(t, vec3(0.2), vec3(0.5), vec3(0.5), vec3(0.35847,0.742714,0.04212));
            col = albedo;
            ks = t * 0.1; 
        }
        
        // lightning 
        float occ     = calcOcclusion(p, norm, T) * focc;
        //occ = mix(occ, 1.0, smoothstep(8.0, 10.0, dt.y));
        float fre     = clamp(1.0 + dot(norm,rd), 0.0, 1.0);
        
        vec3  liHal   = normalize(lightD - rd);
        float liShape = ks * pow(clamp(dot(norm, liHal), 0.0, 1.0), 20.0) 
                      * diff * (0.04 + 0.96 * pow(clamp(1.0 + dot(liHal,rd),0.0,1.0),5.0));
        float skyDiff = sqrt(clamp(0.2 + 0.2 * norm.y, 0.0, 1.0 ));
        float bouDiff = sqrt(clamp(0.1 - 0.9 * norm.y, 0.0, 1.0 ))
                      * clamp(1.0 - 0.1 * p.y, 0.0, 1.0);
        float bacDiff = clamp(0.1 + 0.9 * dot(norm, normalize(vec3(-lightD.x,0.0,-lightD.z))), 0.0, 1.0 );
        float sssDiff = fre * skyDiff * (0.25 + 0.75 * shadow);
        
        vec3 lin = vec3(0.0);
        lin += diff    * vec3(0.2, 1.0, 1.0) * vec3(shadow,shadow*shadow*0.5+0.5*shadow,shadow*shadow);
        lin += skyDiff * vec3(0.9, 0.6, 1.0) * occ; 
        lin += bouDiff * vec3(0.5, 3.5, 2.5) * occ; 
        lin += bacDiff * vec3(0.45,2.35,0.25) * occ;
        lin += sssDiff * vec3(0.25,0.75,0.50) * occ;
        
        col = col * lin;
        
        col += liShape * vec3(2.90,4.10,1.30) * shadow;
        col += liShape * vec3(0.20,0.30,0.65) * occ*occ;
        //col = col * diff * shadow;
        //col = vec3(occ * occ);
        col = pow(col, vec3(1.0,2.1,1.6) );
        // fog
        col = mix( col, vec3(0.,0.4,0.6), 1.0-exp( -0.0001*dt.x*dt.x*dt.x ) );
    }
    
    col = pow(col * 1.0, vec3(1.0 / 2.2));
    
    O = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
