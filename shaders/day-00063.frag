uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              KuKo Day - 63                   ▓
    ▓                                              ▓
    ▓                   SDFS                       ▓
    ▓                    Map                       ▓
    ▓               Grid Circles                   ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
mat2 rotate2D(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
float sdSphere(vec3 p, float r)
{
    vec3 new_p = p; 
    new_p.zx = rotate2D(iTime) * new_p.zx;
    return length(new_p) - r;
}
float map(vec3 p)
{
    float speed = 1.5;
    float d1_fx = pow(sin(iTime * speed) * 1.0 + 0.8, 3.0);
    float d1_fx_two = pow(sin(iTime * speed + 3.0) * 1.0 + 0.8, 3.0);
    float d1 = sdSphere(p + vec3(0.0,0.0, 0.5 + d1_fx), 2.0);
    float d3 = sdSphere(p + vec3(-4.0,-2.0, 1.5 + d1_fx_two ), 2.0);
    float d4 = sdSphere(p + vec3( 4.0,-2.0, 1.5 + d1_fx_two), 2.0);
    float d5 = sdSphere(p + vec3(-4.0, 2.0, 1.5 + d1_fx_two), 2.0);
    float d6 = sdSphere(p + vec3( 4.0, 2.0, 1.5 + d1_fx_two), 2.0);
    float d2 = p.z + 1.0;
    // Combine all spheres first
    float spheres = smin(d1, d3, 1.0);
    spheres = smin(spheres, d4, 1.0);
    spheres = smin(spheres, d5, 1.0);
    spheres = smin(spheres, d6, 1.0);
    return smin(spheres, d2, 3.0);
}
float gridLines(vec3 p)
{
    vec2 cell_p = mod(p.xy, 0.2) - 0.1;
    float center = length(cell_p);
    float circles = 1.0 - smoothstep(0.08, 0.08, center);
    float dist = length(p.xy);
    return circles;
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓               Ray Direction                  ▓
    ▓                  Normal                      ▓
    ▓                   Light                      ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<80; i++)
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
    vec2 e = vec2(0.0001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yxx) - map(p - e.yxx)
    ));
}
vec3 phongLight(vec3 p, vec3 norm, vec3 lightDir, vec3 viewDir, vec3 baseColor)
{
    
    float diff = max(dot(norm, lightDir), 0.40);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 2.0);

    return baseColor * (diff + spec * 0.6);
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                   Color                      ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}
void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){    
    if(effectIndex == 2){
        rgbColor = pal(uv.y,vec3(0.0017,0.0241,0.165),vec3(0.01133,0.0907,0.0619),vec3(0.57, 0.239, 0.232),vec3(0.1, 0.15, 0.3) );
    }   else {
        rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }
    bg = vec3(0.631,0.847,0.969);
}

vec3 colorGird(vec3 norm, float grid, int effectIndex, vec3 p)
{
    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColorTwo;
    colorPalette(effectIndex, norm.xy, bg, rgbColorTwo);
    return mix(bg, rgbColorTwo, grid);
    // return rgbColor;
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                   Main                       ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(-uv.y);

    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayDirection(ro, rd);

    if(dt < 20.)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        vec3 lightDir = normalize(vec3(0.0,0.0,3.0));
        vec3 viewDir = normalize(-rd);

        float grid = gridLines(p);

        vec3 baseColor = vec3(0.0);

        if((p.x > 0.0 && p.y > 0.0))
        {
            baseColor = colorGird(norm, grid, 2, p);
        } else if (p.x < 0.0 && p.y < 0.0){
            baseColor = colorGird(norm, grid, 2, p);
        } else {
            baseColor = colorGird(norm, grid, 5, p);
        }

        vec3 light = phongLight(p, norm, lightDir, viewDir, baseColor);

        color = light;
    }
    color = pow(color * 1.2, vec3(1.0/2.0));
    // color = vec3(dt * 0.2);
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
