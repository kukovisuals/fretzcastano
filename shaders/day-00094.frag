uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 94  🌟                

    ▓  Learning Flow field simulation
    
    ▓  Great tutorial on:
    ▓  https://wyattflanders.com/MeAndMyNeighborhood.pdf
    
    ▓  Added Simplex Noise
    ▓  https://www.shadertoy.com/view/W3VGW3

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define ss(t, b, g) smoothstep(t-b, t+b, g)
#define screen(a, b) a+b-a*b
#define SCALE_P 0.516
#define NOISE_T 0.0

vec2 hash( vec2 p ) // modified from iq's too
{
	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
	p = -1.0 + 2.0*fract(sin(p)*43758.5453123);
    return p;
    //return normalize(p); // more uniform (thanks Fabrice)
}

// slightly modified version of iq's simplex noise shader: https://www.shadertoy.com/view/Msf3WH
vec3 noise( in vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2  i = floor( p + (p.x+p.y)*K1 );
    vec2  a = p - i + (i.x+i.y)*K2;
    float m = step(a.y,a.x); 
    vec2  o = vec2(m,1.0-m);
    vec2  b = a - o + K2;
	vec2  c = a - 1.0 + 2.0*K2;
    vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return 1e2*n; //return full vector
}

#define LOOKUP(COORD) texture(iChannel0, COORD/iResolution.xy)

void mainImage( out vec4 O, in vec2 I )
{
    vec4 field = LOOKUP(I * 1.);
    //O += vec4(field.y * 0.5 + 0.0, field.x*0.5+0.2, field.x *0.5+0.3, 1.0);
    float vel =  length(field.xy);
    
    vec3 lightCol = vec3(0.624,0.824,0.839);//vec3(0.012,0.498,0.549);//vec3(0.663,0.137,0.137);
    vec3 grassBright = vec3(0.467,0.737,0.855);//vec3(0.078,0.078,0.078);
    float grassAmount = smoothstep(-0.2, 2.0, field.y);
    vec3 grassColor = mix(lightCol, grassBright, grassAmount);
    
    vec3 darkCol = vec3(0.22,0.408,0.549);
    vec3 waterBright = vec3(0.094,0.118,0.11);
    float waterAmount = smoothstep(-0.2, 2.0, field.x);
    vec3 waterColor = mix(darkCol, waterBright, waterAmount);
    
    // Add velocity highlights (white foam/movement)
    vec3 velocityHighlight = vec3(0.094,0.118,0.11) * smoothstep(0.1, 0.9, vel);
    
    // Combine everything
    float waterGrassMix = smoothstep(-0.1, 0.1, field.x - field.y);
    vec3 baseColor = mix(grassColor, waterColor, waterGrassMix);
    vec3 finalColor = mix(baseColor, velocityHighlight, vel * 0.3);
    
    O = vec4(finalColor, 1.0);
    // Add noise to the force field
    vec3 n = noise(I * SCALE_P + iTime * NOISE_T); // slow time evolution
    vec3 an = abs(n);
    vec4 s = vec4(
        dot(n, vec3(1.)),
        dot(an, vec3(1.)),
        length(n),
        max(max(an.x, an.y), an.z)
    );

    // Apply noise as additional force
    O += 0.025*( s.y*-abs(s.x) );
    
    
    
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
