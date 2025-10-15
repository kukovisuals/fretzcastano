uniform vec3 iResolution;
uniform float iTime; 


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 71                 ▓
    ▓                 SDF Circle                   ▓
    ▓                 Shapes id                    ▓
    ▓                    Map                       ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/


#define T iTime
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
mat2 rotate2D(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a) ); }
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec2 cell_uv = uv;
    vec3 color = vec3(0.0);
   
    float speed = 0.5;
    float fx3 = ( cos(3.0 * uv.y + T * speed / 3.0)) * sin( 4.0 * uv.x + T * speed / 4.0) * 0.2 + 0.2;

    float fx1 = sin(0.0 + T * speed) * 0.5 + 0.5;
    float fx2 = sin(0.2 + T * speed) * 0.5 + 0.5;
    float fx4 = sin(0.4 + T * speed) * 0.5 + 0.5;
    float fx5 = sin(0.5 + T * speed) * 0.5 + 0.5;

    cell_uv = rotate2D(T * 0.1) * cell_uv;
    cell_uv.x += fx3; 
    

    float size = 15.0;
    vec2 p = fract(cell_uv * size) - 0.5;
    vec2 id = floor(cell_uv * size) - 0.5;

    float ran_r = mix(0.01,0.4, hash21(id));

    float d1 = length(p) - (ran_r * fx1);
    float d2 = length(p) - (ran_r * fx2);
    float d3 = length(p) - (ran_r * fx4);
    float d4 = length(p) - (ran_r * fx5);


    d1 = smoothstep( 0.03, 0.0, d1);
    d2 = smoothstep( 0.03, 0.0, d2);
    d3 = smoothstep( 0.03, 0.0, d3);
    d4 = smoothstep( 0.03, 0.0, d4);

    if(id.x > -1.0 && id.y > 0.0){
        color += vec3(d1);
    } else if(id.x > -1.0 && id.y < 0.0){
        color += vec3(d2);
    } else if(id.x < 1.0 && id.y > 0.0){
        color += vec3(d3);
    } else {
        color += vec3(d4);
    }

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
