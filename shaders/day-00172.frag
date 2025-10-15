uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃 KuKo Day 172  🎃               
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define S(a,b,c) smoothstep(a,b,c)
#define STEM 5.0
#define AA 2

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

vec3 combineMin(vec3 a, vec3 b)
{
    return (a.x < b.x)? a : b;
}

// https://iquilezles.org/articles/smin
float smin( float d1, float d2, float k )
{
    k *= 4.0;
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
}

// https://iquilezles.org/articles/distfunctions
float sdEllipsoid( in vec3 p, in vec3 r )
{
    float k1 = length(p/r);
    return (k1-1.0)*min(min(r.x,r.y),r.z);
}

// https://iquilezles.org/articles/smin
float smax( float a, float b, float k )
{
    float h = max(k-abs(a-b),0.0);
    return max(a, b) + h*h*0.25/k;
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

float sdCone( vec3 p, vec2 c, float h )
{
  float q = length(p.xz);
  return max(dot(c.xy,vec2(q,p.y)),-h-p.y);
}

vec3 sdfGhost(vec3 p)
{
    float scale = 5.5;
    p *= scale;
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
    eyeLid_p1.yz *= R2(0.9);
    eyeLid_p2.yz *= R2(-0.9);
    eyeLid_p1.xz *= R2(-0.6);
    eyeLid_p2.xz *= R2(0.6);

    vec3 eyeLidSize = vec3(0.15,0.6,0.8);
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
    float mouth = sdCutSphere(mouth_p + vec3(-1.8,-0.2,0), 1.3, 0.0) - 0.2;
    mouthOcc = 0.1 + 0.9*clamp(mouth*20.0, 0.0, 1.0); // Darkening facto
    
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
    float teeth_1 = sdCone(teeth_p + vec3(-2.6,-0.46,0.6), coneC, coneR + 0.1);
    float teeth_2 = sdCone(teeth_p + vec3(-2.6,-0.45,0.2), coneC, coneR);
    float teeth_3 = sdCone(teeth_p + vec3(-2.6,-0.45,-0.2), coneC, coneR);
    float teeth_4 = sdCone(teeth_p + vec3(-2.6,-0.46,-0.6), coneC, coneR + 0.1);
   
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

    float sdfId = 5.0;
    float sdfIdOff = 0.2;

    if(eyeLeft < minDist)  { minDist = eyeLeft; sdfId += sdfIdOff; }
    if(eyeRight < minDist) { minDist = eyeRight; sdfId += sdfIdOff; }
    if(eyeLidL < minDist)  { minDist = eyeLidL; sdfId += 1.0; }
    if(eyeLidR < minDist)  { minDist = eyeLidR; sdfId += 1.0; }
    if(teeth_1 < minDist)  { minDist = teeth_1; sdfId += 1.4; }
    if(teeth_2 < minDist)  { minDist = teeth_2; sdfId += 1.4; }
    if(teeth_3 < minDist)  { minDist = teeth_3; sdfId += 1.4; }
    if(teeth_4 < minDist)  { minDist = teeth_4; sdfId += 1.4; }
    if(tounge < minDist)   { minDist = tounge; sdfId += 2.6; }
    //if(tongueLine < minDist) { minDist = tongueLine; sdfId = 3.7; }
    //if(eyeShadow2 < minDist) { minDist = eyeShadow2; sdfId = 4.0; }
    //if(mouthWalls < minDist) { minDist = mouthWalls; sdfId = 5.0; }
    if(eyeShadow2 < minDist) { minDist = eyeShadow2; sdfId = 9.0; }
    
    vec3 res = vec3(minDist, sdfId, mouthOcc);
    res.x /= scale;
    return res;
}

vec3 SDFPumpkin(vec3 pos, float extraId)
{  
    float proxy = length(pos - vec3(0.0, 0.1, 0.0));  // Y center: 0.2 → 0.1
    
    if (proxy > 1.0)  // Proxy radius: 2.0 → 1.0
    {
    	return vec3(proxy - 0.75, 0.0, 0.0);  // Proxy fallback: 1.5 → 0.75
    }
    else   
    {   
        float angle = atan(pos.x, pos.z);
        float section = smax(0.0125, abs(sin(angle * 4.0)), 0.0125) * 0.025;  // 0.025→0.0125, 0.05→0.025
        float longLen = length(pos.xz);
        float pinch = S(0.35, -0.05, longLen);  // 0.7→0.35, -0.1→-0.05
        float pumpkin = sdEllipsoid(pos, vec3(0.425, 0.375, 0.425)) + pinch * 0.15;  // (0.85,0.75,0.85)→(0.425,0.375,0.425), 0.3→0.15
        
        float pumpkinDisplace = ((sin(angle * 25.0) + sin(angle * 43.0)) * 0.000375 - section) * S(0.05, 0.325, longLen);  // 0.00075→0.000375, 0.1→0.05, 0.65→0.325
        pumpkin += pumpkinDisplace;
        
        float stem = longLen - 0.0725 + S(0.275, 0.375, pos.y) * 0.0375 + sin(angle * 4.0) * 0.0025;  // 0.145→0.0725, 0.55→0.275, 0.75→0.375, 0.075→0.0375, 0.005→0.0025
        
        float stemDisplace = sin(angle * 10.0);
        
        stem += stemDisplace * 0.00125;  // 0.0025→0.00125
        stem -= (pos.y - 0.3) * 0.025;  // 0.6→0.3, 0.05→0.025
        
        stem *= 0.8;
        
        float stemCut = pos.y - 0.4 + pos.x * 0.075;  // 0.8→0.4, 0.15→0.075
        stem = smax(stem, stemCut, 0.0125);  // 0.025→0.0125
        stem = max(stem, 0.25 - pos.y);  // 0.5→0.25
        
        float pumpkinID = clamp(pumpkinDisplace * 4.0 + 0.5, 0.0, 0.999);
        float stemID = STEM + (0.5 + stemDisplace * 0.2) * S(0.025, -0.15, stemCut);  // 0.05→0.025, -0.3→-0.15
        
        pumpkin = abs(pumpkin) - 0.0125;  // 0.025→0.0125
        
        // FACE 
        float face = length(pos.xy - vec2(0.0, 0.1075)) - 0.275;  // (0,0.15)→(0,0.075), 0.55→0.275
        face = max(face, -(length(pos.xy - vec2(0.0, 0.5)) - 0.5));  // (0,0.9)→(0,0.45), 1.0→0.5
        
        // TEETH 
        float teeth = abs(pos.x - 0.1) - 0.04;  // 0.2→0.1, 0.08→0.04
        teeth = smax(teeth, -0.125 - pos.y + pos.x * 0.025, 0.175);  // -0.225→-0.1125, 0.05→0.025, 0.035→0.0175
        
        float teeth2 = abs(pos.x + 0.1) - 0.04;  // 0.2→0.1, 0.08→0.04
        teeth2 = smax(teeth2, 0.134 + pos.y + pos.x * 1.25, 0.175);  // 0.25→0.125, 0.025→0.0125, 0.035→0.0175
        
        face = smax(face, -min(teeth, teeth2), 0.0175);  // 0.035→0.0175
        
        vec2 symPos = pos.xy;
        symPos.x = abs(symPos.x);
        
        // NOSE
        float nose = -pos.y + 0.05;  // 0.05→0.025
        nose = max(nose, symPos.x - 0.0625 + symPos.y * 0.45);  // 0.125→0.0625, 0.5→0.25
        
        // EYES 
        float eyes = -pos.y + 0.1 - symPos.x * 0.025;  // 0.2→0.1, 0.045→0.0225
        eyes = max(eyes, symPos.x - 0.25 + symPos.y * 0.45);  // 0.5→0.25, 0.5→0.25
        eyes = max(eyes, -symPos.x - 0.0075 + symPos.y * 0.525);  // -0.015→-0.0075, 0.65→0.325
        
        // HANDS 
        vec3 hands_p1 = pos + vec3(-0.45,0.1,0.4);
        vec3 hands_p2 = pos + vec3(0.45,0.1,0.4);
        hands_p1.xz *= R2(-0.5);
        hands_p2.xz *= R2(0.5);
        //hands_p2.xy *= R2();
        vec3 handSize = vec3(0.05,0.07,0.2);

        float handL = sdEllipsoid(hands_p1, handSize);
        float handR = sdEllipsoid(hands_p2, handSize);
        
        // FEET
        vec3 feet_p1 = pos + vec3(-0.2,0.4,-0.1);
        vec3 feet_p2 = pos + vec3(0.2,0.4,-0.1);
        feet_p1.yz *= R2(-1.5);
        feet_p2.yz *= R2(1.5);
        //hands_p2.xy *= R2();
        vec3 feetSize = vec3(0.05,0.07,0.3);

        float feetL = sdEllipsoid(feet_p1, feetSize);
        float feetR = sdEllipsoid(feet_p2, feetSize);
        
        
        face = min(face, nose);
        face = min(face, eyes);

        face = max(face, pos.z);

        float feet = smin(feetL, feetR, 0.05);

        // Combine both hands
        float hands = smin(handL, handR, 0.05);

        // Combine pumpkin with hands and feet
        float body = smin(pumpkin, hands, 0.05);
        body = smin(body, feet, 0.05);

        // Subtract the face
        pumpkin = smax(body, -face, 0.0075);
        
        vec3 res = vec3(pumpkin, pumpkinID + extraId, 1.0); 
		res = combineMin(res, vec3(stem, stemID + extraId, 1.0));
        return res;
    }
}

vec3 map(vec3 p)
{
    float zOffset = -1.0;
    
    vec3 oneUv = p;
    oneUv.z -= 1.9 + zOffset;
    oneUv.xz *= R2(iTime);
    oneUv.x -= 1.0;
    oneUv.y += sin(oneUv.z * 0.5 + iTime * 6.0 ) * 0.2;
    oneUv.xz *= R2(1.7);
    
    vec3 pumpkTwo = p;
    pumpkTwo.z -= 1.5 + zOffset;
    pumpkTwo.xz *= R2(iTime);
    pumpkTwo.x += 1.0;
    pumpkTwo.y += sin(oneUv.z * 0.5 + iTime * 6.0 + 1.0) * 0.2;
    pumpkTwo.xz *= R2(-1.7);
    
    // ghost 
    vec3 bigGhost_p = p;
    bigGhost_p.z -= 1.5 + zOffset;
    bigGhost_p.xz *= R2(iTime + 1.5);
    bigGhost_p.x += 1.0;
    bigGhost_p.y += sin(bigGhost_p.z * 0.5 + iTime * 6.0 + 2.0) * 0.2;
    bigGhost_p.xy *= R2(0.2);
    
    
    // combine sdfs 
    vec3 d1 = SDFPumpkin(pumpkTwo, 0.0);  
    vec3 d2 = SDFPumpkin(oneUv, 2.0); 
    vec3 d3 = sdfGhost(1.4 * bigGhost_p); 
    vec3 finalSdf = combineMin(d1, d2);
    finalSdf = combineMin(finalSdf, d3);
    return finalSdf;
}

vec3 rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    float id = -1.0;
    float oc = -1.0;
    
    for(int i=0; i<100; i++)
    {
        vec3 d = map(ro + rd * dt);
        dt += d.x;
        id = d.y;
        oc = d.z;
        if(abs(d.x) < 0.001 || dt > 30.0) break;
    }
    if(dt > 30.0)
    {
        float dt = -1.0;
        float id = -1.0;
        float oc = -1.0;
    }
    
    return vec3(dt, id, oc);
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
    
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p);
        float sz = 1./9.; 
        norm = db(iChannel0, p*sz, norm, .1/(1. + dt.x*.25/20.));
        vec3 svn = norm;
        vec3 L = normalize(vec3(0,0,1));
        float diff = clamp(dot(L, norm),0.0,1.0);
        //float shadow = softShadow(p + norm * 0.01, L, 0.1, 10.0, 8.0);
        vec3 tangent = normalize(cross(norm, vec3(0,1,0)));
        vec3 halfV = normalize(reflect(-L, norm));
        float rim = 1.2 - pow(dot(norm, -rd), 2.0) * 1.3;
        float fr = clamp(1.0 + dot(rd, norm), .0, 1.); // Fresnel reflection term.
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 34.0);
        
        vec3 refl = envMap(normalize(reflect(rd, svn*.5 + norm*.5)), svn*.5 + norm*.5);
        vec3 refr = envMap(normalize(refract(rd, svn*.5 + norm*.5, 1./1.35)), svn*.5 + norm*.5);
        
        // More fake physics that looks like real physics. :) Mixing the reflection and refraction 
        // colors according to a Fresnel variation.
        
        vec3 refCol = mix(refr, refl, pow(fr, 5.)); //(refr + refl)*.5; // Adding them, if preferred.
        
        vec3 materialCol = vec3(0.05);
        vec3 lightCol = vec3(1.0);
        vec3 diffC = materialCol * diff * 0.1;
        vec3 specC = spec * lightCol * vec3(0.5, 1.7, 1.0) * 1.0;
        vec3 fresnelC = vec3(0);
        
        vec3 bgCol = vec3(0);
        
        // ghost colors
        if(dt.y > 3.9){
            fresnelC = vec3(1) * pow(fr, 6.0) * 10.25;
            col = diffC + specC + fresnelC;
            col += refCol * ((diff * diff * 1.625 + 0.75)) * 0.6;

            col += rim * 0.3 * vec3(2);
        } 
        
        // pumpkin
        else if(dt.y > 1.0){
            fresnelC = vec3(10.0, 1.7, 0.4) * pow(fr, 6.0) * 10.25;
            col = diffC + specC + fresnelC;
            col += refCol * ((diff * diff * 1.625 + 0.75)) * 0.6;

            col += rim * 0.1 * vec3(.3, 1.6, 0.8);
            
        } else {
            fresnelC = vec3(10.0, 1.7, 0.4) * pow(fr, 6.0) * 10.25;
            col = diffC + specC + fresnelC;
            col += refCol * ((diff * diff * 1.625 + 0.75)) * 0.2;

            col += rim * 0.1 * vec3(10.3, .6, 0.8);
            //if(false)
            //col = 0.5 + 0.5*norm.yxz;
        }
        
        col = mix( col, vec3(0.0), 1.0-exp( -0.001*dt.x*dt.x*dt.x) );
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
    
    vec3 ta = vec3(0,0,0); 
    vec3 ro = ta + vec3(0, 0, 3); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 tot = vec3(0.0);

    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I + off) - iResolution.xy) / iResolution.y;
        vec3 rd = normalize(vec3(uv * 0.6, -1));
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
