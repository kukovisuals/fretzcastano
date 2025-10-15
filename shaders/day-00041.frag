uniform vec3 iResolution;
uniform float iTime; 

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}
// sigmoid
float smin( float a, float b, float k )
{
    k *= log(2.0);
    float x = b-a;
    return a + x/(1.0-exp2(x/k));
}
float sdSpahere(vec3 p){ return length(p) - 0.15;}
float map(vec3 p)
{
    vec3 q = p;
    q.y += iTime * 0.2;
    q.z += iTime * 1.0;
    q = fract(q * 0.6) - 0.5;
    float d = sdSpahere(q);

    float ground = p.y + 1.4675;
    // Create wavy hands
    vec3 handPos = q;
    // Add wave displacement based on X position (along the capsule length)
    handPos.y += sin(handPos.x * 4.0 * 1.0 * 3.14159 + iTime * 2.0) * 0.08;  // 8 complete cycles
    handPos.z += cos(handPos.x * 2.0 * 1.0 * 3.14159 + iTime * 1.5) * 0.04; // 6 complete cycles
    
    float hands = sdCapsule(handPos, vec3(-0.5,-0.0,-0.0), vec3(0.5,0.0,0.0), 0.0315);
    return smin(ground, smin(d, hands, 0.08), 0.1);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;

    // init
    vec3 rayOrigin = vec3(0.0, 0.0, -3.0);
    vec3 rayDirect = normalize(vec3(uv, 1.0));

    float distT = 0.0;  // total distance travel
    
    vec3 color = vec3(0.0);
    int i;// Raymarching 
    for(i=0; i<80; i++)
    {
        vec3 p = rayOrigin + rayDirect * distT; // position along the ray 

        float d = map(p);                       // current distance to the scene

        distT += d;                             // march the ray

        if(d < 0.001 || distT > 12.0) break;
    }
    // Color calculation AFTER raymarching
    if(distT < 12.0) // We hit something
    {
        // Calculate the hit position
        vec3 hitPos = rayOrigin + rayDirect * distT;
        
        if(hitPos.y > -1.44 && hitPos.y < 1.0){
            // Apply your color effect using the 3D hit position
            float hue = (iTime * 0.01) * 0.2 + 0.2;
            vec3 center = hitPos - 0.5;
            float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
            float circle = length(hitPos - 0.5) - 0.5;
            circle = sin(circle * 1. + iTime * 0.1);
            float rotate_hue = (angle + hue) + (circle * 0.3);
            float conHue = mod(rotate_hue, 0.4) * 0.5 + 0.6;
            color = hsv2rgb(vec3(conHue, 0.8, 0.9));
        }
    }
    else
    {
        // Background color (didn't hit anything)
        // color = vec3(distT * 0.01 + float(i) * 0.005);
        color = vec3(0.0);
    }

    O = vec4(color, 1.0);
}
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
