uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    
    ▓              🌟  KuKo Day 111  🌟                

    ▓  AA practice. Trying to understand how iq did his AA
    ▓  I'm really struggling this week
    ▓  I still see aliasing so more things to learn
    
    ▓  Studying this shader from iq 
    ▓  https://www.shadertoy.com/view/llXGR4
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
#define PI 3.14159265359
#define ANTIALIASING

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

vec2 sdfCapsule(vec3 p, float id)
{
    float wave1 = sin(p.y * 2.2 + id * 2.0 - T * 2.) * 0.06;
    float wave2 = sin(p.y * 10.5 + id * 1.0 - T * 1.) * 0.03;
    vec3 wp = p; wp.x += wave1 + wave2;

    vec3 a = vec3(0.0, 50.0, 0.0);
    vec3 b = vec3(0.0,-50.3, 0.0);
    float r = 0.2;

    vec3 pa = wp - a, ab = b - a;
    float t = clamp(dot(pa,ab)/dot(ab,ab), 0.0, 1.0);   // axis param in [0,1]
    float d = length(pa - ab*t) - r;
    return vec2(d, t);
}


vec3 map(vec3 p)
{
    vec2 cell = vec2(2);
    p.z += T * 0.1;

    vec2 id2 = floor((p.xz + 1.0)/2.0);
    p.xz = mod(p.xz + 0.5, cell) - 0.5*cell;

    float objId = hash(id2);                 // y-channel “material/id”
    vec2  c = sdfCapsule(p, objId);          // c.x = d, c.y = axis param

    float dPlane = p.y + 1.9;
    float d = smin(c.x, dPlane, 0.2);

    float useCaps = step(c.x, dPlane + 1e-5);
    float aux = mix(0.0, c.y, useCaps);

    return vec3(d, objId, aux);
}

vec3 calcNormal(vec3 pos, float eps)
{
    vec2 e = vec2(1.0,-1.0)*eps;
    return normalize(
        e.xyy*map(pos + e.xyy).x +
        e.yyx*map(pos + e.yyx).x +
        e.yxy*map(pos + e.yxy).x +
        e.xxx*map(pos + e.xxx).x
    );
}

vec3 shade(float t, float m, float v, vec3 ro, vec3 rd)
{
    float fl = 1.0;
    float px = (2.0/iResolution.y)*(1.0/fl);
    vec3  pos = ro + t*rd;
    vec3  nor = calcNormal(pos, px*max(t,0.5));
    return nor; // normals only I don't care about colors now 
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 p = (2.0*I - iResolution.xy)/iResolution.y;

    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(p, -1.0));

    float fl = 1.0;
    float px = (2.0/iResolution.y)*(1.0/fl);

    vec3 col = vec3(0.0);
    const float MAX_DIST = 20.0;

    vec3 res = vec3(-1.0);      // (t, m, v)
    float t = 0.0;

    #ifdef ANTIALIASING
    vec3 oh = vec3(1e9);        // previous h sample (d, m, v) style
    vec4 acc = vec4(0.0);       // premultiplied rgb, alpha = coverage
    #endif

    for (int i=0; i<128; i++)
    {
        vec3 h = map(ro + t*rd);          // h.x = d, h.y = m, h.z = v
        float th1 = px * t;               // inner cone radius
        #ifndef ANTIALIASING
        //th1 *= 1.5;                    
        #endif

        res = vec3(t, h.yz);              

        if (h.x < th1 || t > MAX_DIST) break;

        #ifdef ANTIALIASING
        float th2 = px * t * 2.0;         // outer cone radius (AA band)
        if ((h.x < th2) && (h.x > oh.x))  // entered AA ring, front-facing
        {
            float lalp = 1.0 - (h.x - th1)/max(1e-6, (th2 - th1)); // 1..0
            vec3  lcol = shade(t, oh.y, oh.z, ro, rd);             // normals
            acc.rgb += (1.0 - acc.a) * lalp * lcol;
            acc.a   += (1.0 - acc.a) * lalp;
            if (acc.a > 0.995) break;
        }
        oh = h;
        #endif

        t += min(h.x, 0.5) * 0.55;         // conservative step
    }

    if (t < MAX_DIST)
    {
        vec3 base = shade(res.x, res.y, res.z, ro, rd); // normals
        #ifdef ANTIALIASING
        col = mix(base, (acc.a>0.0 ? acc.rgb/acc.a : base), acc.a);
        #else
        col = base;
        #endif
    }
    else
    {
        #ifdef ANTIALIASING
        if (acc.a > 0.0) col = acc.rgb/acc.a; // subpixel grazing only
        #endif
    }

    col = pow(col * 1.1, vec3(1.1/2.2));
    O = vec4(col, 1.0);
}



/*
void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy)/iResolution.y;
    vec3 col = vec3(0.0);
    
    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0)); 
    
    float dt = rayMarch(ro, rd);

    if(dt < 10.0)
    {
        vec3 p = ro + rd * dt;

        vec3 norm = calcNormal(p);
        vec3 lightDir = normalize(vec3(3.0,3.0,9.0));
        float diff = max(dot(norm, lightDir), 0.0);
        
        float ambient = 0.1;
        vec3 albedo = vec3(0.0, 0.5, 0.5);
        
        col = norm;
        //col = albedo * (ambient + diff);
        //col = (ambient + diff) * vec3(0.0,0.5,0.5);
    }
    
   
    col = pow(col * 2.1, vec3(1.1 / 2.2));
    
    O = vec4(col,1.0);
}
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
