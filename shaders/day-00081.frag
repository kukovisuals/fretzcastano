uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 81  🌟                     ▓
    
    ▓   forked -> https://www.shadertoy.com/view/4cKyRm   ▓
    ▓   Created by Peace in 2024-11-15                    ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

const float PI = 3.1415926;
#define T iTime
#define cexp(z) (exp((z).x) * vec2(cos((z).y), sin((z).y)))
#define clog(z) vec2(0.35 * log(dot(z, z)), atan((z).y, (z).x))
mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a) ); }

float sfract(float x) {
    x = fract(x);
    return x * smoothstep(1.0, 0.0, x);
}

void mainImage(out vec4 fragColor, vec2 fragCoord) {
    vec2 uv = (fragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
    uv = rotate2D(T * 0.3) * uv;
    vec2 ruv = uv;
  
    uv = clog(uv);
    uv.x = sfract(uv.x - T * 0.5) * 0.2;
    float s = sqrt(sqrt(uv.x));
    uv.x += sin(s * s * PI * 2.0 - T * 0.4);
    uv = cexp(uv); //* tan(uv.x * 0.2 - T * 0.1 )  ;
    
    uv *= 2.0;
    
    float line_width = 0.01;
    vec4 uv_ddxy = vec4(dFdx(uv), dFdy(uv));
    vec2 uv_deriv = vec2(length(uv_ddxy.xz), length(uv_ddxy.yw));  
    vec2 draw_width = max(vec2(line_width), uv_deriv);  
    vec2 grid_uv = abs(fract(uv) * 2.0 - 1.0);  
    vec2 grid2 = smoothstep(uv_deriv * 1.5, -uv_deriv * 1.5, grid_uv - draw_width);  
    grid2 *= min(line_width / draw_width, 1.0);  
    grid2 = mix(grid2, vec2(line_width), clamp(uv_deriv * 2.0 - 1.0, vec2(0), vec2(1)));  
    float grid = mix(grid2.x, 1.0, grid2.y);
    
    
    vec3 col = vec3(grid);
    vec2 fuv = abs(fract(uv - 0.5) * 2.0 - 1.0);
    float k = length(min(line_width / draw_width, 1.0));
    col = mix(vec3(0.063,0.122,0.337)*fuv.y*fuv.y, vec3(0.094,0.212,0.204)*fuv.x*fuv.x, 0.5);
    col = vec3(mix(length(fuv) * col * k, vec3(1), grid));
    col *= s * 6.0;
    
    fragColor = vec4(col, 1);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
