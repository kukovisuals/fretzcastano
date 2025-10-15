uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 79  🌟                        

    ▓  This is my representation of 🌟 Adenine 🌟, one of the  
    ▓  essential building blocks of DNA and RNA.               
    ▓                                                      
    ▓  🟢 Green     — Carbon (C)                              
    ▓  🔵 Blue      — Nitrogen (N)                            
    ▓  ⚪ White     — Hydrogen (H)                            
    ▓  🟡 Yellow    — Electrons                               
    ▓                                                      
    ▓  I created this molecule by color-coding the atoms.    
    ▓  The yellow dots represent electrons, which I learned  
    ▓  are involved in covalent bonds — meaning they     
    ▓  are shared and held in place between atoms.           
    ▓                                                      
    ▓  It's crazy to think that life is built from such       
    ▓  tiny building blocks. Every living thing on earth       
    ▓  has this molecule at its core.                    

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
#define PI 3.14159265
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a) ); }
float orbit( in vec2 uv, vec2 translate, float offset)
{
    float d = 1e9;
    float seed = sin(T * 0.00005) * 0.01 + offset;
    float a = hash21(vec2(seed, 0.0)) * PI * 2.0;
    vec2 p = vec2(cos(a), sin(a)) * 0.3;
    float temp_d = length(uv + translate - p) - 0.001;
    d = min(d, temp_d);
    return abs(d); 
}

