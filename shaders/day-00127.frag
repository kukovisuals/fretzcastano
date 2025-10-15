uniform vec3 iResolution;
uniform float iTime;
uniform vec2 iMouse;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 127  🌟                
    
    ▓  3D, light practice. Doing Iq's tutorial 
    ▓  https://www.youtube.com/watch?v=Cfe5UQ-1L9Q
    
    ▓  Added fog to the back, fixed (tried to) articafct on bubbles
    
    ▓  Added light, occlusion.
    
    ▓  Not sure what I'm doing wrong but that's not the color I wanted
    ▓  It turne out very sci fi so I'll take that. There is a bug on the
    ▓  lightning which I need to fix.
    
    ▓  Here is a video of an UFO that looks closer to what I have seen.
    ▓  https://www.youtube.com/watch?v=Dq1lLClmsQg
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float sdEllipsoid( vec3 p, vec3 r )
{
  float k0 = length(p/r);
  float k1 = length(p/(r*r));
  return k0*(k0-1.0)/k1;
}

float ufo(vec3 p)
{
    float fxX = sin(iTime) * 0.5 + 0.5;
    float fxY = cos(iTime) * 0.2 - 0.5;
    
    float d1 = sdEllipsoid(p + vec3(fxX,-0.5 + fxY,-iTime), vec3(1.0,0.2,1.0));
    float d2 = length(p + vec3(fxX,-0.8 + fxY, -iTime)) - 0.4;
    
    return smin(d1, d2, 0.5);
}

vec4 map(vec3 p, float T)
{
    float fh = -0.6 + 0.06 * (sin(2.3 * p.x + iTime * 0.5) * sin(2.4 * p.z + iTime * 2.0));
    
    // ufo
    float d1 = ufo(p);
    
    // plane
    float d2 = p.y - fh;
    
    float cell = 5.0;
    
    vec3 q    = vec3(mod((p.x) + 0.0,cell) - 1.5, p.y, mod(p.z + 1.5, cell) - 1.5);
    vec2 id   = vec2(floor(abs(p.x) / cell), floor((p.z + 1.5) / cell ));
    float fid = id.x *211.1 + id.y * 131.7;
    float fy  = fract(fid * 0.13312 + T * 0.05);
    float y   = -1.0 + 3.0 * fy;
    float siz = 5.0*fy*(1.0-fy);
    vec3 rad  = vec3(0.7, 1.5 + 0.5 * sin(fid *331.7), 1.0);
    
    rad -= 0.1 * (sin(p.x * 0.5) + sin(p.y * 0.4) + sin(p.y * 1.5));
    // bubbles
    float d3 = sdEllipsoid(q - vec3(1.0, y, 0.0) , siz * rad);
    float fs = smoothstep(-0.2, 0.2, sin(1.0 * p.x) * sin(4.0 * p.z) * sin(5. * p.y));
    
    d3 -= fs * 0.02;
    
    float plane = smin(d2, d3, 1.4);
    
    //return min(d1, d2);
    //return plane < d1 ? vec2(plane, 1.0) : vec2(d1, 2.0);
    float dist  = min(plane, d1);
    float matId = (plane < d1) ? 1.0 : 2.0; // 1 = plane/bubbles, 2 = UFO

    return vec4(dist, matId, 1.0, 1.0);
}

vec4 rayMarch(vec3 ro, vec3 rd, float T)
{
    vec4 res = vec4(-1.0,-1.0,0.0,1.0);

    float tmin = 0.5;
    float tmax = 30.0;
    
	#if 1
    // raytrace bounding plane
    float tp = (3.4 - ro.y) / rd.y;
    if( tp > 0.0 ) tmax = min(tmax, tp );
	#endif    
    
    // raymarch scene
    float t = tmin;
    for( int i=0; i<256 && t<tmax; i++ )
    {
        vec4 h = map( ro+rd*t, T );
        if(abs(h.x) < (0.0005 * t))
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
    vec3 ro = vec3(0, -0, 3.0 + T) + control;
    vec3 rd = normalize(vec3(uv, -1.0));
    
    vec4 dt = rayMarch(ro, rd, T);
    
    col = mix(col, vec3(0.2,0.5,0.9), exp(-7.0 * rd.y));
    
    if(dt.y > 0.0)
    {
        vec3 p     = ro + rd * dt.x;
        vec3 norm  = calcNormal(p, T);
        float focc = dt.w;
        
        vec3 lightD  = normalize(vec3(2,4,3));
        float diff   = max(dot(lightD, norm), 0.0);
        float shadow = castShadow(p + norm* 0.001, lightD, T); 
        
        col = vec3(0.0, 0.5, 0.6);
        
        float ks;
        if(dt.y > 1.5){
            // UFO 
            float t = p.y * 1.1 + 1.2;//T * 0.3;
            vec3 albedo = palette(t, vec3(0.5), vec3(0.5), vec3(0.59), vec3(0.847,0.0714,0.212));
            col *= albedo;
            ks = t * 0.8; 
        
        } else if(dt.y > 0.5){
            // Plane
            float f = -1.0 + 2.0 * smoothstep(-0.2, 0.2, sin(0.2 * p.x) * sin(0.3 * p.z) * sin(0.1 * p.y));
            col += f * 0.87 * vec3(0.1, 0.5, 0.6);
            ks = 1.0 + p.y * 0.15; 
        }
        
        // lightning 
        float occ     = calcOcclusion(p, norm, T) * 0.6;
        //occ = mix(occ, 1.0, smoothstep(8.0, 10.0, dt.y));
        float fre     = clamp(1.0 + dot(norm,rd), 0.0, 1.0);
        
        vec3  liHal   = normalize(lightD - rd);
        float liShape = ks * pow(clamp(dot(norm, liHal), 0.0, 1.0), 20.0) 
                      * diff * (0.04 + 0.96 * pow(clamp(1.0 + dot(liHal,rd),0.0,1.0),5.0));
        float skyDiff = sqrt(clamp(0.5 + 0.5 * norm.y, 0.0, 1.0 ));
        float bouDiff = sqrt(clamp(0.1 - 0.9 * norm.y, 0.0, 1.0 ))
                      * clamp(1.0 - 0.1 * p.y, 0.0, 1.0);
        float bacDiff = clamp(0.1 + 0.9 * dot(norm, normalize(vec3(-lightD.x,0.0,-lightD.z))), 0.0, 1.0 );
        float sssDiff = fre * skyDiff * (0.25 + 0.75 * shadow);
        
        vec3 lin = vec3(0.0);
        lin += diff    * vec3(0.2, 1.0, 1.9) * vec3(shadow,shadow*shadow*0.05+0.05*shadow,shadow*shadow);
        lin += skyDiff * vec3(0.9, 0.6, 1.0) * occ; 
        lin += bouDiff * vec3(0.5, 7.0, 1.0) * occ; 
        lin += bacDiff * vec3(0.45,0.35,0.25) * occ;
        lin += sssDiff * vec3(30.25,2.75,2.50) * occ;
        
        col = col * lin;
        
        col += liShape * vec3(9.90,8.10,6.30) * shadow;
        col += liShape * vec3(0.20,0.30,0.65) * occ*occ;
        //col = col * diff * shadow;
        //col = vec3(occ * occ);
        col = pow(col, vec3(0.8,0.9,1.0) );
    }
    
    col = pow(col * 1.0, vec3(1.0 / 2.2));
    
    O = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
