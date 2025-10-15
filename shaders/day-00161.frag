uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  Day 161  🎃               
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define S(a,b,c) smoothstep(a,b,c)
#define STEM 5.0

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

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

vec2 combineMin(vec2 a, vec2 b)
{
    return (a.x < b.x)? a : b;
}

vec2 SDFPumpkin(vec3 pos)
{  
    pos.yz *= R2(-1.5);
    float proxy = length(pos - vec3(0.0, 0.1, 0.0));  // Y center: 0.2 → 0.1
    
    if (proxy > 1.0)  // Proxy radius: 2.0 → 1.0
    {
    	return vec2(proxy - 0.75, 0.0);  // Proxy fallback: 1.5 → 0.75
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
        
        face = min(face, nose);
        face = min(face, eyes);

        face = max(face, pos.z);

        pumpkin = smax(pumpkin, -face, 0.0075);  // 0.015→0.0075
        
        vec2 res = vec2(pumpkin, pumpkinID); 
		res = combineMin(res, vec2(stem, stemID));
        return res;
    }
}

// double helix by fabrice
// https://www.shadertoy.com/view/XddBD8
float map(vec3 p)
{
    p.xy *= R2(iTime * 0.3);
    p.z += iTime;
    
    float len   = length(p.xy);
    float angle = atan(p.y, p.x);  
    float dist  = angle - p.z;
    
    float A = 2.38;
    float v = abs( mod(dist  ,6.28) -3.14);
    dist = min(v, abs( mod(dist -A,6.28) -3.14));
    
    float n = 3.82;            // spheres per rotation
    float helixRadius = 4.0;  // radius of helix

    float pumpkinIndex = floor(n * angle / 6.28);
    
    float randRotX = hash(vec2(pumpkinIndex, 0.0)) * 6.28;
    float randRotY = hash(vec2(pumpkinIndex, 1.0)) * 6.28;
    float randRotZ = hash(vec2(pumpkinIndex, 2.0)) * 6.28;
    
    vec3 spherePos = vec3(
        len - helixRadius,             // radial offset to helix
        dist,                          // perpendicular to helix path
        fract(n * angle) - 0.5         // periodic spacing along helix
    );
    
    //spherePos.yz *= R2(randRotX);
    spherePos.xz *= R2(randRotY + iTime);
    //spherePos.xy *= R2(randRotZ);
    
    vec2 d1 = SDFPumpkin(spherePos);  
    return d1.x;
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    
    for(int i=0; i<100; i++)
    {
        float d = map(ro + rd * dt);
        dt += d;
        if(abs(d) < 0.001 || dt > 20.0) break;
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
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0);
    float T = iTime;
    
    vec3 ta = vec3(0);
    vec3 ro = ta + vec3(10.0*cos(0.1*T), 0.0, 10.0*sin(0.1*T)); 
    //vec3 ro = ta + vec3(1.0*cos(1.5), 2.0, 7.0*sin(1.5)); 
    //vec3 ro = ta + vec3(0.2, 0, 3); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 rd = ca * normalize(vec3(uv, 1.5));
    
    float dt = rayMarch(ro, rd);
    
    if(dt < 20.0)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        
        vec3 L = normalize(vec3(0,0,1));
        float diff = clamp(dot(L, norm),0.0,1.0);
        //float shadow = softShadow(p + norm * 0.01, L, 0.1, 10.0, 8.0);
        vec3 tangent = normalize(cross(norm, vec3(0,1,0)));
        vec3 halfV = normalize(reflect(-L, norm));
        float rim = 1.2 - pow(dot(norm, -rd), 2.0) * 1.3;
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 16.0);
        
        vec3 lightCol = vec3(1.0);
        vec3 bgCol = vec3(0.9) * 1.;
        vec3 diffC = lightCol;
        
        // body little ghost
        float gPos = SDFPumpkin(p).x;
        float caustic = sin(gPos * 1.0 + T * 2.5);
        caustic *= sin(dot(norm, -rd) * 5.0 + T);
        vec3 ris  = refract(norm, tangent, 1.0) ;
        float rl = cos(dot(vec3(caustic), vec3(0,1,0)) * 1. + 0.8) * 1.5 + 0.5;

        vec3 albedo = palette(abs(caustic), vec3(0.7), vec3(0.8), vec3(0.30), vec3(.05, 0.15, 0.21));
        bgCol = albedo; 
        diffC = rim * 3.1 * diff  * 0.4 * lightCol * 0.9;
    
        vec3 specC = spec * lightCol * 0.4;
       
        vec3 finalLight = 0.6 + diffC + specC;
        
        col = bgCol * finalLight;
        //if(false)
        //col = 0.5 + 0.5*norm.yxz;
        
        col = mix( col, vec3(0.0), 1.0-exp( -0.001*dt*dt*dt) );
    }
    
    O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
