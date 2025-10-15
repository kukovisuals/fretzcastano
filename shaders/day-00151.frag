uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 151  🎃            
    
    ▓  Trying to make the ghost from luigi's mantion game.
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 30.0
#define AA 2

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

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 148  🎃            
    
    ▓  Playing with the theme. It needs some bats or 
    ▓  something.
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime

vec2 sdfGhost(vec3 p)
{
    // body 
    float d1 = sdSphere(p, 3.0);

    // eye 
    vec3 eyeSize   = vec3(0.2,0.2,0.15);
    vec3 eyeOff = vec3(-2.9,-0.5,0.4);
    float eyeRight = sdEllipsoid(p + eyeOff, eyeSize);
    float eyeLeft  = sdEllipsoid(p + vec3(-2.9,-0.5,-0.4), eyeSize);

    // eyebrows 
    vec3 eyeLid_p1 = p;
    vec3 eyeLid_p2 = p;
    eyeLid_p1.yz *= R2(-0.5);
    eyeLid_p2.yz *= R2(0.5);

    vec3 eyeLidSize = vec3(0.1,0.15,0.5);
    float eyeLidL = sdEllipsoid(eyeLid_p1 + vec3(-2.8,-1.15,-0.0), eyeLidSize);
    float eyeLidR  = sdEllipsoid(eyeLid_p2 + vec3(-2.8,-1.15,-0), eyeLidSize);
    
    float eyeLidL2 = sdEllipsoid(eyeLid_p1 + vec3(-3.2,-1.15,-0.0), eyeLidSize);
    float eyeLidR2  = sdEllipsoid(eyeLid_p2 + vec3(-3.2,-1.15,-0), eyeLidSize);
    
    // eye balls / shadow?
    vec3 eyeBalls_p = p;
    eyeBalls_p.yz *= R2(3.1415);
    float eyeBalls = sdCutSphere(eyeBalls_p + vec3(-3.0,1.0,0), 0.8, 0.0) - 0.12;
    
    // mouth 
    vec3 mouth_p = p;
    mouth_p.yz *= R2(3.1415);
    float mouth = sdCutSphere(mouth_p + vec3(-3.0,-0.2,0), 0.9, 0.0) - 0.12;
    
    // tounge 
    vec3 tounge_p = p;
    tounge_p.xz *= R2(1.0);
    tounge_p.y += sin(tounge_p.z * 2.0 + 0.5) * 0.5 + 0.5;
    
    vec3 toungeA = vec3(0,-0.5,0);
    vec3 toungeB = vec3(2,-1,3);
    float tounge = sdCapsule(tounge_p + vec3(0.3,0,0.5), toungeA, toungeB, 0.4,0.3);
    
    // teeth
    vec3 teeth_p = p;
    teeth_p.yz *= R2(3.1416);
    float teeth_1 = sdEllipsoid(teeth_p + vec3(-2.6,-0.0,0.6), vec3(0.3,0.5,0.15));
    float teeth_2 = sdEllipsoid(teeth_p + vec3(-2.6,-0.0,0.2), vec3(0.3,0.4,0.15));
    float teeth_3 = sdEllipsoid(teeth_p + vec3(-2.6,-0.0,-0.2), vec3(0.3,0.4,0.15));
    float teeth_4 = sdEllipsoid(teeth_p + vec3(-2.6,-0.0,-0.6), vec3(0.3,0.5,0.15));
   
    // hands 
    vec3 hands_p1 = p;
    vec3 handSize = vec3(0.4,0.4,0.7);

    float handL = sdEllipsoid(hands_p1 + vec3(-1.5,0,3), handSize);
    float handR = sdEllipsoid(hands_p1 + vec3(-1.5,0,-3), handSize);

    // min dist 
    float minDist = smin(smin(handL, max(-mouth, d1), 0.2), handR, 0.2);
                  
    float sdfId = 1.0;

    if(eyeLeft < minDist)  { minDist = eyeLeft; sdfId = 1.2; }
    if(eyeRight < minDist) { minDist = eyeRight; sdfId = 1.2; }
    if(eyeLidL < minDist)  { minDist = eyeLidL; sdfId = 2.0; }
    if(eyeLidR < minDist)  { minDist = eyeLidR; sdfId = 2.0; }
    if(teeth_1 < minDist)  { minDist = teeth_1; sdfId = 2.4; }
    if(teeth_2 < minDist)  { minDist = teeth_2; sdfId = 2.4; }
    if(teeth_3 < minDist)  { minDist = teeth_3; sdfId = 2.4; }
    if(teeth_4 < minDist)  { minDist = teeth_4; sdfId = 2.4; }
    //if(eyeLidL2 < minDist) { minDist = eyeLidL2; sdfId = 3.2; }
    //if(eyeLidR2 < minDist) { minDist = eyeLidR2; sdfId = 3.4; }
    if(tounge < minDist)   { minDist = tounge; sdfId = 3.6; }

    return vec2(minDist, sdfId);
}

vec2 map(vec3 p)
{
    vec2 d1 = sdfGhost(p);
    return d1;
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
    
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p);
        
        vec3 L = normalize(vec3(2,3,2));
        float diff = clamp(dot(L, norm),0.0,1.0);
        vec3 halfV = normalize(reflect(-L, norm));
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 16.0);
        
        vec3 lightCol = vec3(1.0);
        //vec3 bgCol = vec3(0.780,0.416,0.000);
        vec3 bgCol = vec3(0.9) * 1.;
        
        vec3 diffC = diff * lightCol * 0.5;
        vec3 specC = spec * lightCol * 0.4;
       
        vec3 finalLight = 0.6 + diffC + specC; 
        
        if(dt.y >  3.5){
            bgCol = vec3(0.5, 0,0.1) * 1.0;
        } else if(dt.y >  3.0){
            bgCol = vec3(0.9) * 1.0;
        } else if(dt.y >  2.0){
            bgCol = vec3(0.5) * 1.0;
        } else if(dt.y >  1.5){
            bgCol = vec3(0.04) * 1.0;
        } else if(dt.y >  1.1) {
            bgCol = vec3(0.5,0,0.7) * 1.0;
        } else {
            bgCol = vec3(0.9) * 1.0;
        }
        
        col = bgCol * finalLight;
       
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
    float T = iTime * 1.0;
    
    vec3 ta = vec3(0.0, 0.0, 0.0); 
    vec3 ro = ta + vec3(6.0*cos(0.5 * T), 0, 6.0*sin(0.5 * T)); 
    mat3 ca = setCamera(ro, ta, 0.0);
    
    
    vec3 tot = vec3(0.0);
    
    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I + off) - iResolution.xy) / iResolution.y;
        uv *= 2.0;
        vec3 rd = ca * normalize(vec3(uv, 2.0));
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
