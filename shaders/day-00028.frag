uniform vec3 iResolution;
uniform float iTime; 

#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718
#define H(n) fract(1e4 * sin(n.x + n.y / 0.7 + vec2(1, 12.34)))

float Hash(vec2 p) 
{
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

vec2 hash2(vec2 p)
{
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float fbm11(vec2 p) 
{
    float f = 0.0;
    float weight = 0.5;
    float scale = 1.0;
    
    for (int i = 0; i < 4; i++) 
    {
        f += weight * (0.5 + 0.5 * sin(p.x * scale) * sin(p.y * scale));
        weight *= 0.5;
        scale *= 2.0;
    }
    
    return f;
}

float ellipseDistance(vec2 p, vec2 center, vec2 ab, float angle) 
{
    p = p - center;

    float c = cos(angle);
    float s = sin(angle);

    p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
    p = p / ab;
    
    float r = length(p);
    return (r - 0.5) * min(ab.x, ab.y);
}

bool insideEllipse(vec2 p, vec2 center, vec2 ab, float angle) 
{
    p = p - center;
    
    float c = cos(angle);
    float s = sin(angle);

    p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
    p = p / ab;
    
    return length(p) < 0.5;
}

struct VoronoiResult 
{
    vec3 dists;
    vec2 cellCenter;
    vec2 toCenter;
    vec2 cellId;
};

struct Ellipse 
{
    vec2 center;
    vec2 axes;
    float angle;
    float distFromPoint;
    bool isInside;
};

VoronoiResult voronoiExtended(vec2 p, float dt) 
{
    vec2 cellId, diff;
    float d;
    VoronoiResult result;
    result.dists = vec3(1.9);
    result.cellCenter = vec2(0.0);
    result.toCenter = vec2(0.0);
    result.cellId = vec2(0.0);
    
    for (int k = 0; k < 9; ++k) 
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 cellCenter = H(cellId) + cellId;//+ 0.1 * sin(dt + 6.28 * H(cellId));
        diff = H(cellId) + cellId - p;
        
        d = dot(diff, diff);
        if (d < result.dists.x) 
        {
            result.dists.z = result.dists.y;
            result.dists.y = result.dists.x;
            result.dists.x = d;
            result.cellCenter = cellCenter;
            result.toCenter = diff;
            result.cellId = cellId;
        } else if (d < result.dists.y) 
        {
            result.dists.z = result.dists.y;
            result.dists.y = d;
        } else if (d < result.dists.z) 
        {
            result.dists.z = d;
        }
    }
    return result;
}

Ellipse findNearestEllipseInVoronoiCell(vec2 uv, VoronoiResult voro, float dt) 
{
    Ellipse nearest;
    nearest.distFromPoint = 1000.0;
    nearest.isInside = false;
    
    float cellRadius = sqrt(voro.dists.y);
    vec2 localUV = uv - voro.cellCenter + voro.toCenter;
    
    int numEllipses = 2 + int(15.0 * Hash(voro.cellId));
    numEllipses = int(min(numEllipses, 15)); 
    
    for (int i = 0; i < 15; i++) 
    {
        if (i >= numEllipses) break;
        
        vec2 seedOffset = 0.09 * vec2(i);
        vec2 h = hash2(voro.cellId + seedOffset);
        
        vec2 ellipseOffset = (h - 0.5) * cellRadius * 0.0;
        vec2 ellipseCenter = voro.cellCenter + ellipseOffset;
        
        float sizeScale = 0.7 + 0.143 * hash2(voro.cellId + vec2(i, 0)).x;
        float aspect = 0.50 + 0.15 * hash2(voro.cellId + vec2(0, i)).y;
        vec2 ab = cellRadius * sizeScale * vec2(1.7, aspect);

        float angle = TWO_PI * hash2(voro.cellId + vec2(i)).y + dt * 0.2;

        float dist = ellipseDistance(uv, ellipseCenter, ab, angle);
        if (dist < nearest.distFromPoint) 
        {
            nearest.distFromPoint = dist;
            nearest.center = ellipseCenter;
            nearest.axes = ab;
            nearest.angle = angle;
            nearest.isInside = insideEllipse(uv, ellipseCenter, ab, angle);
        }
    }
    return nearest;
}

vec3 crystalColors(float dotSize, float noisyDist, vec2 normalizedPos, vec2 hashInput)
{
    float innerDot = smoothstep(dotSize, dotSize * 0.1, noisyDist);
    float outerGlow = smoothstep(dotSize * 2.0, dotSize * 0.5, noisyDist);
    
    // Amethyst color palette based on hex codes
    vec3 amethyst1 = vec3(0.349, 0.192, 0.325);  // #593153
    vec3 amethyst2 = vec3(0.545, 0.318, 0.549);  // #8B518C
    vec3 amethyst3 = vec3(0.733, 0.690, 0.776);  // #BBB0C6
    vec3 amethyst4 = vec3(0.522, 0.325, 0.651);  // #8553A6
    vec3 amethyst5 = vec3(0.733, 0.635, 0.749);  // #BBA2BF

    float centerBoost = smoothstep(0.3, 0.0, length(normalizedPos));
    float edgeGlow = smoothstep(0.4, 0.3, length(normalizedPos));

    // Instead of HSV, use direct color mixing for more accurate amethyst colors
    float colorSeed = Hash(hashInput + vec2(27.1, 33.7));
    float brightnessSeed = Hash(hashInput + vec2(77.7, 33.2));

    // Mix between deeper and lighter amethyst colors
    vec3 baseColor;
    if (colorSeed < 0.2) {
        baseColor = amethyst1; // Deep purple
    } else if (colorSeed < 0.5) {
        baseColor = amethyst2; // Medium purple
    } else if (colorSeed < 0.7) {
        baseColor = amethyst4; // Vibrant purple
    } else {
        // Mix between the lighter colors for highlights
        baseColor = mix(amethyst3, amethyst5, brightnessSeed);
    }

    // Add brightness variation
    float brightness = 0.8 + 0.5 * brightnessSeed * innerDot;
    brightness += 0.4 * centerBoost; // Brighter in center

    // Add white highlight for sparkle effect
    float sparkle = pow(innerDot, 10.0) * (0.6 + 0.4 * brightnessSeed);
    vec3 sparkleColor = vec3(1.0, 0.95, 1.0); // Slightly purple-tinted white

    // The final color combines base amethyst color with brightness and sparkle
    vec3 thisColor = mix(baseColor * brightness, sparkleColor, sparkle);

    // Add a subtle outer glow in a complementary color
    vec3 glowColor = mix(amethyst4, amethyst3, 0.5);
    thisColor = mix(glowColor * 0.6, thisColor, smoothstep(0.0, 0.8, innerDot + outerGlow * 0.3));

    vec3 coloredDot = thisColor * (innerDot + outerGlow * 0.3);
    return coloredDot;
}

vec3 generateDots(vec2 uv, vec2 ellipseCenter, vec2 ellipseAxes, float ellipseAngle, float dt) 
{   
    vec3 dotColor = vec3(0.0);
    vec2 localPos = uv - ellipseCenter;
    
    float c = cos(-ellipseAngle) * .5;
    float s = sin(-ellipseAngle) * .5;
    localPos = vec2(c * localPos.x + s * localPos.y, -s * localPos.x + c * localPos.y);
    vec2 normalizedPos = localPos / ellipseAxes;
    
    if (length(normalizedPos) >= 1.5) {
        return vec3(0.0); // Outside the ellipse
    }
    
    vec2 cellId = floor(ellipseCenter * 15.0);

    int NUM_DOTS = int(25.0 * (ellipseAxes.x + ellipseAxes.y));
    NUM_DOTS = int(max(NUM_DOTS, 25)); 
    NUM_DOTS = int(min(NUM_DOTS, 50)); 
    
    for (int i = 0; i < 50; i++) 
    {
        if (i >= NUM_DOTS) break;
        
        vec2 hashInput = vec2(float(i) * 0.1) + cellId + vec2(13.5, 7.2);
        
        vec2 dotPos = vec2(
            Hash(hashInput) * 2.0 - 1.0,
            Hash(hashInput + vec2(42.1, 11.3)) * 2.0 - 1.0
        );
        
        dotPos *= 0.585;
        
        float distFromEdge = 0.5 - length(normalizedPos);
        vec2 animOffset = 0.91 * distFromEdge * vec2(
            sin(dt * 0.5 + 6.28 * Hash(hashInput)),
            cos(dt * 0.5 + 6.28 * Hash(hashInput + vec2(33.3, 27.8)))
        );
        dotPos += animOffset;
        
        // Instead of random angle, align with ellipse orientation
        // Use ellipse angle + a small random variation
        float stretchAngle = ellipseAngle + PI/2.0 + (Hash(hashInput + vec2(50.1, 23.7)) * 0.4 - 0.2);
        
        // Mix of fixed and random stretch amount
        float stretchAmount = 2.5 + 2.0 * Hash(hashInput + vec2(77.3, 11.2));
        
        // Create a transform matrix for stretched dots
        float cs = cos(stretchAngle);
        float sn = sin(stretchAngle);
        mat2 stretchRotate = mat2(cs, sn, -sn, cs);
        
        // Make y-stretch more extreme to follow ellipse shape
        vec2 stretchScale = vec2(stretchAmount, 2.0);
        
        // Transform the position difference through our stretch matrix
        vec2 stretchedDiff = stretchRotate * ((normalizedPos - dotPos) * stretchScale);
        float stretchedDist = length(stretchedDiff);
        
        float edgeFactor = smoothstep(0.0, 0.2, 1.0 - length(dotPos));
        float dotSize = (0.5 + 0.017 * Hash(hashInput + vec2(100.0, 200.0))) * edgeFactor;
        
        // Use the stretched distance for dot rendering
        float textureSeed = Hash(hashInput + vec2(33.7, 71.9)) * 100.0;
        float noiseValue = fbm11((normalizedPos - dotPos) * 1.6 + textureSeed + dt * 0.1);
        float noisyDist = stretchedDist * (0.7 + 0.5 * noiseValue);
        
        vec3 coloredDot = crystalColors(dotSize, noisyDist, normalizedPos, hashInput);

        dotColor = max(dotColor, coloredDot);
    }
    
    float edgeFade = smoothstep(2.9, 0.8, length(normalizedPos));
    return dotColor * edgeFade;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) 
{
    float dt = iTime;
    vec2 uv = 2.5 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv.y += dt * 0.2;

    VoronoiResult voro = voronoiExtended(uv, dt);
    Ellipse ellipse = findNearestEllipseInVoronoiCell(uv, voro, dt);
    
    float voronoiEdgeDistance = voro.dists.y - voro.dists.x;
    float normalizedEdge = voronoiEdgeDistance / (voro.dists.x + 0.0001);
    float voronoiEdge = 1.0 - smoothstep(0.01, 0.9, normalizedEdge);
    
    float ellipseEdge = exp(-30.0 * abs(ellipse.distFromPoint));
    
    vec3 dots = vec3(0.0);
    if (ellipse.isInside) {
        dots = generateDots(uv, ellipse.center, ellipse.axes, ellipse.angle, dt);
    }
    
    vec3 voronoiGlowColor = vec3(0.0);
    
    vec3 ellipseGlowColor = mix(
        vec3(0.522,0.325,0.651),  // Lighter blue
        vec3(0.733,0.69,0.776),  // White-blue
        smoothstep(-0.1, 0.1, cos(uv.x * 0.3) * cos(uv.y * 0.2))
    );
    
    vec3 bgColor = vec3(0.0, 0.0, 0.1);
    vec3 finalColor = bgColor;

    finalColor += dots;
    finalColor = mix(finalColor, ellipseGlowColor, ellipseEdge * 0.7);
    finalColor = mix(finalColor, voronoiGlowColor, voronoiEdge);
    
    fragColor = vec4(finalColor, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
