uniform vec3 iResolution;
uniform float iTime; 


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓               🌟  KuKo — Day 82  🌟                  ▓

        🟡 Point A  — Yellow
        🟢 Point C  — Green (both are vectors)
        ⚪ White dots — projections of A and C 
            using dot product

    ▓   Starting from the ground up with vector math.     ▓
    ▓   It's been over 10 years since school, so this     ▓
    ▓   is my fresh restart — rebuilding the foundation.  ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

const float PI = 3.1415926;
#define T iTime

float drawLine(vec2 uv, vec2 start, vec2 end, float thickness) {
    vec2 dir = end - start;
    vec2 perp = normalize(vec2(-dir.y, dir.x));
    vec2 toPoint = uv - start;
    
    float along = dot(toPoint, normalize(dir));
    float across = abs(dot(toPoint, perp));
    
    float lineLength = length(dir);
    
    if (along < 0.0 || along > lineLength) {
        return 0.0;
    }
    
    return 1.0 - smoothstep(0.0, thickness, across);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 0.7;
    vec3 color = vec3(-uv.y);

    vec3 blue = vec3(0.0,0.5,0.6);
    vec3 red  = vec3(0.7,0.1,0.2);
    vec3 yell = vec3(0.6,0.6,0.0);
    vec3 gree = vec3(0.1,0.5,0.2);
    vec3 purp = vec3(0.4,0.0,0.4);
    vec3 white = vec3(0.8,0.8,0.8);

    vec2 A = vec2(sin(T * 0.05), cos(T * 0.05)) * 0.5;
    vec2 B = vec2( 0.0, 0.0);
    vec2 C = vec2( -0.5, 0.5);
    vec2 D =  (dot(A, C) / dot(A, A)) * A;
    vec2 E =  (dot(A, C) / dot(C, C)) * C;
    vec2 A1 = uv - A;
    float r = 0.03;  

    float d0 = length(uv - C) - r;
    float d1 = length(uv - A) - r;
    float d2 = length(uv - B) - r;
    float d3 = length(uv - D) - r;
    float d4 = length(uv - E) - r;
    
    d1 = smoothstep(0.01,0.0,d1);
    d2 = smoothstep(0.01,0.0,d2);
    d0 = smoothstep(0.01,0.0,d0);
    d3 = smoothstep(0.01,0.0,d3);
    d4 = smoothstep(0.01,0.0,d4);

    // Draw lines
    float lineThickness = 0.01;
    float lineA = drawLine(uv, B, A, lineThickness);     // Origin to A (yellow)
    float lineC = drawLine(uv, B, C, lineThickness);     // Origin to C (green)
    float lineD = drawLine(uv, B, D, lineThickness);     // Origin to D (white)
    float lineE = drawLine(uv, B, E, lineThickness);     // Origin to E (white)
    
    float projLineD = drawLine(uv, A, D, lineThickness * 0.5);  // A to D projection
    float projLineC = drawLine(uv, D, C, lineThickness * 0.5);
    float projLineE = drawLine(uv, A, E, lineThickness * 0.5);  // A to E projection

    vec3 PD = mix(vec3(0.0),white, d3); // projection vector
    vec3 PE = mix(vec3(0.0),white, d4); // projection vector
    vec3 PB = mix(vec3(0.0),red, d2); // origin 
    vec3 PA = mix(vec3(0.0),yell, d1); // vector A 
    vec3 PC = mix(vec3(0.0),gree, d0); // vector C
    
    // Add line colors
    vec3 lineColors = lineA * yell * 0.5 + 
                      lineC * gree * 0.5 + 
                      lineD * white * 0.5 + 
                      lineE * white * 0.5 +
                      projLineD * white * 0.3 +
                      projLineE * white * 0.3 +
                      projLineC * white * 0.3;
    
    color = PA + PB + PC + PD + PE + lineColors; 

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
