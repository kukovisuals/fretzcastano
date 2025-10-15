uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 96  🌟                

    ▓  Learning vector flow field
    
    ▓  forked -> https://www.shadertoy.com/view/clVSW3

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
void mainImage(out vec4 O, in vec2 I) 
{
    //I += sin(I.y * 0.5 + iTime * 0.1);
    vec2 uv = I / iResolution.xy;
    O = texture(iChannel0, uv);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
