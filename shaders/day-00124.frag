uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 124  🌟                
    
    ▓  Branching practice. The goal now is to keep writing the 
    ▓  the same algo until it sticks, playing with the branches
    ▓  and so on. The goals was to make random trees. Then I 
    ▓  wanted to add a road and it turned into a water road. 
    
    ▓  Based on @sillsm
    ▓  https://www.shadertoy.com/view/XtyGzh
     
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define SPEED iTime * 0.5

float hash21(vec2 p) {
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x*p.y);
}

mat3 R(float a)
{
    float c = cos(a), s = sin(a);
    return mat3(c,s,0, -s,c,0, 0,0,1);
}

mat3 desp(vec2 d)
{
    return mat3(1,0,0, 0,1,0, d,1);
}

float sdCylinder(vec2 p, vec2 h)
{
    p -= vec2(0, h.y);
    vec2 d = abs(vec2(length(p.x),p.y)) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec2 grass2(vec2 p)
{
    const float LEN0   = 0.076;
    const float WID    = 0.0001;
    const float ANGLE  = radians(20.5);
    
    const int TOTAL    = 1024;
    const int DEPTH    = 5;
    const int BRANCH   = 4;
    
    p.x += iTime * 0.15;
    p.y += 0.5;
    
    vec2 cell = vec2(0.3, 0.6);
    vec2 id   = floor(p / cell);
    
    p = mod(p * 1.0, cell) - 0.5 * cell;
    
    float dBranch = sdCylinder(p, vec2(WID, LEN0));
    float dLeaf   = 1e5;
    
    mat3 posR = R(-ANGLE);
    mat3 negR = R( ANGLE);
    
    // add randomness
    float ran  = mix(0.1, 4.0, hash21(id));
    float ran1 = mix(0.5, 3.0, hash21(id));
    
    int c = 0;
    for(int iter = 0; iter < TOTAL && c < TOTAL; iter++)
    {
        vec2  pLoc = p;
        int   off  = TOTAL; 
        float l    = LEN0; 
     
        for(int i = 1; i <= DEPTH; i++)
        {
            l   *= 0.5;
            off /= BRANCH;
            
            int dec  = c / off;
            int path = dec - BRANCH * (dec / BRANCH);
            
            mat3 wind0 = R(0.3 * sin(SPEED + 6.2));
            mat3 wind1 = R(0.3 * sin(SPEED + 1.0));
            
            mat3 mx;
            if(path == 0){
                mx =         posR * desp(vec2(0, -1.0  *l));
            } else if(path == 1){
                mx = wind0 * negR * desp(vec2(0, -ran1 *l));
            } else if(path == 2){
                mx = wind1 * negR * desp(vec2(0, -ran  *l));
            } else {
                mx =         posR * desp(vec2(0, -4.0  *l));
            }
            
            pLoc = (mx * vec3(pLoc, 1)).xy;
            
            float y = sdCylinder(pLoc, vec2(WID, l));
            
            if(y - 2.0 * l > 0.0){
                c += off - 1;
                break;
            }
            
            if(i == DEPTH - 3){
                float rLeaf = 0.3 * l;
                float leaf  = length(pLoc - vec2(0, 3.0 * l)) - rLeaf;
                
                dLeaf = min(dLeaf, leaf);
            }
            dBranch = min(dBranch, y);
        }
        c++;
    }
    return vec2(dBranch, dLeaf);
}

float glowFromSD(float sd, float px, float widthPx) {
    float x = max(sd, 0.0) / (widthPx * px); 
    return exp(-x*x);                        
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    vec3 col = vec3(0);
    
    vec2 g = grass2(uv);
    vec2 d = g; 
    
    float px = 1.0 / iResolution.y;
    
    float wb = 0.0001;
    
    float mainBranch = smoothstep(wb + 3.0 * px, wb - px, d.x);
    float mainLeaf   = smoothstep(0.0, -2.0 * px, d.y);
    
    vec3 bgColor   = vec3(0);
    vec3 roadCol   = vec3(0.012,0.471,0.651);
    vec3 branchCol = vec3(0.2, 0.9, 0.8);
    vec3 leafCol   = vec3(0.5, 0.1, 0.3);
    
    col = mix(bgColor, branchCol, mainBranch);
    col = mix(col, leafCol, mainLeaf);
        
    float halo = glowFromSD(d.y, px, 5.0);           
    col += leafCol * (0.15 * halo);                  
    col += leafCol * 1.0 * smoothstep(6.0*px, 0.0, d.y);
    
    // fx of the water road
    uv.y += 0.21;
    uv.x += iTime * 0.05;
    uv.y += sin(4.3 * uv.x + iTime) * 0.03;
    
    // road
    float rectBase = mod(uv.y * 1.7, 1.0) - 0.5 * 1.2;
    float roadDown = smoothstep(0.0, 0.1, rectBase);
    float roadUp   = 1.0 - smoothstep(0.3, 0.4, rectBase);
    float road     = roadUp * roadDown;
    
    col += mix(bgColor, roadCol, road);
    
    // lines of the road
    float lineBase = mod((uv.y * 10.2), 6.0) - 4.9;
    float lineDown = smoothstep(0.0, 0.3, lineBase);
    float lineUp   = 1.0 - smoothstep(0.3, 0.4, lineBase);
    float lines    = lineUp * lineDown;
    
    // dash frequency
    float dashPatt = mod(uv.x * 3.0, 2.0); 
    float dashes   = smoothstep(0.3, 0.7, dashPatt) 
                   * smoothstep(1.7, 1.3, dashPatt);

    float dashedLines = lines * dashes;
    
    col += mix(bgColor, leafCol * 1.0, dashedLines);
    
    O = vec4(col, 1.0);
}









void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
