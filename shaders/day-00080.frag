uniform vec3 iResolution;
uniform float iTime; 


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 80  🌟                        

    ▓  This is my representation of 🌟 Thymine 🌟, one of the  
    ▓  essential building blocks of DNA and RNA.               
    ▓  🟢 Green     — Carbon (C)                              
    ▓  🔵 Blue      — Nitrogen (N)                            
    ▓  ⚪ White     — Hydrogen (H)                            
    ▓  🍎 Red       — Oxygen  (O)                            
    ▓  🟡 Yellow    — Electrons    
    ▓  
    ▓ I got really bored after finishing the nucleus 
    ▓ To do the elctron bonding lol
*/

#define T iTime
#define PI 3.14159265
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a) ); }

vec2 nucleusP(float r1, float r2)
{
    return vec2(r1 * sqrt(3.0) / 2.0, r2/2.0);
}

vec3 shape(in vec2 uv, float r1, float r2, vec3 col, float dr)
{
    vec2 p1 = vec2(r1 * sqrt(3.0) / 2.0, r2/2.0);
    float d2 = length(uv + p1) - dr;
    d2 = 0.03 / (d2 + 0.09);
    return vec3(d2) * col;
}

float glowCircles(vec2 uv, vec2 p, float r)
{
    float d = length(uv + p) - r;
    d = 0.02 / (d + 0.09);
    return d;
}

vec3 addColor(vec2 uv, vec2 p, float r, vec3 color)
{
    float d = glowCircles(uv, p, r);
    return vec3(d) * color;
}

vec3 posShape(vec2 uv, float r, float dr, vec3 blue, vec3 green)
{
    vec3 result = vec3(0.0);
    result += shape(uv, -r, -r, blue, dr);
    result += shape(uv, -r,  r, green, dr);
    result += shape(uv,  r,  r, green, dr);
    result += shape(uv,  r, -r, green, dr);
    return result;
}


void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(-uv.y);

    vec3 blue   = vec3(0.1,0.3,0.5);
    vec3 grey   = vec3(0.145,0.141,0.122);
    vec3 orange = vec3(0.649,0.431,0.008);
    vec3 green  = vec3(0.094,0.212,0.204);
    vec3 pink   = vec3(0.69,0.435,0.459);
    
    // nucleus
    float r = 0.4;  // make this larger of smaller
    float dr = 0.09;
    vec2 p0 = vec2(0.0,-r);
    vec2 p4 = vec2(0.0, r);
    vec2 p7 = p0 + vec2(0.0, -r);
    vec2 p8 = nucleusP(-r,-r) * 2.;
    vec2 p9 = nucleusP(-r, r) * 2.;
    vec2 p10 = p4 + vec2(0.0, r);
    vec2 p11 = nucleusP(r, r) * 2.;
    vec2 p12 = nucleusP(r,-r) * 2.;
    vec2 p13 = p12 * 1.5;
    vec2 p15 = p12 * 1.5;
    vec2 p14_norm = normalize(p12);
    vec2 p16 = p12 + vec2(p14_norm.y, -p14_norm.x) * r;
    vec2 p17 = p12 + vec2(-p14_norm.y,  p14_norm.x) * r;

    // electrons
    float a = PI;
    float a2 = -PI/2.;
    // electrons
    vec2 center = vec2(sin(a), cos(a)) * r/2.1; 
    vec2 center2 = 0.0 + vec2(sin(a2), cos(a2)) * r/1.6; 
    vec2 p0_1 = center + rotate2D(T * 5.0) * (vec2(r/20.5, 0.0) - center/10.); 
    vec2 p0_2 = center + rotate2D(T * 5.0 + PI) * (vec2(r/20.0, 0.0) - center/10.);

    vec2 p1_1 = center2 + rotate2D(T * 5.0) * (vec2(r/20.5, 0.0) - center2/10.); 
    vec2 p1_2 = center2 + rotate2D(T * 5.0 + PI) * (vec2(r/20.0, 0.0) - center2/10.);

    // vec2 cell = fract(uv * 2.5) - 0.5;
    color  = addColor(uv, p0, dr, green);
    color += addColor(uv, p4, dr, blue);
    color += addColor(uv, p7, dr, pink);
    color += addColor(uv, p8, dr, grey);
    color += addColor(uv, p9, dr, pink);
    color += addColor(uv, p10, dr, grey);
    color += addColor(uv, p11, dr, grey);
    color += addColor(uv, p12, dr, green);
    color += addColor(uv, p15, dr, grey);
    color += addColor(uv, p16, dr, grey);
    color += addColor(uv, p17, dr, grey);

    color += posShape(uv, r, dr, blue, green);

    // electrons
    color += addColor(uv, p0 + p0_1, dr/1.3, orange);
    color += addColor(uv, p0 + p0_2, dr/1.3, orange);

    color += addColor(uv, p4 - p0_1, dr/1.3, orange);
    color += addColor(uv, p4 - p0_2, dr/1.3, orange);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
