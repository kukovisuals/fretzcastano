uniform vec3 iResolution;
uniform float iTime; 

#define T iTime
mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;

    uv = rotate2D(T * 0.2) * uv;
    vec3 color  = vec3(-uv.y);
    vec2 p = uv;

    p.x += sin(p.y * 2.0 - T * 0.1) * 0.5 + 0.8;
    p.x += cos(p.x * 2.0) * 0.5 + 0.5;

    float f_x = sin(p.y + T * 0.2) * 2.5 + 2.5;
    vec2 cell = fract(p * vec2(f_x, 0.0)) - 0.5;

    float d1 = length(cell.x) * exp(-length(uv));
    float edgeWidth = max(0.4, fwidth(d1));
    d1 = smoothstep(0.3 + edgeWidth, 0.3 - edgeWidth, d1);
    //d1 = smoothstep(0.5, 0.1, d1);

    d1 = mod(d1 * 3.0 - T * 0.3, 1.0);
   
    d1 = pow(0.05 / d1, 0.9);
    
    color = vec3(d1);
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
