uniform vec3 iResolution;
uniform float iTime; 

#define PI 3.14159265

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

mat2 rotateX(float a){
    return mat2(
        cos(a), -sin(a),
        sin(a), cos(a)
    );
}

float sdMoon(vec2 p, float d, float ra, float rb, vec2 uvId )
{
    if(uvId.x > -1.0 && uvId.y > -1.5){
        p = rotateX(PI/1.4) * p;
    } else if (uvId.x < -1.0 && uvId.y < -0.5){
        p = rotateX(PI/0.4) * p;
    }
    p.y = abs(p.y);
    float a = (ra*ra - rb*rb + d*d)/(2.0*d);
    float b = sqrt(max(ra*ra-a*a,0.0));
    if( d*(p.x*b-p.y*a) > d*d*max(b-p.y,0.0) )
          return length(p-vec2(a,b));
    return max( (length(p          )-ra),
               -(length(p-vec2(d,0))-rb));
}
float opOnion( in vec2 p, in float r, vec2 uvId )
{
    float sinFx = sin(iTime * 10.0) * 0.1 + 0.1;
    return abs(sdMoon(p * 7.0, 0.34 + sinFx, 0.5, 0.573, uvId)) / 7.0 - r;
}


void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    vec2 uvId = floor(uv * 1.0) - 0.5;
    vec2 newUv = fract(uv * 1.0) - 0.5;

    vec3 color = vec3(0.0);

    const int SHAPE_COUNT = 10;
    vec2 positions[SHAPE_COUNT] = vec2[](
        vec2(-0.049,  0.054), vec2(-0.3525, -0.065), vec2(-0.3141, -0.294), vec2( 0.122,  -0.330), vec2( 0.352370, -0.144),
        vec2(0.01435,  -0.1350), vec2(-0.3410,  0.34315), vec2( -0.050,  0.322), vec2( 0.3128,  0.412), vec2( 0.2440,  0.160)
    );

    for(int i=0; i<SHAPE_COUNT; i++)
    {
        
       float m2 = opOnion(newUv - (positions[i]) , 0.001, uvId);
        m2 = smoothstep(0.02, 0.0, m2);

        vec3 blue = vec3(0.0, 0.5, 0.9);
        vec3 black = vec3(0.0);

        color += mix(black, blue, m2);
    }

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
