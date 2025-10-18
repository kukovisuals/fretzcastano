uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day 176    
    
    ▓ Noise rust from @fewer
    ▓ https://www.shadertoy.com/view/wXlcDX
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 30.0
// https://www.shadertoy.com/view/XsXfRH
float hash(ivec3 p)
{
    int n = p.x*3 + p.y*113 + p.z*311;
	n = (n << 13) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    return -1.0+2.0*float( n & 0x0fffffff)/float(0x0fffffff);
}

// https://iquilezles.org/articles/morenoise/
vec4 noised(in vec3 x)
{
    ivec3 i = ivec3(floor(x));
    vec3 w = fract(x);
    vec3 u = w*w*(3.0-2.0*w);
    vec3 du = 6.0*w*(1.0-w); 
    float a = hash(i+ivec3(0,0,0));
    float b = hash(i+ivec3(1,0,0));
    float c = hash(i+ivec3(0,1,0));
    float d = hash(i+ivec3(1,1,0));
    float e = hash(i+ivec3(0,0,1));
	float f = hash(i+ivec3(1,0,1));
    float g = hash(i+ivec3(0,1,1));
    float h = hash(i+ivec3(1,1,1));
    float k0 =   a;
    float k1 =   b - a;
    float k2 =   c - a;
    float k3 =   e - a;
    float k4 =   a - b - c + d;
    float k5 =   a - c - e + g;
    float k6 =   a - b - e + f;
    float k7 = - a + b + c - d + e - f - g + h;
    return vec4( k0 + k1*u.x + k2*u.y + k3*u.z + k4*u.x*u.y + k5*u.y*u.z + k6*u.z*u.x + k7*u.x*u.y*u.z, 
                 du * vec3( k1 + k4*u.y + k6*u.z + k7*u.y*u.z,
                            k2 + k5*u.z + k4*u.x + k7*u.z*u.x,
                            k3 + k6*u.x + k5*u.y + k7*u.x*u.y ) );
}

vec4 noisedFBM(in vec3 x, int octaves, float gain)
{
    vec4 result = vec4(0.);
    float a = 1.0;
    float s = 0.0;
    for (int i = 0; i < octaves; i++)
    {
        result += noised(x ) * a;
        s += a;
        x *= 2.0;
        a *= gain;
    }
    return result / s;
}

mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }

float sdRoundBox( vec3 p, vec3 b, float r )
{
    vec3 q = abs(p) - b + r;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sdBoxFrame( vec3 p, vec3 b, float e )
{
    p = abs(p  )-b;
    vec3 q = abs(p+e)-e;
    return min(min(
    length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
    length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
    length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

vec2 combineMin(vec2 a, vec2 b)
{
    return (a.x < b.x)? a : b;
}

vec3 _noisePos;
vec3 glow;
const vec3  FRAME_B = vec3(1.96, 0.96, 0.96);
const float FRAME_E = 0.01;

const vec3  GLOW_COLOR   = vec3(0.020,0.635,0.902); 
const float GLOW_STRENGTH= 0.040;                  
const float GLOW_FALLOFF = 320.0;                 

vec2 map(vec3 p)
{
    float cell = 4.0;
    vec3 q    = vec3(mod((p.x) + 0.0,10.0) - 5.5, mod((p.y) + 0.0,7.0) - 2.5, mod((p.z) + 0.0,cell) - 1.5);
    vec2 id   = vec2(floor(abs(p.x) / cell), p.z);
    
    //q.xz *= R2(iTime * 0.5);
    
    vec2 d1 = vec2(sdRoundBox(q, vec3(2.0,1.,1), 0.1), 1.0);
    vec2 d2 = vec2(sdBoxFrame(q, FRAME_B, FRAME_E), 2.0);
    
    return combineMin(d1, d2);
}

vec2 rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    float id = 0.0;
    glow = vec3(0.0);
    
    for(int i=0; i<50; i++)
    {
        vec3 p = ro + rd * dt;
        float cell = 4.0;

        vec3 q    = vec3(mod((p.x) + 0.0,10.0) - 5.5, mod((p.y) + 0.0,7.0) - 2.5, mod((p.z),cell) - 1.5);
        
        vec2 d = map(p);
        _noisePos = q;
        
        //_noisePos.xz *= R2(iTime*0.5);
        
        if(abs(d.x) < 0.001 )
        {
            id = d.y;
            break;
        }
        
        vec3 pf = q; 
        //pf.xz *= R2(iTime*0.5);
        float dFrame = sdBoxFrame(pf, FRAME_B, FRAME_E);
        
        float stepLen = clamp(d.x, 0.1, 0.2);          
        float fall    = 1.0 / (1.0 + dFrame*dFrame*GLOW_FALLOFF);
        float mask    = smoothstep(0.25, 0.0, abs(dFrame));
        glow += GLOW_COLOR * (GLOW_STRENGTH * stepLen * fall * mask);

        dt += d.x;
        if( dt > FAR) break;
    }
    
    if(dt > FAR)
    {
       float dt = -1.0;
       float id = -1.0; 
    }
    
    return vec2(dt, id);
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

vec3 rustCol(float noise01, float nl, vec3 l, vec3 col, vec2 dt)
{
    vec3 darkMet = vec3(0.043,0.035,0.043); // dark metal
    vec3 rustOra = vec3(0.008,0.157,0.353);      // rusty orange
    vec3 stains  = vec3(0.000,0.024,0.200);       // deeper stains
    vec3 darkPat = vec3(0.01, 0.0, 0.0);      // darker patches
    
    float rust  = smoothstep(0.66,   0.58, noise01);
    float stain = smoothstep(0.5,   0.425, noise01);
    float stain2= smoothstep(0.575, 0.3625,  noise01);

    vec3 albedo = mix(darkMet, rustOra, rust);
    //albedo = mix(albedo, stains, stain);
    albedo = mix(albedo, darkPat, stain2);
    col = albedo * vec3(max(0., nl));

    float spot = dot(l, vec3(0, 1, 0));
    col *= smoothstep(0.3, 0.75, spot);
   
    return col;
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(uv.y * .00051);//vec3(uv.y);
    
    vec3 ro = vec3(5.5,-2.,3.8 - iTime);
    vec3 rd = normalize(vec3(uv, -1));
    
    vec2 dt = rayMarch(ro, rd);
    
    if(dt.x < FAR)
    {
        vec3 p = ro + rd * dt.x;
        
        vec3 norm = calcNormal(p);
        
        vec3 l = normalize(vec3(-2, 2,4));
        float nl = dot(norm, l);
        
        vec4 noise = noisedFBM(_noisePos * vec3(1, 0.75, 1) * 4.0, 10, 0.95);
        norm = normalize(norm + noise.yzw * 0.8);
        
        float noise01 = noise.x * 0.5 + 0.5;
        
        if(dt.y > 1.9)
        {
            vec3 pf = p;
            float dFrame = sdBoxFrame(pf, FRAME_B, FRAME_E);

        } else {
            col = rustCol(noise01, nl, l, col, dt);
        }
        
        col = mix( col, vec3(0.0), 1.0-exp( -0.0005*dt.x*dt.x*dt.x ) );
    }
    col += glow; 
    
    col *= 20.0;
    
    col = pow(col, vec3(1.0 / 2.2));
    
    O = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
