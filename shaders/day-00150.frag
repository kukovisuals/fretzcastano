uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 150  🎃            
    
    ▓ Not much time today. Back from Vegas the sphere was 
    ▓ really fun. Top notch graphics
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define PI 3.14159265359
#define T iTime

mat2 R(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float map(vec3 p)
{
    vec3 newp = p;
    newp.z -= T * 2.4;
    newp = vec3(mod(newp, 1.0) - 0.5);
    newp.z *= 0.35;
    return length(newp) - 0.25;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(abs(d) < 0.001 || dt > 20.) break;
    }
    return dt;
}

vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.001, 0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0.0); //* vec3(0.0,0.6,0.4);
    uv *= R(T * 0.5);

    float cam_up = sin(T * 0.1) * 0.2 - 0.354; 
    float cam_x = cos(T * 0.3) * 0.3;
    vec3 ro = vec3(0,0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0)); 
    
    rd.y *= sin(rd.z * 4.6 + T * 0.1) * cos(rd.z + T * 0.2);
    float dt = rayMarch(ro, rd);
    
    if( dt < 10.0)
    {
        vec3 p = ro + rd * dt;
        //if(p.y > -1.1 && p.y < 0.214)
        {
            vec3 norm = calcNormal(p);
            vec3 L  = normalize(vec3(2, 3, 1));   
            float diff = clamp(dot(L, norm), 0.0, 1.0);
            vec3 halfV = reflect(-L, norm);
            float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
            spec = pow(spec, 24.0);
            float fx = sin(T * 2.5) * 10.5 + 15.5;
            float rim = pow(1.0 - max(dot(norm, -rd), 0.0), fx);

            vec3 bgCol = vec3(0.4, 0.1, 0.0);
            vec3 bgCol2 = palette(p.x, vec3(0.5), vec3(0.5), 
            vec3(0.5), vec3(0.2,0.6,0.6));
            vec3 lightCol = vec3(1);
            vec3 amber = 0.5 * vec3(0.6);
            vec3 specC = spec * lightCol * vec3(0.6);
            vec3 diffC = diff * lightCol * vec3(0.6);
            vec3 rimC = rim * vec3(10.8);
            vec3 mainLight = amber + specC + diffC;
            
            col = bgCol2 * mainLight * rimC;

            //col = vec3(rim);
            //col = norm;
        }
    }
    
    col = pow(col * 1.1, vec3(1.0/2.2));
    
    O = vec4(col,1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
