uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo - Day 170 🎃            
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define AA 2

#define GHOST_BODY   7.0
#define GHOST_EYE    8.0
#define GHOST_PUPIL  9.0

#define T iTime

mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

vec2 combineMin(vec2 a, vec2 b)
{
    return (a.x < b.x)? a : b;
}

float smin( float d1, float d2, float k )
{
    k *= 4.0;
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
}

float sdEllipsoid( in vec3 p, in vec3 r )
{
    float k1 = length(p/r);
    return (k1-1.0)*min(min(r.x,r.y),r.z);
}

float sdCappedCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h, r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdPlane(in vec3 p, float h) {
    return p.y + h;
}

float sdSphere(in vec3 p, float r) {
    return length(p) - r;
}

vec2 sdfLittleGhost(vec3 pos)
{
    pos *= 1.8;
    pos.y -= 1.5;
    pos.x -= 0.5;
    // pos. -= 0.5;
    pos.yx *= R2(0.5);
    pos.xz *= R2(-1.5);
    pos.yz *= R2(T * -1.5);
    vec3 q = pos + vec3(0.0, sin(T * 2.5) * 0.3 + 0.5, 0.0);

    float body = sdCappedCylinder(q - vec3(0.0, -0.9, 0.0), 0.5, 0.9);
    float head = sdSphere(q, 0.5);
    float baseGhost = min(body, head);

    float repeat = 6.5;
    float wave =
        (0.6 + 0.2 * sin(T * 1.0)) *
        sin(q.x * repeat + T * 5.0) *
        sin(q.z * repeat + T * 5.0) * 2.0;

    float wavePlane = sdPlane(q, 1. - 0.1 * wave) * 0.5;
    float ghostD = max(baseGhost, -wavePlane);
    
    // hands 
    float handsFx = sin(T * 6.) * 0.5 + 0.2;
    float handsFx2 = sin(T * 6. + 4.0) * 0.5 + 0.2;
    vec3 hands_p1 = pos + vec3(-0.4,0.7,0);
    vec3 hands_p2 = pos + vec3( 0.4,0.7,0);
    hands_p1.xy *= R2(-handsFx);
    hands_p2.xy *= R2(handsFx2);
    vec3 handSize = vec3(0.4,0.15,0.2);
    vec3 e = vec3(abs(q.x), q.yz);
    
    float handL = sdEllipsoid(hands_p1, handSize);
    float handR = sdEllipsoid(hands_p2 , handSize);
    float eyeHo = sdSphere(e - vec3(0.17, 0, 0.30), 0.17);
    
    float bodyHands = smin(smin(
                      -smin(-ghostD, eyeHo, 0.012), handL, 0.02),
                      handR, 0.02);
                      
    vec2 res = vec2(bodyHands, GHOST_BODY);
    
    float eyeD   = sdEllipsoid(e - vec3(0.2, 0, 0.380), vec3(0.16,0.4,0.10));
    float pupilD = sdSphere(e - vec3(0.2, 0, 0.412), 0.08);
    
    res = combineMin(res, vec2(eyeD,   GHOST_EYE));
    res = combineMin(res, vec2(pupilD, GHOST_PUPIL));

    res.x /= 1.8;
    return res;
}

vec2 map(vec3 p)
{
    vec3 newUv = p;
    newUv.xy *= R2(T * 0.3);
    newUv.z -= T * 2.;

    float len   = length(newUv.xy);
    float angle = atan(newUv.y, newUv.x); 
    float dist  = angle - newUv.z;
    
    float A = 2.38;
    float v = abs( mod(dist  ,6.28) -3.14);
    dist = min(v, abs( mod(dist -A,6.28) -3.14));
    
    float n = 3.82;
    float helixRadius = 6.0;

    vec3 spherePos = vec3(
        len - helixRadius,
        dist,
        fract(n * angle) - 0.5
    );

    vec2 d1 = sdfLittleGhost(spherePos);  
    
    return d1;
}

