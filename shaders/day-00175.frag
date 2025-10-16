uniform vec3 iResolution;
uniform float iTime; 
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 175  🎃               
    
    ▓  Flame from @yufengjie  
    ▓  https://www.shadertoy.com/view/wfSBzV
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define S(a,b,c) smoothstep(a,b,c)
#define STEM 5.0
#define T iTime
#define s1(v) (sin(v)*.5+.5)
#define AA 2

#define GHOST_BODY   7.0
#define GHOST_EYE    8.0
#define GHOST_PUPIL  9.0

vec2 combineMin(vec2 a, vec2 b)
{
    return (a.x < b.x)? a : b;
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

mat2 R2(float a){
    float s = sin(a);
    float c = cos(a);
    return mat2(c,-s,s,c);
}

// https://iquilezles.org/articles/smin
float smin( float d1, float d2, float k )
{
    k *= 4.0;
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
}

float smax( float a, float b, float k )
{
    float h = max(k-abs(a-b),0.0);
    return max(a, b) + h*h*0.25/k;
}

float sdEllipsoid( in vec3 p, in vec3 r )
{
    float k1 = length(p/r);
    return (k1-1.0)*min(min(r.x,r.y),r.z);
}

float sdBox( vec3 p, vec3 b )
{
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdSphere(in vec3 p, float r) {
    return length(p) - r;
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

float sdCapsule(in vec3 p, vec3 a, vec3 b, float ra, float rb)
{   
    vec3 pa = p - a, ba = b - a;
    
    float h = clamp( dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float r = mix(ra, rb, h);
    return length(pa - ba * h) - r;
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
float sdPlane(in vec3 p, float h) {
    return p.y + h;
}

float fbm(vec3 p){
    float amp = 1.;
    float fre = 1.;
    float n = 0.;
    for(float i = 0.; i < 4.; i++){
        n += abs(dot(cos(p*fre), vec3(.1,.52,.3))) * amp;
        amp *= .59;
        fre *= 1.3;
        p.xz *= R2(p.y*0.51 + T*.1);
        p.y -= T*1.; // Upward motion
    }
    return n;
}


vec2 SDFPumpkin(vec3 pos)
{  
    float scale = 2.0;
    pos *= scale;
    float proxy = length(pos - vec3(0.0, 0.2, 0.0));
    
    if (proxy > 4.0)
    {
    	return vec2(proxy - 3.0, 0.0);
    }
    else   
    {   
        float angle = atan(pos.x, pos.z);
        float section = smax(0.05, abs(sin(angle * 4.0)), 0.05) * 0.1;
        float longLen = length(pos.xz);
        float pinch = S(1.4, -0.2, longLen);

        float pumpkin = sdEllipsoid(pos, vec3(1.7, 1.5, 1.7)) + pinch * 0.6;
        
        float pumpkinDisplace =  ((sin(angle * 25.0) + sin(angle * 43.0)) * 0.0015 - section) * S(0.2, 1.3, longLen);
        pumpkin += pumpkinDisplace;

        float stem = longLen - 0.29 + S(1.1, 1.5, pos.y) * 0.15 + sin(angle * 4.0) * 0.01;
        float stemDisplace = sin(angle * 10.0);
        stem += stemDisplace * 0.005;
        stem -= (pos.y - 0.2) * 0.1;
        stem *= 0.8;
        
        float stemCut = pos.y - 2. + pos.x * 0.3; // here the stem grows to 3.6 but due to the mod it doesn't grow more
        stem = smax(stem, stemCut, 0.05);
        stem = max(stem, 1.0 - pos.y);

        float pumpkinID = clamp(pumpkinDisplace * 4.0 + 0.5, 0.0, 0.999);
	    float stemID = STEM + (0.5 + stemDisplace * 0.2) * S(0.1, -0.6, stemCut);
        
        pumpkin = abs(pumpkin) - 0.05;

        // Face carving
        float face = length(pos.xy - vec2(0.0, 0.3)) - 1.1;
        face = max(face, -(length(pos.xy - vec2(0.0, 1.8)) - 2.0));
        // TEETH
        float teeth = abs(pos.x - 0.4) - 0.16;
        teeth = smax(teeth, -0.45 - pos.y + pos.x * 0.1, 0.07);
        
        float teeth2 = abs(pos.x + 0.40) - 0.16;
        teeth2 = smax(teeth2, 0.5 + pos.y + pos.x * 0.05, 0.07);
        
        face = smax(face, -min(teeth, teeth2), 0.07);

        vec2 symPos = pos.xy;
        symPos.x = abs(symPos.x);

        float nose = -pos.y + 0.1;
        nose = max(nose, symPos.x - 0.25 + symPos.y* 0.5);

        float eyes = -pos.y + 0.48 - symPos.x * 0.17;
        eyes = max(eyes, symPos.x - 1.0 + symPos.y * 0.5);
        eyes = max(eyes, -symPos.x - 0.05 + symPos.y * 0.5);

        face = min(face, nose);
        face = min(face, eyes);
        face = max(face, pos.z);

        pumpkin = smax(pumpkin, -face, 0.03);

        vec2 res = vec2(pumpkin, pumpkinID);
		res = combineMin(res, vec2(stem, stemID));
        res.x /= scale;
        return res;
    }
}

float sdFlame(vec3 p, out vec3 flameCol)
{
    p.y -= 0.; // Start at pumpkin top
    vec3 q = p;
    //q.z += T;
    q.z += T;
    q = vec3(mod(q.x + 0.5, 5.0) - 2.5,mod(q.y + 0.5, 5.0) - 2.5, mod(q.z + 0.5, 5.0) - 2.5);
    // Flame parameters
    float h = 3.1;  // Height of flame
    float range = S(-h, h, p.y);
    float w = range * 0.6 + 0.2;  // Width tapers with height
    float thick = range * 0.4 + 0.15;
    
    // Twist flame as it rises
    q.xz *= R2(q.y * 0.3 - T * 1.35);
    
    // Create hollow column shape
    float d = SDFPumpkin(q).x;
    float d1 = SDFPumpkin(q - vec3(0.1, 0.21, 0.1)).x;
    
    d = max(d, -d1);
    
    // Add turbulence
    d += fbm(p * 1.6) * 0.454;
    
    // Convert to thin shell for glow
    d = abs(d) * 0.2315 + .001;
    
    // Flame color gradient (red->yellow->white going up)
    //vec3 c = s1(vec3(2, 1, 1) + (p.y + p.z) * .5 - T * 1.);
    float k = clamp(S(2.191, h, p.y), 0.0, 1.0);           // 0 at base, 1 near tip
    vec3 warm = mix(vec3(1.0, 0.25, 0.06), vec3(0.0, 0.98, 0.1), k); // red→yellow
    vec3 c    = mix(warm, vec3(1.0), smoothstep(0.6, 1.0, k));        // hint to white at tip
    
    // Inverse square falloff for glow
    flameCol = pow(1.1 / d,2.2) * c;
   
    return d;
}

float map(vec3 p)
{
    vec3 oneUv = p;
    
    //oneUv.y += iTime * 0.1;
    oneUv.z += T;
    oneUv = vec3(mod(oneUv.x + 0.5, 5.0) - 2.5,mod(oneUv.y + 0.5, 5.0) - 2.5, mod(oneUv.z + 0.5, 5.0) - 2.5);
    
    oneUv.xz *= R2(-T * 1.5);
    
    vec2 d1 = SDFPumpkin(oneUv);
    return d1.x;
}

float rayMarch(vec3 ro, vec3 rd, out vec3 flameGlow)
{
    float dt = 0.0;
    flameGlow = vec3(0);
    
    for(int i = 0; i < 60; i++)
    {
        vec3 p = ro + rd * dt;
        
        vec3 fCol = vec3(0);
        float dFlame = sdFlame(p, fCol);
        
        flameGlow += fCol * 0.00035;
        
        float d = map(p);
        float dMin = min(d, dFlame);
        dt += dMin;
        
        if( dt > 20.0) break;
    }
    
    return dt;
}

vec3 calcNormal(vec3 p)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0)) - map(p - vec3(e,0,0)),
        map(p + vec3(0,e,0)) - map(p - vec3(0,e,0)),
        map(p + vec3(0,0,e)) - map(p - vec3(0,0,e))
    ));
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void mainImage( out vec4 O, in vec2 I )
{
    vec3 ta = vec3(0, 2, 0);
    vec3 ro = ta + vec3(5.0*cos(-1.7), 2.0, 5.0*sin(-1.5)); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 tot = vec3(0.0);
    
    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I + off) - iResolution.xy) / iResolution.y;
        
        vec3 rd = ca * normalize(vec3(uv, 2.0));
        
        vec3 col = vec3(0);
        vec3 flameGlow = vec3(0);
        float dt = rayMarch(ro, rd, flameGlow);
        
        if(dt < 30.0)
        {
            vec3 p = ro + rd * dt;
            vec3 norm = calcNormal(p);
            
            //col = 0.3 + 0.5*norm.yxz;
            //col *= vec3(0);
            //col = mix(col, vec3(0.0), 1.0 - exp(-0.001*dt*dt*dt));
        }
        
        flameGlow = tanh(flameGlow / 2.0);
        col += flameGlow;
        
        tot += col;
    }
    
    tot /= float(AA * AA);
    
    O = vec4(tot, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
