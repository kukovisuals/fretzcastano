uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 105  🌟                
    
    ▓  SDF Practice time with a triangle
    
    ▓ Lots of dot products and cross product in 2D 
    ▓ After a couple of references online this one worked 
    ▓ best for me to understand it. 
    
    ▓ I spend most of the time on paper then code
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime

float sdfTriangle(in vec2 p)
{
    // play
    float aniX = sin(T) * .25 + 0.5; 
    float aniY = cos(T) * .25 + 0.5;
    float ani2 = cos(T * 0.25);
    
    // Triangle vertices
    float size = 0.5;
    vec2 a = vec2(-aniX, -aniY);
    vec2 b = vec2( aniX, -ani2);
    vec2 c = vec2( aniX * ani2 , aniY);
    
    // Vector from each vertex to point
    vec2 pa = p - a;
    vec2 pb = p - b;
    vec2 pc = p - c;
    
    // Edge vectors
    vec2 ab = b - a;
    vec2 bc = c - b;
    vec2 ca = a - c;
    
    // Closest points on each edge
    float t1 = clamp(dot(pa, ab) / dot(ab, ab), 0.0, 1.0);
    float t2 = clamp(dot(pb, bc) / dot(bc, bc), 0.0, 1.0);
    float t3 = clamp(dot(pc, ca) / dot(ca, ca), 0.0, 1.0);
    
    // Distance to each edge
    float d1 = length(pa - t1 * ab);
    float d2 = length(pb - t2 * bc);
    float d3 = length(pc - t3 * ca);
    
    // Return minimum distance, with proper sign
    float dist = min(min(d1, d2), d3);
    
    // Check if inside using cross products for sign
    float s1 =  ab.x*pa.y - ab.y*pa.x;
    float s2 =  bc.x*pb.y - bc.y*pb.x;
    float s3 =  ca.x*pc.y - ca.y*pc.x;
    
    return -sign(min(min(s1,s2),s3)) * dist;
    
    /*
    float s1 = sign((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
    float s2 = sign((c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x));
    float s3 = sign((a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x));
    
    return (s1 == s2 && s2 == s3) ? -dist : dist;
    */
}

void mainImage( out vec4 O, in vec2 I )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (2.0 * I - iResolution.xy)/iResolution.y;

    vec3 col = vec3(uv.y);
    
    float shape = sdfTriangle(uv);
    
    col = vec3(1.0) - sign(shape)*vec3(0.9,0.2,0.0);
	col *= 1.0 - exp(-5.0*abs(shape));
	col *= 0.8 + 0.32*sin(120.0*shape);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.015,abs(shape)) );
    
    O = vec4(col,1.0);
}




/*

    // Helper function for 2D cross product
    float cross2d(vec2 a, vec2 b) {
        return a.x * b.y - a.y * b.x;
    }

    float sdf1(in vec2 p)
    {
        // Define three vertices
        vec2 a = vec2(-0.5, -0.3); // bottom left
        vec2 b = vec2( 0.5, -0.3); // bottom right
        vec2 c = vec2( 0.0,  0.4); // top 

        // Calculate distances to each edge using cross product
        float d1 = cross2d(p - a, b - a);  // Distance to edge AB
        float d2 = cross2d(p - b, c - b);  // Distance to edge BC  
        float d3 = cross2d(p - c, a - c);  // Distance to edge CA

        // Inside if all distances have same sign
        return max(max(d1, d2), d3) - 0.1;
    }


*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
