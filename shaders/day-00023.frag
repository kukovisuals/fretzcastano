uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
// Identify the primary Voronoi cell centers and edges (already done)
// Create a local coordinate system within each primary cell
// Generate a secondary Voronoi pattern using these local coordinates
// Combine the primary and secondary patterns
// Refine the appearance (thickness, contrast, etc.)

// Steps to Add Height, Normals, and Lighting:
// Create a height field based on the Voronoi distances
// Calculate normals from the height field
// Implement basic lighting using the normals
// Refine material properties and lighting parameters
// Add additional effects (specular, ambient occlusion, etc.)

// Steps to Animate the Voronoi Pattern with Correct Normals and Lighting:
// Modify the voronoiDistSq function to include animation
// Update the getClosestCellInfo function to use the same animation parameters
// Ensure the normal calculation uses animated values consistently
// Adjust animation parameters for the inner Voronoi pattern
// Fine-tune the animation speed and amplitude


// Here are the steps to add texture mapping:
// Calculate texture coordinates based on our Voronoi pattern
// Sample the texture using these coordinates
// Blend the texture with our existing lighting calculation
// Adjust blend parameters to control the texture's influence

#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )

vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 animationOffset = 0.15 * vec2(
            cos(dt + 6.28 * H(cellId).x),
            sin(dt + 6.28 * H(cellId).y)
        );
        
        diff = H(cellId) + cellId + animationOffset - p;

        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

vec2 getLocalCoordinates(vec2 p, vec2 cellCenter, vec2 cellId) {
    vec2 localP = p - cellCenter;
    
    // Generate a random scale based on cell ID
    float randomValue = H(cellId).x; // Get a random value between 0-1
    
    // Map random value to a scale range
    float minScale = 1.0;
    float maxScale = 5.0;
    float scale = minScale + randomValue * (maxScale - minScale);
    
    localP *= scale;
    
    return localP;
}

vec4 getClosestCellInfo(vec2 p, float dt) {
    vec2 bestCellId = vec2(0.0);
    vec2 bestCellPoint = vec2(0.0);
    float minDist = 100.0;
    
    for (int k = 0; k < 9; ++k) {
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        
        vec2 cellPoint = H(cellId) + cellId; // + animationOffset;
        
        float dist = length(cellPoint - p);
        
        if (dist < minDist) {
            minDist = dist;
            bestCellId = cellId;
            bestCellPoint = cellPoint;
        }
    }
    
    return vec4(bestCellId, bestCellPoint);
}

float createHeightField(float primaryEdgeDist, float secondaryEdgeDist, float primaryDist) {

    float primaryEdgeHeight = 1.9;  
    float secondaryEdgeHeight = 0.5;  
    float baseHeight = 0.1;  
    float primaryEdgeWidth = 0.2;  
    float secondaryEdgeWidth = 0.1;  
    
    float primaryEdgeInfluence = 1.0 - smoothstep(0.0, primaryEdgeWidth, primaryEdgeDist);
    float primaryHeight = mix(baseHeight, primaryEdgeHeight, primaryEdgeInfluence);
    
    float secondaryEdgeInfluence = 1.0 - smoothstep(0.04, secondaryEdgeWidth, secondaryEdgeDist);
    float secondaryHeight = mix(baseHeight, secondaryEdgeHeight, secondaryEdgeInfluence);
    float combinedHeight = max(primaryHeight, secondaryHeight);
    
    float centerBump = 0.21 * (1.2 - smoothstep(1.0, 0.8, primaryDist));
    
    return combinedHeight + centerBump;
}

vec3 calculateNormals(vec2 uv, float scale, float dt) {
    float eps = 0.03;
    vec2 e = vec2(eps, 0.01);
    
    float heightCenter = createHeightField(
        sqrt(voronoiDistSq(uv * scale, dt).y) - sqrt(voronoiDistSq(uv * scale, dt).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv, getClosestCellInfo(uv * scale, dt).zw / scale, 
             getClosestCellInfo(uv * scale, dt).xy) + 
             vec2(getClosestCellInfo(uv * scale, dt).xy * 0.1), dt * 0.5).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv, getClosestCellInfo(uv * scale, dt).zw / scale, 
             getClosestCellInfo(uv * scale, dt).xy) + 
             vec2(getClosestCellInfo(uv * scale, dt).xy * 0.1), dt * 0.5).x),
        sqrt(voronoiDistSq(uv * scale, dt).x)
    );
    
    float heightX = createHeightField(
        sqrt(voronoiDistSq((uv + e.xy) * scale, dt).y) - sqrt(voronoiDistSq((uv + e.xy) * scale, dt).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.xy, 
             getClosestCellInfo((uv + e.xy) * scale, dt).zw / scale,
             getClosestCellInfo((uv + e.xy) * scale, dt).xy) + 
             vec2(getClosestCellInfo((uv + e.xy) * scale, dt).xy * 0.1), dt * 0.5).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.xy, 
             getClosestCellInfo((uv + e.xy) * scale, dt).zw / scale,
             getClosestCellInfo((uv + e.xy) * scale, dt).xy) + 
             vec2(getClosestCellInfo((uv + e.xy) * scale, dt).xy * 0.1), dt * 0.5).x),
        sqrt(voronoiDistSq((uv + e.xy) * scale, dt).x)
    );

    float heightY = createHeightField(
        sqrt(voronoiDistSq((uv + e.yx) * scale, dt).y) - sqrt(voronoiDistSq((uv + e.yx) * scale, dt).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.yx, 
             getClosestCellInfo((uv + e.yx) * scale, dt).zw / scale,
             getClosestCellInfo((uv + e.yx) * scale, dt).xy) + 
             vec2(getClosestCellInfo((uv + e.yx) * scale, dt).xy * 0.1), dt * 0.5).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.yx, 
             getClosestCellInfo((uv + e.yx) * scale, dt).zw / scale,
             getClosestCellInfo((uv + e.yx) * scale, dt).xy) + 
             vec2(getClosestCellInfo((uv + e.yx) * scale, dt).xy * 0.1), dt * 0.5).x),
        sqrt(voronoiDistSq((uv + e.yx) * scale, dt).x)
    );
    
    vec3 normal;
    normal.x = (heightX - heightCenter) / eps;
    normal.y = (heightY - heightCenter) / eps;
    normal.z = 1.0;
    
    return normalize(normal);
}



