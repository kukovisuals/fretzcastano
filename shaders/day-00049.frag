uniform vec3 iResolution;
uniform float iTime; 

// lots of iq's SDFs helpers

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float sdCircle(vec3 p )
{
    return length(p + vec3(0.0, 2.0, 0.0)) - 1.5;   
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 newPa = p;
    float speed = iTime * 1.21001;
    newPa += cos(2.5*newPa.x - speed)*sin(3.5*newPa.y + speed)*cos(2.0*newPa.z - speed);
    vec3 pa = newPa - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float opOnion( in float sdf, in float thickness )
{
    return abs(sdf)-thickness;
}

float smin( float a, float b, float k )
{
    k *= log(2.0);
    float x = b-a;
    return a + x/(1.0-exp2(x/k));
}
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
float map(vec3 p)
{
    
    vec3 q = p;
    // q -= 0.5;
    q.xz = rotate2d(iTime * 0.2) * q.xz;
    float ground = q.y + 1.394675;
    float ground_top = -q.y + 2.594675;
    // q -= 0.5;
    // q = fract(q * 0.5) - 0.5;
    // q.y -= 1.5;
    float d1 = sdCircle(q);
    float d2 = sdCapsule(q, vec3(0.0, 0.0, 1.0), vec3(-0.0, -0.0, -1.0), 0.241235);
    return smin(ground_top, smin(ground, smin(d1, opOnion(d2, 0.4), 0.57495), 0.7), 0.7);
    // return  opOnion(d2, 0.02);
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dist_travel = 0.0;

    for(int i = 0; i<100; i++)
    {
        vec3 p = ro + rd * dist_travel;

        float d = map(p);

        dist_travel += d;

        if(d < 0.00001 || dist_travel > 20.0) break;
    }

    return dist_travel;
}

vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.1, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}


void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;

    // camera setup
    vec3 ray_origin = vec3(0.0, 0.0, 3.9);
    vec3 ray_direction = normalize(vec3(uv, -1.0));

    // raycast scene 
    float dist_travel = rayMarch(ray_origin, ray_direction);

    // simple coloring
    vec3 color = vec3(0.0);

    if(dist_travel < 20.0)
    {

        vec3 p = ray_origin + ray_direction * dist_travel * 1.1252515;
        if(p.y > -1.44 && p.y < 2.9){
            vec3 norm = calcNormal(p);
            float lightFx = sin(iTime * 0.5) * -30.5 + 0.5;
            float lightFx2 = 1.2 * sin(iTime * 0.5) * 4.5 - 5.5;
            vec3 sunDir = normalize(vec3(lightFx, lightFx2, 5.5));
            float diff = clamp(dot(norm, sunDir), 0.0, 1.0);

            float hue = iTime * 0.2;
            // color = hsv2rgb(vec3(hue, cell_uv.y, 1.0));
            vec2 center = p.xy - 2.2;
            float angle = atan(center.y, center.x) / (2.0 * 3.14159) + 0.5;
            float pattern2 = sin(p.x * 10.0 + iTime);
            float rotating_hue = (angle + hue * 0.2 + 0.2) + (pattern2 * 0.02);
            float controlled_hue = mod(rotating_hue, 0.01) * 0.016 + 0.535757943;
            color = hsv2rgb(vec3(controlled_hue, p.y + 0.9, 1.100))  * diff;
        }
        // color = vec3(0.8, 0.5, 0.3) * diff;
    }


    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
