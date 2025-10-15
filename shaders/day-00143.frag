uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 143  🌟                
    
    ▓  Light practice.              
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  SDF, MAP  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 10.0
#define AA 2
const float SPEED_CAM = 2.0;

float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float sdfBox(vec3 p, vec3 b, float r)
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float building(vec3 p, float T)
{
    vec3 newp = p;
    p.x -= T * SPEED_CAM;
    newp = vec3(mod(p.x + 3.0, 6.0) - 2.5, p.y, mod(p.z + 0.0,5.0) - 2.5);
    vec3 b  = vec3(1.0,20.5,2.2);
    float r = 0.1;
    
    float a  = atan(p.z, p.z) + T * 2.0;
    float r1 = length(p.zy);
    float pl = sin(a * 3.0 + r1 * 10.0 - T * 7.0);
            
    
    return sdfBox(newp, b, r) - pl * 0.0;
}

vec4 map(vec3 p, float T)
{
    float d1 = building(p, T);
    float d2 = building(p, T);
    
    vec2 sdf = d1 < d2 ? vec2(d1, 1.0) : vec2(d2, 2.0);
    
    return vec4(vec2(d1, 1.0), 0.0, 1.0);
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

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  MAIN  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/


vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 render(vec3 ro, vec3 rd, float T)
{
    vec3 col = vec3(0.0);
    
    vec2 dt = rayMarch(ro, rd, T);
    
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p, T);
        
        float ambient = 0.5;
        vec3  L    = normalize(vec3(2, 2, 1));
        float diff = saturate(dot(norm, L));
        float fre  = clamp(1.3 + dot(norm, rd), 0., 1.);
        vec3  hal  = normalize(L - rd); // * sin(T) * 0.5 + 0.5;
        float spec = saturate(dot(norm, hal));
        
        float backL  = saturate(dot(norm, -L));
        float sss    = pow(saturate(backL), 3.0);
        vec3 tangent = normalize(cross(norm, vec3(0,1,0)));
        
        vec3 bitangent = cross(norm, tangent);
        float aniso  = dot(reflect(-L, norm), sin(tangent + T) * 0.3+ 0.3);
        
        float irid1 = sin(dot(norm, rd) * 3.0 + T * 0.5) * 0.5 + 0.5;  
        float NoV  = saturate(dot(norm, -rd));   
        float rim  = pow(1.0 - NoV, 3.0);

        
        vec3 bgCol = vec3(0);
        vec3 nVis = 0.5 + 0.5*norm;
        // debugger
        if(false){                            
            // See normals and diffuse separately
            col = nVis; return col;
            col = vec3(diff); return col;
        }
        
        {
            float a  = atan(p.z, p.z) + T * 2.0;
            float r  = length(p.zy);
            float pl = sin(a * 3.0 + r * 10.0 - T * 7.0);
            pl *= sin(dot(norm, vec3(1,0,0)) * 1.0 + T);
            
            vec3 albedo = palette(abs(pl), vec3(0.45), vec3(0.5), vec3(0.930), vec3(.347,0.1714,0.11212));
            
            col += albedo;   
        }
        
        col += 0.3 * vec3(.5, .5, .5) * pow(vec3(spec), vec3(30,20, 10));
        //col += 2. * (1. - diff * diff) * pow(fre, 16.) * vec3(.0, .04, .2);
        //col += 0.5 * diff * vec3(.0, .1, .3);
        //col *= .3 + .9 * texture(iChannel0, fract(0.4 * p.yx)).xyz;
        
        // Fog
        col = mix( col, vec3(0.0), 1.0-exp( -0.002*dt.x*dt.x*dt.x ) );
    }
    
    col = pow(col * 1.0, vec3(1.1 / 2.2));
    
    return col;
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  AA  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage(out vec4 O, in vec2 I)
{
    float T = iTime * 1.0;
    
    vec3 ta = vec3(0.0, 0.0, 0.0); 
    vec3 ro = ta + vec3(6.0*cos(0.0 * T), 0.0, 4.0*sin(0. * T)); 
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 tot = vec3(0.0);
    
    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I + off) - iResolution.xy) / iResolution.y;
        
        vec3 rd = ca * normalize(vec3(uv, 2.0));
        vec3 col = render(ro, rd, T); 
        
        col = pow(col * 1.0, vec3(1.1 / 2.2));
        
        tot += col;
    }
    
    tot /= float(AA * AA);
    
    O = vec4(tot, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
