uniform vec3 iResolution;
uniform float iTime; 

#define ANIMATE
#define H(n) fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34) ) )


vec2 hash2( vec2 p )
{
	return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm( in vec2 x, in float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    float t = 0.0;
    int numOctaves = 6;
    for( int i=0; i<numOctaves; i++ )
    {
        const mat2 m = mat2( 1.6, 1.2, -1.2, 1.6 );
        x = m * x;               
        t += a*noise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}

float fbm11(vec2 p)
{
    return fbm(p, 0.9) * 1.9 - 1.0;
}


vec3 dotLattice(vec3 c, vec3 col){
    vec2  cellId = c.zy;          
    vec2  cellUV = c.zy;          

    const float SQRT3 = 0.7320508;
    vec2  hexUV   = vec2( cellUV.x + cellUV.y* 0.8,
                        cellUV.y * SQRT3*1.8 );

    float spacing = 0.50;                      
    vec2  gridId  = floor( hexUV / spacing );
    vec2  gv      = hexUV - gridId*spacing - spacing*0.5;

    float ang = 6.28318 * hash2(cellId + gridId).x;    
    gv += 0.01 * vec2( cos(ang), sin(ang) );          

    float r     = length( gv );               
    float mask  = 0.7 - smoothstep(0.0, 0.5, r); 

    float wall  = smoothstep(0.0, 0.05, c.x);       

    vec3 dotCol  = vec3(0.0, 0.8, 0.25);            
    vec2 jitter  = hash2( cellId ) * 0.15;
    vec2 texUV   = fract( cellUV * 1.0  );   
    vec3 texCol  = texture(iChannel0, texUV).rgb;
    col          = mix( col, texCol , mask * wall );
    
    return col;
}

vec3 voronoiDistSq(vec2 p)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);        // x ≤ y ≤ z

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        diff   = H(cellId) + cellId - p;

        #ifdef ANIMATE
        diff += 0.12 * sin(iTime * 2.0 + 4.028318 * diff);
        #endif

        d = dot(diff, diff);       // squared distance

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord  )
{
    vec2 uv = 3.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y
            - iTime * 0.2;

    vec3 d1 = voronoiDistSq(uv);
    //   d1.x = F1²  (nearest)   d1.y = F2²  (2nd‑nearest)

    float edgeDist = sqrt(d1.y) - sqrt(d1.x);  

    float w   = 4.0;
    float mask = smoothstep( w, 3.0, edgeDist ) *
                 smoothstep(-w, 1.3, -edgeDist);     

    vec3 d2 = voronoiDistSq( uv * 5.0 );             
    vec3 col2 = vec3(1.0) * sqrt(d2) - vec3(d2.x);    

    // optional color tweak 
    col2 += 2.0 * ( col2.y / (col2.y / col2.z + 1.0) - 0.5 ) - col2;

    // 4) ORIGINAL COLOR FOR THE CELL INTERIORS
    vec3 col1 = vec3(5.0) * sqrt(d1) - vec3(d1.y);
    col1 += 4.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    // 5) BLEND:   edge gets col2, interior gets col1 
    vec3 finalColor = mix( col1, col2, mask );        

    fragColor = vec4( finalColor, 1.0 );
}




void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
