uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 107  🌟                
    
    ▓  SDF Practice time with a capsule
    
    ▓  The idea was to have more control of a capsule 
    ▓  maybe add more anchors to the capsule later so it 
    ▓  more flow when I go 3D 
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define PI 3.14159265359
mat2 R(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

float sdfCapsuleAnchor(in vec2 p, vec2 a, vec2 b, vec2 c, float r)
{   
    float anim = cos(iTime) * 0.5 + 0.5;
    
    vec2 c0 = b + R(anim * -PI) * (c - b);
    
    vec2 pa = p - a, ab = b - a, pb = p - b, bc = c0 - b;
    
    float h1 = clamp( dot(pa, ab) / dot(ab, ab), 0.0,1.);
    float h2 = clamp( dot(pb, bc) / dot(bc, bc), 0.0,1.);
    
    float d1 = length( pa - ab*h1) - r;
    float d2 = length( pb - bc*h2) - r;
    return min(d1,d2);
}


void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy)/iResolution.y;
    
    vec3 col = vec3(uv.y);
    
    vec2 a = vec2(0, -0.6);
    vec2 b = vec2(0, 0.2);
    vec2 c = vec2(0.5, 0.1);
    float r = 0.2;
    
    float d1 = sdfCapsuleAnchor(uv, a, b, c, r);
    
    float shape = d1;
    
    // Time varying pixel color
    col = vec3(1.0) - sign(shape)*vec3(0.9,0.2,0.0);
	col *= 1.0 - exp(-5.0*abs(shape));
	col *= 0.8 + 0.32*sin(120.0*shape);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.015,abs(shape)) );
    
    O = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
