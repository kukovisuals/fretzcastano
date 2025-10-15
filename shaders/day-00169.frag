uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 169  🌟              
    ▓
    ▓  TBT. Last day of the work retreat X_X 

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
#define T iTime

// Constants
const float GRID_SIZE   = 5.0;
const float SHAPE_SPEED = 0.2;
const float SDF_SPEED   = 0.05;
const float DEL_SPEED   = 0.04;
const float RADIUS      = 0.2;

// Color palette
const vec3 BLUE   = vec3(0.1, 0.3, 0.5);
const vec3 GREY   = vec3(0.145, 0.141, 0.122);
const vec3 ORANGE = vec3(0.649, 0.431, 0.008);
const vec3 GREEN  = vec3(0.094, 0.212, 0.204);
const vec3 PINK   = vec3(0.69, 0.435, 0.459);

mat2 rotate2D(float angle) { return mat2(cos(angle), -sin(angle),  sin(angle), cos(angle));}

float sdfCircle(vec2 cell, float radius) {
    float d2 = abs(cell.x);
    //return 0.15 / (d2 + 0.001);
    //Alternative implementation (commented out)
    float d1 = length(cell) - radius;
    float w = 1.0 / iResolution.y;
    return 1.2992 / (smoothstep(w, w, d1) + 0.01);
}

struct AnimationPattern {
    vec2 direction;
    vec3 color;
};

AnimationPattern getAnimationPattern(float id) 
{
    float idx = mod(id, 8.0);
    
    if (idx == 0.0) return AnimationPattern(vec2(0.0, SDF_SPEED), BLUE);
    if (idx == 1.0) return AnimationPattern(vec2(-SDF_SPEED, 0.0), ORANGE);
    if (idx == 2.0) return AnimationPattern(vec2(SDF_SPEED, 0.0), GREY);
    if (idx == 3.0) return AnimationPattern(vec2(0.0, SDF_SPEED), BLUE);
    if (idx == 4.0) return AnimationPattern(vec2(-SDF_SPEED, 0.0), PINK);
    if (idx == 5.0) return AnimationPattern(vec2(SDF_SPEED, 0.0), GREEN);
    if (idx == 6.0) return AnimationPattern(vec2(0.0, SDF_SPEED), BLUE);
    if (idx == 7.0) return AnimationPattern(vec2(-SDF_SPEED, 0.0), PINK);
    
    return AnimationPattern(vec2(0.0), GREY);
}

void mainImage(out vec4 O, in vec2 I) 
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv = rotate2D(T * DEL_SPEED) * uv;
    
    uv.x += sin(uv.x * 2.7 + T * SHAPE_SPEED) * 0.3 
          + sin(uv.x * 8.1 - T * SHAPE_SPEED) * 0.1 
          + cos(uv.y * 5.3 + T * SHAPE_SPEED) * 0.25 
          + cos(uv.y * 3.2 - T * SHAPE_SPEED) * 0.2 
          + 0.15;
    
    uv.x += T * 0.1;
    
    float id = floor(uv.x * GRID_SIZE);
    AnimationPattern pattern = getAnimationPattern(id);
    vec2 animatedUV = uv + pattern.direction * T;
    
    vec2 cell = fract(animatedUV * GRID_SIZE) - 0.5;
    
    float dist = sdfCircle(cell, RADIUS);
    vec3 shape = mix(vec3(0.0),pattern.color, dist);
    
    O = vec4(shape, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
