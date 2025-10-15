uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 145  🎃               
    
    ▓  Starting the halloween theme
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float sdSphere(vec3 p, float r)
{
    return length(p) - r;
}

float sdfBox(vec3 p, vec3 b, float r)
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}


float map(vec3 p)
{
    float T = iTime;
    float d1 = sdSphere(p, 0.5);
    
    float fd = abs(dot(p, vec3(0,4,0)));
    float fg = pow(fd, 1.0) * cos(length(p + vec3(0,0,5)) * 4.0 - T * 2.2)
             * sin(length(p.yxy + vec3(0,0,5)) * 2.0 - T * 0.3);

    float d2 = sdfBox(p + vec3(0,4,0), vec3(50,3,50), 0.4) - fg * 0.07;
    return d2;
    return min(d1, d2);
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
    vec3 ro = ta + vec3(8.0*cos(1.), 2.0, 8.0*sin(1.)); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 rd = ca * normalize(vec3(uv, 3.0));
    
    float dt = rayMarch(ro, rd);
    
    if(dt < 20.0)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        
        // return normal
        if(true)
        col = 0.3 + 0.6*norm.yxz;
        
       
        col = mix( col, vec3(0.0), 1.0-exp( -0.001*dt*dt*dt) );
    }
    
    O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