vec3 calculateLighting(vec3 normal, float height, vec2 edgeTexUV, vec2 centerTexUV, float secondaryEdgeInfluence) {
    vec3 lightDir1 = normalize(vec3(0.4, 0.86, 0.58));
    vec3 lightDir2 = normalize(vec3(-0.3, -0.2, 0.13));

    // Sample both textures
    vec3 edgeTexCol = texture(iChannel0, edgeTexUV).rgb;
    vec3 centerTexCol = texture(iChannel1, centerTexUV).rgb;
    
    vec3 baseColor = vec3(0.506,0.514,0.651); //vec3(0.208,0.106,0.349);
    vec3 edgeColor = vec3(0.122,0.098,0.149);
    vec3 highlightColor = vec3(0.9, 0.9, 0.9);
    
    float diffuse1 = max(0.1, dot(normal, lightDir1));
    float diffuse2 = max(0.5, dot(normal, lightDir2)) * 0.5;
    
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    vec3 halfVector1 = normalize(lightDir1 + viewDir);
    float specular1 = pow(max(0.0, dot(normal, halfVector1)), 32.0) * 0.7;
    
    float ao = mix(0.5, 1.0, smoothstep(0.1, 0.6, height));
    
    float primaryEdgeFactor = smoothstep(0.5, 1.0, height);
    float secondaryEdgeFactor = secondaryEdgeInfluence * (1.0 - primaryEdgeFactor);
    
    vec3 texturedPrimaryEdge = mix(edgeColor, edgeTexCol, 0.17 * primaryEdgeFactor);
    vec3 texturedCellInterior = mix(baseColor, centerTexCol, 0.17 * secondaryEdgeFactor);
    
    // Combine both textured areas
    vec3 surfaceColor = mix(texturedCellInterior, texturedPrimaryEdge, primaryEdgeFactor);
    
    float ambient = 0.025;
    vec3 finalColor = surfaceColor * (ambient * ao + diffuse1 + diffuse2);
    
    finalColor += highlightColor * specular1 * primaryEdgeFactor;
    
    return finalColor;
}



vec2 calculateEdgeTextureCoords(vec2 uv, vec2 cellCenter, float scale, float dt) {
    vec2 texUV = uv * 1.0;
    float distortionFactor = 0.1;
    
    vec3 voro = voronoiDistSq(uv * scale, dt);
    float distToBoundary = sqrt(voro.y) - sqrt(voro.x);
    
    float edgeProximity = 1.0 - smoothstep(0.0, 0.3, distToBoundary);
    texUV += distortionFactor * vec2(
        sin(dt * 0.05 + texUV.y * 5.0), 
        cos(dt * 0.05 + texUV.x * 7.0)
    ) * edgeProximity;
    
    texUV += 0.05 * H(getClosestCellInfo(uv * scale, dt).xy);
    
    return fract(texUV);
}

// Calculate texture coordinates for the secondary (inner) Voronoi pattern
vec2 calculateCenterTextureCoords(vec2 uv, vec2 cellCenter, vec2 localCoords, float dt) {

    vec2 texUV = localCoords * 0.4; 
    
    vec2 cellId = getClosestCellInfo(uv * 0.5, dt).xy;
    texUV += 0.2 * H(cellId);
    
    texUV += 0.1 * vec2(
        sin(dt * 0.2 + cellId.x * 3.14),
        cos(dt * 0.3 + cellId.y * 3.14)
    );
    
    return fract(texUV);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float dt = iTime;
    vec2 uv = 2.5 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv.x += dt * 0.5;
    
    float scale = 0.5;
    vec3 d1 = voronoiDistSq(uv * scale, dt);
    
    vec4 cellInfo = getClosestCellInfo(uv * scale, dt);
    vec2 cellId = cellInfo.xy;
    vec2 cellCenter = cellInfo.zw / scale;
    
    vec2 localCoords = getLocalCoordinates(uv, cellCenter, cellId);
    vec3 d2 = voronoiDistSq(localCoords + vec2(cellId.x * 0.1, cellId.y * 0.1), dt);
    
    float primaryDist = sqrt(d1.x);
    float primaryEdgeDist = sqrt(d1.y) - sqrt(d1.x);
    float secondaryDist = sqrt(d2.x);
    float secondaryEdgeDist = sqrt(d2.y) - sqrt(d2.x);
    float primaryCellInfluence = smoothstep(0.0, 1.0, primaryEdgeDist);
    
    float secondaryEdgeInfluence = 1.0 - smoothstep(0.0, 1.0, secondaryEdgeDist);
    
    float height = createHeightField(primaryEdgeDist, secondaryEdgeDist * primaryCellInfluence, primaryDist);
    vec3 normal = calculateNormals(uv, scale, dt);
    
    vec2 edgeTexUV = calculateEdgeTextureCoords(uv, cellCenter, scale, dt);
    vec2 centerTexUV = calculateCenterTextureCoords(uv, cellCenter, localCoords, dt);
    
    vec3 finalColor = calculateLighting(normal, height, edgeTexUV, centerTexUV, secondaryEdgeInfluence);
    
    fragColor = vec4(finalColor, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
