uniform vec3 iResolution;
uniform float iTime; 


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 78  🌟              
    ▓
    ▓  Proteins bend and they have some weird geometry                                   
    ▓  I could have done different shapes in a fract
    ▓  But I think this could be an abstract representation of it                                            

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
#define T iTime
mat2 rotate2D(float a) {return mat2(cos(a), -sin(a), sin(a), cos(a));}
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 1.5;
    uv = rotate2D(T * 0.05) * uv;
    uv += T * 0.1;
    vec3 color = vec3(-uv.y);

    float width = 0.2;
    float speed = 0.4;
    vec2 p_1 = uv;
    
    p_1.y = sin(p_1.x * 2.7 + T * speed) * 0.3 + sin(p_1.x * 8.1 - T * speed) * 0.1 + 0.5 * cos(p_1.y * 5.3 + T * speed) * 0.5 + cos(p_1.y * 3.2 - T * speed) * 0.2 + 0.15;
    
    float dist = abs(p_1.y);
    // glow fx from https://www.shadertoy.com/view/wX3Gzs
    color = vec3(0.02 / (dist + 0.001)); 
    
    O = vec4(color,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
