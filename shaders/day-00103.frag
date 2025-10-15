uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 103  🌟                
    
    ▓  SDF Practice time
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define PI 3.1415926535897932384626433832795

vec2 wormPath(float t) {
    float x = t * 0.9 + 0.1;
    float y = t * 0.0 + 0.1 + sin(t * 6.28 - iTime) * 0.2 * t; // Increasing amplitude
    return vec2(x, y);
}

float sdfWorm(vec2 p) {
    float minDist = 100.0;
    
    for(float t = 0.0; t <= 1.0; t += 0.15) {
        vec2 point = wormPath(t);
        float dist = length(p - point);
        minDist = min(minDist, dist);
    }
    
    return minDist - 0.15;
}

float sdfStarFish(in vec2 p)
{
    // Add some curve
    //p.x += sin(p.y * 7.0) * 0.1;
    
    p = abs(p);
    vec2 a = vec2(-0.5);
    vec2 b = vec2(0.5,0.5);
    vec2 pa = p-a, ba = b-a, pb = p-b;
    
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0,1.0);
    
    // Taper the thickness based on position along the line
    float thickness = 0.4 * (1.0 - h * 0.97); // Thicker at start, thinner at end
    
    return length(pa - ba * h) - thickness;
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(-uv.y);
    
    vec2 tra = vec2(1.3,0.);
    float d1 = sdfWorm(uv + tra);
    
    tra = vec2(-0.7,0.0);
    float d3 = sdfStarFish(uv + tra);
    
    float shape = min(d1, d3);
    
    col = vec3(1.0) - sign(shape)*vec3(0.9,0.2,0.0);
	col *= 1.0 - exp(-5.0*abs(shape));
	col *= 0.8 + 0.32*sin(200.0*shape);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.015,abs(shape)) );
    
    
    O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
