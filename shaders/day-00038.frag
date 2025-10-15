uniform vec3 iResolution;
uniform float iTime; 


float sphere(vec3 p)
{
    float d = length(cos(p) + 0.05*cos(9.0*p.y*p.x) 
    - 0.1*cos(9.0*(0.3*p.x - p.y + p.z + iTime))) 
    - 0.4614;
    return d;
}

float sdBox(in vec3 p, vec3 wh)
{
    p = abs(p) - wh;
    return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}

float map(vec3 p)
{
    // You can also play with sphere
    //return sphere(p - vec3(0.0, 0.0, -3.0));
    float spxTime = sin(iTime * 0.5) * 0.3 + 0.5;
    return sdBox(cos(p) + 0.03*cos(2.4*p.y*p.x) - 0.2*cos(4.0*(spxTime*p.x - p.z + p.z + iTime * 0.3)) - vec3(0.0, 0.0, -0.1), vec3(1.5, 0.8, 0.2));
}

float raycast(vec3 ro, vec3 rd)
{
    float t = 0.0;
    for(int i = 0; i < 64; i++)
    {
        vec3 p = ro + t * rd;
        float d = map(p);

        if(d < 0.001 || t > 100.0) break;

        t += d;
    }
    return t;
}

vec3 getRayDirection(vec2 uv, vec3 ro, vec3 ta)
{
    vec3 forward = normalize(ta - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    
    return normalize(uv.x * right + uv.y * up + 2.0 * forward);
}

vec3 getNormal(vec3 p)
{
    float eps = 0.001;
    return normalize(vec3(
        map(p + vec3(eps, 0, 0)) - map(p - vec3(eps, 0, 0)),
        map(p + vec3(0, eps, 0)) - map(p - vec3(0, eps, 0)),
        map(p + vec3(0, 0, eps)) - map(p - vec3(0, 0, eps))
    ));
}


void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    float dt = iTime;
    // camera static
    //vec3 ro = vec3(0.0, 0.0, 2.0);
    //vec3 ta = vec3(0.0, 0.0, 0.0);
    // camera moving
    float angle = dt * 0.2;  // Speed of rotation
    vec3 ro = vec3(0.0, 0.0, 2.0 - dt * 1.0);
    vec3 ta = vec3(0.0, 0.0, -3.0 - dt * 1.0); 

    vec3 rd = getRayDirection(uv, ro, ta);

    //Raymarch scene
    float t = raycast(ro, rd);

    vec3 color = vec3(0.1);
    if(t < 60.0)
    {
        vec3 p = ro + t * rd;
        float d = map(p);

        // Simple lighting based on position
        //float lighting = 0.5 + 0.5 * sin(p.x) * cos(p.y);
        vec3 normal = getNormal(p);
        
        float lighting = max(0.0, dot(normal, normalize(vec3(1.0, 1.0, 1.0))));
        
        vec3 baseColor = vec3(0.922,0.275,0.188);
       
        float pattern1 = sin(p.x * 2.0 + dt) * cos(p.y * 3.0);
        float pattern2 = sin(p.z * 4.0 + dt * 0.5);
        float combined = pattern1 + pattern2;
        baseColor = vec3(
            0.6 + 0.4 * sin(combined),
            0.4 + 0.6 * cos(combined + 1.0),
            0.5 + 0.5 * sin(combined + 2.0)
        );
        color = baseColor * lighting;
        
        

    }
    // color = vec3(uv.x);
    // normal 
    //O = vec4(color, 1.0);
    //playfull
    float ldt = sin(iTime * 3.1) * 1.6 + 1.6;
    O = vec4(3. * color * exp(-t/(ldt + 4.1)), 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
