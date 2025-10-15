uniform vec3 iResolution;
uniform float iTime; 
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃 KuKo Day 171  🎃               
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define S(a,b,c) smoothstep(a,b,c)
#define STEM 5.0
#define AA 2

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

vec2 combineMin(vec2 a, vec2 b)
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

vec2 SDFPumpkin(vec3 pos, float extraId)
{  
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
        
        // HANDS 
        vec3 hands_p1 = pos + vec3(-0.45,0.1,0.4);
        vec3 hands_p2 = pos + vec3(0.45,0.1,0.4);
        hands_p1.xz *= R2(-0.0);
        hands_p2.xz *= R2(0.0);
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
        
        vec2 res = vec2(pumpkin, pumpkinID + extraId); 
		res = combineMin(res, vec2(stem, stemID + extraId));
        return res;
    }
}

// double helix by fabrice
// https://www.shadertoy.com/view/XddBD8
vec2 map(vec3 p)
{
    vec3 oneUv = p;
    oneUv.z -= 1.5;
    oneUv.xz *= R2(iTime);
    oneUv.x -= 0.7;
    oneUv.y += sin(oneUv.z * 0.5 + iTime * 6.0 ) * 0.2;
    //oneUv.xz *= R2(-1.5);
    oneUv.xz *= R2(1.7);
    
    vec3 pumpkTwo = p;
    pumpkTwo.z -= 1.5;
    pumpkTwo.xz *= R2(iTime);
    pumpkTwo.x += 0.7;
    pumpkTwo.y += sin(oneUv.z * 0.5 + iTime * 6.0 + 1.0) * 0.2;
    pumpkTwo.xz *= R2(-1.7);
    
    vec2 d1 = SDFPumpkin(pumpkTwo, 0.0);  
    vec2 d2 = SDFPumpkin(oneUv, 2.0);  
    vec2 finalSdf = combineMin(d1, d2);
    return finalSdf;
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
        if(abs(d.x) < 0.001 || dt > 20.0) break;
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
    
    vec2 dt = rayMarch(ro, rd);
    
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
        vec3 fresnelC = vec3(10.0, 1.7, 0.4) * pow(fr, 6.0) * 10.25;
        
        if(dt.y > 1.0){
            
            col = diffC + specC + fresnelC;
            col += refCol * ((diff * diff * 1.625 + 0.75)) * 0.6;

            col += rim * 0.1 * vec3(.3, 1.6, 0.8);
            
        } else {
            
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
