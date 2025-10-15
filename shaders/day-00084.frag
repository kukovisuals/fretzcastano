uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 84  🌟              
    ▓
    ▓  Trying to understand AA when using fract  
    ▓  

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime

const float SHAPE_SPEED = 0.4;
const float GRID_SIZE   = 4.0;
const float SDF_SPEED   = 0.3; 
const float RADIUS      = 0.3;
const float UV_SPEED    = 0.05;


// Color palette
const vec3 CYAN  = vec3(0.09,0.494,0.647);
const vec3 BLUE  = vec3(0.094,0.145,0.51);
const vec3 GREY  = vec3(0.753,0.792,0.851);
const vec3 DARK  = vec3(0.094, 0.212, 0.204);
const vec3 GREEN = vec3(0.02,0.651,0.357);

struct AnimationPattern {
    vec2 direction;
    vec3 color;
};

AnimationPattern getAnimationPattern(float id) 
{
    float idx = mod(id, 8.0);
    
    if (idx == 0.0) return AnimationPattern(vec2(0.0, SDF_SPEED), CYAN);
    if (idx == 1.0) return AnimationPattern(vec2(-SDF_SPEED, 0.0), DARK);
    if (idx == 2.0) return AnimationPattern(vec2(SDF_SPEED, 0.0), BLUE);
    if (idx == 3.0) return AnimationPattern(vec2(0.0, SDF_SPEED), DARK);
    if (idx == 4.0) return AnimationPattern(vec2(-SDF_SPEED, 0.0), GREEN);
    if (idx == 5.0) return AnimationPattern(vec2(SDF_SPEED, 0.0), DARK);
    if (idx == 6.0) return AnimationPattern(vec2(0.0, SDF_SPEED), GREEN);
    if (idx == 7.0) return AnimationPattern(vec2(-SDF_SPEED, 0.0), DARK);
    
    return AnimationPattern(vec2(0.0), BLUE);
}

mat2 rotate2D(float angle) { return mat2(cos(angle), -sin(angle),  sin(angle), cos(angle));}

float sdfCircle(vec2 cell, float radius) {
    
    float w = 1.0 / iResolution.y;
    float d1 = smoothstep(1.0, 0.7, cell.x) - 1.0 + smoothstep(0.0,0.3, cell.x);
    float d2 = abs(cell.x);
    return 0.326 / (d1 * d2 + 0.001);
}


void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy)/iResolution.y;
    
    uv = rotate2D(T * UV_SPEED) * uv;
    uv.y += T * 0.15;
    
    uv.y += sin(uv.x * 5.5 + T * SHAPE_SPEED * 0.8) * 0.2 
      + sin((uv.x + uv.x) * 5.0 - T * SHAPE_SPEED * 1.2) * 0.15 
      + cos(uv.x * 4.0 + T * SHAPE_SPEED) * 0.25 
      + 0.1;

    uv.x += sin(uv.x * 5.0 + T * SHAPE_SPEED) * 0.05 
      + cos(uv.y * 10.0 - T * SHAPE_SPEED) * 0.05 
      + sin((uv.x + uv.y) * 5.0) * 0.1;
    
    vec2 cell = fract(uv * GRID_SIZE);   
    
    float id = floor(uv.x * GRID_SIZE);
    AnimationPattern pattern = getAnimationPattern(id);
    vec2 animatedUV = uv + pattern.direction * T;
    
    float dist = sdfCircle(cell, RADIUS);
    vec3 shape = mix(vec3(0.0),pattern.color, dist);
    
    vec3 color = shape; //vec3(d1);
    O = vec4(color,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
