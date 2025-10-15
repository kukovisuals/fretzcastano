uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              KuKo Day - 62                   ▓
    ▓                                              ▓
    ▓                   SDFS                       ▓
    ▓                    Map                       ▓
    ▓               Grid Circles                   ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
float sdSphere(vec3 p, float r)
{
    float fx = sin(iTime * 0.3) * 1.5 + 1.5;
    return length(p + vec3(0.0, 0.0, 2.5 - fx)) - r;
}
float sdSphereTwo(vec3 p, float r)
{
    float fx = 0.0 - sin(iTime * 0.3) * 2.0 + 1.5;
    return length(p + vec3(0.0, 0.0, 2.5 - fx)) - r;
}
float map(vec3 p)
{
    vec3 d1_off = vec3(3.5,0.0,0.0);
    vec3 d1b_off = vec3(-3.5,0.0,0.0);
    float d1 = sdSphere(p + d1_off, 1.5);
    float d1b = sdSphere(p + d1b_off, 1.5);
    float d1c = sdSphereTwo(p, 1.0);
    float d2 = p.z + 1.0;
    return smin(smin(smin(d1, d1c, 5.0), d1b, 5.0), d2, 5.0);
}
float gridLines(vec3 p)
{
    vec2 cell_p = mod(p.xy, 0.5) - 0.3;
    float center = length(cell_p);
    float circles = 1.0 - smoothstep(0.2, 0.2, center);
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
    for(int i=0; i< 80; i++)
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
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
vec3 colorGird(vec3 norm, float grid)
{
    float color_fx = smoothstep(0.0,1.0, (-norm.x) +  0.8) ;
    float hue =  color_fx * 0.2 + 0.3313;
    float hue2 =  color_fx * 0.3 + 0.8313;
    vec3 rgbColor = hsv2rgb(vec3(hue, 0.99, 1.0));
    vec3 rgbColorTwo = hsv2rgb(vec3(hue2, 0.99, 1.0));
    return mix(rgbColorTwo, rgbColor, grid);
    // return rgbColor;
}
vec3 colorGirdTwo(vec3 norm, float grid)
{
    float color_fx = smoothstep(1.0,0.1, (-norm.x) +  0.5) ;
    float hue =  color_fx * 0.1 - 0.56;
        float hue2 =  color_fx * 0.3 + 0.9;
    vec3 rgbColor = hsv2rgb(vec3(hue, 0.99, 1.0));
    vec3 rgbColorTwo = hsv2rgb(vec3(hue2, 0.99, 1.0));
    return mix(rgbColorTwo,rgbColor , grid);
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

    vec3 ro = vec3(0.,0.,3.);
    vec3 rd = normalize(vec3(uv, -1.0));
    float dt = rayDirection(ro, rd);

    if(dt < 20.)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        vec3 lightDir = normalize(vec3(0.0,0.0,1.0));
        vec3 viewDir = normalize(rd);

        float grid = gridLines(p);

        vec3 baseColor = vec3(0.0);
        if(p.x > 0.0)
        {
            baseColor = colorGird(norm, grid);
        } else {
            baseColor = colorGird(norm, grid);
            //baseColor = colorGirdTwo(norm, grid);
        }

        vec3 light = phongLight(p, norm, lightDir, viewDir, baseColor);

        color = light;
    }
    color = pow(color * 1.2, vec3(1.0/0.3));
    // color = vec3(dt * 0.2);
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
