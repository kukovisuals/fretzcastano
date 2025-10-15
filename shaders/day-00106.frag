uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 106  🌟                
    
    ▓  SDF Practice time with a capsule
    
    ▓  I think I want to stay here for a bit and practice 
    ▓  manipulating capsules. Yah know, some people are 
    ▓  obsessed with triangles—I think I’m going to be 
    ▓  obsessed with capsules.
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
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

float sdf(in vec2 p, vec2 a, vec2 b, float r)
{   
    float ra = 0.24;
    float rb = 0.11;
    
    vec2 pa = p - a, ba = b - a;
    
    float h = clamp( dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    // noise 
    //h += noise(pa * 5.0) * 0.1272;
    r = mix(ra, rb, h);
    
    return length(pa - ba * h) - r;
}

void mainImage( out vec4 O, in vec2 I )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (2.0 * I - iResolution.xy)/iResolution.y;
    //uv *= 1.5;
    vec3 col = vec3(uv.y);
    
    vec2 a1 = vec2(-.3, -.5); // bottom
    vec2 b1 = vec2( .6, -.5);
    
    vec2 a2 = vec2(-.2, .3);  // left
    vec2 b2 = vec2(-.6,-.4);
    
    vec2 a3 = vec2( .5,-.2);  // right
    vec2 b3 = vec2( .0, .5);
    
    float r = 0.15;
    
    vec2 new_uv = fract(uv) - 0.5;
    
    float d1 = sdf(uv , a1, b1, r);
    float d2 = sdf(uv , a2, b2, r);
    float d3 = sdf(uv , a3, b3, r);
    
    float bump = noise(uv * 5.0) * 0.072;
    float k = .1;
    d1 += bump * k / ( k + max(0.,d1) );
    d2 += bump * k / ( k + max(0.,d2) );
    d3 += bump * k / ( k + max(0.,d3) );
    
    float shape = min(min(d1, d2),d3);
    
    
    // Add simple bump to edges
    //float bump = noise(uv * 5.0) * 0.072;
    //shape += bump;
    
    // Time varying pixel color
    col = vec3(1.0) - sign(shape)*vec3(0.9,0.2,0.0);
	col *= 1.0 - exp(-5.0*abs(shape));
	col *= 0.8 + 0.32*sin(120.0*shape);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.015,abs(shape)) );
    
    // Output to screen
    O = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
