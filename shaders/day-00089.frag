uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 89  🌟                

    ▓  Learning Flow field simulation
    
    ▓  Great tutorial on:
    ▓  https://wyattflanders.com/MeAndMyNeighborhood.pdf

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define LOOKUP(COORD) texture(iChannel0,(COORD)/iResolution.xy)

void mainImage( out vec4 color, in vec2 coord )
{
    color = LOOKUP (coord).xxww;
    // black and white
    //color = LOOKUP (coord).wwww;
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
