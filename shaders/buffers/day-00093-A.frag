uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
uniform float     iTimeDelta; 

#define ss(t, b, g) smoothstep(t-b, t+b, g)
#define screen(a, b) a+b-a*b
#define SCALE_P 0.00516
#define NOISE_T 0.1

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


#define V_FIELD(COORD) texture(iChannel0, COORD/iResolution.xy)
#define T iTime

const float SPEED_D1 = 0.5;
// 1: All my energy translate with my order energey
vec4 Field(vec2 p)
{
    vec2 vf = V_FIELD(p).xy;
    //   └── fetch v(p) from R﻿G channels
    vec2 p0 = p - vf;
    //   └── back‑trace: p₀ = p - Δt·v(p)
    return V_FIELD(p0);
    //   └── sample the old field at that p₀
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 R = iResolution.xy;
    // check if resolution changed
    if(iFrame < 1 )
    {
        O = vec4(0.1,0.0,0.0,0.0);
        return;
    }
    O = Field(I);
    // neighborhood
    vec4 px = Field(I + vec2(1,0));
    vec4 py = Field(I + vec2(0,1));
    vec4 nx = Field(I - vec2(1,0));
    vec4 ny = Field(I - vec2(0,1));
    
    // 2: disorder energy diffuses completely 
    O.b = (px.b + py.b + nx.b + ny.b) / 4.0;
    
    // 3: order in the disorder energy creates order 
    vec2 Force;
    Force.x = nx.b - px.b;
    Force.y = ny.b - py.b;
    //O.xy += Force / 4.0;

    // Add noise to the force field
    vec3 n = noise(I * SCALE_P + vec2(T * NOISE_T)); // slow time evolution
    vec3 an = abs(n);
    vec4 s = vec4(
        dot(n, vec3(1.)),
        dot(an, vec3(1.)),
        length(n),
        max(max(an.x, an.y), an.z)
    );

    // Apply noise as additional force
    Force += 0.25*( s.y * -abs(s.x));
    //Force += (s.xy - 0.5) * 0.03; // centered around zero
    O.xy += Force * 0.5; // Now apply the combined force
    //O.xy += (s.xy * 0.01);
    
    // 4: disorder in the order energy creates disorder
    O.b += (nx.x - px.x + ny.y - py.y) / 4.0;
    
    // gravity offset
    O.y -= O.w / 300.0;
    
    // mass concervation 
    O.w += (nx.x * nx.w - px.x * px.w + ny.y * ny.w - py.y * py.w)/4.0;
    
    //boundery conditions
    if(I.x < 10. || I.y < 10. || R.x - I.x < 10. || R.y - I.y < 10.)
    {
        O.xy *= 0.0;
    }
}










void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
