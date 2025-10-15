uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 165  🎃            
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  SDFs, helper fx  🎃            
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 30.0
#define AA 1

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



vec3 sdfGhost(vec3 p)
{
    // body 
    float d1 = sdSphere(p, 3.0);
    float mouthOcc = 1.0; // Add this
    
    // eye 
    vec3 eyeSize   = vec3(0.15,0.2,0.15);
    vec3 eyeOff = vec3(-2.58,-0.9,0.4);
    float eyeRight = sdEllipsoid(p + eyeOff, eyeSize);
    float eyeLeft  = sdEllipsoid(p + vec3(-2.58,-0.9,-0.4), eyeSize);

    // eyebrows, eyelids
    vec3 eyeLid_p1 = p + vec3(-2.25,-1.7,-0.6);
    vec3 eyeLid_p2 = p + vec3(-2.25,-1.7, 0.6);
    eyeLid_p1.yz *= R2(1.1);
    eyeLid_p2.yz *= R2(-1.1);
    eyeLid_p1.xz *= R2(-0.6);
    eyeLid_p2.xz *= R2(0.6);

    vec3 eyeLidSize = vec3(0.15,0.36,0.8);
    float eyeLidL = sdEllipsoid(eyeLid_p1, eyeLidSize);
    float eyeLidR  = sdEllipsoid(eyeLid_p2, eyeLidSize);
    float eyelids = min(eyeLidL, eyeLidR);
    
    // eye shadow background 
    vec3 eyeSocket_p = p;
    vec3 socketSize = vec3(0.4225, 0.4, 1.2);
    float eyeShadow = sdEllipsoid(eyeSocket_p + vec3(-2.75, -0.9, 0), socketSize);
    float eyeShadow2 = sdEllipsoid(p + vec3(-2.5, -0.9, 0), vec3(0.1,0.5,1.2)); 
    float eyeShadowMain = smin(eyeShadow, eyeShadow2, 0.1);
    
    // mouth 
    vec3 mouth_p = p;
    mouth_p.yz *= R2(3.1415);
    float mouth = sdCutSphere(mouth_p + vec3(-3.0,-0.2,0), 1.3, 0.0) - 0.12;
    mouthOcc = 0.1 + 0.9*clamp(mouth*50.0, 0.0, 1.0); // Darkening facto
    // mouth interior 
    vec3 mouthWall_p = p;
    mouthWall_p.yz *= R2(3.1415);
    float mouthOuter = sdCutSphere(mouthWall_p + vec3(-2.3,-0.2,0), 0.9, 0.0) - 0.01;
    float mouthInner = sdCutSphere(mouthWall_p + vec3(-2.9,-0.16,0), 0.8, 0.0) - 0.1;
    float mouthWalls = max(-mouthInner, mouthOuter); 
     
    // tounge 
    vec3 tongue_p = p + vec3(-2.5,0.1,0.0);
    tongue_p.y += sin(tongue_p.x * 3.5 + 3.) * 0.25 + 0.3;
    tongue_p.y += tongue_p.x * tongue_p.x * 0.05; 
    tongue_p.xz *= R2(1.); 
    tongue_p.yz *= R2(-0.5); 
    
    vec3 toungeA = vec3(0,-0.5,0);
    vec3 toungeB = vec3(0.5, -0.5,1);
    float toungeMain = sdCapsule(tongue_p, toungeA, toungeB, 0.2,0.6);
    
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
    vec3 hands_p1 = p + vec3(-1.5,0,3);
    vec3 hands_p2 = p + vec3(-1.5,0,-3);
    hands_p1.yz *= R2(-0.6);
    hands_p2.yz *= R2(0.6);
    vec3 handSize = vec3(0.4,0.4,0.9);

    float handL = sdEllipsoid(hands_p1, handSize);
    float handR = sdEllipsoid(hands_p2, handSize);

    // min dist 
    //float minDist = smin(smin(handL, max(-mouth, d1), 0.2), handR, 0.2);
    float bodyWithSockets = -smin(eyeShadow, -d1, 0.1);
    float bodyWithEyelids = smin(eyelids, bodyWithSockets, 0.04); 
    float minDist = smin(smin(handL,max(-mouth, bodyWithEyelids), 0.2), handR, 0.2);

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
    //if(eyeShadow2 < minDist) { minDist = eyeShadow2; sdfId = 4.0; }
    //if(mouthWalls < minDist) { minDist = mouthWalls; sdfId = 5.0; }
    if(eyeShadow2 < minDist) { minDist = eyeShadow2; sdfId = 6.0; }
    
    return vec3(minDist, sdfId, mouthOcc);
}

