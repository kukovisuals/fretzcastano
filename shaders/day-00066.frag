uniform vec3 iResolution;
uniform float iTime; 


#define PI 3.14159265
#define T iTime
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                KuKo Day - 66                 ▓
    ▓                   SDFS                       ▓
    ▓                    Map                       ▓
    ▓               Grid Circles                   ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
mat2 rotate2D(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}
float sdSphere(vec3 p, float r){ return length(p) - r; }
float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b + r;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}
float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
// Hash function for pseudo-random numbers
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

/*
    Ai prompt: I have a grid of circles and I want to animate them. what I want to do is to read randomly a cell and tell the program hey I actually want you to go from opacity 1.0 to 0.0 and then go back to opacity 1.0. how can I do that.
*/

// Get animation phase for a specific cell
float getCellAnimation(vec2 cellID) {
    float cell_id = hash(cellID);
    // Animation parameters
    float fx_1 = 0.60;  // Duration of one fade cycle (out + in)
    float speed = 0.5;     // How often animations trigger
    // Create a time offset based on cell hash so animations don't all sync
    float offset = cell_id * 10.0;
    float phi = T * speed + offset;
    // Determine if this cell should be animating
    float delta = 0.1; // 10% chance per cycle
    float i = step(hash(cellID + floor(phi / (fx_1 * 2.0))), delta);
    if (i < 0.5) {
        return 1.0; // Not animating, full opacity
    }
    // Calculate fade animation (0->1->0 over fx_1)
    float localTime = mod(phi, fx_1);
    float fadePhase = localTime / fx_1;
    // Create a fade out and fade in cycle
    float opacity;
    if (fadePhase < 0.5) {
        // Fade out: 1.0 -> 0.0
        opacity = 1.0 - (fadePhase * 2.0);
    } else {
        // Fade in: 0.0 -> 1.0
        opacity = (fadePhase - 0.5) * 2.0;
    }
    return opacity;
}

float map(vec3 p)
{   
    vec3 new_p = p;
    float fx_v = cos(T * 0.1 ) * 1.0 + 1.0;
    new_p.x -= pow(fx_v, 0.9) * 4.3;
    float d1 = sdSphere(new_p + vec3(0.0,0.,0.2), 1.5);
    float d3 = sdRoundBox(new_p + vec3(8.0,0.,0.0), vec3(0.95,0.95,0.95), 0.0);
    float d2 = new_p.z - 0.0;
    
    float sp = smin(d1, d3, 0.0);
    return smin(sp, d2, 4.0);
}

float gridLines(vec3 p)
{
    vec3 new_p = p;
    vec2 cell_p = mod(new_p.xy, 0.3) - 0.15;
    
    // Get the cell ID for animation
    vec2 cellID = floor(new_p.xy / 0.3);
    float cellOpacity = getCellAnimation(cellID);
    
    float center = length(cell_p);
    float circles = smoothstep(
        0.12 + fwidth(center),   
        0.12 - fwidth(center),   
        center);
    
    // Apply cell-specific opacity animation
    circles *= cellOpacity;
    
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
        if(d < 0.001 || dt > 20.0) break;
    }
    return dt;
}

vec3 calcNorm(vec3 p)
{
    vec2 e = vec2(0.0001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yxx) - map(p - e.yxx)
    ));
}

vec3 phongLight(vec3 p, vec3 rd, vec3 color_b)
{
    vec3 norm = calcNorm(p);
    vec3 lightDir = normalize(vec3(0.0,0.0,1.0));
    vec3 viewDir = normalize(-rd);
    float diff = max(dot(norm, lightDir), 0.6);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir),0.0), 1.0);

    return color_b * (diff + spec * 0.9);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                   Color                      ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    rgbColor = vec3(0.051,0.043,0.043);
    bg  = vec3(0.149,0.129,0.133);         
    
    // play to understand palette
    // rgbColor = pal(uv.y,vec3(0.0, 0.0, 0.2),vec3(1.0, 0.0,0.0),vec3(0.5, 0.9,0.1),vec3(0.3, 5.0, 0.5) );
    if(effectIndex == 0){
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.082,0.067,0.071),vec3(0.114,0.098,0.102),vec3(0.157,0.161,0.157) );
    }   else if(effectIndex == 1) {
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.373,0.,0.039),vec3(0.114,0.098,0.102),vec3(0.647,0.055,0.102) );
    }   else if(effectIndex == 2){
        bg = vec3(0.933,0.298,0.231);
        rgbColor = pal(uv.y,vec3(0.0017,0.0241,0.165),vec3(0.01133,0.0907,0.0619),vec3(0.57, 0.239, 0.232),vec3(0.1, 0.15, 0.3) );
    }   else if(effectIndex == 3){
        bg = vec3(0.922,0.275,0.188);
        rgbColor = pal(uv.y, vec3(0.275,0.173,0.208),vec3(0.13,0.033,0.003), vec3(0.384,0.212,0.188),vec3(0.31,0.173,0.184) );
    }   else if(effectIndex == 4){
        bg = vec3(0.631,0.847,0.969);
        rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }   else {
        bg = vec3(0.631,0.847,0.969);
        rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }
}


vec3 colorGird(vec3 p, float grid)
{
    float dist = length(p.xy);
    float gradFact = smoothstep(0.0, 9.0, dist);

    vec3 blue = vec3(0.012,0.651,0.651);
    blue = vec3(0.016,0.467,0.749);
    blue = vec3(0.012,0.224,0.651);
    vec3 white = vec3(1.0);
     // Get current palette index based on time
    int paletteIndex = int(mod(T * 0.02, 4.0));
    
    vec3 bg, rgbColor;
    colorPalette(paletteIndex, p.xy, bg, rgbColor);
    
    // Create color gradient based on distance
    vec3 dotColor = mix(rgbColor, bg, gradFact * 0.5);

    return mix(vec3(0.0), dotColor, grid);
}

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                   Main                       ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 1.6;

    vec3 color = vec3(-uv.y);

    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0));
    float dt = rayDirection(ro, rd);

    if(dt < 20.0)
    {
        vec3 p = ro + rd * dt;
        float grid = gridLines(p);
        vec3 color_b = colorGird(p, grid);
        vec3 light = phongLight(p, rd, color_b);
        color = light;
    }
    color = pow(color * 1.0, vec3(1.1 / 2.0));
    // color = vec3(dt * 0.2);

    O = vec4(color, 1.0);
}



/*
    mk estoy vuelto mieda 
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
