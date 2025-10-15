uniform vec3 iResolution;
uniform float iTime; 
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 72                 ▓
    ▓             Happy 4th of July                ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec2 new_uv = uv;
    vec3 color  = vec3(0.0);

    float size = 5.0;
    vec2 cell  = fract(new_uv * size) - 0.5;
    vec2 id    = floor(new_uv * size) - 0.5;

    float rnd = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    float phi = fract(iTime * 0.15 + rnd);
    float fx = step(0.9, phi);
    // circle
    float d1  = smoothstep(0.43, 0.3, length(cell) - 0.0);

    color = d1 * fx * vec3(1.0);
    // color = vec3(cell, 1.0);
    O = vec4(color,1.0); 
}






/*
    * Ese hotbot donde los suegros estubo bueno
    * la verdad no tengo afan me puedo quedar haciendo 
    * Estoy un rato, esta tool es muy useful 
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
