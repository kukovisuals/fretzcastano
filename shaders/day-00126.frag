uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 126  🌟                
    
    ▓  3D, soft shadow, fract practice. Doing Iq's tutorial 
    ▓  https://www.youtube.com/watch?v=Cfe5UQ-1L9Q
    
    ▓  I have seen UFOs twice in my life: once in Tampa, Florida,
    ▓  and another time in New York City. They didn't look like this, 
    ▓  but more like bright spheres. I saw a pair both times. 
    
    ▓  Here is a video that looks closer to what I have seen.
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
    float cycleTime = sin(iTime * 0.3) * 3.9 - 0.5;//mod(iTime, 2.0);
    float flipAngle = 0.0;
    
    mat2 flipMat = mat2(
        cos(cycleTime), -sin(cycleTime),
        sin(cycleTime), cos(cycleTime)
    );
    p.xy *= flipMat;
    
    float fxX = sin(iTime) * 0.5 + 0.5;
    float fxY = cos(iTime) * 0.2 - 0.5;
    
    float d1 = sdEllipsoid(p + vec3(fxX,0.1 + fxY,-iTime), vec3(1.0,0.2,1.0));
    float d2 = length(p + vec3(fxX,-0.1 + fxY, -iTime)) - 0.4;
    
    return smin(d1, d2, 0.5);
}

vec2 map(vec3 p, float T)
{
    float fh = -1.9 + 0.06 * (sin(2.3 * p.x + iTime * 0.5) * sin(2.4 * p.z + iTime * 2.0));
    
    float d1 = ufo(p);
    
    float d2 = p.y - fh;
    
    float cell = 5.0;
    
    vec3 q    = vec3(mod((p.x) + 0.0,cell) - 1.5, p.y, mod(p.z + 1.5, cell) - 1.5);
    vec2 id   = vec2(floor(abs(p.x) / cell), floor((p.z + 1.5) / cell ));
    float fid = id.x *511.1 + id.y * 131.7;
    float fy  = fract(fid * 1.312 + T * 0.1);
    float y   = -1.9 + 4.0 * fy;
    float siz = 4.0*fy*(1.0-fy);
    vec3 rad  = vec3(0.7, 1.5 + 0.5 * sin(fid *431.7), 1.1);
    
    rad -= 0.1 * (sin(p.x * 0.5) + sin(p.y * 0.4) + sin(p.y * 1.5));
    
    float d3 = sdEllipsoid(q - vec3(0.5, y, 0) , siz * rad);
    float fs = smoothstep(-0.2, 0.2, sin(1.0 * p.x) * sin(4.0 * p.z) * sin(5. * p.y));
    
    d3 -= fs * 0.02;
    
    float plane = smin(d2, d3, 0.4);
    
    //return min(d1, d2);
    return plane < d1 ? vec2(plane, 1.0) : vec2(d1, 2.0);
}

vec2 rayMarch(vec3 ro, vec3 rd, float T)
{
    float m = -1.0;
    float dt = 0.0;
    
    for(int i = 0; i < 100; i++)
    {
        vec2 d = map(ro + rd * dt, T);
        
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

float castShadow(vec3 ro, vec3 rd, float T)
{
    float res = 1.0;
    float dt  = 0.001;
    
    for(int i=0; i<100; i++)
    {
        float d = map(ro + rd * dt, T).x;
        res = min(res, 10.0 * d / dt);
        
        if((res) < 0.001) break;
        dt += d;
        
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

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    vec3 col = mix(vec3(0.2,0.5,0.8), vec3(0.0), uv.y + 0.0);
    
    float mAngles = 10.0 * iMouse.x / iResolution.x;
    vec3  control = vec3(1.5 * sin(mAngles), 1, 1.5 * cos(mAngles));
    
    vec3 ro = vec3(0, -1, 3.0 + iTime) + control;
    vec3 rd = normalize(vec3(uv, -1.0));
    
    float T = iTime;
    vec2 dt = rayMarch(ro, rd, T);
    
    if(dt.y > 0.0)
    {
        vec3 p    = ro + rd * dt.x;
        vec3 norm = calcNormal(p, T);
        
        vec3 lightD  = normalize(vec3(2,7,3));
        float diff   = max(dot(lightD, norm), 0.0);
        float shadow = castShadow(p + norm* 0.001, lightD, T); 
        
        vec3 bgCol = vec3(0.1, 0.7, 0.9);
        
        // Plane
        if(dt.y < 1.5){
            float f = -1.0 + 2.0 * smoothstep(-0.2, 0.2, sin(0.2 * p.x) * sin(0.3 * p.z) * sin(0.1 * p.y));
            bgCol += f * 0.7 * vec3(0.9, 0.6, 0.7);
        
        // UFO 
        } else if(dt.y < 2.5){
            float t = p.y * 0.1 + iTime * 0.3;
            vec3 albedo = palette(t, vec3(0.5), vec3(0.5), vec3(0.9), vec3(0.847,0.0714,0.212));
            
            bgCol = albedo;
        }
         
        col = bgCol * diff * shadow;
    }
    
    col = pow(col * 1.5, vec3(1.0 / 2.2));
    
    O = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
