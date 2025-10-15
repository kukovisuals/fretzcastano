uniform vec3 iResolution;
uniform float iTime; 

#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )

// fabrice -> https://www.shadertoy.com/view/4dKSDV
float rand(vec2 p) {                  // cheap 2‑D hash → [0,1)
    return fract(sin(dot(p, vec2(27.13, 91.17))) * 43758.5453);
}

vec3 voronoiVarRadius(vec2 p, float dt) {
    vec2  base   = floor(p);         
    vec3  dists  = vec3(9.0); 
    float differ;       

    for(int j = -3; j <= 3; ++j)
    for(int i = -3; i <= 3; ++i) {
        vec2 cell  = base + vec2(i, j);         
        vec2 site  = cell + H(cell) + 0.05 * sin(dt + 6.28 * H(cell));            
        float r    = mix(0.5, 3.0, rand(cell) ); 

        differ = length(p - site) - r;         
        differ *= differ;                                 

        differ < dists.x ? (dists.yz = dists.xy, dists.x = differ) :
        differ < dists.y ? (dists.z  = dists.y , dists.y = differ) :
        differ < dists.z ?                dists.z = differ  :
                       differ;
    }
    return dists;   // x = F1², y = F2², z = F3²
}

vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        // diff   = H(cellId) + cellId - p;
        diff = H(cellId) + cellId + 0.05 * cos(dt + 6.28 * H(cellId)) - p;

        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    rgbColor = vec3(0.051,0.043,0.043);
    // bg = vec3(0.416,0.153,0.208);
    // rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.373,0.,0.039),vec3(0.04114,0.098,0.102),vec3(0.9647,0.055,0.102) );
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
        bg = vec3(0.333,0.373,0.49);
        rgbColor = pal(uv.y,vec3(0.063,0.035,0.176),vec3(0.094,0.09,0.325),vec3(0.094,0.067,0.298),vec3(0.333,0.373,0.49) );
    }   else {
        bg = vec3(0.631,0.847,0.969);
        rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }
}

int effectIndex = 0;


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    float dt = iTime;
    vec2 uv = 1.5 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;

    uv.x += dt * 0.1;   

    float scale2 = floor(rand(iResolution.xy) * 1.0) + 6.0;
    vec3 d1 = voronoiDistSq(uv * 1.0, dt);  
    vec3 d2 = voronoiVarRadius(uv * scale2, dt);  

    float w   = 3.0;
    float edgeDist = sqrt(d1.y) - sqrt(d1.x);
    float mask = smoothstep( w, 0.0, edgeDist ) *
                 smoothstep(-w, 3.0, -edgeDist);     
    
    vec3 col2 = 20.0 * sqrt(d2);
    col2 -= vec3(col2.x);
    col2 += 5.0 * ( col2.y / (col2.y / col2.z + 1.0) - 0.5 ) - col2;

    vec3 col1 = 4.0 * sqrt(d1);
    col1 -= vec3(col1.x);
    col1 += 8.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    // vec3 finalColor = col1;
    vec3 finalColor = mix( col1, col2, mask );

    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColor;
    int effectIndex = int(mod(dt / 10.0, 6.0));
    colorPalette(effectIndex, uv, bg, rgbColor);
    
    vec3 color = mix(rgbColor,bg , finalColor);

    fragColor = vec4( color, 1.0 );
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
