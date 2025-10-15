uniform vec3 iResolution;
uniform float iTime; 

// fabrice -> https://www.shadertoy.com/view/4dKSDV
#define ANIMATE
#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float rand(vec2 p) {                  // cheap 2‑D hash → [0,1)
    return fract(sin(dot(p, vec2(27.13, 91.17))) * 43758.5453);
}


vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        diff   = H(cellId) + cellId - p;

        diff += 0.0 + 0.1 * sin(dt * 1.0 + 9.28318 * diff) 
            * atan(dt * 0.5 + 1.128318 * diff);

        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}

vec3 voronoiVarRadius(vec2 p, float dt) {
    vec2  base   = floor(p);         
    vec3  dists  = vec3(9.0);        

    for(int j = -3; j <= 3; ++j)
    for(int i = -3; i <= 3; ++i) {
        vec2 cell  = base + vec2(i, j);         
        vec2 site  = cell + H(cell);            
        float r    = mix(0.5, 3.0, rand(cell * cos(dt * 0.000001))); 

        float d = length(p - site) - r;         
        d *= d;                                 

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?                dists.z = d  :
                       d;
    }
    return dists;   // x = F1², y = F2², z = F3²
}
float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
}
vec2 simulatedMouse(float time, float scale) {
    float x = sin(time * 0.07);
    float y = cos(time * 0.09);
    return vec2(x, y) * scale;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    float dt = iTime;
    vec2 uv = 7.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   
    float dc3 = modulatedSine(dt, 0.7, 0.2, 0.09, 0.16, 1.9);
    vec2 fakeMouse = simulatedMouse(dt, 1.0);
    uv =  scale( vec2(dc3 )) * uv;
    uv += fakeMouse  * 4.5 * dc3;
    vec3 d1 = voronoiDistSq(uv, dt);

    float edgeDist = sqrt(d1.y) - sqrt(d1.x);  

    float w   = 3.0;
    float mask = smoothstep( w, 2.0, edgeDist ) *
                 smoothstep(-w, 1.1, -edgeDist);     

    float scale2 = floor(random(iResolution.xy) * 1.0) + 14.0;
    vec3 d2 = voronoiVarRadius(uv * scale2, dt); 
    
    vec3 col2 = vec3(3.3) * sqrt(d2) - vec3(d2.x);    

    col2 += 1.5 * ( col2.y / (col2.y / col2.z + 1.0) - 0.5 ) - col2;

    vec3 col1 = vec3(5.0) * sqrt(d1) - vec3(d1.y);
    col1 += 4.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    vec3 finalColor = mix( col1, col2, mask );        

    fragColor = vec4( finalColor, 1.0 );

}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
