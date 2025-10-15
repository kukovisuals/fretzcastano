uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 121  🌟                         
    
    ▓  After playing with capsules, I want to get better at    
    ▓  branching capsules (not sure if that's the correct           
    ▓  way to call them) - I want to feel comfortable  
    ▓  branching the capsules and doing more complex things   
    ▓  with them, kind of like a fractal-looking structure.    
                                                              
    ▓  I have a book called "The Algorithmic Beauty of Plants" 
    ▓  and the first pattern that came up as "easy" was the    
    ▓  Koch L-systems. So I started with that one.             
                                                              
    ▓  I'm gonna guess this is going to be a week-long journey
    ▓  here haha. I have ADHD so probably until I get bored    
    ▓  and move on to another thing.  
    
    ▓  If you use it at a vj show please send videos to my ig  
    
    ▓  I got the starting code from Fabrice
    ▓  https://www.shadertoy.com/view/ll3XRn
    
    ▓  AA seems better not the best but I'll take ideas 
    ▓  if anyone knows how to make it better.
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

mat2 r2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }

vec3 render(vec2 I){
    vec2 R = iResolution.xy;

    // Normalize & spin
    vec2 uv = abs(I + I - R) / R.x;
    uv *= r2(iTime * 0.05);

    // Orbit traps
    vec3 k = vec3(1e9);

    // Koch-ish mapping
    for(int i = 0; i < 13; i++){
    
        float t = iTime * 0.117;
        float aA = 2.5 + 2.5 * sin(t);
        float aB = 5.2 + 2.5 * cos(t * 1.3);

        mat2 animatedTransform;
        if(uv.x < 0.0){
            animatedTransform = mat2(aA, 5.2, -5.2, aA) / 6.0;
        } else {
            animatedTransform = mat2(9.0, aB, -aB, 9.0) / 6.0;
        }

        uv *= -animatedTransform;
        float mask = 1.0 - abs(uv).y;
        
        float w = fwidth(1.0 / R.y);
        uv.y = smoothstep(0.0, 1.0, mask);
       
        k = min(k, vec3(abs(uv.x), abs(uv.y), dot(uv,uv)));
    }

    float d = uv.y;
    float s = length(uv);

    const float PI2 = 6.28318530718;
    vec3 phase = vec3(0.0, cos(iTime * 0.3) * 2.0, sin(iTime * 0.3) * 2.0);

    vec3 trap = clamp(k, 0.0, 1.0);

    vec3 c = max( cos(d * PI2 + phase) - s * sqrt(abs(d) + 1e-4) - trap, 0.0 );
    c.gb += 0.01;

    vec3 col = c * 0.4 + c.brg * 0.6 + c * c;

    // Glow
    float glowMask = smoothstep(0.3, 1.0, length(col)); 
    float glowFalloff = exp(-30.0 * s); 
    vec3 glow = col * glowMask * glowFalloff * 10.0;

    col += glow;

    return col;
}

void mainImage(out vec4 O, vec2 I)
{
    // multiSample AA 
    vec2 offsets[4] = vec2[4](
        vec2( 0.25,  0.25),
        vec2(-0.25, -0.25),
        vec2(-0.25,  0.25),
        vec2( 0.25, -0.25)
    );

    vec3 col = vec3(0.0);
    for(int i=0; i<4; i++){
        col += render(I + offsets[i]);
    }
    col /= 4.0; // average samples

    O = vec4(col, 1.0);
}



void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
