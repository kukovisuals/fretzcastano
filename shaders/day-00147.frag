uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 147  🎃             
    
    ▓  Going to vegas tomorrow morning! :) 
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define t iTime
#define FAR 30.0

#define GHOST_BODY   1.0
#define GHOST_EYE    2.0
#define GHOST_PUPIL  3.0

vec2 combineMin(vec2 a, vec2 b) { return (a.x < b.x) ? a : b; }

float sdSphere(in vec3 p, float r) {
    return length(p) - r;
}

float sdCappedCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h, r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdPlane(in vec3 p, float h) {
    return p.y + h;
}

vec2 SDFGhost(vec3 pos)
{
    vec3 q = pos + vec3(0.0, sin(t * 5.0) * 0.1, 0.0);

    float body = sdCappedCylinder(q - vec3(0.0, -1.0, 0.0), 1.0, 1.0);
    float head = sdSphere(q, 1.0);
    float baseGhost = min(body, head);

    float repeat = 4.5;
    float wave =
        (0.9 + 0.2 * sin(t * 1.0)) *
        sin(q.x * repeat + t * 5.0) *
        sin(q.z * repeat + t * 5.0) * 2.0;

    float wavePlane = sdPlane(q, 1.1 - 0.1 * wave) * 0.5;
    float ghostD = max(baseGhost, -wavePlane);

    vec2 res = vec2(ghostD, GHOST_BODY);

    vec3 e = vec3(abs(q.x), q.yz);
    float eyeD   = sdSphere(e - vec3(0.35, 0.20, 0.70), 0.30);
    float pupilD = sdSphere(e - vec3(0.37, 0.23, 0.82), 0.20);

    res = combineMin(res, vec2(eyeD,   GHOST_EYE));
    res = combineMin(res, vec2(pupilD, GHOST_PUPIL));

    return res;
}

vec2 map(vec3 p)
{
    vec3 newp = p;
    p.z -= t;
    newp = vec3(mod(p.x + 3.0, 5.0) - 2.5, p.y, mod(p.z + 0.0,5.0) - 2.5);
    vec2 g = SDFGhost(newp);
    return g;
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

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

// @Shane's transparent light 
// https://www.shadertoy.com/view/Xd3SDs
vec3 sampleLighting(vec3 sp, vec3 sn, vec3 rd, vec3 lp, float lBoost)
{
    vec3 ld = lp - sp;
    float lDist = max(length(ld), 1e-3);
    ld /= lDist;

    // Classic terms + Fresnel
    float l  = max(dot(ld, sn), 0.0);
    float s  = pow(max(dot(reflect(-ld, sn), -rd), 0.0), 8.0);
    float fr = pow(max(1.0 - max(0.0, dot(-rd, sn)), 0.0), 5.0);

    // Distance attenuation 
    float atten = 1.0 / (1.0 + lDist*0.25 + lDist*lDist*0.05);

    return ((l + 0.02 + fr*0.010) + vec3(0.5, 0.7, 1.0) * s) * atten * lBoost;
}


void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0);
    float T = iTime;
    
    vec3 ta = vec3(0);
    //vec3 ro = ta + vec3(7.0*cos(0.5*T), 2.0, 7.0*sin(0.5*T)); 
    //vec3 ro = ta + vec3(7.0*cos(2.2), 2.0, 7.0*sin(2.2)); 
    vec3 ro = ta + vec3(1.0, 2.0, 8.); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 rd = ca * normalize(vec3(uv, 3.0));
    vec3 lp = ro + normalize(vec3(1.0, 3.0, 3.0)) * 5.0;
    
    //vec2 dt = rayMarch(ro, rd);
    
    float dt    = 0.0;
    vec3  tOut  = vec3(0.0);
    float layer = 0.0;
    float thD   = 0.125;
    
    for(int i=0; i<64; i++)
    {
        if(layer > 30.0 || dt > FAR) break;
        
        vec3 p = ro + rd * dt;
        vec2 d = map(p);  
        vec3 norm = calcNormal(p);
        float m = clamp(abs(d.x), 0.01, 0.3);
        
        // We hit surface when distance is small
        if (d.y < 2.5)   
        {
            float aD = (thD - abs(m) * (31.0/32.0)) / thD;
            
             // Material type check
            if(aD > 0.0) 
            {
                vec3 baseTint = vec3(3);
                
                vec3 transLight = sampleLighting(p, norm * sign(m), rd, lp, 0.25);
                
                col += transLight * aD * mix(vec3(1), baseTint, 0.645);
                
                layer += 1.0;
            }
        }
        dt += max(abs(m) * 0.575, thD * 0.04125);
    }
    
    O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