vec2 rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    float id = -1.0;
    for(int i=0; i<100; i++)
    {
        vec2 d = map(ro + rd * dt);
        dt += d.x;
        id = d.y;
        if(abs(d.x) < 0.001 || dt > 30.0) break;
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

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 envMap(vec3 rd, vec3 n)
{    
    //vec3 col = tpl(iChannel1, rd*4., n);
    return smoothstep(0., 1., vec3(0));
}

vec3 render(vec3 ro, vec3 rd, float T)
{
    vec3 col = vec3(0);
    
    vec2 dt = rayMarch(ro, rd);
    
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p);
        float sz = 1./9.; 
        //norm = db(iChannel0, p*sz, norm, .1/(1. + dt.x*.25/20.));
        vec3 svn = norm;
        vec3 L = normalize(vec3(0,0,1));
        float diff = clamp(dot(L, norm),0.0,1.0);
        vec3 tangent = normalize(cross(norm, vec3(0,1,0)));
        vec3 halfV = normalize(reflect(-L, norm));
        float rim = 1.2 - pow(dot(norm, -rd), 2.0) * 1.3;
        float fr = clamp(1.0 + dot(rd, norm), .0, 1.);
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 34.0);
        
        vec3 refl = envMap(normalize(reflect(rd, svn*.5 + norm*.5)), svn*.5 + norm*.5);
        vec3 refr = envMap(normalize(refract(rd, svn*.5 + norm*.5, 1./1.35)), svn*.5 + norm*.5);
        
        vec3 refCol = mix(refr, refl, pow(fr, 5.));
        
        vec3 materialCol = vec3(0.05);
        vec3 lightCol = vec3(1.0);
        vec3 diffC = materialCol * diff * 0.1;
        vec3 specC = spec * lightCol * vec3(0.5, 0.7, 1.0) * 1.0;
        vec3 fresnelC = vec3(0.2, 1.7, 1.4) * pow(fr, 6.0) * 10.25;
        
        if(dt.y > 8.0){
            col += rim * 1.1 * vec3(1);
        } else if(dt.y > 8.0){
            
            col += rim * 1.1 * vec3(1) * 20.0;
        } else if(dt.y > 7.0){
            
            col += rim * 1.1 * vec3(0) * 2.0;
        } else if(dt.y > 6.0){
            
            col = diffC + specC + fresnelC;
            col += refCol * ((diff * diff * 1.625 + 0.75)) * .5;

            col += rim * 0.1 * vec3(0.3, .4, 0.8);
            vec3 lightCol = vec3(1.0);
            vec3 bgCol = vec3(0.0, 0.3, 0.4) * 1.;
            vec3 diffC = lightCol;

            diffC = rim * 10.1 * diff  * 0.4 * lightCol * 0.9;

            vec3 specC = spec * lightCol * 0.4;

            vec3 finalLight = 0.6 + diffC + specC + refCol;

            col = bgCol * finalLight;
        } else {
            vec3 lightCol = vec3(1.0);
            vec3 bgCol = vec3(0.4, 0.1, 0.0) * 1.;
            vec3 diffC = lightCol;

            diffC = rim * 10.1 * diff  * 0.4 * lightCol * 0.9;

            vec3 specC = spec * lightCol * 0.4;

            vec3 finalLight = 0.6 + diffC + specC + refCol;

            col = bgCol * finalLight;
        }
        
        col = mix( col, vec3(0.0), 1.0-exp( -0.001*dt.x*dt.x*dt.x) );
    }
    
    return col;
}

void mainImage(out vec4 O, in vec2 I)
{
    float T = T * 0.3;
    
    vec3 ta = vec3(0,0,0); 
    vec3 ro = ta + vec3(0, 1.0, 8.0);
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 tot = vec3(0.0);

    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I.xy + off) - iResolution.xy) / iResolution.y;
        vec3 rd = normalize(vec3(uv, -1));
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
