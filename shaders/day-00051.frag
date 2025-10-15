uniform vec3 iResolution;
uniform float iTime; 


#define size 4.0
#define speed iTime * 0.6

float sdCircle( vec3 p, float r) { return length(p) - r;}
float sdTorus( vec3 p, vec2 t ){ return length( vec2(length(p.xz)-t.x,p.y) )-t.y;}
float opSmoothUnion( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float opDisplace( float primitive, in vec3 p )
{
    float d1 = primitive;
    float d2 = sin(size*p.x + speed)*cos(size*p.y)*sin(size*p.x + speed);
    return d1+d2;
}

float opTwist( float primitive, in vec3 p )
{
    const float k = 10.0; // or some other amount
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    float d2 = sin(size*p.x+speed)*sin(size*p.y)*sin(size*p.z+speed);
    return d2;
}

float map(vec3 p)
{   
    float r = 1.956;
    vec3 new_uv = p;
    // new_uv = fract(new_uv * 0.3) - 0.5; // shit doesn't work
    float d1 = sdCircle(p, r);
    float d2 = sdTorus(p, vec2(0.1342, 1.195312));
    d2 = opDisplace(d2, p);
    d2 += opTwist(d2, p);
    return opSmoothUnion(d1, d2, 0.9); 
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
    vec3 color = vec3(0.0);
    float pi = 3.1416;
    float pi2 = pi * 2.0;

    // init ray
    vec3 ray_origin = vec3(0.0, 0.0, -4.0);
    vec3 ray_direct = normalize(vec3(uv, 1.0));

    // total dst travel 
    float dst_travel = 0.0;
    float steps = 0.0; // track iteration count
    vec3 final_pos = vec3(0.0);

    // raymarch
    for(int i=0; i<80; i++)
    {
        vec3 p = ray_origin + ray_direct * dst_travel; // position along the ray
        float d = map(p); // current distance to the scene 
        dst_travel += d; // march ray
        steps += 1.0;
        final_pos = p;

        if(d < 0.001 || dst_travel > 20.0) break;
    }

    if(dst_travel < 10.0)
    {
        vec3 p = ray_origin + ray_direct * dst_travel;
        vec3 normal = getNormal(p);
        float d = map(p);
        float lightning = max(0.0, dot(normal, normalize(vec3(0.0, -0.3, -0.5))));
        // Height-based gradient (adjust range as needed)
        float height = p.y; // Use Y coordinate for height
        float heightNormalized = (height + 3.0) / 6.0; // Normalize to [0,1] range
        heightNormalized = clamp(heightNormalized, 0.0, 1.0);
        
        // Create white to blue gradient based on height
        vec3 lowColor = vec3(0.1, 0.6, 0.8);   // Deep blue for low areas
        vec3 highColor = vec3(0.98, 0.95, 1.); // White for high areas
        vec3 base_color = mix(lowColor, highColor, heightNormalized);
        
        // Enhanced brightness for higher areas
        float brightnessMult = 0.5 + heightNormalized * 0.9; // Range: 0.5 to 2.0
        
        // Apply lighting and height-based brightness
        color = base_color * lightning * brightnessMult;
        
        // Optional: Add some atmospheric glow effect
        vec3 atmosphereColor = vec3(0.364, 0.86, 1.0) * (1.0 - heightNormalized) * 0.33;
        color += atmosphereColor;
        
        // vec3 base_color = vec3(0.7, 0.7, 0.7);
        // color = base_color * lightning * 1.0;
        // color = vec3(dst_travel * 0.2);
    }
    color = pow(color * 1.2, vec3(1.0/2.2));


    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
