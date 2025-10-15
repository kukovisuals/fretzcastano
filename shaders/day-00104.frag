uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 104  🌟                
    
    ▓  SDF Practice time
    
    ▓ Today was about understand min and max, how to do 
    ▓ union, subtraction, intersection and xor.
     
    ▓ Then I try making a triangle with dot products + 
    ▓ union but it turns out that it needs also 
    ▓ Barycentric coordinates so I kind of left it there
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float sdf(in vec2 p)
{
    vec2 C = vec2( 0.0 , 0.5);
    vec2 A = vec2(-0.5, -0.5);
    vec2 B = vec2( 0.5, -0.5);
    float r = 0.2;
    
    vec2 AB = B - A;
    vec2 AC = C - A;
    vec2 BC = C - B;
    

    float e0 = clamp( dot(p - A, AB) / dot(AB, AB), 0.0, 1.0);
    float e1 = clamp( dot(p - A, AC) / dot(AC, AC), 0.0, 1.0);
    float e2 = clamp( dot(p - B, BC) / dot(BC, BC), 0.0, 1.0);
    
    vec2 h  = A + e0 * AB;
    vec2 h1 = A + e1 * AC;
    vec2 h2 = B + e2 * BC;
    
    float d1 = length(p - h ) - r;
    float d2 = length(p - h1) - r;
    float d3 = length(p - h2) - r;
    
    return min(min(d1,d2), d3);
}

float sdfLineDirection(in vec2 p)
{
    vec2 a = vec2(-0.5,-0.5);
    vec2 b = vec2( 0.0,0.5);
    
    vec2 pa = p - a, ba = b - a;
    float d = dot(pa, ba) / dot(ba,ba);
    
    float t = clamp(d, 0.0,1.0);
    vec2 dist = a + t*ba;
    return length(p - dist) - 0.2;
}

float sdfSqare(in vec2 p )
{
    vec2 a   = abs(p) - vec2(0.9,0.2);
    vec2 d1  = max(a, 0.0);
    
    float d2 = max(a.x, a.y);
    float d = length( d1 ) + min(d2,0.0);
    return d;
}

float sdfLine(in vec2 p)
{
    float a = clamp(p.y, -0.6,0.6);
    vec2  b = vec2( 0.0, a );
    float d = length( p - b ) - 0.3; 
    
    return d;
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(uv.y);
    
    int fx = int(mod(iTime/1.0, 6.0));
    
    float d1 = sdfLine(uv);
    float d2 = sdfSqare(uv);
    float d3 = sdfLineDirection(uv);
    float d4 = sdf(uv);
    
    float shape = d1;
    
    if( fx == 0)
        shape = d2;
    else if (fx == 1)
        // union 
        shape = min(d1, d2);
    else if (fx == 2)
    // substraction
        shape = max(-d2, d1);
    else if (fx == 3)
    // intersection
        shape = max(d2, d1);
    else if (fx == 4)
    // xor
        shape = max(min(d1, d2), -max(d1,d2));
    else if( fx == 5)
        shape = d4;
    
    
    col = vec3(1.0) - sign(shape)*vec3(0.9,0.2,0.0);
	col *= 1.0 - exp(-5.0*abs(shape));
	col *= 0.8 + 0.32*sin(120.0*shape);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.015,abs(shape)) );
    
    O = vec4(col,1.0);
}


/*

float sdfTriangleBary(in vec2 p)
{
    vec2 C = vec2( 0.0 , 0.3);
    vec2 A = vec2(-0.3, -0.3);
    vec2 B = vec2( 0.3, -0.3);
    float r = 0.1;
    
    // Barycentric coordinates
    vec2 e0 = B - A;
    vec2 e1 = C - B; 
    vec2 e2 = A - C;
    
    vec2 v0 = p - A;
    vec2 v1 = p - B;
    vec2 v2 = p - C;
    
    vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
    vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
    vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
    
    float s = sign(e0.x * e2.y - e0.y * e2.x);
    vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                     vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                     vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
    
    return -sqrt(d.x) * sign(d.y);
}

*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
