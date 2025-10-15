uniform vec3 iResolution;
uniform float iTime; 

/*
    ████████████████████████████████████████████████████████████████
    
    ▓              🌟  KuKo Day 116  🌟  
    
    ✨ Anti-Aliasing + Glow Shader by Fabrice ✨
    Modified to use Capsule geometry
    
    An impressive shader demonstrating advanced AA and glow techniques.
    
    Original: https://www.shadertoy.com/view/tlSfzV
    
    Notes:
    - Extended and expanded from the original "golfed" version for clarity
    - Converted from sphere to capsule using SDF raymarching
    - Implements smooth anti-aliasing for crisp edges
    - Features beautiful glow/bloom effects
    - Code has been un-minified to improve readability and learning
    
    This shader serves as an excellent reference for:
    • Understanding AA implementation in fragment shaders
    • Learning glow/bloom post-processing techniques
    • Studying SDF raymarching techniques
    • Optimized graphics programming patterns
    
    ████████████████████████████████████████████████████████████████
*/

#define T iTime

float sdfCapsule(vec3 p, float id)
{
    vec2 cell = vec2(2);
    //p.xz = mod(p.xz + 0.0, cell) - 0.5*cell;
    vec3 wp = p;
    wp.x += sin(p.y * 1. - T * 4.) * 0.9;
    
    float s = mix(0.2, 2.5, id);
    
    vec3 a = vec3(0.0, -6.0, 0.0);
    vec3 b = vec3(0.0, 6.0, 0.0);
    vec3 pa = wp - a, ab = b - a;
    
    float h = clamp(dot(pa, ab) / dot(ab, ab), 0.0, 1.0);
    
    return length(pa - ab * h) - 3.1;
}

vec3 calculateNormal(vec3 p) {
    const float eps = 0.001;
    return normalize(vec3(
        sdfCapsule(p + vec3(eps, 0, 0), 0.5) - sdfCapsule(p - vec3(eps, 0, 0), 0.5),
        sdfCapsule(p + vec3(0, eps, 0), 0.5) - sdfCapsule(p - vec3(0, eps, 0), 0.5),
        sdfCapsule(p + vec3(0, 0, eps), 0.5) - sdfCapsule(p - vec3(0, 0, eps), 0.5)
    ));
}

float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    const int maxSteps = 64;
    const float minDist = 0.001;
    const float maxDist = 100.0;
    
    for (int i = 0; i < maxSteps; i++) {
        vec3 p = ro + t * rd;
        float d = sdfCapsule(p, 0.5);
        
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

void mainImage(out vec4 O, vec2 I) {
    // Screen resolution and normalized coordinates
    vec2 R = iResolution.xy;
    vec2 normalizedCoords = (2.0 * I - R) / R.y;
    
    // Ray setup
    vec3 rd = normalize(vec3(normalizedCoords, -1.0));
    vec3 ro = vec3(0.0, 0.0, 15.0);
    
    // Lighting
    vec3 ld = normalize(vec3(2.0, 3.0, 2.0));
    
    // Background gradient (cyan to dark blue, top to bottom)
    float bgGrad = sqrt(I.y / R.y);
    vec4 bgColor = mix(vec4(0.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.1, 1.0), bgGrad);
    O = bgColor;
    
    // Raymarch to find intersection
    float t = raymarch(ro, rd);
    
    if (t > 0.0) {
        // Ray hits capsule - calculate intersection
        vec3 hitPoint = ro + t * rd;
        vec3 surfaceNormal = calculateNormal(hitPoint);
        
        // Lighting calculations
        float diffuseAmount = max(0.0, dot(surfaceNormal, ld));
        float facingAmount = max(0.0, dot(surfaceNormal, -rd));
        
        // Capsule color (red with ambient and diffuse lighting)
        vec4 capsuleColor = vec4(1.0, 0.0, 0.0, 0.0) * (0.02 + diffuseAmount);
        
        // Silhouette effect
        float silhouetteMask = pow(1.0 - facingAmount, 10.0);
        
        if (normalizedCoords.x > 0.0) {
            // Right side: white silhouette effect
            O = capsuleColor + silhouetteMask;
        } else {
            // Left side: antialiased silhouette blend
            O = mix(capsuleColor, O, silhouetteMask);
        }
        
    } else {
        // Ray misses capsule - calculate glow effect
        // Sample distance field along the ray to find closest approach
        float minDist = 1000.0;
        vec3 closestPoint;
        
        // Sample along the ray to find minimum distance
        for (float rayT = 0.0; rayT < 50.0; rayT += 0.5) {
            vec3 samplePoint = ro + rayT * rd;
            float dist = sdfCapsule(samplePoint, 0.5);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = samplePoint;
            }
        }
        
        float distToShapeEdge = minDist;
        
        if (normalizedCoords.y < 0.0) {
            // Bottom half: show glow around capsule
            vec4 glowColor;
            
            if (normalizedCoords.x > 0.0) {
                // Right bottom: inner silhouette-like glow
                glowColor = vec4(pow(max(0.0, 1.0 - distToShapeEdge * 0.5), 10.0));
            } else {
                // Left bottom: inverse distance glow
                glowColor = vec4(1.0 / (distToShapeEdge * distToShapeEdge + 1.0));
            }
            O += glowColor;
        }
    }
    
    // Convert to sRGB color space
    O = pow(O, vec4(1.0 / 2.2));
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
