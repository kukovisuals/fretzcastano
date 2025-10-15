uniform vec3 iResolution;
uniform float iTime;

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}

float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
}

float powSine(float time, float power, float frequency, float phase) {
    return pow(sin(phase + frequency * time), power);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.y * 2.0 - 0.0;
    float dt = iTime;
    vec3 color = vec3(0.0);

    vec2 gridId = vec2(0.0);
    vec2 cellUv = vec2(0.0);
    float gridSize = 20.0;

    // float rowHeight = 1.0/gridSize; // If you're using a 3×3 grid
    // First find which row we're in
    float rowIndex = floor(uv.y * gridSize);
    if (mod(rowIndex, 2.0) == 0.0) { 
        float newRandom = random(vec2(rowIndex, 0.0)); // Use rowIndex as seed
        float speedMultiplier = 0.3 + (newRandom * 1.2);
        vec2 offsetUv = vec2(uv.x - dt * speedMultiplier, uv.y);
        
        gridId = floor(offsetUv * gridSize);
        cellUv = fract(offsetUv * gridSize);
    } else if (mod(rowIndex, 1.0) == 0.0) { 
        float newRandom = random(vec2(rowIndex, 0.0)); // Use rowIndex as seed
        float speedMultiplier = 0.4 + (newRandom * 0.7);
        vec2 offsetUv = vec2(uv.x - dt * speedMultiplier, uv.y);
        
        gridId = floor(offsetUv * gridSize);
        cellUv = fract(offsetUv * gridSize);
    } else {
        gridId = floor(uv * gridSize);
        cellUv = fract(uv * gridSize);
    }

    cellUv -= 0.5;
    cellUv = rotate2d(radians(0.0)) * cellUv;
    cellUv += 0.5;

    float newRandom = random(vec2(gridId)); // Use rowIndex as seed
    float mappedRandom = 0.3 + (newRandom * 0.5); 
    float mappedRandom2 = 0.5 + (newRandom * 0.2); 
    float mappedRandom3 = 0.7 + (newRandom * 0.2); 
    float mappedRandom4 = 0.76 + (newRandom * 0.2); 
    float mappedRandom5 = 0.4 + (newRandom * 0.2); 

    float rectL = smoothstep(mappedRandom5, mappedRandom, cellUv.x);
    float rectB = smoothstep(mappedRandom2, mappedRandom, cellUv.y);
    float rectR = smoothstep(mappedRandom3, mappedRandom2, cellUv.x);
    float rectT = smoothstep(mappedRandom4, mappedRandom2, cellUv.y);
    float pct = rectL * rectB * rectR * (rectT);

    color = vec3(pct);
    fragColor = vec4(color, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
