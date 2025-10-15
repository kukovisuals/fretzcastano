uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 157  🎃        
       
       
    ▓  It looks better with this music
    
    ▓  https://www.youtube.com/watch?v=JqVdGVofErY&list=RDJqVdGVofErY&start_radio=1
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  SDFs, helper fx  🎃            
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define S(a,b,c) smoothstep(a,b,c)
#define STEM			5.0

#define FAR 30.0
#define AA 2

#define GHOST_BODY   7.0
#define GHOST_EYE    8.0
#define GHOST_PUPIL  9.0

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 combineMin(vec2 a, vec2 b)
{
    return (a.x < b.x)? a : b;
}

mat2 R2(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a));}


mat4 rotationY( in float angle ) {
    
    float c = cos(angle);
    float s = sin(angle);
    
	return mat4( c, 0,	 s,	0,
			 	 0,	1.0, 0,	0,
				-s,	0,	 c,	0,
				 0, 0,	 0,	1);
}

// Noise functions for fire
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// https://iquilezles.org/articles/smin
float smax( float a, float b, float k )
{
    float h = max(k-abs(a-b),0.0);
    return max(a, b) + h*h*0.25/k;
}

// https://iquilezles.org/articles/smin
float smin( float a, float b, float k )
{
    k *= 6.0;
    float h = max( k-abs(a-b), 0.0 )/k;
    return min(a,b) - h*h*h*k*(1.0/6.0);
}


