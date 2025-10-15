uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 86  🌟                                                        

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
#define PI 3.14159265

const float GRID = 2.0;
const float UV_T = 0.3;

const vec3 BLUE  = vec3(0.1,0.3,0.5);
const vec3 GREEN = vec3(0.094,0.212,0.204);
const vec3 CYAN  = vec3(0.09,0.494,0.647);


float map(vec2 p)
{
    //  p = abs(p) - 0.6;
    float d1 = length(p) - 0.4;
    //d1 = smoothstep(0.0,-fwidth(d1), d1);
    return d1;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    uv.y += T * 0.06;
    uv.y = sin(uv.y * 1.5);
    uv.x = cos(uv.x * 1.5);
    uv.y += cos(uv.x * 5.5 + T * UV_T * 0.5) * 0.2 
      + sin((uv.x + uv.y) * 10.0 - T * UV_T * 0.5) * 0.15 
      + cos(uv.y * 5.0 + T * UV_T) * 0.25 
      + 0.1;

    vec3 color = vec3(0.1);

    vec2 cell = fract(uv * GRID) - 0.5;
    float idx = floor(uv.x * GRID);

    float d = map(cell);
    float glow = 0.045191 / (abs(d) + 0.02);
    
    vec3 newColor = mix(CYAN, BLUE, sin(uv.x - T * 0.25) * 0.5 + 0.5);
    color += glow * newColor;
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
