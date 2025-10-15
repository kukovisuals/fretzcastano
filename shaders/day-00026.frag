uniform vec3 iResolution;
uniform float iTime; 

#define H(n) fract(1e4 * sin(n.x + n.y/.7 + vec2(1, 12.34)))

vec3 voronoiDistSq(vec2 p, float dt, vec3 voroDist)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = voroDist;       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 animationOffset = 0.05 * vec2(
            cos(dt + 6.28 * H(cellId).x),
            sin(dt + 6.28 * H(cellId).y)
        );
        
        diff = H(cellId) + cellId + animationOffset - p;
        d = dot(diff, diff);      

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
    return dists;
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

vec4 getClosestCellInfo(vec2 p, float dt) 
{
    vec2 bestCellId = vec2(0.0);
    vec2 bestCellPoint = vec2(0.0);
    float minDist = 100.0;
    
    for (int k = 0; k < 9; ++k) {
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 animationOffset = 0.15 * vec2(
            cos(dt + 6.28 * H(cellId).x),
            sin(dt + 6.28 * H(cellId).y)
        );
        
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
// Get closest secondary cell info
vec4 getNearTwoCell(vec2 p, float dt) 
{
    vec2 bestCellId = vec2(0.0);
    vec2 bestCellPoint = vec2(0.0);
    float minDist = 100.0;
    
    for (int k = 0; k < 9; ++k) {
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 animationOffset = 0.15 * vec2(
            cos(dt + 6.28 * H(cellId).x),
            sin(dt + 6.28 * H(cellId).y)
        );
        
        vec2 cellPoint = H(cellId) + cellId + animationOffset;
        float dist = length(cellPoint - p);
        
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
    
    float randAngle = 6.28 * H(cellId).x;
    float randScaleX = 2.0 + 1.0 * H(cellId).y;
    float randScaleY = 2.0 + 2.0 * H(cellId + vec2(40.0, 13.0)).x;
    
    mat2 transform = mat2(
        randScaleX * cos(randAngle), randScaleX * sin(randAngle),
        -randScaleY * sin(randAngle), randScaleY * cos(randAngle)
    );
    
    return transform * localP;
}

// Triangle wave (0 to 1 to 0)
float triangleWave(float x) {
    return abs(2.0 * fract(x * 1.5) - 1.0);
}

vec3 initNoiseDots(vec2 uv, vec2 cellId, vec2 localCoor, float oneEdgeDist, float twoEdgeDist, float dt) 
{   
    float dotPattern = 0.0;
    vec3 dotColor = vec3(0.0);
    
    const int NUM_DOTS = 50;
    
    vec2 twoCoords = localCoor + vec2(cellId.x * 0.1, cellId.y * 0.1);
    vec4 twoCellInfo = getNearTwoCell(twoCoords, dt * 0.5);
    
    vec2 twoCellCenter = twoCellInfo.zw;
    vec2 normalTwoPos = (twoCoords - twoCellCenter) / 1.0;
    
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

        float dotSize = 0.01 + 0.05 * H(hashInput + vec2(100.0, 200.0)).x;
        float dist = length(normalTwoPos - scaledDotPos);
        
        float textureSeed = H(hashInput + vec2(33.7, 71.9)).x * 100.0;
        
        float noiseValue = fbm11((normalTwoPos - scaledDotPos) * 4.0 + textureSeed + dt * 0.1);
        float noisyDist = dist * (1.0 + 0.3 * noiseValue);
        
        float innerDot = smoothstep(dotSize, dotSize * 0.3, noisyDist);
        float outerGlow = smoothstep(dotSize * 3.0, dotSize * 0.5, noisyDist);
        
        float hue = 0.6 + 0.1 * H(hashInput + vec2(27.1, 33.7)).x; 
        float sat = 0.2 + 0.3 * H(hashInput + vec2(77.7, 33.2)).x; 
        float val = 0.8 + 0.2 * innerDot; 
        
        vec3 dotHSV = vec3(hue, sat, val);
        vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
        vec3 p = abs(fract(dotHSV.xxx + k.xyz) * 6.0 - 3.0);
        vec3 thisColor = dotHSV.z * mix(vec3(1.0), clamp(p - vec3(1.0), 0.0, 1.0), dotHSV.y);
        
        vec3 coloredDot = thisColor * (innerDot + outerGlow * 0.4);
        
        dotColor = max(dotColor, coloredDot);
        dotPattern = max(dotPattern, innerDot);
    }
    
    float edgeAvoidance = smoothstep(0.0, 0.1, oneEdgeDist) * smoothstep(0.0, 0.05, twoEdgeDist);
    
    return dotColor * edgeAvoidance;
}



void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float dt = iTime;
    vec2 uv = 1.3 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv.y += dt * 0.1;
    float scale = 1.0;
    
    vec3 d1 = voronoiDistSq(uv * scale, dt, vec3(0.5) );
    float primaryDist = sqrt(d1.x);
    float oneEdgeDist = sqrt(d1.y) - sqrt(d1.x);
    
    vec4 cellInfo = getClosestCellInfo(uv * scale, dt);
    vec2 cellId = cellInfo.xy;
    vec2 cellCenter = cellInfo.zw / scale;
    
    vec2 localCoor = getLCoords(uv, cellCenter, cellId);
    
    vec3 d2 = voronoiDistSq(localCoor + vec2(cellId.x * 0.1, cellId.y * 0.1), dt * 0.5, vec3(0.35));
    float secondaryDist = sqrt(d2.x);
    float twoEdgeDist = sqrt(d2.y) - sqrt(d2.x);
    
    float firstCellInf = smoothstep(0.1, 0.2, oneEdgeDist);
    
    float oneEdge = smoothstep(0.06, 0.02, oneEdgeDist);
    
    float twoEdge = smoothstep(0.03, 0.0, twoEdgeDist) * firstCellInf;
    
    vec3 coloredDots = initNoiseDots(uv, cellId, localCoor, oneEdgeDist, twoEdgeDist, dt);
    
    vec3 edgeColor = vec3(0.000,0.000,0.000);
    vec3 twoEdgeColor = vec3(0.000,0.000,0.000);
    
    vec3 edgesResult = oneEdge * edgeColor * 0.0 + twoEdge * twoEdgeColor;
    vec3 result = max(edgesResult, coloredDots);
    
    vec3 backgroundColor = vec3(0.0, 0.05, 0.1);
    result = result + backgroundColor * (1.0 - max(oneEdge, max(twoEdge, length(coloredDots))));
    
    fragColor = vec4(result, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
