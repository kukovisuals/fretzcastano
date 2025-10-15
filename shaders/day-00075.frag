uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 75                 ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv.x += T * 0.05;

    vec3 color = vec3(-uv.y);

    // dots grid
    float size = 15.0;
    vec2 cell = fract(uv * size) - 0.5;
    vec2 id   = floor(uv * size) - 0.5;

    float rand  = fract(hash21(id));
    float phi   = fract(T * 0.05 + rand);
    float fw    = fwidth(length(cell));
    float fwphi = fwidth(phi);
    float fx    = smoothstep(0.5 - fwphi, 0.1 + fwphi, length(phi) - 0.65513);

    float d1 = smoothstep(0.1 + fw, 0.01 - fw, length(cell) - 0.2);

    // background shape
    vec2 new_uv = uv; 
    new_uv.y += sin(new_uv.x + T * 0.2) + T * 0.1;
    
    float repeat    = mod(new_uv.y * 2.5, 2.7);
    float lineW     = 2.7;
    float repeat_fw = fwidth(new_uv.y * 2.5);
    float d2        = smoothstep(4.0 + repeat_fw, 1.39 - repeat_fw, repeat)
                      - smoothstep(lineW - 0.1 + repeat_fw, lineW - repeat_fw,repeat) ;
    
    // types of blending 
    color = vec3(d1) - fx * vec3(d2);
    //color = vec3(d1) - fx / vec3(d2);
    //color = vec3(d1) - fx + vec3(d2);
    //color = vec3(d1) - fx - vec3(d2);
    //color = vec3(d2);
    O = vec4(color, 1.0);
}



/*
    Sobreviviendo en el trabajo es lunes y tengo una pereza orrible mk 
    Es como si estuviara poseido por la pereza
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
