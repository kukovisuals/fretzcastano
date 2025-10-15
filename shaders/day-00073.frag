uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 73                 ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}

void mainImage(out vec4 O, in vec2 I) {
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv.x += iTime * 0.1;
    vec3 color = vec3(0.0); 
    
    float size = 15.0;

    vec2 id   = floor(uv * size) - 0.5;
    vec2 cell = fract(uv * size) - 0.5;
    
    float patSize     = 6.0; 
    float columActive = 3.0; 
    
    float columnMod   = mod(id.x, patSize);
    bool columnBool = (columnMod >= 0.0 && columnMod < columActive);
    
    if (columnBool) 
    {
        float d1 = smoothstep(0.02, 0.0, length(cell) - 0.335);

        float speed  = 0.3;
        float offset = iTime * speed;

        float phaseFx = offset - (id.y * 0.8); 

        float phi = fract(phaseFx);
        float fx  = step(0.3, phi);
        
        float rnd = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
        fx *= smoothstep(0.0,1.0, rnd); 
        
        color = vec3(d1) * fx;
    }
    
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