vec3 map(vec3 p)
{
    vec3 bigGhost_p = p;
    
    bigGhost_p.xz *= R2(-1.5); 
    bigGhost_p.xy *= R2(0.2);
    bigGhost_p.z -= T;
    bigGhost_p.y -= 1.0;
    
    float cellZ = floor((bigGhost_p.z + 3.0) / 6.0);
    vec2 ghostId = vec2(floor(bigGhost_p.x / 6.0), cellZ);
    
    float timeOffset = hash(ghostId) * 6.28;
    
    bigGhost_p = vec3(bigGhost_p.x, (bigGhost_p.y), 
                mod(bigGhost_p.z + 3.0, 6.0) - 3.);
                
    float cycle = 0.5 * T;
    float phase = fract(cycle + timeOffset);
    float finalDelta = 0.0;
    float activePhase = 0.4; 
    
    if (phase < activePhase) {
        float t = phase / activePhase;
        t = t * t * (3.0 - 2.0 * t); 
        finalDelta = t * 6.28;
    } else {
        float restPhase = (phase - activePhase) / (1.0 - activePhase);
        float decay = 1.0 - restPhase * 0.03; 
        finalDelta = 6.28 * decay;
    }
    
    float punchPhase = fract(T * 0.58 + timeOffset);
    float punch = 0.0;
    if (punchPhase < 0.2) {
        float t = punchPhase / 0.2;
        t = 0.5 - 0.5 * cos(t * 6.28); 
        punch = t * 2.0; 
    }
    
    bigGhost_p.x -= punch;
    
    bigGhost_p.yz *= R2(finalDelta);
    
    vec3 d1 = sdfGhost(1.4 * bigGhost_p + vec3(0,0,0));
    
    return d1;
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

vec3 rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    float m = -1.0;
    float oc = -1.0;
    
    for(int i=0; i<100; i++)
    {
        vec3 d = map(ro + rd * dt);
        m = d.y;
        oc = d.z;
        dt += d.x;
        if(abs(d.x) < 0.001 || dt > 30.0) break;
    }
    
    if(dt > 30.0)
    {
        float dt = -1.0;
        float m = -1.0;
        float oc = -1.0;
    }
    return vec3(dt, m, oc);
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


// Tri-Planar blending function. Based on an old Nvidia writeup:
// GPU Gems 3 - Ryan Geiss: https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch01.html
vec3 tpl( sampler2D t, in vec3 p, in vec3 n ){
    
    n = max(abs(n) - .2, 0.001);
    n /= dot(n, vec3(1));
	vec3 tx = texture(t, p.zy).xyz;
    vec3 ty = texture(t, p.xz).xyz;
    vec3 tz = texture(t, p.xy).xyz;
    
    // Textures are stored in sRGB (I think), so you have to convert them to linear space 
    // (squaring is a rough approximation) prior to working with them... or something like that. :)
    // Once the final color value is gamma corrected, you should see correct looking colors.
    return (tx*tx*n.x + ty*ty*n.y + tz*tz*n.z);
}

// Texture bump mapping. Four tri-planar lookups, or 12 texture lookups in total.
vec3 db( sampler2D tx, in vec3 p, in vec3 n, float bf){
   
    const vec2 e = vec2(.001, 0);
    
    // Three gradient vectors rolled into a matrix, constructed with offset greyscale texture values.    
    mat3 m = mat3( tpl(tx, p - e.xyy, n), tpl(tx, p - e.yxy, n), tpl(tx, p - e.yyx, n));
    
    vec3 g = vec3(.299, .587, .114)*m; // Converting to greyscale.
    g = (g - dot(tpl(tx,  p , n), vec3(.299, .587, .114)) )/e.x; g -= n*dot(n, g);
                      
    return normalize(n + g*bf); // Bumped normal. "bf" - bump factor.	
}


// Simple environment mapping.
vec3 envMap(vec3 rd, vec3 n)
{    
    vec3 col = tpl(iChannel1, rd*4., n);
    return smoothstep(0., 1., col);
}

vec3 render(vec3 ro, vec3 rd, float T)
{
    vec3 col = vec3(0);

    vec3 dt = rayMarch(ro, rd);
    
    if(dt.y > -0.0)
    {
        vec3 p = ro + rd * dt.x;
        
        vec3 texCoord = p;
        texCoord.xz *= R2(-1.5);
        texCoord.xy *= R2(T * 0.1);
        texCoord.z -= T;
        texCoord = vec3(texCoord.x, texCoord.y, 
                    mod(texCoord.z, 6.0) - 3.);
                   
        vec3 norm = calcNormal(p);
        float sz = 1./9.; 
        norm = db(iChannel0, texCoord*sz, norm, .1/(1. + dt.x*.25/20.));
        vec3 svn = norm;
        
        vec3 L = normalize(vec3(2,1,2));
        float diff = clamp(dot(L, norm),0.0,1.0);
        float shadow = softShadow(p + norm * 0.01, L, 0.1, 10.0, 8.0);
        vec3 halfV = normalize(reflect(-L, norm));
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        float rim = 1.0 - pow(clamp(dot(norm, -rd), 0.0,1.0), 2.0) * 2.4;
        float fr = clamp(1.0 + dot(rd, norm), .0, 1.); 
        spec = pow(spec, 16.0);
        
        vec3 refl = envMap(normalize(reflect(rd, svn*.5 + norm*.5)), svn*.5 + norm*.5);
        vec3 refr = envMap(normalize(refract(rd, svn*.5 + norm*.5, 1./1.35)), svn*.5 + norm*.5);
        
        vec3 refCol = mix(refr, refl, pow(fr, 5.)); //(refr + refl)*.5; // Adding them, if preferred.
        vec3 fresnelC = vec3(10.0, 10.7, 10.4) * pow(fr, 6.0) * 0.25;
        
        vec3 lightCol = vec3(1.0);
        //vec3 bgCol = vec3(0.780,0.416,0.000);
        vec3 bgCol = vec3(0.9) * 1.;
        
        vec3 diffC = lightCol;
        vec3 mouth_p = p;

        float angleFx = sin(T * 0.5) * 0.7 + 4.7;
        mouth_p.xz *= R2(angleFx);
        mouth_p.z += 1.0;
        //mouth_p.yz *= R2(0.1415);
        float mouthDist = sdCutSphere(mouth_p + vec3(-0.5,-0.2,0), 1.3, 0.0) - 0.12;
        
        // Big Daddy Ghost
        if(dt.y >  4.9){
            // eye shadow
            float blendFact = smoothstep(0.0,0.002,map(p).x);
            vec3 shadowCol = vec3(0.03);
            bgCol = mix(shadowCol, vec3(0.5), blendFact) * 1.;
            //diffC =  diff * shadow * 1.4 * lightCol * 0.5;
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
            bgCol = vec3(2.7) * 1.5;
            diffC = diff * 2.9 * lightCol * 0.5;
        } else if(dt.y >  1.5){
            bgCol = vec3(0) * 1.0;
        } else if(dt.y >  1.0) {
            // eyes
            bgCol = vec3(0.5,0,0.7) * 10.0;
        } else {
            // Normal body
            
            bgCol = vec3(1.0) * 1.0;
            bgCol += refCol * ((diff * diff * 1.625 + 0.75)) * 3.5;
            
            diffC = rim * diff * shadow * lightCol * 0.5 + fresnelC;
        }
        
        vec3 specC = spec * lightCol * 0.4;
       
        vec3 finalLight = 0.6 + diffC + specC + refCol;
        
        col = bgCol * finalLight * dt.z;
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
    
    vec3 ta = vec3(0,1,10); 
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
