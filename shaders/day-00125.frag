uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 125  🌟                
    
    ▓  Shadow practice, following iq's tutorial on cast shadows
    ▓  also learned about giving ids to shapes to color them
    ▓  I had done it on 2d but 1st time in 3d.
    
    ▓  https://www.youtube.com/watch?v=Cfe5UQ-1L9Q
    
    ▓  something interesting I read last night was about how 
    ▓  important gamma correction is on shaders. 
    
    ▓  CRT monitors (and many modern displays) have an inherent 
    ▓  power-law relationship between input voltage and output brightness:
    ▓  Output Brightness = (Input Voltage)^γ
    ▓  Where γ (gamma) ≈ 2.2-2.4 for most displays.
    
    ▓  CRT Legacy: Early CRT monitors had this non-linear response due to 
    ▓  the physics of electron guns heating phosphor coatings. The relationship 
    ▓  wasn't a bug - it was just how the hardware worked. 
    ▓  Modern LCD/OLED displays often mimic this curve for compatibility.
    
    ▓  on another note, labor day sale is tomorrow + have to setup shopify 
    ▓  admin stuff for the company instead of coding mehh. 
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 15.

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float sdfCapsule(vec3 p)
{
    vec3 a = vec3(-3, 1, 0);
    vec3 b = vec3( 1, 1, 0);
    
    vec3 pa = p - a;
    vec3 ba = b - a;
    
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    
    return length(pa - ba*h) - 0.3;
}

float sdSphere(vec3 p)
{
    return max(length(abs(p)) - 0.9, p.y);
}

vec2 ufo(vec3 p)
{
    float fx = sin(iTime * 1.1) * 0.6 + 0.2;
    float d1 = sdfCapsule(p + vec3(0, fx, -iTime - 0.5));
    float d2 = sdSphere(p + vec3(1,-0.0,-iTime));
    
    return vec2(d1, 1.0);
    //return vec2(max(-d2, d2), 1.0);
    return vec2(smin(d2,d1, 0.5), 1.0);
}

vec2 map(vec3 p)
{
    float fh = -1. + 0.16 * (sin(2.3 * p.x) * sin(2.4 * p.z));
    
    vec2 d1 = ufo(p);
    float d2 = p.y - fh;
    
    //return vec2(d1, 1.0);
    return d2 < d1.x ? vec2(d2, 2.0) : d1;
}

float castShadow(vec3 ro, vec3 rd)
{
    float res = 1.0;
    float dt  = 0.001;
     
    for(int i = 0; i<100; i++)
    {
        float d = map(ro + rd * dt).x;
        res = min(res, 5.0 * d / dt);
        
        if(res < 0.001) break;
        dt += d;
        
        if(dt > FAR) break;
    }
    
    return clamp(res, 0.0, 1.0);
}

vec2 rayMarch(vec3 ro, vec3 rd)
{
    float m  = -1.0;
    float dt = 0.0;
    
    for(int i = 0; i<80; i++)
    {
        vec2 d = map(ro + rd * dt);
        
        m = d.y;
        
        if(d.x < 0.001) break;
        dt += d.x;

        if(dt > FAR) break;
    }
    
    if(dt > FAR) {
        m  = -1.0;
        dt = -1.0;
    }
    
    return vec2(dt, m);
}

vec3 calcNormal(vec3 p)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0)).x - map(p - vec3(e,0,0)).x,
        map(p + vec3(0,e,0)).x - map(p - vec3(0,e,0)).x,
        map(p + vec3(0,0,e)).x - map(p - vec3(0,0,e)).x
    ));
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    vec3 col = mix(vec3(0.14), vec3(0.2,0.6,0.9), uv.y);
    
    float an = 10.0 * iMouse.x / iResolution.x;
    
    vec3 ro = vec3(0.0,0.0,2.0 + iTime) + vec3(1.5 * sin(an), 0, 1.5 * cos(an));
    vec3 rd = normalize(vec3(uv, -1.0));
    
    vec2 dt = rayMarch(ro, rd);
    
    if(dt.y > 0.)
    {
        vec3 p    = ro + rd * dt.x;
        vec3 norm = calcNormal(p);
        
        vec3 mate    = vec3(0.933, 0.388, 0.349);
        vec3 bgColor = vec3(0.5,0.7,0.5);
        
        if(dt.y < 1.5){
            mate = vec3(0.5);
        } else {
           float f = -1.0 + 2.0 * smoothstep(-0.2, 0.2, sin(2.0 * p.x) * sin(10.0 * p.z));
           mate += f * 0.2 * vec3(0.9, 0.6, 0.7);
        }
        
        vec3 lightD  = normalize(vec3(2.0, 1.0, 3.0));
        float diff   = max(dot(lightD, norm),0.0);
        float shadow = castShadow(p + norm * 0.001, lightD);
        
        col = mate * bgColor * diff * shadow;
    }
    
    col = pow(col * 1.1, vec3(1.0/2.2));
    
    O = vec4(col, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
