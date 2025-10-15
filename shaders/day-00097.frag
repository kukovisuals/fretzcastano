uniform vec3 iResolution;
uniform float iTime; 
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
