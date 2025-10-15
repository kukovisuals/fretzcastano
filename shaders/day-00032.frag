uniform vec3 iResolution;
uniform float iTime; 

vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
                          dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}


float voronoi(vec2 uv) {
    vec2 cell = floor(uv);
    vec2 pos = fract(uv);
    float minDist = 1.0;
    
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = random2(cell + neighbor) + 
                         0.5*sin(iTime * random2(cell + neighbor));
            float dist = distance(pos, point + neighbor);
            minDist = min(minDist, dist);
        }
    }
    
    return pow(minDist,0.2);
}


float voronoiVaryingSize(vec2 uv) {
    vec2 cell = floor(uv);
    vec2 pos = fract(uv);
    
    float minDist = 1.0;
    
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = random2(cell + neighbor);
            point = 0.5 + 0.5*sin(iTime * 0.3 + 6.2831*point);
            
            // Random cell size factor
            float sizeFactor = 0.5 + random2(cell + neighbor).x;
            
            // Apply size factor to distance calculation
            float dist = length(pos - (point + neighbor)) * sizeFactor;
            minDist = min(minDist, dist);
        }
    }
    
    return minDist;
}

vec3 colorVoronoiCellID(vec2 uv) {
    vec2 cell = floor(uv);
    vec2 pos = fract(uv);
    
    float minDist = 1.0;
    float cellID = 0.0;
    
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = random2(cell + neighbor);
            float dist = length(pos - (point + neighbor));
            if(dist < minDist) {
                minDist = dist;
                cellID = dot(cell + neighbor, vec2(1.0, 73.0));
            }
        }
    }
    
    // Edge detection
    float edge = 1.0 - smoothstep(0.0, 0.05, minDist);
    
    // Cell coloring based on ID
    vec3 cellColor = 0.5 + 0.5*cos(cellID*0.1 + vec3(0.0, 0.5, 1.0));
    
    // Membrane color (dark blue/purple)
    vec3 membraneColor = vec3(0.1, 0.0, 0.2);
    
    return mix(cellColor, membraneColor, edge);
}


vec3 colorBacteria(vec2 uv) {
    float v = voronoiVaryingSize(uv * 1.0);
    
    // Create gradient for bacteria appearance
    float inner = smoothstep(0.0, 0.2, v);
    float outer = smoothstep(0.2, 0.5, v);
    
    // Bacteria colors
    vec3 nucleusColor = vec3(0.9, 0.3, 0.2); // Red nucleus
    vec3 cytoplasmColor = vec3(0.9, 0.7, 0.3); // Yellow-orange cytoplasm
    vec3 membraneColor = vec3(0.1, 0.0, 0.1); // Dark purple membrane
    
    // Mix colors based on distance
    vec3 col = mix(nucleusColor, cytoplasmColor, inner);
    col = mix(col, membraneColor, outer);
    
    return col;
}


// Modified voronoi to return both distance and cell ID
vec2 voronoiWithID(vec2 uv) {
    vec2 cell = floor(uv);
    vec2 pos = fract(uv);
    
    float minDist = 1.0;
    vec2 minCell = cell;
    
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = random2(cell + neighbor);
            point = 0.5 + 0.5*sin(iTime + 6.2831*point);
            
            float dist = distance(pos, point + neighbor);
            if(dist < minDist) {
                minDist = dist;
                minCell = cell + neighbor;
            }
        }
    }
    
    return vec2(pow(minDist,0.5), dot(minCell, vec2(1.0, 73.0)));
}


