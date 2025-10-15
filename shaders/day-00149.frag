uniform vec3 iResolution;
uniform float iTime; 


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 148  🎃            
    
    ▓  Playing with the theme. It needs some bats or 
    ▓  something.
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/


#define S(a,b,c) smoothstep(a,b,c)
#define STEM			5.0
#define FAR 30.0

#define GHOST_BODY   1.0
#define GHOST_EYE    2.0
#define GHOST_PUPIL  3.0

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
float smax( float a, float b, float k )
{
    float h = max(k-abs(a-b),0.0);
    return max(a, b) + h*h*0.25/k;
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

vec2 SDFPumpkin(vec3 pos)
{  

    float proxy = length(pos - vec3(0.0, 0.2, 0.0));
    
    if (proxy > 4.0)
    {
    	return vec2(proxy - 3.0, 0.0);
    }
    else   
    {   
        float angle = atan(pos.x, pos.z);

        float section = smax(0.05, abs(sin(angle * 4.0)), 0.05) * 0.13;

        float longLen = length(pos.xz);

        float pinch = S(1.4, -0.2, longLen);

        float pumpkin = sdEllipsoid(pos, vec3(1.7, 1.5, 1.7)) + pinch * 0.6;
        
        float pumpkinDisplace =  ((sin(angle * 25.0) + sin(angle * 43.0)) * 0.0015 - section) * S(0.2, 1.3, longLen);

        pumpkin +=   pumpkinDisplace;

        float stem = longLen - 0.29 + S(1.1, 1.5, pos.y) * 0.15 + sin(angle * 4.0) * 0.01;
        
        float stemDisplace = sin(angle * 10.0);
        
        stem += stemDisplace * 0.005;

        stem -= (pos.y - 1.2) * 0.1;
        
        stem *= 0.8;
        
        float stemCut =  pos.y - 1.6 + pos.x * 0.3;

        stem = smax(stem, stemCut, 0.05);

        stem = max(stem, 1.0 - pos.y);


        float pumpkinID = clamp(pumpkinDisplace * 4.0 + 0.5, 0.0, 0.999);//, PUMPKIN_INSIDE, S(0.03, -0.05, pumpkin));
        
	    float stemID = STEM + (0.5 + stemDisplace * 0.2) * S(0.1, -0.6, stemCut);
        
        
        pumpkin = abs(pumpkin) - 0.05;

        float face = length(pos.xy - vec2(0.0, 0.3)) - 1.1;
        //float fx3 = sin(iTime * 5.0) * 0.2 + 0.7;
        face = max(face, -(length(pos.xy - vec2(0.0, 1.8)) - 2.0));
        
        float teeth = abs(pos.x - 0.4) - 0.16;
        teeth = smax(teeth, -0.45 - pos.y + pos.x * 0.1, 0.07);
        
        float teeth2 = abs(pos.x + 0.40) - 0.06;
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

        return res;
    }
}

float sdfBox(vec3 p, vec3 b, float r)
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

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


#define T iTime
#define FX sin(2.0 - T * 2.2) * 0.2 + 0.5

vec2 SDFGhost(vec3 pos)
{
    //pos *= 1.5;
    vec3 q = pos + vec3(0, sin(T * 1.0) * 0.5, 0.0);

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
    // pumpkin
    vec3 newp = p;
    newp.zx *= R2(2.9);
    vec2 d1 = SDFPumpkin(newp  - vec3(-1.53,-2.9 + FX ,3));
    
    float fd = abs(dot(p, vec3(0,4,0)));
    float fg = pow(fd, 1.0) * cos(length(p + vec3(0,0,5)) * 3.0 - T * 2.2)
             * sin(length(p.yxy + vec3(0,0,5)) * 2.0 - T * 0.3);
    
    // water thing
    float d2 = sdfBox(p + vec3(0,8,0), vec3(50,3.5,50), 0.4) - fg * 0.02;
    
    // ghost 
    vec3 ghostUv = p * 1.;
    ghostUv.xz *= R2(0.5);
    ghostUv.z -= T;
    vec2 ghostCellId = vec2(
        floor((ghostUv.x - 4.0) / 6.0),
        floor((ghostUv.z - 5.0) / 5.0)
    );
    
    // Add random height based on cell ID
    ghostUv.y += hash(ghostCellId) * 3.0;

    ghostUv = vec3(mod(ghostUv.x + 4.0, 6.0) - 3.1, ghostUv.y - 5.0, mod(ghostUv.z - 5.0,5.0) - 1.5);
    
    vec2 g = SDFGhost(ghostUv);
    
    float minDist = d1.x;
    float sdfId = d1.y;

    if(d2 < minDist){ minDist = d2; sdfId = 4.0; }
    if(g.x < minDist){ minDist = g.x; sdfId = g.y + 6.0; }
    
    return vec2(minDist, sdfId);
   // return min(d1.x, d2);
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

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 2.5;
    vec3 col = vec3(0);
    
    vec3 ta = vec3(-0, 0, 0);
    vec3 ro = ta + vec3(15.0*cos(1.), 4.0, 15.0*sin(1.)); 
    //vec3 ro = ta + vec3(4.0*cos(-1.5), 2.0, 7.0*sin(-1.3)); 
    //vec3 ro = ta + vec3(15.0*cos(0.1*T), 2.0, 15.0*sin(0.1*T)); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 rd = ca * normalize(vec3(uv, 3.0));
    
    vec2 dt = rayMarch(ro, rd);
    
    if(dt.y > -1.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p);
        
        vec3 L = normalize(vec3(2,3,2));
        float diff = clamp(dot(L, norm),0.0,1.0);
        vec3 halfV = normalize(reflect(-L, norm));
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 16.0);
        
        vec3 lightCol = vec3(5.0);
        //vec3 bgCol = vec3(0.780,0.416,0.000);
        vec3 bgCol = vec3(0.651,0.247,0.012) * 1.;
        
        vec3 diffC = diff * lightCol * 0.5;
        vec3 specC = spec * lightCol * 0.4;
       
        vec3 finalLight = 0.6 + diffC + specC; 
        
        col = bgCol * finalLight;
        if(dt.y > 8.5){
            bgCol = vec3(0.2) * 1.0;
            col = bgCol * finalLight;
        } else if(dt.y > 7.5){
            bgCol = vec3(0.0) * 1.0;
            col = bgCol * finalLight;
        } else if(dt.y > 5.5){
            bgCol = vec3(0.2) * 1.0;
            col = bgCol * finalLight;
        } else if(dt.y > 4.5){
            bgCol = vec3(0.1,0.5,0.1);
            col = bgCol * finalLight;
        } else if(dt.y > 0.5){
            bgCol = vec3(0.216,0.851,0.859);//vec3(0.0,0.7,0.05);
            col = bgCol * finalLight;
            //col *= 0.2 + 0.4 * texture(iChannel0, fract(2.5 * p.xy)).xyz;
        }
        
        // see normals
        //col = 0.2 + 0.6*norm.yxz;
       
        col = mix( col, vec3(0.0), 1.0-exp( -0.0005*dt.x*dt.x*dt.x) );
    }
    col = pow(col * 1.0, vec3(1.1 / 2.2));
    
    O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
