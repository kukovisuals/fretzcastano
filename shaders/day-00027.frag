uniform vec3 iResolution;
uniform float iTime;

#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )
// ---------------------------------------------------------------------------
// Multiplicatively-weighted (rounded-edge) Voronoi distance field
// ---------------------------------------------------------------------------
// -  H(id)  : 2-D hash that returns a pseudo-random vec2 in [0,1]
// -  p      : query point in the plane
// -  dt     : time (for optional animation)
// -  voroD  : vec3 voronoi distance 
// Returns the three smallest *weighted* distances (F1 ≤ F2 ≤ F3)
// ---------------------------------------------------------------------------
vec3 voronoiDistSq(vec2 p, float dt, vec3 voroD, bool animar)
{
    vec3 dists = voroD;          

    for (int k = 0; k < 9; ++k)     
    {
        // --- node position -------------------------------------------------
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;

        // animated offset (optional)
        vec2 anim = 0.05 * vec2(
            cos(dt + 6.28318 * H(cellId).x),
            sin(dt + 6.28318 * H(cellId).y)
        );

        vec2 site = vec2(0.0);
        if(animar){
            site = H(cellId) + cellId + anim;
        } else {
            site = H(cellId) + cellId;
        }


        // --- multiplicative weight ----------------------------------------
        // choose any positive weight function; this one is in (0.4 … 1.0)
        float w = 0.4 + 0.6 * fract(sin(dot(cellId, vec2(127.1,311.7))) * 43758.5453);

        // --- weighted (Apollonius) distance --------------------------------
        float d = dot(p - site, p - site) / (w * w);   // ⟨x−c, x−c⟩ / w²

        // --- keep the three smallest distances ----------------------------
        if (d < dists.x) {
            dists.z = dists.y;
            dists.y = dists.x;
            dists.x = d;
        } else if (d < dists.y) {
            dists.z = dists.y;
            dists.y = d;
        } else if (d < dists.z) {
            dists.z = d;
        }
    }
    return dists;                    // F1, F2, F3  (all curved-edge now)
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm( in vec2 x, in float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    float t = 0.0;
    int numOctaves = 3;
    for( int i=0; i<numOctaves; i++ )
    {
        const mat2 m = mat2( 1.6, 1.2, -1.2, 1.6 );
        x = m * x;               
        t += a*noise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}

float fbm11(vec2 p)
{
    return fbm(p, 1.0) * 1.9 - 1.0;
}

// Triangle wave (0 to 1 to 0)
float triangleWave(float x) {
    return abs(2.0 * fract(x * 0.5) - 1.0);
}

vec4 getClosestCellInfo(vec2 p, float dt) 
{
    vec2 bestCellId = vec2(0.0);
    vec2 bestCellPoint = vec2(0.0);
    float minDist = 100.0;
    
    for (int k = 0; k < 9; ++k) {
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        
        vec2 cellPoint = H(cellId) + cellId;
        vec2 diff = cellPoint - p;
        float distSq = dot(diff, diff); 
        
        if (distSq < minDist) {
            minDist = distSq;
            bestCellId = cellId;
            bestCellPoint = cellPoint;
        }
    }
    
    return vec4(bestCellId, bestCellPoint);
}

// Get closest secondary cell info with circular/elliptical shape
vec4 getNearTwoCell(vec2 p, float dt) 
{
    vec2 bestCellId = vec2(0.0);
    vec2 bestCellPoint = vec2(0.0);
    float minDist = 10.0;
    
    for (int k = 0; k < 9; ++k) {
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        
        // Modified animation offset for more fluid movement
        vec2 animationOffset = .05 * vec2(
            cos(dt * 0.7 + 6.28 * H(cellId).x),
            sin(dt * 0.5 + 6.28 * H(cellId).y)
        );
        
        // Get base cell point
        vec2 cellPoint = H(cellId) + cellId + animationOffset;
        
        // Create elliptical distance field instead of standard Euclidean distance
        vec2 diff = p - cellPoint;
        
        // Generate random elliptical parameters for this cell
        float angle = 6.28 * H(cellId + vec2(33.7, 42.5)).x;
        float aspectRatio = 0.7 + 0.5 * H(cellId + vec2(11.3, 79.4)).y;
        
        // Rotate the difference vector to align with ellipse orientation
        float cs = cos(angle);
        float sn = sin(angle);
        vec2 rotatedDiff = vec2(
            cs * diff.x + sn * diff.y,
            -sn * diff.x + cs * diff.y
        );
        
        // Scale one axis to create elliptical distance field
        rotatedDiff.x *= aspectRatio;
        
        // Calculate smoothed distance with less sharp features
        float dist = length(rotatedDiff);
        
        // Apply noise to distance for organic shape
        float noiseScale = 0.3 + 0.3 * H(cellId + vec2(57.1, 63.9)).x;
        float organicNoise = noiseScale;
        
        // Mix noise with elliptical distance to create organic ellipses
        dist = mix(dist, dist * (1.0 + 0.2 * organicNoise), 0.4);
        
        if (dist < minDist) {
            minDist = dist;
            bestCellId = cellId;
            bestCellPoint = cellPoint;
        }
    }
    
    return vec4(bestCellId, bestCellPoint);
}

vec2 getLCoords(vec2 p, vec2 cellCenter, vec2 cellId) 
{
    vec2 localP = p - cellCenter;
    
    // More gentle transformation with bias toward circular/elliptical shapes
    float randAngle = 6.28 * H(cellId).x;
    float randScaleX = 2.0 + 1.0 * H(cellId).y;  // Made more balanced
    float randScaleY = 1.8 + 1.2 * H(cellId + vec2(40.0, 13.0)).x;  // Less extreme
    
    // More subtle animation for fluid motion
    float timeVar = iTime * 0.05;
    randAngle += 0.15 * sin(timeVar + cellId.x * 0.1);
    
    mat2 transform = mat2(
        randScaleX * cos(randAngle), randScaleX * sin(randAngle),
        -randScaleY * sin(randAngle), randScaleY * cos(randAngle)
    );
    
    return transform * localP;
}


vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    rgbColor = vec3(0.051,0.043,0.043);

        
    if(effectIndex == 0){
       bg = vec3(0.631,0.847,0.969);
       rgbColor = pal(uv.x,vec3(0.063,0.035,0.176),vec3(0.094,0.09,0.325),vec3(0.094,0.067,0.298),vec3(0.333,0.373,0.49) );
    } else {
       bg = vec3(0.922,0.275,0.188);
       rgbColor = pal(uv.x, vec3(0.275,0.173,0.208),vec3(0.13,0.033,0.003), vec3(0.384,0.212,0.188),vec3(0.31,0.173,0.184) );
    }
}


vec3 initNoiseDots(vec2 uv, vec2 cellId, vec2 localCoor, float oneEdgeDist, float twoEdgeDist, float dt) 
{   
    float dotPattern = 0.0;
    vec3 dotColor = vec3(0.0);
    
    const int NUM_DOTS = 25;
    
    vec2 twoCoords = localCoor + vec2(cellId.x * 0.1, cellId.y * 0.1);
    vec4 twoCellInfo = getNearTwoCell(twoCoords, dt * 0.5);
    
    vec2 twoCellCenter = twoCellInfo.zw;
    vec2 normalTwoPos = (twoCoords - twoCellCenter) / 0.7;
    
    for (int i = 0; i < NUM_DOTS; i++) 
    {   
        vec2 hashInput = vec2(float(i) * 0.1) + cellId * 10.0 + twoCellInfo.xy * 5.0 + vec2(13.5, 7.2);
        vec2 dotPos = vec2(
            H(hashInput).x,
            H(hashInput + vec2(42.1, 11.3)).y
        );
        
        vec2 scaledDotPos = dotPos * 1.5 - 1.0; 
        vec2 animOffset = 0.1 * vec2(
            sin(dt * 0.5 + 6.28 * H(twoCellInfo.xy + hashInput).x),
            cos(dt * 0.5 + 6.28 * H(twoCellInfo.xy + hashInput).y)
        );
        scaledDotPos += animOffset;

        float dotSize = 0.01 + 0.08 * H(hashInput + vec2(100.0, 200.0)).x;
        float dist = length(normalTwoPos - scaledDotPos);
        
        float textureSeed = H(hashInput + vec2(33.7, 71.9)).x * 100.0;
        
        float noiseValue = fbm11((normalTwoPos - scaledDotPos) * 5.0 + textureSeed + dt * 0.1);
        float noisyDist = dist * (0.7 + 0.5 * noiseValue);
        
        float innerDot = smoothstep(dotSize, dotSize * 0.3, noisyDist);
        float outerGlow = smoothstep(dotSize * 3.0, dotSize * 0.5, noisyDist);
        
        float hue = 0.6 + 0.1 * H(hashInput + vec2(27.1, 33.7)).x;  // Increased range from 0.1 to 0.2
        float sat = 0.3 + 0.5 * H(hashInput + vec2(77.7, 33.2)).x;  // Increased from 0.2-0.3 to 0.3-0.8
        float val = 0.8 + 0.2 * innerDot; 
        
        vec3 dotHSV = vec3(hue, sat, val);
        vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
        vec3 p = abs(fract(dotHSV.xxx + k.xyz) * 6.0 - 3.0);
        vec3 thisColor = dotHSV.z * mix(vec3(1.0), clamp(p - vec3(1.0), 0.0, 1.0), dotHSV.y);
        
        vec3 coloredDot = thisColor * (innerDot + outerGlow * 1.5);
        
        dotColor = max(dotColor, coloredDot);
        dotPattern = max(dotPattern, innerDot);
    }
    
    float edgeAvoidance = smoothstep(0.0, 0.15, oneEdgeDist) * smoothstep(0.0, 0.08, twoEdgeDist);
    
    return dotColor * edgeAvoidance;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    float dt = iTime;
    vec2 uv = 1.4 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv += dt * 0.02;
    
    float scale = 1.0;
    vec3 d1 = voronoiDistSq(uv * scale, dt, vec3(0.8), true );
    float primaryDist = sqrt(d1.x);
    float oneEdgeDist = sqrt(d1.y) - sqrt(d1.x);
    
    vec4 cellInfo = getClosestCellInfo(uv * scale, dt);
    vec2 cellId = cellInfo.xy;
    vec2 cellCenter = cellInfo.zw / scale;
    
    vec2 localCoor = getLCoords(uv * 1.5, cellCenter, cellId);
    
    vec3 d2 = voronoiDistSq(localCoor + vec2(cellId.x * 0.1, cellId.y * 0.1), dt * 1.5, vec3(9.0), false);
    float secondaryDist = sqrt(d2.x);
    float twoEdgeDist = sqrt(d2.y) - sqrt(d2.x);

    float edgeNoise = 0.3;
    float edgeNoise2 = 0.25;
    float edgeWidth = 0.135;
    float secondEdgeWidth = 0.057;
    
    float firstCellInf = smoothstep(0.08, 0.125, oneEdgeDist);  // Changed from 0.1, 0.2 to 0.08, 0.25
    float oneEdge = smoothstep(edgeWidth, 0.03, oneEdgeDist);
    float twoEdge = smoothstep(secondEdgeWidth, 0.0, twoEdgeDist) * firstCellInf;
    
    vec3 coloredDots = initNoiseDots(uv, cellId, localCoor, oneEdgeDist, twoEdgeDist, dt);
    
    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColor;
    int effectIndex = int(mod(dt / 10.0, 2.0));
    colorPalette(effectIndex, uv, bg, rgbColor);
    vec3 edgeColor = rgbColor;
    vec3 twoEdgeColor = bg;

    // Create softer edge blending for marbling effect with feathering
    vec3 edgesResult =  twoEdge * twoEdgeColor;
    
    vec3 result = max(edgesResult, coloredDots);
    
    vec3 backgroundColor = rgbColor;//vec3(0.0, 0.05, 0.1);

    float blendFactor = max(oneEdge, max(twoEdge, length(coloredDots)));
    blendFactor = mix(blendFactor, smoothstep(0.0, 1.0, blendFactor), 0.3);
    
    result = mix(backgroundColor, result, blendFactor);
    
    fragColor = vec4(result, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
