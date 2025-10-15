uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 87  🌟               
    
    ▓  Learning flow fields. I still don't get it fully
    ▓  Need to make some arrows so I can get this better
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage( out vec4 O, in vec2 I )
{
    vec4 col = texture(iChannel0, I/iResolution.xy);    
    
    O = col;

}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
