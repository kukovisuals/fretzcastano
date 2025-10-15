uniform vec3 iResolution;
uniform float iTime; 

#define PI 3.14159265

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
float sdSphere(vec3 p, float r)
{ 
    float fx = sin(iTime * 0.6) * 0.7 + 1.0;
    return length(p + vec3(0.0, 0.0, 1.4 - fx)) - r;
}
mat2 rotate2D(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}
float map(vec3 p){
    vec3 new_p = p;
    float theta_fx = -PI/8.0 * (sin(iTime * 0.3) * 0.5 + 0.5);
    new_p.yz = rotate2D(theta_fx) * new_p.yz;
    float sphere = sdSphere(new_p, 1.4);
    float plane = new_p.z + 0.5;
    return smin(sphere, plane, 3.9);
}
float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<70; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d < 0.0001 || dt > 20.) break;
    }
    return dt;
}
vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.0001, 0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yxx) - map(p - e.yxx)
    ));
}

vec3 phongLight(vec3 norm, vec3 lightDir, vec3 viewDir, vec3 baseColor)
{
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 3.0);

    return baseColor * (diff + spec * 0.5);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float gridLines(vec2 p)
{
    // Calculate shape factor
    float shapeX = smoothstep(0.0, 0.05, mod(p.x, 0.3) - 0.27);
    float shapeX2 = smoothstep(0.0, 0.05, mod(-p.x, 0.3)- 0.27);
    float shapeY = smoothstep(0.0, 0.05, mod(p.y, 0.3) - 0.27);
    float shapeY2 = smoothstep(0.0, 0.05, mod(-p.y, 0.3) - 0.27);
    return shapeX + shapeX2 + shapeY + shapeY2;
}

vec3 colorGird(vec3 norm, float finalShape)
{
    float color_fx = smoothstep(0.0,1.0, (norm.x) +  0.5) ;
    float hue = color_fx * 0.2 + 0.53;
    vec3 rgbColor = hsv2rgb(vec3(hue, 0.99, 1.0));
    return mix(rgbColor, vec3(1.0), finalShape);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(-uv.y);

    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayDirection(ro, rd);
    if( dt < 20.0)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        vec3 lightDir = normalize(vec3(0.0,0.0,3.0));
        vec3 viewDir = normalize(-rd);

        float finalShape = gridLines(p.xy);
        
        vec3 shapeColor = colorGird(norm, finalShape);

        vec3 light = phongLight(norm, lightDir, viewDir, shapeColor);
        
        color = light;
        // color = norm * 0.5 + 0.5;
    }
    color = pow(color * 1.0, vec3(1.0/2.2));
    // color = vec3( dt * 0.2);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
