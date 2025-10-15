uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 109  🌟                
    
    ▓  SDF Practice time with a capsule
    
    ▓  I wanted to experiment with the raydirection
    ▓  and this thing turned out
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define PI 3.14159265359
#define T iTime

const float SPEED_Z = 0.9;
const float BLUR    = 0.09;

mat2 R(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              💊  SDF, MAP  💊                
    
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float sdfCapsuleAnchor(in vec3 p, vec3 a, vec3 b, vec3 c, float r, float id)
{   
    float h1a = hash(vec2(id, id*1.3));         // phase seed
    float h2a = hash(vec2(id*2.1, id*3.7));     // speed seed
    float phase = 2.0*PI * h1a;                 // [0, 2π)
    float angle = PI * sin(phase);              // full swing in [-π, π]
    
    vec3 offSet = c - b;
    vec2 r_xy = R(angle) * offSet.xy;
    vec3 c0 = b + vec3(r_xy, offSet.z);
    
    vec3 pa = p - a, ab = b - a, pb = p - b, bc = c0 - b;
    
    float h1 = clamp( dot(pa, ab) / dot(ab, ab), 0.0,1.);
    float h2 = clamp( dot(pb, bc) / dot(bc, bc), 0.0,1.);
    
    float d1 = length( pa - ab*h1) - r;
    float d2 = length( pb - bc*h2) - r;
    return d1;
    //return smin(d1,d2, 0.15);
}


float map(vec3 p)
{
    vec3 q = p;
    q.z -= T * SPEED_Z;   
    vec2 id = floor(q.xz);
    q = fract(q) - 0.5;
    
    float s = mix(0.2, 1.1, hash(id));   

    vec3 a = vec3(0.0, -0.2, 0.0);
    vec3 b = vec3(0.0,  0.3 * s, 0.0); 
    vec3 c = vec3(0.1,  0.2,  0.0);
    
    float r = 0.05 * s;                   
    
    float d1 = sdfCapsuleAnchor(q, a, b, c, r, hash(id));
    
    float d2 = p.y + 0.76;
    
    return smin(d1, d2, 0.15);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓          💡  COLOR, RAYMARCH, NORMALS  💡                
    
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d < 0.001 || dt > 100.) break;
    }
    return dt;
}

float mapLocked(vec3 p, vec2 gid){
    vec3 q=p; q.z-=T*SPEED_Z; q=fract(q)-0.5;
    float s=mix(0.4,1.1,hash(gid)), r=0.04;
    vec3 a=vec3(0.0,-0.2,0.0), b=vec3(0.0,0.3,0.0) * s, c=vec3(0.1,0.2,0.0);
    float d1=sdfCapsuleAnchor(q,a,b,c,r,hash(gid)), d2=p.y+0.76;
    return smin(d1,d2,0.15);
}

vec3 calcNormal(vec3 p)
{
    vec2 e=vec2(1e-4,0), gid=floor((p-vec3(0,0,T*5.0)).xz);
    return normalize(vec3(
        mapLocked(p+e.xyy,gid)-mapLocked(p-e.xyy,gid),
        mapLocked(p+e.yxy,gid)-mapLocked(p-e.yxy,gid),
        mapLocked(p+e.yxx,gid)-mapLocked(p-e.yxx,gid)
    ));
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓                   🌏  MAIN  🌏     
    
    ▓  I tried adding more blur to hide more alaising 
    ▓  But I still see it on my big screen. Well gotta 
    ▓  learn how to do AA on 3D. 
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/


void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0.0); //* vec3(0.0,0.6,0.4);
    
    /*
        Ray direction playground
    */
    
    float twist = 2.5;                  // strength
    float a = twist * length(uv) - T * SPEED_Z;
    mat2 RR = mat2(cos(a),-sin(a), sin(a),cos(a));
    
    int   N = 15;                        // number of slices
    float ang = atan(uv.y, uv.x);
    float rad = length(uv);
    float s = 2.0*PI/float(N);
    ang = abs(mod(ang, s) - 0.5*s);     // fold into one wedge
    uv = vec2(cos(ang), sin(ang)) * rad * RR;
    vec3 rd = normalize(vec3(uv, -1.0));
     
    /*
        End Ray direction playground
    */
    
    float cam_up = sin(T * 0.1) * 0.2 - 0.54; 
    float cam_x = cos(T * 0.3) * 0.3;
    vec3 ro = vec3(cam_x,cam_up,3.0);

    float dt = rayMarch(ro, rd);
    
    if( dt < 10.0)
    {
        vec3 p = ro + rd * dt;
        if(p.y > -1.1 && p.y < 0.214)
        {
            vec3 norm = calcNormal(p);
            vec3 lDir  = normalize(vec3(0.6, 0.6, 0.5));  
            
            float diff = max(dot(norm, lDir), 0.0);           
            
            float amb  = 0.08;                              
            
            float vdn = dot(norm, -rd);
            float wRim = max(fwidth(vdn), 0.9);
            float rim = pow(smoothstep(0.0, wRim, 1.0 - vdn), 2.0);
            
            float t = p.y * 0.9 + T * 0.05;
            vec3 albedo = palette(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.047,0.714,0.212));
            
            
            float focusDist = 0.8;   
            // bigger = more blur
            float aperture  = BLUR;  
            float coc  = clamp(aperture * abs(dt - focusDist) / max(focusDist, 1e-3), 0.0, 1.0); // circle of confusion
            float sharp = exp(-10.0 * coc);          
            vec3  gray  = vec3(dot(albedo, vec3(0)));
            vec3  albedoSoft = mix(gray, albedo, sharp);     
            float softAmb = amb + 10.15 * coc;                
            
            float d0   = map(p);
            float wCov = max(fwidth(d0), 1e-1);
            float alpha = 1.0 - smoothstep(0.0, wCov, d0);
        
            float light = softAmb + (diff + 3.6*rim)*sharp;
            
            col = albedoSoft * light * alpha;
        }
    }
    
    col = pow(col * 1.1, vec3(1.0/2.2));
    
    O = vec4(col,1.0);
}


/*
    float fov = 1.1; // radians
    float r = length(uv);
    float theta = atan(uv.y, uv.x);
    float phi = r * fov;               // radial angle
    vec3 rd = normalize(vec3(sin(phi)*cos(theta),
                             sin(phi)*sin(theta),
                             -cos(phi)));
                             
    float k = 1.7;                   // >0 barrel, <0 pincushion
    float r2 = dot(uv,uv);
    uv *= .01 + k*r2;
    
   
    float zoom = 0.25*sin(0.7*T);
    uv *= 3.0 + zoom;
    vec3 rd = normalize(vec3(uv, -1.0));


    uv = RR * uv;
    vec3 rd = normalize(vec3(uv, -1.0));
    
        
    */
    
    
    
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
