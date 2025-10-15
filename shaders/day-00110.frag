uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    
    ▓              🌟  KuKo Day 110  🌟                

    ▓  AA practice. Every time there's repetition,  
    ▓  I get aliasing problems.
    
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime

float sdfCapsule(vec3 p)
{
    vec3 a = vec3(0.0, -50.0, 0.0);
    vec3 b = vec3(0.0, 50.0, 0.0);
    vec3 pa = p - a, ab = b - a;
    
    float h = clamp( dot(pa, ab) / dot(ab, ab), 0.0,1.0);
    
    return length(pa - ab * h) - 0.1;
}

float map(vec3 p)
{
    
    vec2 cell = vec2(2.0);
    p.z -= T * 0.9;
    p.xz = mod(p.xz + 0.0, cell) - 0.5*cell;
   
    return sdfCapsule(p);
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d < 0.01 || dt > 20.0) break;
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

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy)/iResolution.y;
    vec3 col = vec3(0.0);
    
    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0)); 
    
    float dt = rayMarch(ro, rd);

    if(dt < 10.0)
    {
        vec3 p = ro + rd * dt;

        vec3 norm = calcNormal(p);
        vec3 lightDir = normalize(vec3(3.0,3.0,9.0));
        float diff = max(dot(norm, lightDir), 0.0);
        
        float ambient = 0.1;
        vec3 albedo = vec3(0.0, 0.5, 0.5);
        
        col = norm;
        //col = albedo * (ambient + diff);
        //col = (ambient + diff) * vec3(0.0,0.5,0.5);
    }
    
   
    col = pow(col * 2.1, vec3(1.1 / 2.2));
    
    O = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