float orbit( in vec2 uv, vec2 translate, float offset, int len, float r)
{
    float d = 1e9;
    float baseT = sin(T * 0.001) * 0.001 + offset;
    float newBaseT = sin(T * 0.00002) * 0.003 + offset;
    for(int i=0; i<len; i++)
    {
        float seed = float(i) * 0.1 ;
        float a = hash21(vec2(seed, newBaseT)) * PI * 2.0;
        vec2 p = vec2(cos(a), sin(a)) * r;
        float temp_d = length(uv + translate - p) - 0.001;
        d = min(d, temp_d);
    }
    return abs(d); 
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                      Main                           ▓                                     

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 1.6;
    //uv = rotate2D(T * 0.1) * uv;
    uv.x += sin(uv.x * 0.2 + T * 0.2) * cos(uv.x * 0.2 + T * 0.2);
    uv.x += sin(T * 0.2) * 1.5 - 1.1;
    uv.y += cos(T * 0.2) * 1.5 - 0.3;
    uv.y -= 0.7;
    uv.x -= 0.6;
    uv *= sin(T * 0.2) * 0.2 + 0.6;
    
    vec3 color  = vec3(0.0);
    vec3 blue   = vec3(0.1,0.3,0.5);
    vec3 blue2  = vec3(0.145,0.141,0.122);
    vec3 orange = vec3(0.749,0.431,0.008);
    vec3 green  = vec3(0.094,0.212,0.204);

    // nucleus
    float r1 = 0.03;
    float d1  = length(uv + vec2(-0.4 ,-0.6 )) - r1;
    float d3  = length(uv + vec2( 0.4 ,-0.6 )) - r1;
    float d5  = length(uv + vec2( 0.0 ,-0.15)) - r1;
    float d8  = length(uv + vec2( 0.0 , 0.45)) - r1;
    float d11 = length(uv + vec2(-0.6 , 0.7 )) - r1; // nitrogen
    float d14 = length(uv + vec2(-0.6 , 1.3 )) - r1; // carbon
    float d17 = length(uv + vec2(-1.2 , 1.5 )) - r1;
    float d19 = length(uv + vec2(-0.13, 1.7 )) - r1;
    float d22 = length(uv + vec2( 0.5 , 1.3 )) - r1; // carbon
    float d25 = length(uv + vec2( 0.5 , 0.7 )) - r1; // carbon
    float d28 = length(uv + vec2( 1.2 , 0.45)) - r1; // Nitrogen
    float d31 = length(uv + vec2( 1.7 , 1.05)) - r1; // carbon
    float d34 = length(uv + vec2( 1.2 , 1.7 )) - r1; // Nitrogen
    float d36 = length(uv + vec2( 2.3 , 1.05)) - r1; // Hydrogen
    float d38 = length(uv + vec2( 1.2 , 2.3 )) - r1; // Hydrogen

    // Electrons
    float r2 = 0.03;
    float r3 = 0.15;
    float d2  = orbit(uv, vec2(-0.4,-0.6 ), 0.01 );
    float d4  = orbit(uv, vec2( 0.4,-0.6 ), 0.005);
    float d6  = orbit(uv, vec2( 0.0,-0.15), 0.0045, 5, 0.3);
    float d7  = orbit(uv, vec2( 0.0,-0.15), 0.01, 2, 0.15);
    float d9  = orbit(uv, vec2( 0.0, 0.45), 0.0003, 4, 0.3);
    float d10 = orbit(uv, vec2( 0.0, 0.45), 0.01, 2, 0.15);
    float d12 = orbit(uv, vec2(-0.6, 0.7 ), 0.015, 5, 0.3);
    float d13 = orbit(uv, vec2(-0.6, 0.7 ), 0.025, 2, 0.15);
    float d15 = orbit(uv, vec2(-0.6, 1.3 ), 0.025, 4, 0.3);
    float d16 = orbit(uv, vec2(-0.6, 1.3 ), 0.042, 2, 0.15);
    float d18 = orbit(uv, vec2(-1.2, 1.5 ), 0.022);
    float d20 = orbit(uv, vec2(-0.13, 1.7), 0.014, 5, 0.3);
    float d21 = orbit(uv, vec2(-0.13, 1.7), 0.012, 2, 0.15);
    float d23 = orbit(uv, vec2( 0.5 , 1.3), 0.021, 4, 0.3);
    float d24 = orbit(uv, vec2( 0.5 , 1.3), 0.015, 2, 0.15);
    float d26 = orbit(uv, vec2(0.55,  0.7), 0.025, 4, 0.3);  // carbon
    float d27 = orbit(uv, vec2(0.55,  0.7), 0.014, 2, 0.15); // carbon
    float d29 = orbit(uv, vec2(1.2,  0.45), 0.017, 5, 0.3);  // carbon
    float d30 = orbit(uv, vec2(1.2,  0.45), 0.017, 2, 0.15); // Nitrogen
    float d32 = orbit(uv, vec2(1.7,  1.05), 0.019, 4, 0.3);  // carbon
    float d33 = orbit(uv, vec2(1.7,  1.05), 0.039, 2, 0.15); // carbon
    float d35 = orbit(uv, vec2(1.2,   1.7), 0.023, 5, 0.3);  // Nitrogen
    float d37 = orbit(uv, vec2(2.3,  1.05), 0.014);          // Hydrogen
    float d39 = orbit(uv, vec2(1.2,   2.3), 0.044);          // Hydrogen

    // nucleus
    d1  = abs(d1); d3  = abs(d3); d5  = abs(d5); d8  = abs(d8); d11 = abs(d11); d14 = abs(d14); d17 = abs(d17); d19 = abs(d19); d22 = abs(d22); d25 = abs(d25); d28 = abs(d28); d31 = abs(d31); d34 = abs(d34); d36 = abs(d36); d37 = abs(d37); d38 = abs(d38);
    
    // Nucleus
    float glow_0 = 0.07;
    float glow = 0.1;
    float e_1 = 0.01;
    float e_2 = 0.03;
    float e_4 = 0.02;
    color  = vec3(glow   / (d1  + e_1)) * blue2; 
    color += vec3(glow   / (d3  + e_1)) * blue2;
    color += vec3(glow_0 / (d5  + e_2)) * blue;
    color += vec3(glow_0 / (d8  + e_4)) * green;
    color += vec3(glow_0 / (d11 + e_2)) * blue;
    color += vec3(glow_0 / (d14 + e_2)) * green;
    color += vec3(glow   / (d17 + e_1)) * blue2;
    color += vec3(glow_0 / (d19 + e_2)) * blue;
    color += vec3(glow_0 / (d22 + e_4)) * green;
    color += vec3(glow_0 / (d25 + e_4)) * green;
    color += vec3(glow_0 / (d28 + e_2)) * blue;
    color += vec3(glow_0 / (d31 + e_4)) * green;
    color += vec3(glow_0 / (d34 + e_2)) * blue;
    color += vec3(glow   / (d36 + e_1)) * blue2;
    color += vec3(glow   / (d38 + e_1)) * blue2;

    // Electrons
    float glow_1 = 0.004;
    float e_3 = 0.002;
    color += vec3(glow_1 / (d2  + e_3)) * orange;
    color += vec3(glow_1 / (d4  + e_3)) * orange;
    color += vec3(glow_1 / (d6  + e_3)) * orange;
    color += vec3(glow_1 / (d7  + e_3)) * orange;
    color += vec3(glow_1 / (d9  + e_3)) * orange;
    color += vec3(glow_1 / (d10 + e_3)) * orange;
    color += vec3(glow_1 / (d12 + e_3)) * orange;
    color += vec3(glow_1 / (d13 + e_3)) * orange;
    color += vec3(glow_1 / (d15 + e_3)) * orange;
    color += vec3(glow_1 / (d16 + e_3)) * orange;
    color += vec3(glow_1 / (d18 + e_3)) * orange;
    color += vec3(glow_1 / (d20 + e_3)) * orange;
    color += vec3(glow_1 / (d21 + e_3)) * orange;
    color += vec3(glow_1 / (d23 + e_3)) * orange;
    color += vec3(glow_1 / (d24 + e_3)) * orange;
    color += vec3(glow_1 / (d26 + e_3)) * orange;
    color += vec3(glow_1 / (d27 + e_3)) * orange;
    color += vec3(glow_1 / (d29 + e_3)) * orange;
    color += vec3(glow_1 / (d30 + e_3)) * orange;
    color += vec3(glow_1 / (d32 + e_3)) * orange;
    color += vec3(glow_1 / (d33 + e_3)) * orange;
    color += vec3(glow_1 / (d35 + e_3)) * orange;
    color += vec3(glow_1 / (d37 + e_3)) * orange;
    color += vec3(glow_1 / (d39 + e_3)) * orange;

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
