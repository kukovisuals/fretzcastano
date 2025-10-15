uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 64                 ▓
    ▓                   Noise                      ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                   SDFS                       ▓
    ▓                    Map                       ▓
    ▓               Grid Circles                   ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

mat2 rotate2D(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

float sdSphere(vec3 p, float r) { return length(p) - r;}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float map(vec3 p)
{
    vec3 n_p = p;
    n_p.xy = rotate2D(iTime * 0.12) * n_p.xy;
    // noise 
    float noise1 = noise3D(n_p * 2.0 + iTime * 0.1) * 0.305;
    // sphere vectors
    float speed = 0.2;
    float v_z = 1.0; float v_xy = 2.5; float v_r = 1.1;
    // fx
    float fx1 = pow(sin(iTime * speed ) * 1.0 + 0.8, 3.0);
    float fx2 = pow(sin(iTime * speed + 0.0) * 0.8 + 0.8, 3.0);
    float fx3 = pow(sin(iTime * speed + 0.0) * 0.8 + 0.8, 3.0);
    // sdf sphere
    float d1 = sdSphere(n_p + vec3(0.0,0.0, v_z - 0.4 + fx1), v_r + 0.3);
    float d3 = sdSphere(n_p + vec3(-v_xy + fx2,-v_xy, v_z ), v_r);
    float d4 = sdSphere(n_p + vec3( v_xy,-v_xy, v_z + fx3), v_r);
    float d5 = sdSphere(n_p + vec3(-v_xy, v_xy, v_z + fx3), v_r);
    float d6 = sdSphere(n_p + vec3( v_xy - fx2, v_xy, v_z), v_r);
    // sdf plane
    float d2 = n_p.z + 1.0;
    // noise 
    d3 -= noise1; d6 -= noise1; d4 -= noise1; d5 -= noise1;
    // Combine all spheres first
    float sp = smin(d1, d3, 1.5);
    sp = smin(sp, d4, 2.0);
    sp = smin(sp, d5, 2.0);
    sp = smin(sp, d6, 2.0);
    
    return smin(sp, d2, 1.0);
}

float gridLines(vec3 p)
{
    vec2 cell_p = mod(p.xy, 0.2) - 0.1;
    float center = length(cell_p);
    float circles = smoothstep(1.0, -1.0, (center - 0.08) / fwidth(center));
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
        if(d < 0.001 || dt > 20.) break;
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

vec3 phongLight(vec3 p, vec3 norm, vec3 baseColor, vec3 rd)
{
    vec3 lightDir   = normalize(vec3(0.0,0.0,3.0));
    vec3 viewDir    = normalize(-rd);
    float diff      = max(dot(norm, lightDir), 0.640);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec      = pow(max(dot(viewDir, reflectDir), 0.0), 1.0);

    return baseColor * (diff + spec * 0.46);
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

void colorPalette(int fx, vec2 uv, out vec3 bg, out vec3 rgbColor)
{
    if(fx == 1) {
        //bg = vec3(0.416,0.153,0.208);
        //bg = pal(uv.y,vec3(0.078,0.549,0.580),vec3(0.576,0.322,0.184),vec3(0.737,0.722,0.722),vec3(0.153,0.149,0.149) );
        bg = vec3(0.247,0.549,0.463);
    }   else if(fx == 2){
        bg = vec3(0.824,0.227,0.224);
        //bg = pal(uv.y,vec3(0.941,0.180,0.098),vec3(0.392,0.545,0.686),vec3(0.992,0.949,0.949),vec3(0.165,0.153,0.153) );
        //bg = vec3(0.851,0.212,0.267);
    }
    rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.373,0.,0.039),vec3(0.114,0.098,0.102),vec3(0.647,0.055,0.102) );
}

vec3 colorGird(vec3 norm, float grid, int fx, vec3 p)
{
    vec3 bg, rgbColor;
    colorPalette(fx, norm.xy, bg, rgbColor);
    return mix(rgbColor,bg, grid);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                   Main                       ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv.xy = rotate2D(iTime * 0.1) * uv.xy;
    uv *= 0.5;
    vec3 color = vec3(-uv.y);

    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0));
    float dt = rayDirection(ro,rd);

    if(dt < 20.)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);

        float grid = gridLines(p);

        vec3 baseColor = vec3(0.0);

        if(( p.y > 0.0)){
            baseColor = colorGird(norm, grid, 2, p);
        } else if (p.y < 0.0){
            baseColor = colorGird(norm, grid, 1, p);
        } else {
            baseColor = colorGird(norm, grid, 1, p);
        }

        vec3 light = phongLight(p, norm, baseColor, rd);

        color = light;
    }
    color = pow(color * 1.1, vec3(1.0/2.0));

    O = vec4(color, 1.0);
}






/*
    Today was the launch of a product of course it was stressful 
    now I have to setup another july sale so I feel like shaders 
    give me some peace some control when work is messy. 

*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
