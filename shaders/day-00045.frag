uniform vec3 iResolution;
uniform float iTime; 

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2. * I - iResolution.xy) / iResolution.y;

    uv = vec2(noise(uv));
    vec2 uv_id = fract(uv * 10.5) - 0.5;
    vec2 uv_frac = fract(uv * 10.5) - 0.5;

    if(uv_id.x < 0.0){
        uv_frac.y += sin(uv_frac.x * 5.0 - iTime * 4.0) * 0.5 + 0.5;
    } else {
        uv_frac.y += cos(uv_frac.x * 10.0 - iTime * 4.0) * 0.5 + 0.1;
    }
    // uv_frac.x = ;
    // float d = step(0.5, uv_frac.x);
    float d = smoothstep(1.0, 0.0, uv_frac.y);

    vec3 color = vec3(d);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