// https://iquilezles.org/articles/distfunctions
float sdEllipsoidPrecise( in vec3 p, in vec3 r ) // approximated
{
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

// https://iquilezles.org/articles/distfunctions
float sdEllipsoid( in vec3 p, in vec3 r )
{
    float k1 = length(p/r);
    return (k1-1.0)*min(min(r.x,r.y),r.z);
}

float sdSphere(in vec3 p, float r) {
    return length(p) - r;
}

float sdCutSphere( vec3 p, float r, float h )
{
  float w = sqrt(r*r-h*h);

  vec2 q = vec2( length(p.xz), p.y );
  float s = max( (h-r)*q.x*q.x+w*w*(h+r-2.0*q.y), h*q.x-w*q.y );
  return (s<0.0) ? length(q)-r :
         (q.x<w) ? h - q.y     :
                   length(q-vec2(w,h));
}

float sdCapsule(in vec3 p, vec3 a, vec3 b, float ra, float rb)
{   
    vec3 pa = p - a, ba = b - a;
    
    float h = clamp( dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float r = mix(ra, rb, h);
    return length(pa - ba * h) - r;
}

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b + r;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sdCone( vec3 p, vec2 c, float h )
{
  float q = length(p.xz);
  return max(dot(c.xy,vec2(q,p.y)),-h-p.y);
}

float sdCappedCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h, r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdPlane(in vec3 p, float h) {
    return p.y + h;
}

#define T iTime

vec2 sdfLittleGhost(vec3 pos)
{
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

    return res;
}

vec2 map(vec3 p)
{
    vec3 ghostUv = p + vec3(0,-3,0);
    ghostUv.xz *= R2(0.);
    ghostUv.z -= T * 2.;
    ghostUv.x -= 3.5;
    vec2 ghostCellId = vec2(
        floor((ghostUv.x - 0.0) / 4.0),
        floor((ghostUv.z - 0.0) / 5.0)
    );
    
    float timeOffset = hash(ghostCellId) * 6.28;
    float jumpSpeed = 0.2 + hash(ghostCellId + 100.0) * 1.0;

    float fxY = sin(timeOffset * jumpSpeed) * 0.5 + 0.5;
    
    float s = mix(-1.1, 1.1, hash(ghostCellId));  
    ghostUv = vec3(mod(ghostUv.x, 4.0) - 2.5, ghostUv.y + 2. + fxY, mod(ghostUv.z + 0.0,5.0) - 2.5);
    
    // Individual punch timing for each ghost
    float punchTimeOffset = hash(ghostCellId + 200.0) * 0.40;  // 0-8 second offset
    float punchSpeed = 0.008 + hash(ghostCellId + 300.0) * 0.28; // Speed variation: 1.8-2.6
    float punchTime = T * punchSpeed + punchTimeOffset;
    float punchRotation = exp( mod(punchTime, 4.0)) * sin(mod(punchTime, 4.0) * 2.0);

    vec3 ghostUv1 = p  + vec3(0,0,1);
    ghostUv.xz *= R2(punchRotation);
    p.y -= 0.5;
    vec2 g = sdfLittleGhost(ghostUv);
    
    return g;
}


float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k)
{
    float res = 1.0;
    float t = mint;
    
    for(int i = 0; i < 50; i++)
    {
        float h = map(ro + rd * t).x;
        if(h < 0.001)
            return 0.0;
        res = min(res, k * h / t);
        t += h;
        if(t > maxt) break;
    }
    return res;
}

vec2 rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    float m = -1.0;
    
    for(int i=0; i<100; i++)
    {
        vec2 d = map(ro + rd * dt);
        m = d.y;
        dt += d.x;
        if(abs(d.x) < 0.001 || dt > 30.0) break;
    }
    
    if(dt > 30.0)
    {
        float dt = -1.0;
        float m = -1.0;
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

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 render(vec3 ro, vec3 rd, float T)
{
    vec3 col = vec3(0);

    vec2 dt = rayMarch(ro, rd);
    
    if(dt.y > -0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p);
        
        vec3 L = normalize(vec3(2,1,2));
        float diff = clamp(dot(L, norm),0.0,1.0);
        float shadow = softShadow(p + norm * 0.01, L, 0.1, 10.0, 8.0);
        vec3 halfV = normalize(reflect(-L, norm));
        float rim = 1. - pow(dot(norm, -rd), 2.0) * 1.3;
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 16.0);
        
        
        vec3 lightCol = vec3(1.0);
        vec3 bgCol = vec3(0.9) * 1.;
        vec3 diffC = lightCol;
        
        if(dt.y >  9.9){
            // eye's
            bgCol = vec3(0.2,0.5,0.7) * 3.0;
            diffC = rim * diff * lightCol * 0.5;
        } else if(dt.y >  8.9){
            // eye's
            bgCol = vec3(0.5,0,0.7) * 3.0;
            diffC = rim * diff * lightCol * 0.5;
        } else if(dt.y >  7.9){
            // eye shadow
            bgCol = vec3(0) * 0.8; 
            diffC = diff * shadow * 0.4 * lightCol * 0.5;
        } else if(dt.y >  6.9){
            // body little ghost
            bgCol = vec3(1) * 0.8; 
            diffC = rim * 5.1 * diff * shadow * 0.4 * lightCol * 0.5;
        } else {
            bgCol = vec3(0.812,0.396,0.008) * 1.4; 
            diffC = rim * diff * shadow * 0.5 * lightCol * 1.0;
        }
        
        vec3 specC = spec * lightCol * 0.4;
       
        vec3 finalLight = 0.6 + diffC + specC;
        
        col = bgCol * finalLight;
        //col = norm;
        col = mix( col, vec3(0.0), 1.0-exp( -0.0005*dt.x*dt.x*dt.x) );
    }
    
    return col;
}


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  AA  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage(out vec4 O, in vec2 I)
{
    float T = iTime * 0.3;
    
    vec3 ta = vec3(0,0,3); 
    vec3 ro = ta; //+ vec3(6.0*cos(0.5 * T), 0, 6.0*sin(0.5 * T)); 
   //vec3 ro = ta + vec3(7.0*cos(-0.2), 1.0, 7.0*sin(-0.2)); 
    //mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 tot = vec3(0.0);

    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I + off) - iResolution.xy) / iResolution.y;
        //uv *= 0.34;
        vec3 rd = normalize(vec3(uv * 0.4, -1));
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
