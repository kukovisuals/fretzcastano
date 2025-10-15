uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  Day 159  🎃               
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

float sdSphere(vec3 p, float r)
{ 
    return length(p) - r;
}

// double helix by fabrice
// https://www.shadertoy.com/view/XddBD8

float map(vec3 p)
{
    p.xy *= R2(iTime * 0.3);
    float len   = length(p.xy);
    float angle = atan(p.y, p.x);  
    float dist  = angle - p.z;
    
    float A = 2.38;
    float v = abs( mod(dist  ,6.28) -3.14);
    dist = min(v, abs( mod(dist -A,6.28) -3.14));
    
    float n = 3.82;            // spheres per rotation
    float helixRadius = 4.0;  // radius of helix
    
    vec3 spherePos = vec3(
        len - helixRadius,           // radial offset to helix
        dist,                        // perpendicular to helix path
        fract(n * angle) - 0.5       // periodic spacing along helix
    );
    
    float d1 = sdSphere(spherePos, 0.3);  
    return d1;
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    
    for(int i=0; i<100; i++)
    {
        float d = map(ro + rd * dt);
        dt += d;
        if(abs(d) < 0.001 || dt > 20.0) break;
    }
    
    return dt;
}

vec3 calcNormal(vec3 p)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0)) - map(p - vec3(e,0,0)),
        map(p + vec3(0,e,0)) - map(p - vec3(0,e,0)),
        map(p + vec3(0,0,e)) - map(p - vec3(0,0,e))
    ));
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0);
    float T = iTime;
    
    vec3 ta = vec3(0);
    vec3 ro = ta + vec3(10.0*cos(0.1*T), 0.0, 10.0*sin(0.1*T)); 
    //vec3 ro = ta + vec3(1.0*cos(1.5), 2.0, 7.0*sin(1.5)); 
    //vec3 ro = ta + vec3(1, 0, 4.); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 rd = ca * normalize(vec3(uv, 3.0));
    
    float dt = rayMarch(ro, rd);
    
    if(dt < 20.0)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        
        if(true)
        col = 0.5 + 0.5*norm.yxz;
        
        col = mix( col, vec3(0.0), 1.0-exp( -0.001*dt*dt*dt) );
    }
    
    O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
