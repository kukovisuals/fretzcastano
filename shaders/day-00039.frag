uniform vec3 iResolution;
uniform float iTime; 

/*
    * Had a lot of fun doing this at the airport please watch the visual 
    with this music, the transitions should match the "beeeeep..."
    https://www.youtube.com/watch?v=TghXqvyuco4
*/

float sphere(vec3 p)
{
    // float spxTime = sin(iTime * 0.5) * 0.05 + 1.16;
    // its okay
    // float d = length(
    //     cos(p) + 0.125*atan(5.0*p.x*p.x) + 
    //     0.015*sin(15.0*(1.08*p.x - p.y + p.z + iTime * 0.2))) - 
    //     1.0 - 0.05;
    float d = length(
        cos((p +(p.x* 0.4))) + 0.125 *atan(1.0*p.y*p.x) + 
        0.0315*sin(7.0*(3.08*p.x - p.y + p.z + iTime * 0.2))) - 
        1.0 - 0.05;
    return d;
}

float sdBox(in vec3 p, vec3 wh)
{
    p = abs(p) - wh;
    return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}

mat3 rotateY(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
          c, 0.0,   s,
        0.0, 1.0, 0.0,
         -s, 0.0,   c
    );
}

// Rotate around X-axis
mat3 rotateX(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
        1.0, 0.0, 0.0,
        0.0,   c,  -s,
        0.0,   s,  c
    );
}


mat3 rotateZ(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
        c,   -s,  0.0,
        s,   c,  0.0,
        0.0, 0.0, 1.0
    );
}

float map(vec3 p)
{
    int dtFx = int(mod(iTime / 2.0, 6.0));
    if(dtFx == 0 ){
        p = rotateX(iTime * 0.00002) * p;
    } else if(dtFx == 1 ){
        p = rotateZ(iTime * -0.2) * p;
    } else if(dtFx == 2 ){
        p = rotateX(iTime * 0.0002) * p;
    } else if(dtFx == 3 ){
        p = rotateZ(iTime * 0.2) * p;
    } else if(dtFx == 4 ){
        p = rotateX(iTime * 0.0004) * p;
    } else {
        p = rotateY(iTime * 0.0002) * p;
    }
    float spxTime = sin(p.y * 0.002716) * 0.15 + 0.5;
    return sphere(p - vec3(4.5, 3.0, -1.0));
    // return sdBox(
    //     cos(p) + 0.03*cos(2.4*p.y*p.x) - 
    //     0.2*cos(10.0*(spxTime*p.x - p.z + p.z + iTime * 0.3)) -
    //     vec3(0.0, 0.0, -0.1), vec3(1.5, 0.8, 0.2));
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
    float cmrSpeed = 1.0;
    int timeFx = int(mod(iTime / 2.0, 6.0));

    if(timeFx == 1){
        cmrSpeed = 2.5;
    } else if(timeFx == 2){
        cmrSpeed = 1.5;
    } else {
        cmrSpeed = 0.5;
    }
    vec3 ro = vec3(0.0, 0.0, 2.0 - dt * cmrSpeed);
    vec3 ta = vec3(0.0, 0.0, -2.0 - dt * cmrSpeed); 

    vec3 rd = getRayDirection(uv, ro, ta);

    //Raymarch scene
    float t = raycast(ro, rd);

    vec3 color = vec3(0.1);
    if(t < 15.0)
    {
        vec3 p = ro + t * rd + 0.01;
        float d = map(p);

        // Simple lighting based on position
        //float lighting = 0.5 + 0.5 * sin(p.x) * cos(p.y);
        vec3 normal = getNormal(p);
        
        float lighting = max(0.0, dot(normal, normalize(vec3(0.0, 0.5, 1.0))));
        
        vec3 baseColor = vec3(0.922,0.275,0.188);

        int dtFx = int(mod(iTime / 2.0, 2.0));
        
        float ringDist = length(p.xy - vec2(0.0, -7.0)); 
        float rings = tan(ringDist * 5.90 + iTime * 1.5);

        if(dtFx == 0 ){
            rings = tan(ringDist * 1.90 + iTime * 0.5);
        } else {
            rings = tan(ringDist * 5.90 + iTime * 1.5);
        }

        baseColor = mix(
            vec3(0.3, 0.2, 0.5),  // Red rings
            vec3(0.3, 0.4, 0.8),  // Blue rings
            0.5 + 0.5 * rings
        );
        
        color = baseColor * lighting;
    }
    // color = vec3(uv.x);
    // O = vec4(color, 1.0);
    float ldt = sin(iTime * 0.5) * 3.0 + 3.6;
    ldt = clamp(1.0, 10.0,ldt);
    O = vec4(6.5 * color * exp(-t/(ldt)), 1.0);
}



void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
