uniform vec3 iResolution;
uniform float iTime; 


/*
    * The goal was to make some hands waving, coming from a circle 
    * I connected them like neurons but then I was okay with the hands on the side 
    * As I tried to connect them on on the z direction I noticed it looked more fun 
    * On the y direction. There is some alising on the border not sure how to fix it 
    * if you know that would be cool 
    * I was listening to the song https://www.youtube.com/watch?v=qQIqKCMQszg
    * A bit of mid/high tempo ~126 bpm will look nice 
*/
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
    q.y += iTime * 0.3;
    q.z -= iTime * 0.3;
    q = fract(q * 0.6) - 0.5;
    float d = sdSpahere(q);

    float ground = p.y + 1.4675;
    // Create wavy hands
    vec3 handPos = q;
    vec3 handPosTwo = q;
    // Add wave displacement based on X position (along the capsule length)
    handPos.y += sin(handPos.x * 6.0 * 1.0 * 3.14159 + iTime * 4.0) * 0.03;  // 8 complete cycles
    handPos.z += cos(handPos.x * 4.0 * 1.0 * 3.14159 + iTime * 1.5) * 0.02; // 6 complete cycles
    
    handPosTwo.z += sin(handPosTwo.x * 10.0 * 1.0 * 3.14159 + iTime * 1.0) * 0.08;  // 8 complete cycles
    handPosTwo.y += cos(handPosTwo.x * 10.0 * 1.0 * 3.14159 + iTime * 10.0) * 0.09; // 6 complete cycles
    
    float hands = sdCapsule(handPos, vec3(-0.5,-0.0,-0.0), vec3(0.5,0.0,0.0), 0.0315);
    float handsTwo = sdCapsule(handPosTwo, vec3(-0.0,-0.3,-0.0), vec3(0.0,0.3,0.0), 0.01315);
    return smin(smin(handsTwo, ground, 0.2), smin(d, hands, 0.03), 0.06);
    // return smin(d, hands, 0.08);
}

vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.0001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

vec3 applyColor(vec3 p, float diff){
    float hue = (iTime * 0.02) * 0.2 + 0.2;
    vec2 center = p.xy - 0.5;
    float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
    float pattern3 = sin(p.z * 0.5 - iTime * 0.03) * cos(p.y * 1.0 - iTime * 0.03);
    float pattern1 = sin(p.x * 0.4 - iTime * 0.01);
    float rotate_hue = (angle + hue) + (pattern1 + pattern3 * 0.5);
    float conHue = mod(rotate_hue, 0.3) * 0.398 + 0.45;
    return hsv2rgb(vec3(conHue, 1.5, 1.0)) * diff;
}

float rayMarch(vec3 rayOrigin, vec3 rayDirection)
{
    float distTravel = 0.0;
    for(int i=0; i<100; i++)
    {
        vec3 p = rayOrigin + rayDirection * distTravel; // position along the ray

        float d = map(p); // current distance to the scen 

        distTravel += d;// march ray

        if(d < 0.00001 || distTravel > 20.0) break;
    }

    return distTravel;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2. * I - iResolution.xy) / iResolution.y;

    vec3 color = vec3(-uv.y);
    // init camera 
    vec3 rayOrigin    = vec3(0.0, 0.0, 3.0); // ray origin
    vec3 rayDirection = normalize(vec3(uv, -1.0)); // ray direction  
    
    // total distance travel 
    float distTravel = rayMarch(rayOrigin, rayDirection); // Raymarching 
    
    if(distTravel < 10.0){
        vec3 p = rayOrigin + rayDirection * distTravel; // position along the ray

        if( p.y < 1.0)
        {
            vec3 norm = calcNormal(p);
            float lightFx = sin(iTime * 3.5) * -0.5 + 0.5;
            float lightFx2 = 3.2 * sin(iTime * 2.0) * 0.2 - 0.4;
            vec3 sunDir = normalize(vec3(lightFx, lightFx2, 0.5));
            float diff = clamp(dot(norm, sunDir), 0.0, 1.0);
            // Apply your color effect using the 3D hit position
            color = applyColor(p, diff);
        }
    }
    O = vec4(color, 1.0 );
}
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
