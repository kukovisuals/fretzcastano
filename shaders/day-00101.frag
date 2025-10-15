uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 101  🌟                
    
    ▓  Feels like day 1. Looking back and trying to think 
    ▓  of what I can improve
    
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float sdRoundedBox(in vec2 p, in vec2 b, in vec4 r)
{
    r.xy   = (p.x > 0.0) ? r.xy : r.zw;
    r.x    = (p.y > 0.0) ? r.x  : r.y ;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y),0.0) + length( max(q, 0.0)) - r.x; 
}

float sdChamferBox(in vec2 p, in vec2 b, in float chamfer)
{
    p = abs(p) - b;
    
    p = (p.y > p.x) ? p.yx : p.xy;
    p.y += chamfer;
    
    const float k = 1.0 - sqrt(2.0);
    if(p.y < 0.0 && p.y + p.x * k < 0.0 )
        return p.x; // gets the inside of the square 
        
    if( p.x < p.y )
        return (p.x + p.y) * sqrt(0.5); // gets the outside "arrows"
    
    return length(p);
}

float sdBox( in vec2 p, in vec2 b)
{
    vec2 d = abs(p) - b;
    return length(max(d, 0.0) + min(max(d.x, d.y), 0.0) );
}

float sdOrientedBox( in vec2 p, in vec2 a, in vec2 b, float th)
{
    float l = length(b-a);
    vec2 d = (b - a) / l;
    vec2 q = (p - (a + b) * 0.5);
         q = mat2(d.x, -d.y, d.y, d.x) * q;
         q = abs(q) - vec2(l, th) * 0.5;
    return length(max(q,0.0)) + min(max(q.x, q.y), 0.0);
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(-uv.y);
    
    // rounded box
    vec2 b  = vec2(0.3);
    vec4 r  = vec4(0.1,0.3,0.2,0.02);
    float d = sdRoundedBox(uv, b, r);
    d = smoothstep(0.01,0.0, d);
    color += vec3(d);
    
    // chamfer box
    vec2 tra = vec2(1.0, -0.5);
    float chamfer = 0.1;
    b = vec2(0.32, 0.1);
    d = sdChamferBox(uv + tra, b, chamfer);
    d = smoothstep(0.01,0.0, d);
    color += vec3(d);
    
    // exact square
    tra *= vec2(-1.0);
    b = vec2(0.2, 0.2);
    d = sdBox( uv + tra, b);
    d = smoothstep(0.01,0.0,d);
    color += vec3(d);
    
    // oriented box
    tra *= vec2(1.0,-1.0);
    vec2 a = vec2(0.1);
    float th = 0.5;
    d = sdOrientedBox( uv + tra, a, b, th);
    d = smoothstep(0.01,0.0,d);
    color += vec3(d);
    
    O = vec4(color, 1.0);
}













void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