vec3 colorAlgae(vec2 uv) {
    vec2 voro = voronoiWithID(uv * 4.0);
    float dist = voro.x;
    float cellID = voro.y;
    
    // Edge detection
    float edge = 1.0 - smoothstep(0.0, 0.03, dist);
    
    // Varying greens for algae
    float hue = 0.3 + 0.1 * sin(cellID * 0.2); // Green hues
    float sat = 0.6 + 0.3 * sin(cellID * 0.5); // Medium-high saturation
    float val = 0.7 + 0.2 * cos(cellID * 0.3); // Varying brightness
    
    // Convert HSV to RGB (simplified)
    vec3 rgb = clamp(abs(mod(hue*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    vec3 cellColor = rgb * sat * val;
    
    // Dark green membrane
    vec3 membraneColor = vec3(0.0, 0.2, 0.0);
    
    return mix(cellColor, membraneColor, edge);
}

vec3 colorCellLayers(vec2 uv) {
    float v = voronoiVaryingSize(uv * 3.0);
    
    // Create multiple cell layers
    float layer1 = smoothstep(0.0, 0.1, v);
    float layer2 = smoothstep(0.1, 0.3, v);
    float layer3 = smoothstep(0.3, 0.4, v);
    float membrane = smoothstep(0.4, 0.5, v);
    
    // Cell structure colors
    vec3 nucleusColor = vec3(0.6, 0.1, 0.1); // Red nucleus
    vec3 innerColor = vec3(0.8, 0.4, 0.2); // Orange inner layer
    vec3 outerColor = vec3(0.9, 0.7, 0.5); // Light orange-yellow outer layer
    vec3 membraneColor = vec3(0.1, 0.1, 0.1); // Dark membrane
    
    // Mix all layers
    vec3 col = nucleusColor;
    col = mix(col, innerColor, layer1);
    col = mix(col, outerColor, layer2);
    col = mix(col, membraneColor, layer3);
    col = mix(col, vec3(0.0), membrane);
    
    return col;
}

vec3 colorPulsingCells(vec2 uv, float time) {
    vec2 voro = voronoiWithID(uv * 3.0);
    float dist = voro.x;
    float cellID = voro.y;
    
    // Edge detection
    float edge = 1.0 - smoothstep(1.0, 0.3, dist);
    
    // Pulsing effect
    float pulse = 0.5 + 0.5 * sin(time + cellID * 0.4);
    
    // Cell interior gradient
    float gradient = smoothstep(0.4, 0.4, dist);
    
    // Colors based on pulse state
    vec3 activeColor = vec3(0.9, 0.2, 0.3); // Bright red when active
    vec3 restingColor = vec3(0.3, 0.0, 0.1); // Dark red when resting
    vec3 membraneColor = vec3(0.1, 0.0, 0.0); // Dark membrane
    
    // Mix colors based on pulse and gradient
    vec3 cellColor = mix(activeColor, restingColor, 1.0 - pulse);
    cellColor = mix(cellColor, restingColor, gradient);
    
    return mix(cellColor, membraneColor, edge);
}


vec3 colorTissue(vec2 uv) {
    // Two Voronoi layers at different scales
    float v1 = voronoiVaryingSize(uv * 2.0);
    float v2 = voronoiVaryingSize(uv * 8.0);
    
    // Blend layers
    float blended = mix(v1, v2 * 0.5, 0.3);
    
    // Tissue-like coloring
    float inner = smoothstep(0.0, 0.15, blended);
    float mid = smoothstep(0.15, 0.3, blended);
    float outer = smoothstep(0.3, 0.45, blended);
    
    // Tissue colors
    vec3 innerColor = vec3(0.7, 0.3, 0.3); // Pinkish center
    vec3 midColor = vec3(0.8, 0.5, 0.5); // Lighter pink mid
    vec3 outerColor = vec3(0.9, 0.7, 0.7); // Very light pink outer
    vec3 membraneColor = vec3(0.6, 0.2, 0.2); // Darker red membrane
    
    // Mix colors based on layers
    vec3 col = innerColor;
    col = mix(col, midColor, inner);
    col = mix(col, outerColor, mid);
    col = mix(col, membraneColor, outer);
    
    return col;
}

vec3 colorMicroscopeStain(vec2 uv) {
    vec2 voro = voronoiWithID(uv * 3.0);
    float dist = voro.x;
    float cellID = voro.y;
    
    // Edge detection
    float edge = 1.0 - smoothstep(0.0, 0.03, dist);
    
    // Cell gradient
    float gradient = smoothstep(0.0, 0.3, dist);
    
    // Base stain color (purple-blue like crystal violet)
    vec3 stainColor = vec3(0.4, 0.0, 0.6);
    
    // Vary stain intensity by cell
    float stainIntensity = 0.5 + 0.5 * sin(cellID * 0.5);
    vec3 cellColor = stainColor * stainIntensity;
    
    // Lighter center
    vec3 centerColor = mix(cellColor, vec3(0.8, 0.7, 0.9), 0.6);
    
    // Dark cell borders
    vec3 borderColor = vec3(0.2, 0.0, 0.3);
    
    // Mix colors
    vec3 col = mix(centerColor, cellColor, gradient);
    col = mix(col, borderColor, edge);
    
    return col;
}

vec3 colorFluorescent(vec2 uv) {
    vec2 voro = voronoiWithID(uv * 3.0);
    float dist = voro.x;
    float cellID = voro.y;
    
    // Create "tagged" cells - only some cells show fluorescence
    bool isFluorescent = fract(cellID * 0.1234) > 0.6;
    
    // Edge detection
    float edge = 1.0 - smoothstep(1.0, 0.6, dist);
    
    // Cell gradient
    float gradient = pow(smoothstep(0.0, 0.5, dist), 0.1);
    
    // Fluorescent colors
    vec3 fluorescentColor = vec3(0.2, 1.0, 0.3); // Bright green fluorescence
    vec3 nonFluorescentColor = vec3(0.1, 0.1, 0.2); // Dark blue non-fluorescent
    vec3 membraneColor = vec3(0.05, 0.05, 0.1); // Very dark membrane
    
    // Choose cell color based on tag
    vec3 cellColor = isFluorescent ? fluorescentColor : nonFluorescentColor;
    
    // Add glow to fluorescent cells
    float glow = isFluorescent ? (1.0 - gradient) * 0.5 : 0.0;
    cellColor += vec3(glow * fluorescentColor);
    
    // Mix with membrane
    vec3 col = mix(cellColor, membraneColor, edge);
    
    return col;
}


vec3 colorDualStain(vec2 uv) {
    vec2 voro = voronoiWithID(uv * 3.0);
    float dist = voro.x;
    float cellID = voro.y;
    
    // Two stain types
    bool isStainA = fract(cellID * 0.0173) > 0.5;
    
    // Edge detection
    float edge = 1.0 - smoothstep(1.0, 0.03, dist);
    
    // Nucleus region
    float nucleus = 1.0 - smoothstep(0.0, 0.315, dist);
    
    // Cell body region
    float cellBody = smoothstep(0.415, 0.01, dist);
    
    // Stain colors
    vec3 stainA_nucleus = vec3(0.7, 0.0, 0.0); // Red nucleus stain
    vec3 stainA_cytoplasm = vec3(0.9, 0.6, 0.6); // Light red cytoplasm
    
    vec3 stainB_nucleus = vec3(0.0, 0.0, 0.7); // Blue nucleus stain
    vec3 stainB_cytoplasm = vec3(0.6, 0.6, 0.9); // Light blue cytoplasm
    
    vec3 membraneColor = vec3(0.1); // Dark membrane
    
    // Choose stain set
    vec3 nucleusColor = isStainA ? stainA_nucleus : stainB_nucleus;
    vec3 cytoplasmColor = isStainA ? stainA_cytoplasm : stainB_cytoplasm;
    
    // Mix colors for complete cell
    vec3 cellColor = mix(nucleusColor, cytoplasmColor, 1.0 - nucleus);
    cellColor = mix(cellColor, membraneColor, cellBody);
    cellColor = mix(cellColor, membraneColor, edge);
    
    return cellColor;
}

vec3 colorCellViability(vec2 uv, float time) {
    vec2 voro = voronoiWithID(uv * 3.0);
    float dist = voro.x;
    float cellID = voro.y;
    
    // Cell viability status (alive or dead)
    // Cells gradually "die" over time
    float lifeThreshold = 0.5 + 0.3 * sin(time * 0.1); // Changes over time
    bool isAlive = fract(cellID * 0.0357) > lifeThreshold;
    
    // Edge detection
    float edge = 1.0 - smoothstep(0.9, 0.603, dist);
    
    // Cell interior gradient
    float gradient = smoothstep(0.0, 0.9, dist);
    
    // Colors for cell states
    vec3 aliveNucleus = vec3(0.1, 0.5, 0.1); // Green nucleus for live cells
    vec3 aliveCytoplasm = vec3(0.5, 0.8, 0.5); // Light green cytoplasm
    
    vec3 deadNucleus = vec3(0.5, 0.1, 0.1); // Red nucleus for dead cells
    vec3 deadCytoplasm = vec3(0.7, 0.5, 0.5); // Pinkish dead cytoplasm
    
    vec3 membraneColor = vec3(0.1); // Dark membrane
    
    // Choose color set based on viability
    vec3 nucleusColor = isAlive ? aliveNucleus : deadNucleus;
    vec3 cytoplasmColor = isAlive ? aliveCytoplasm : deadCytoplasm;
    
    // Mix colors
    vec3 cellColor = mix(nucleusColor, cytoplasmColor, gradient);
    cellColor = mix(cellColor, membraneColor, edge);
    
    return cellColor;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalize and center coordinates
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv * 2.0 - 1.0; // Map to -1 to 1 range
    uv.x *= iResolution.x/iResolution.y; // Aspect ratio correction
    

   
    vec3 col = colorBacteria(uv * 2.0);
    fragColor = vec4(col, 1.0);


}




void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
