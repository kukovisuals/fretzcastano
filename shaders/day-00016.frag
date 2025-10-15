uniform vec3 iResolution;
uniform float iTime; 
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

// forked -> Iq's https://www.shadertoy.com/view/ldl3W8
// fabrice -> https://www.shadertoy.com/view/4dKSDV

#define ANIMATE

vec2 hash2( vec2 p )
{
	// texture based white noise
	//return textureLod( iChannel0, (p+0.5)/256.0, 0.0 ).xy;
	
    // procedural white noise	
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

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
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
    int numOctaves = 10;
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


#define H(n) fract(1e4 * sin(n.x + n.y / .7 + vec2(1.,12.34)))

// ─────────────────────────────────────────────────────────────────────────────
//  Single‑pass Voronoi: returns
//      x = distance to nearest edge
//      y = nearest‑seed x‑offset   (only needed for colouring / dotLattice)
//      z = nearest‑seed y‑offset
// ─────────────────────────────────────────────────────────────────────────────
vec3 voronoi(in vec2 uv, float t)
{
    vec2  coord = uv;                   // already scaled in mainImage
    vec2  diff, bestVec = vec2(0.0);
    float bestEdge = 9.0, bestNode = 9.0, secondNode = 9.0;

    // scan the 3×3 neighbourhood with the “k” trick
    for (int k = 0; k < 9; ++k)
    {
        vec2 cellId = ceil(coord) + vec2(k - (k/3)*3, k/3) - 2.0;
        diff        = H(cellId) + cellId - coord;

    #ifdef ANIMATE                     
        diff += 0.1 * sin(t*2.5 + 2.58318*diff) *
                      cos(t*2.0 + 3.28318*diff);
    #endif

        float d2 = dot(diff,diff);     // squared distance to this seed

        // keep the 1st & 2nd closest nodes (d2 ≤ bestNode ≤ secondNode)
        if (d2 < bestNode)             { secondNode = bestNode; bestNode = d2; bestVec = diff; }
        else if (d2 < secondNode)      { secondNode = d2; }
    }

    /* edge distance = half the gap between the two closest seeds
       ( √d2 is slower; stay in squared space until the end )                */
    bestEdge = 0.25 * (secondNode - bestNode) / sqrt(bestNode);

    // FBM wobble exactly like the Worley snippet ---------------------------
    float n = fbm11(coord + t * 0.5835329);
    bestEdge += n * 0.005;
    bestVec  += n * 0.04;

    return vec3(bestEdge, bestVec);
}


vec3 dotLattice(vec3 c, vec3 col){
    /* ---------- cell‑constant data ----------------------------------------- */
    vec2  cellId = c.zy;          // same 8× scale you already use
    vec2  cellUV = c.zy;          // 0‑1 coords inside that cell

    /* ---------- dot lattice ------------------------------------------------- */
    // 1. map the cell into a *hex‑friendly* coordinate system
    const float SQRT3 = 1.57320508;
    vec2  hexUV   = vec2( cellUV.x + cellUV.y* 0.8,
                        cellUV.y * SQRT3/0.8 );

    /* 2. pick a lattice spacing (≈ how many dots per cell edge) */
    float spacing = 0.50;                      // tweak: smaller = more dots
    vec2  gridId  = floor( hexUV / spacing );
    vec2  gv      = hexUV - gridId*spacing - spacing*0.5;

    /* 3. organic *jitter* using simple trig + hash --------------------------- */
    float ang = 6.28318 * hash2(cellId + gridId).x;    // random angle 0‑2π
    gv += 0.01 * vec2( cos(ang), sin(ang) );          // pull off the grid

    /* ---------- draw the circle -------------------------------------------- */
    float r     = length( gv );               // radial distance to this lattice point
    float mask  = 1.0 - smoothstep(0.0, 0.3, r);  // radius ≈0.04, soft edge

    /* ---------- fade dots near Voronoi walls so they stay inside ----------- */
    float wall  = smoothstep(0.02, 0.09, c.x);       // uses your existing edge dist

    /* ---------- colour blend ------------------------------------------------ */
    vec3 dotCol  = vec3(0.35, 0.8, 0.25);             // leafy green
    vec2 jitter  = hash2( cellId ) * 0.015;
    vec2 texUV   = fract( cellUV * 2.0  );    // 3× repeats per cell 
    vec3 texCol  = texture(iChannel0, texUV).rgb;
    col          = mix( col, texCol , mask * wall );
    
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    float dt = iTime;
    vec2 uv = fragCoord/iResolution.xx;
    uv += dt * 0.02;
    vec2  scaledUV = 8.0 * uv;    
    vec3 c = voronoi( scaledUV, dt * 0.2 );
    vec3 col = vec3(1.0);
    
    col = dotLattice(c, col);

    // borders	
    col = mix( vec3(0.9), col, smoothstep( 0.00, 0.02, c.x )  );
	fragColor = vec4(col,1.0);
}
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
