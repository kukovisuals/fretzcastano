uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                KuKo Day - 65                 ▓
    ▓                   SDFS                       ▓
    ▓                    Map                       ▓
    ▓               Grid Circles                   ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime

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
    // sphere vectors
    float v_z = 1.0; float v_xy = 2.5; float v_r = 1.1;
    // sdf sphere
    float d1 = sdSphere(n_p + vec3(0.0,0.0, v_z - 0.59), v_r + 1.4);
    // fract
    vec3 fr_p = p;
    fr_p.z -= T * 0.1;
    fr_p = fract(fr_p * 1.3) - 0.5;
    // Mask
    float mask_distance = sdSphere(n_p + vec3(0.0,0.0, v_z - 4.059), v_r + 2.0); // Slightly larger than d1
    float d3;
    if(mask_distance > 0.0) {  
        d3 = 1000.0;  
    } else {
        d3 = sdSphere(fr_p, 0.05);
    }
    // sdf plane
    float d2 = n_p.z + 0.0;
    
    float sp = smin(d1, d3, 0.5);

    return smin(sp, d2, 2.0);;
}

float gridLines(vec3 p)
{
    vec2 cell_p   = mod(p.xy, 0.2) - 0.1;
    float center  = length(cell_p);
    float circles = smoothstep(1.0, -1.0, (center - 0.09) / fwidth(center));
    float dist    = length(p.xy);
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
    vec3 lightDir   = normalize(vec3(0.0,0.0,1.0));
    vec3 viewDir    = normalize(-rd);
    float diff      = max(dot(norm, lightDir), 0.640);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec      = pow(max(dot(viewDir, reflectDir), 0.0), 1.0);

    return baseColor * (diff + spec * 1.5846);
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
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    
    if(effectIndex == 2){
        bg = pal(uv.y, vec3(0.4275,0.05173,0.1208),vec3(0.13,0.033,0.003), vec3(0.384,0.212,0.188),vec3(0.31,0.173,0.184) );
        rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }   else {
        rgbColor = vec3(0.01);
        bg  = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }
}

vec3 colorGird(vec3 norm, float grid, int i, vec3 p)
{
    vec3 bg, rgbColorTwo;
    colorPalette(i, norm.xy, bg, rgbColorTwo);
    return mix(bg, rgbColorTwo, grid);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                   Main                       ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv.xy = rotate2D(T * 0.06) * uv.xy;
    uv *= 0.65;
    vec3 color = vec3(0.0);

    vec3 ro = vec3(0.0,0.0,4.0);
    vec3 rd = normalize(vec3(uv, -1.0));
    float dt = rayDirection(ro,rd);

    if(dt < 10.)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);

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
        
        vec3 light = phongLight(p, norm, baseColor, rd);
        color = light;
    }
    color = pow(color * 1.0, vec3(1.0/2.0));

    O = vec4(color, 1.0);
}






/*
    Mega cansado hoy toco hacer el launch de july 4th sale 
    No hay mucho tiempo pa shaders me toca seguir terminando
    esta chimbada de discounts 
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
