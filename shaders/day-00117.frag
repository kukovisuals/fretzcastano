uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ████████████████████████████████████████████████████████████████
    
    ▓              🌟  KuKo Day 117  🌟  
    
    ▓   AA practice with glow 
    
    ████████████████████████████████████████████████████████████████
*/

#define T iTime

// Fast noise using texture lookup
float noise3D(vec3 p) {
    // Sample multiple octaves from texture for 3D-like noise
    float n = 0.0;
    n += texture(iChannel0, p.xy * 00.91 + T * 0.4).r * 0.15;
    n += texture(iChannel0, p.yz * 0.052 + 0.3).r * 1.25;
    n += texture(iChannel0, p.xz * 0.054 + 0.7).r * 1.94125;
    return n;
}

float sdfCapsule(vec3 p, float id)
{
    vec2 cell = vec2(2);
    //p.xz = mod(p.xz + 0.0, cell) - 0.5*cell;
    vec3 wp = p;
    wp.y += sin(p.x * 0.3 - T * 1.5) * 1.5;
    
    float s = mix(0.2, 2.5, id);
    
    vec3 a = vec3(-12,0, 0);
    vec3 b = vec3(20,0, 0);
    float ra = 4.94;
    float rb = 1.1;
    vec3 pa = wp - a, ab = b - a;
    
    float h = clamp(dot(pa, ab) / dot(ab, ab), 0.0, 1.0);
    float r = mix(ra, rb, h);
    
    float baseCapsule =  length(pa - ab * h) - r;
    
    // Add coral-like surface noise using texture
    float surfaceNoise = noise3D(wp) * 0.225;
    
    // Create coral polyp bumps using texture
    vec2 bumpUV = wp.xz * 0.21 + wp.x * 0.15;
    float coralBumps = texture(iChannel0, bumpUV + T * 0.142).r * 0.1615;
    coralBumps *= texture(iChannel0, bumpUV * 1.3 + 0.2).r; // modulate
    
    return baseCapsule - surfaceNoise - coralBumps;
}

float map(vec3 p)
{
    float d1 = sdfCapsule(p, 0.5);
    float d2 = sdfCapsule(p + vec3(5.0, 0.0,5.0), 0.5);
    float d3 = sdfCapsule(p + vec3(-5.0, 0.0,5.0), 0.5);
    
    return d1;
    //return opU(opU(d1, d2), d3);
}

/*
    ████████████████████████████████████████████████████████████████
    
    ▓              Nomals, raymarch
    
    ████████████████████████████████████████████████████████████████
*/

vec3 calculateNormal(vec3 p) 
{
    const float eps = 0.001;
    return normalize(vec3(
        map(p + vec3(eps, 0, 0)) - map(p - vec3(eps, 0, 0)),
        map(p + vec3(0, eps, 0)) - map(p - vec3(0, eps, 0)),
        map(p + vec3(0, 0, eps)) - map(p - vec3(0, 0, eps))
    ));
}

float raymarch(vec3 ro, vec3 rd) 
{
    float t = 0.0;

    const float minDist = 0.001;
    const float maxDist = 100.0;
    
    for (int i = 0; i < 64; i++) {
        vec3 p = ro + t * rd;
        float d = map(p);
        
        if (d < minDist) {
            return t;
        }
        
        t += d;
        
        if (t > maxDist) {
            break;
        }
    }
    
    return -1.0; // No intersection
}

/*
    ████████████████████████████████████████████████████████████████
    
    ▓              Light, glow
    
    ████████████████████████████████████████████████████████████████
*/

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec4 capsuleLight(vec3 norm, vec3 ld, vec3 rd, vec3 p)
{
    // Lighting calculations
    float diffuse = max(0.0, dot(norm, ld));
    float facing = max(0.0, dot(norm, -rd));
    
    float t = -p.x * 0.004 + 0.6;//T * 1.05;
    vec3 albedo = palette(t, vec3(0.27), vec3(0.5), vec3(1.0), vec3(1.047,0.714,0.212));

    vec4 sdfColor = vec4(albedo, 1.0) * (0.9052 + diffuse); //vec4(0.475,0.255,0.949, 0.0) * (0.052 + diffuse);

    float silhouetteMask = pow(1.0 - facing, 5.0);
    return sdfColor + silhouetteMask;
}

float glowLight(vec3 ro, vec3 rd)
{
    // Ray misses capsule - calculate glow effect
    // Sample distance field along the ray to find closest approach
    float minDist = 1000.0;
    vec3 closestPoint;

    // Sample along the ray to find minimum distance
    for (float rayT = 0.0; rayT < 50.0; rayT += 0.5) 
    {
        vec3 samplePoint = ro + rayT * rd;
        float dist = map(samplePoint);
        if (dist < minDist) {
            minDist = dist;
            closestPoint = samplePoint;
        }
    }

    return minDist;
}


/*
    ██████████████████████████████████████████
    
    ▓              Main
    
    ██████████████████████████████████████████
*/


void mainImage(out vec4 O, vec2 I) 
{
    vec2 R = iResolution.xy;
    vec2 uv = (2.0 * I - R) / R.y;
    
    float twist = 2.5;                  // strength
    float a = twist * length(uv) ;
    mat2 RR = mat2(cos(a),-sin(a), sin(a),cos(a));
    
    //uv *= RR;
    vec3 rd = normalize(vec3(uv, -1.0));
    vec3 ro = vec3(0.0, 0.0, 15.0);
    
    // light direction
    vec3 ld = normalize(vec3(1.0, 2.0, 2.0));
    
    // Background gradient 
    float bgGrad = sqrt(I.y / R.y);
    vec4 bgColor = mix(vec4(0.13, 0.5, 1.0, 1.0), vec4(0.1, 0.0, 0.2, 1.0), bgGrad);//vec4(0.003); //mix(vec4(0.3, 0.5, 1.0, 1.0), vec4(0.2, 0.0, 0.2, 1.0), bgGrad);
    O = bgColor;
    
    // Raymarch to find intersection
    float t = raymarch(ro, rd);
    
    if (t > 0.0) 
    {
        // Ray hits capsule - calculate intersection
        vec3 hitPoint = ro + t * rd;
        vec3 norm = calculateNormal(hitPoint);
        
        O = capsuleLight(norm, ld, rd, hitPoint);
        //O = vec4(norm, 1.0);
    } else {
        
        float distToShapeEdge = glowLight(ro, rd);
        
        vec4 glowColor;
            
        glowColor = vec4(pow(max(0.0, 1.0 - distToShapeEdge * 0.6), 10.0));
        O += glowColor;
    }
    
    O = pow(O, vec4(1.0 / 2.2));
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
