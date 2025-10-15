uniform vec3 iResolution;
uniform float iTime; 



#define ANIMATE

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

#define H(n) fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34) ) )

void mainImage( out vec4 outColor, in vec2 fragCoord )
{
    // --- setup -------------------------------------------------------------
    vec2  resolution   = iResolution.xy;
    vec2  cellId, diff;
    vec2  coord        = 2.0 * (fragCoord + fragCoord - resolution) / resolution.y
                       - iTime * 0.1;   
                       
    float distSq;                                         

    outColor = vec4(9.0);

    for (int k = 0; k < 9; ++k)            
    {
        cellId = ceil(coord) + vec2( k - (k/3)*3, k/3 ) - 2.0;

        diff   = H(cellId) + cellId - coord;
        #ifdef ANIMATE
            diff += 0.0 + 0.1 * sin(iTime * 1.5 + 7.28318 * diff) 
            * cos(iTime * 0.5 + 1.128318 * diff);
        #endif
        distSq = dot(diff, diff);

        distSq < outColor.x ? (outColor.yz = outColor.xy, outColor.x = distSq) :
        distSq < outColor.y ? (outColor.z  = outColor.y , outColor.y = distSq) :
        distSq < outColor.z ? (                          outColor.z = distSq) :
                              distSq;
    }
    float n = fbm11(coord * 1.0 + iTime * 0.0835329); 
    
    outColor  = vec4(dotLattice(outColor.xyz + n * 0.009, outColor.xyz), 1.0);
    outColor = 5.0 * sqrt(outColor);
    outColor -= outColor.x;
 
    outColor += 4.0 * ( outColor.y / (outColor.y / outColor.z + 1.0) - 0.5 )
              - outColor;
}




void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
