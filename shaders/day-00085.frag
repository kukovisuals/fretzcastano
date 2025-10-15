uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓               🌟  KuKo — Day 85  🌟                ▓

    ▓   Want to understand this AA when using fract       ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

const float PI = 3.1415926;
#define T iTime

const float RADIUS = 0.45;
const float GRID   = 3.0;
const float GRID_T = 0.015;
const float UV_T   = 0.01;

const vec3 CYAN  = vec3(0.09,0.494,0.647);
const vec3 BLUE  = vec3(0.094,0.145,0.51);

mat2 rotate2D(float angle) { return mat2(cos(angle), -sin(angle),  sin(angle), cos(angle));}

float sdfCircle(vec2 p)
{
    float d = length(p) - RADIUS;
    float w = 1.0 / iResolution.y;
    return smoothstep(0.0,-fwidth(d), d);
}

vec2 animation(vec2 uv, float idx)
{
    vec2 cell = vec2(0.0);
    
    if(mod(idx, 2.0) == 0.0){
        uv.x += T * GRID_T;
        cell = fract(uv * GRID) - 0.5;
        return cell;
    } else {
        uv.x -= T * GRID_T;
        cell = fract(uv * GRID) - 0.5;
        return cell;
    }
    
}


void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    uv = rotate2D(T * 0.05) * uv;
    uv.x = sinh(uv.x * 0.7);
    uv.y += sin(uv.x * 5.5 + T * UV_T * 0.8) * 0.2 
      + sin((uv.y + uv.y) * 5.0 - T * UV_T * 1.2) * 0.15 
      + cos(uv.y * 3.0 + T * UV_T) * 0.25 
      + 0.1;
    
    vec3 color = vec3(0.0);
    
    float idx = floor(uv.x * GRID);
    vec2 cell = animation(uv, idx);
    float d = sdfCircle(cell);
    
    if(mod(idx, 2.0) != 0.0){
        //color += CYAN * d;
        color += mix(vec3(0.0), CYAN, d);
    } else {
        color += CYAN * d;
    }
    
    color = pow(color * 1.7, vec3(1.1 / 2.2) );
   
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
