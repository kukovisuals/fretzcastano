uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 102  🌟                
    
    ▓  I'm really bad at SDFs need to get better at it 
    ▓  before moving on to other things. Will move on until 
    ▓  I can do 1 just 1 on my own besides a circle 
    
    ▓  current SDFs by iquilez
    ▓  https://iquilezles.org/articles/distfunctions2d/
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define PI 3.1415926535897932384626433832795


float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}


float sdSegment( in vec2 p, in vec2 a, in vec2 b)
{
    vec2 pa = p - a, ba = b - a;
    float h = clamp( dot(pa, ba) / dot(ba, ba), 0.0,1.0);
    return length(pa - ba * h);
}

float ndot(vec2 a, vec2 b){ return a.x*b.x - a.y*b.y;}
float sdRombus(in vec2 p, in vec2 b)
{
    p = abs(p);
    float h = clamp(ndot(b - 2.0*p, b) / dot(b,b), -1.0,1.0);
    float d = length(p - 0.5*b*vec2( 1.0 - h, 1.0 + h));
    return d * sign(p.x*b.y + p.y*b.x - b.x*b.y);
}

float sdTrapezoid(in vec2 p, in float r1, in float r2, float he)
{
    vec2 k1 = vec2(r2, he);
    vec2 k2 = vec2(r2-r1,2.0*he);
    
    p.x = abs(p.x);
    vec2 ca = vec2(p.x - min(p.x, (p.y < 0.0) ? r1 : r2), abs(p.y) - he);
    vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot(k2, k2), 0.0, 1.0 );
    float s = (cb.x < 0.0 && ca.y < 0.0) ? - 1.0 : 1.0;
    return s*sqrt( min(dot(ca, ca), dot(cb, cb)));
}

float sdStar(in vec2 p)
{
    float r = 0.2;
    const vec4 k = vec4(-0.5,0.8660254038,0.5773502692,1.7320508076);
    p = abs(p);
    
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= 2.0 * min(dot(k.yx, p), 0.0) * k.yx;
    
    p -= vec2(clamp(p.x,r*k.z,r*k.w),r);

    return length(p) * sign(p.y);
}

float sdPentagram(in vec2 p)
{
    const float k1x = 0.809016994; // cos(π/ 5) = ¼(√5+1)
    const float k2x = 0.309016994; // sin(π/10) = ¼(√5-1)
    const float k1y = 0.587785252; // sin(π/ 5) = ¼√(10-2√5)
    const float k2y = 0.951056516; // cos(π/10) = ¼√(10+2√5)
    const float k1z = 0.726542528; // tan(π/ 5) = √(5-2√5)
    const vec2  v1  = vec2( k1x,-k1y);
    const vec2  v2  = vec2(-k1x,-k1y);
    const vec2  v3  = vec2( k2x,-k2y);
    
    p.x = abs(p.x);
    p -= 2.0 * max(dot(v1, p), 0.0) * v1;
    p -= 2.0 * max(dot(v2, p), 0.0) * v2;
    p.x = abs(p.x);
    
    float r = 0.5;
    p.y -= r;
    return length(p -v3 * clamp(dot( p, v3),0.0, k1z * r)) 
            * sign(p.y * v3.x - p.x * v3.y);
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    vec2 a = vec2(0.0,-0.2);
    vec2 b = a * vec2(-1.0);
    vec2 trans = vec2(1.2, -0.3);
    float d = sdSegment(uv + trans, a, b) - 0.1;
    
    b = vec2(0.4, 0.2);
    trans = vec2(-1.2, -0.3);
    float d2 = sdRombus(uv + trans, b) - 0.04;
    
    trans = vec2(1.2, 0.2);
    float d3 = sdTrapezoid(uv +trans, 0.3, 0.05, 0.3);
    
    trans = vec2(-1.2, 0.2);
    float d4 = sdStar(uv + trans) - 0.05;
    
    float d5 = sdPentagram(uv);
    //shape
    float shape = min(d , d2);
    shape = smin(shape, d3, 0.4);
    shape = smin(shape, d4, 0.2);
    shape = min(shape, d5);
    
    vec3 col = vec3(1.0) - sign(shape)*vec3(0.9,0.2,0.0);
	col *= 1.0 - exp(-5.0*abs(shape));
	col *= 0.8 + 0.32*sin(200.0*shape);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.015,abs(shape)) );
    
    O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
