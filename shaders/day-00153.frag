uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 153  🎃            
    
    ▓  The big ghost got chunkers today. 
    
    ▓  The idea is to have a sound track of like some army hehe
    
    ▓  🔊 Play this video, it has an army in it kind of sounds 
    ▓  good with the shader 🔊
    
    ▓  📢 https://www.youtube.com/watch?v=Pis3veqKl8k 
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  SDFs, helper fx  🎃            
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

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

// https://iquilezles.org/articles/smin
float smin( float d1, float d2, float k )
{
    k *= 4.0;
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
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

vec2 sdfGhost(vec3 p)
{
    // body 
    float d1 = sdSphere(p, 3.0);

    // eye 
    vec3 eyeSize   = vec3(0.05,0.2,0.15);
    vec3 eyeOff = vec3(-2.6,-0.5,0.4);
    float eyeRight = sdEllipsoid(p + eyeOff, eyeSize);
    float eyeLeft  = sdEllipsoid(p + vec3(-2.6,-0.5,-0.4), eyeSize);

    // eyebrows, eyelids
    vec3 eyeLid_p1 = p;
    vec3 eyeLid_p2 = p;
    eyeLid_p1.yz *= R2(0.9);
    eyeLid_p2.yz *= R2(-0.9);
    eyeLid_p1.xz *= R2(-0.5);
    eyeLid_p2.xz *= R2(0.5);

    vec3 eyeLidSize = vec3(0.15,0.6,0.7);
    float eyeLidL = sdEllipsoid(eyeLid_p1 + vec3(-2.9,-0.4,0), eyeLidSize);
    float eyeLidR  = sdEllipsoid(eyeLid_p2 + vec3(-2.9,-0.4,0), eyeLidSize);
    float eyelids = min(eyeLidL, eyeLidR);
    
    // mouth 
    vec3 mouth_p = p;
    mouth_p.yz *= R2(3.1415);
    float mouth = sdCutSphere(mouth_p + vec3(-3.0,-0.2,0), 0.9, 0.0) - 0.12;
     
    // mouth interior 
    vec3 mouthWall_p = p;
    mouthWall_p.yz *= R2(3.1415);
    float mouthOuter = sdCutSphere(mouthWall_p + vec3(-2.3,-0.2,0), 0.9, 0.0) - 0.01;
    float mouthInner = sdCutSphere(mouthWall_p + vec3(-2.9,-0.16,0), 0.8, 0.0) - 0.1;
    float mouthWalls = max(-mouthInner, mouthOuter); 
    // eye shadow background 
   
   vec3 eyeSocket_p = p;
    vec3 socketSize = vec3(0.225, 0.6, 0.9);
    vec3 socketSize2 = vec3(0.0525, 0.6, 1.0);
    float eyeShadow = sdRoundBox(eyeSocket_p + vec3(-2.75, -0.7, 0), socketSize, 0.15);
    float eyeShadow2 = sdRoundBox(eyeSocket_p + vec3(-2.5, -0.7, 0), socketSize2, 0.15);

    // tounge 
    vec3 tongue_p = p;
    tongue_p.y += tongue_p.x * tongue_p.x * 0.05; 
    tongue_p.xz *= R2(1.0); 

    tongue_p.y += sin(tongue_p.z * 2.0 + 0.5) * 0.25 + 0.3;
    
    vec3 toungeA = vec3(0,-0.5,0);
    vec3 toungeB = vec3(2,-1,3);
    float toungeMain = sdCapsule(tongue_p + vec3(0.3,-0.5,0.5), toungeA, toungeB, 0.1,0.4);
    
    // tongue central line
    vec3 tongueLine_p = tongue_p;
    float tongueLine = sdCapsule(tongueLine_p + vec3(0.13,-0.87,0.25), toungeA, toungeB, 0.2, 0.015);
    float tounge = max(-tongueLine, toungeMain);
    
    // teeth
    vec3 teeth_p = p;
    teeth_p.yz *= R2(3.1416);
    vec2 coneC = vec2(0.2, 0.07);
    float coneR = 0.4;
    //float teeth_1 = sdEllipsoid(teeth_p + vec3(-2.6,-0.0,0.6), vec3(0.3,0.5,0.15));
    float teeth_1 = sdCone(teeth_p + vec3(-2.6,-0.6,0.6), coneC, coneR + 0.1);
    float teeth_2 = sdCone(teeth_p + vec3(-2.6,-0.5,0.2), coneC, coneR);
    float teeth_3 = sdCone(teeth_p + vec3(-2.6,-0.5,-0.2), coneC, coneR);
    float teeth_4 = sdCone(teeth_p + vec3(-2.6,-0.6,-0.6), coneC, coneR + 0.1);
   
    // hands 
    vec3 hands_p1 = p;
    vec3 handSize = vec3(0.4,0.4,0.7);

    float handL = sdEllipsoid(hands_p1 + vec3(-1.5,0,3), handSize);
    float handR = sdEllipsoid(hands_p1 + vec3(-1.5,0,-3), handSize);

    // min dist 
    //float minDist = smin(smin(handL, max(-mouth, d1), 0.2), handR, 0.2);
    float bodyWithSockets = -smin(eyeShadow, -d1, 0.14);
    float bodyWithEyelids = smin(eyelids, bodyWithSockets, 0.04); 
    float minDist = smin(smin(handL, max(-mouth, bodyWithEyelids), 0.2), handR, 0.2);

    float sdfId = 1.0;

    if(eyeLeft < minDist)  { minDist = eyeLeft; sdfId = 1.2; }
    if(eyeRight < minDist) { minDist = eyeRight; sdfId = 1.2; }
    if(eyeLidL < minDist)  { minDist = eyeLidL; sdfId = 2.0; }
    if(eyeLidR < minDist)  { minDist = eyeLidR; sdfId = 2.0; }
    if(teeth_1 < minDist)  { minDist = teeth_1; sdfId = 2.4; }
    if(teeth_2 < minDist)  { minDist = teeth_2; sdfId = 2.4; }
    if(teeth_3 < minDist)  { minDist = teeth_3; sdfId = 2.4; }
    if(teeth_4 < minDist)  { minDist = teeth_4; sdfId = 2.4; }
    if(tounge < minDist)   { minDist = tounge; sdfId = 3.6; }
    //if(tongueLine < minDist) { minDist = tongueLine; sdfId = 3.7; }
    if(eyeShadow2 < minDist) { minDist = eyeShadow2; sdfId = 4.0; }
    if(mouthWalls < minDist) { minDist = mouthWalls; sdfId = 5.0; }

    return vec2(minDist, sdfId);
}

vec2 sdfLittleGhost(vec3 pos)
{
    vec3 q = pos + vec3(0.0, 0.0, 0.0);

    float body = sdCappedCylinder(q - vec3(0.0, -1.0, 0.0), 1.0, 1.0);
    float head = sdSphere(q, 1.0);
    float baseGhost = min(body, head);

    float repeat = 4.5;
    float wave =
        (0.9 + 0.2 * sin(T * 1.0)) *
        sin(q.x * repeat + T * 5.0) *
        sin(q.z * repeat + T * 5.0) * 2.0;

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
    vec3 bigGhost_p = p;
    bigGhost_p.z += 7.0;
    //bigGhost_p.x -= 6.0;
    float angleFx = sin(T * 0.5) * 0.7 + 4.7;
    bigGhost_p.xz *= R2(angleFx); //R2(4.9);
    //bigGhost_p.yz *= R2(0.2);
    bigGhost_p.xy *= R2(0.2);
    
    float fx = sin(iTime * 2.) * 0.3 + 0.6;
    vec2 d1 = sdfGhost(1.4 * bigGhost_p + vec3(0,fx - 0.2 - 2.,0));
    
    vec3 ghostUv = p * 1.0;
    ghostUv.xz *= R2(0.);
    ghostUv.z -= T;
    vec2 ghostCellId = vec2(
        floor((ghostUv.x - 1.2) / 4.0),
        floor((ghostUv.z - 0.0) / 5.0)
    );
    
    float timeOffset = hash(ghostCellId) * 6.28;
    float jumpSpeed = 2.2 + hash(ghostCellId + 100.0) * 1.0;

    // Animated jump with unique timing per ghost
    float fxY = sin(timeOffset + T * jumpSpeed) * 0.5 + 0.5;
    
    float s = mix(-1.1, 1.1, hash(ghostCellId));  
    ghostUv = vec3(mod(ghostUv.x - 1.2, 4.0) - 2.5, ghostUv.y + 3.3 + fxY, mod(ghostUv.z + 0.0,5.0) - 2.5);
    
    vec2 g = sdfLittleGhost(ghostUv);
    
    return combineMin(d1, g);
    //return d1;
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
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 16.0);
        
        vec3 lightCol = vec3(1.0);
        //vec3 bgCol = vec3(0.780,0.416,0.000);
        vec3 bgCol = vec3(0.9) * 1.;
        vec3 diffC = lightCol;
        
        if(dt.y >  8.9){
            // eye's
            bgCol = vec3(0.5,0,0.7) * 2.0;
            diffC = diff * shadow * 0.4 * lightCol * 0.5;
        } else if(dt.y >  7.9){
            // eye shadow
            bgCol = vec3(0) * 0.8; 
            diffC = diff * shadow * 0.4 * lightCol * 0.5;
        } else if(dt.y >  6.9){
            // eye shadow
            bgCol = vec3(1) * 0.8; 
            diffC = diff * shadow * 0.4 * lightCol * 0.5;
        }
        // Big Daddy Ghost
        else if(dt.y >  4.9){
            // eye shadow
            bgCol = vec3(0.1, 0.2, 0.6) * 0.8; 
            diffC = diff * shadow * 0.4 * lightCol * 0.5;
        } else if(dt.y >  3.6){
            // eye shadow
            bgCol = vec3(0.03) * 0.9;
            diffC = diff * shadow * 2.1 * lightCol * 0.5;
        } else if(dt.y >  3.5){
            // tounge
            bgCol = vec3(0.1, 0,0.4) * 1.0;
            diffC = diff * shadow * lightCol * 0.5;
        } else if(dt.y >  3.0){
        
        } else if(dt.y >  2.0){
            // teeth
            bgCol = vec3(0.7) * 1.0;
            diffC = diff * shadow * 2.9 * lightCol * 0.5;
        } else if(dt.y >  1.5){
            bgCol = vec3(0) * 1.0;
        } else if(dt.y >  1.1) {
            // eyes
            bgCol = vec3(0.5,0,0.7) * 10.0;
        } else {
            // body
            bgCol = vec3(1) * 1.0;
            diffC = diff * shadow * lightCol * 0.5;
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
   // vec3 ro = ta + vec3(7.0*cos(-0.2), 1.0, 7.0*sin(-0.2)); 
    //mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 tot = vec3(0.0);

    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I + off) - iResolution.xy) / iResolution.y;
        vec3 rd = normalize(vec3(uv * 0.5, -1));
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
