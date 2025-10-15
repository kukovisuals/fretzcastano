uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
uniform float     iTimeDelta; 

#define T iTime
#define PI 3.14159265359

float hash11(float x){ return fract(sin(x*12.9898)*43758.5453123); }
vec2  hash21(float x){ return fract(sin(vec2(x, x+1.23)*vec2(12.9898,78.233))*43758.5453); }

mat2 R(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float sdSphere(vec3 p, float r){ return length(p)-r; }

float smin(float a, float b, float k){
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}

void basis(vec3 n, out vec3 t, out vec3 b)
{
    float s = sign(n.z==0.0 ? 1.0 : n.z);
    float a = -1.0/(s + n.z);
    float bb = n.x*n.y*a;
    t = vec3(1.0 + s*n.x*n.x*a, s*bb, -s*n.x);
    b = vec3(bb, s + n.y*n.y*a, -n.y);
}

float gEmit = 1e9;
float sdTentacle(vec3 p, vec3 o, vec3 n, float len, float r0, float r1, float seed)
{
    vec3 t, b; basis(n, t, b);
    float u = clamp(dot(p - o, n)/len, 0.0, 1.0);

    float wFreq = mix(1.5, 3.5, hash11(seed*3.1));
    float phase = T*mix(0.4, 0.9, hash11(seed*5.7)) + seed*6.28;
    float amp   = mix(0.03, 0.08, hash11(seed*2.3));
    vec2  sc    = vec2(sin(wFreq*u*6.283 + phase + T * 3.) * 0.3, cos(wFreq*u*6.283 + phase + T * 3.) * 0.2);
    vec3  side  = (t*sc.x + b*sc.y) * (amp*u);         

    vec3 c = o + n*(u*len) + side;
    float r = mix(r0, r1, u);

    vec3 tipC = o + n*len + (t*0.0 + b*0.0);
    gEmit = min(gEmit, length(p - tipC) - (r1*1.15));

    return length(p - c) - r;
}

vec3 hemiFibo(uint i, uint N)
{
    float phi = (sqrt(5.0)*0.5 + 0.5) * 2.0*PI;        // golden angle
    float k   = float(i) + 0.5;
    float y   = 1.0 - 2.0*k/float(N);                  // -1..1
    float r   = sqrt(max(0.0, 1.0 - y*y));
    float th  = phi*k;
    vec3 p    = vec3(cos(th)*r, y, sin(th)*r);
    if(p.y < 0.0) p.y = -p.y;                          // flip to upper hemi
    return normalize(p);
}

const uint NUM_TENT = 15u;       

float map(vec3 p)
{
    p.xz *= R(0.15 * (T*0.35));

    float baseR = .428;
    float d = sdSphere(p - vec3(0.0, -0.12, 0.0), baseR*0.9);

    for(uint i=0u; i<NUM_TENT; ++i){
        vec3 n = hemiFibo(i, NUM_TENT);                // outward normal
        vec3 o = vec3(0.0, -0.12, 0.0) + n*baseR;      // anchor on base surface

        float sd = sdTentacle(
            p, o, normalize(n + vec3(0.0,0.15,0.0)),   // push axis a bit upward
            /*len*/ mix(0.55, 0.95, hash11(float(i)*1.7)),
            /*r0 */ mix(0.055,0.075, hash11(float(i)*2.9)),
            /*r1 */ mix(0.018,0.028, hash11(float(i)*4.1)),
            /*seed*/ float(i)+13.0
        );
        d = smin(d, sd, 0.08);                         // soft union to keep “fleshy” look
    }
    return d;
}

vec3 calcNormal(vec3 p)
{
    float e = 1e-3;
    vec2 h = vec2(1,-1)*0.5773;
    return normalize( h.xyy*map(p+h.xyy*e) +
                      h.yyx*map(p+h.yyx*e) +
                      h.yxy*map(p+h.yxy*e) +
                      h.xxx*map(p+h.xxx*e) );
}

float march(vec3 ro, vec3 rd)
{
    float t = 0.0;
    for(int i=0;i<128;i++){
        vec3 p = ro + t*rd;
        float d = map(p);
        if(d<1e-4) return t;
        t += d;
        if(t>8.0) break;
    }
    return -1.0;
}

void mainImage(out vec4 O, vec2 I)
{
    vec2 p = (2.0*I - iResolution.xy)/iResolution.y;

    // Camera
    float ang = (T*1.2);
    vec3 ro = vec3(0,0,1.5);//vec3(2.5*sin(ang) + 1.0, 0.15, 2.5*cos(ang) + 1.0);
    vec3 ta = vec3(0.0,0.5,0);
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(vec3(0,1,0), ww));
    vec3 vv = cross(ww, uu);
    vec3 rd = normalize(p.x*uu + p.y*vv + 1.7*ww);

    // Raymarch
    gEmit = 1e9;
    vec3 col = vec3(0.0);
    float t = march(ro, rd);

    // Background
    col = mix(vec3(0.015,0.03,0.06), vec3(0.02,0.05,0.09), 0.5 + 0.5*p.y);

    if(t>0.0){
        vec3 pos = ro + t*rd;
        vec3 n = calcNormal(pos);
        vec3 l = normalize(vec3(0.7, 0.9, 0.4));
        vec3 h = normalize(l - rd);

        float diff = max(dot(n,l),0.0);
        float spe  = pow(max(dot(n,h),0.0), 32.0);

        vec3 baseCol = vec3(0.08,0.10,0.16);
        vec3 bodyCol = baseCol + vec3(0.0, 0.07, 0.03)*smoothstep(0.0, 0.8, diff);

        float glow = exp(-8.0*max(gEmit,0.0)) * 1.4;   // strong near tips
        vec3 tipCol = vec3(0.95, 0.98, 0.15) * glow;

        col = bodyCol + 0.9*diff + 0.25*spe + tipCol;

        col += 0.15*pow(max(dot(normalize(l+vec3(0,0.8,0)), n),0.0), 2.0);
    }

    col = pow(col, vec3(0.4545)); // gamma lift
    O = vec4(col,1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
