uniform vec3 iResolution;
uniform float iTime; 

// fabrice -> https://www.shadertoy.com/view/4dKSDV
#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )

// 2D Random
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
    int numOctaves = 10;
    for( int i=0; i<numOctaves; i++ )
    {
        t += a*noise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}
// fbm in [‑1,1] instead of [0,1]
float fbm11(vec2 p)
{
    return fbm(p, 0.9) * 1.9 - 1.0;
}

vec2 hash22(vec2 p){
    p = fract(p*vec2(127.1, 311.7));
    p += dot(p, p+45.32);
    return fract(vec2(p.x*p.y, p.x+p.y));
}


struct VoronoiResult {
    vec3 dists;        
    vec2 cellCenter;   
    vec2 toCenter;     
    vec2 cellId;       
};

VoronoiResult voronoiExtended(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    VoronoiResult result;
    result.dists = vec3(1.5);
    result.cellCenter = vec2(0.0);
    result.toCenter = vec2(0.0);
    result.cellId = vec2(0.0);
    
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;

        vec2 cellCenter = H(cellId) + cellId;
        diff = H(cellId) + cellId + 0.2 * cos(dt + 6.28 * H(cellId)) - p;
        
        d = dot(diff, diff);      

        if (d < result.dists.x) {
            result.dists.z = result.dists.y;
            result.dists.y = result.dists.x;
            result.dists.x = d;
            result.cellCenter = cellCenter;
            result.toCenter = diff;
            result.cellId = cellId;
        } else if (d < result.dists.y) {
            result.dists.z = result.dists.y;
            result.dists.y = d;
        } else if (d < result.dists.z) {
            result.dists.z = d;
        }
    }
    return result;
}

vec3 voronoiDistSqEdge(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(0.9);       

    p.y *= 0.4;
    p.x *= 0.8;
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        // diff   = H(cellId) + cellId - p;
        diff = H(cellId) + cellId + 0.15 * cos(dt + 6.28 * H(cellId)) - p;
        // With this:

        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}

float metaballCellField(vec2 p, VoronoiResult vr, float t, out vec3 metaBallColor)
{
    float R   = 0.80 * sqrt(vr.dists.y);
    vec2  g   = (p - vr.cellCenter) / R;
    float rho = clamp(length(g), 0.0, 1.0);
    
    // Base field
    float field = 0.64760 * (1.0 - rho);
    
    // Add noise for organic shape
    float n = fbm11(p * 9.0 + t * 0.05);
    field += n * 0.02 * (1.0 - rho);
    // Voronoi-aware falloff
    float F1 = sqrt(vr.dists.x);
    float F2 = sqrt(vr.dists.y);
    float edgeDist = F2 - F1;
    float voronoiFalloff = smoothstep(0.0, 0.0125, edgeDist);
    
    field *= voronoiFalloff;  // Fade field near Voronoi edges
    
    // Small metaballs
    for (int i = 0; i < 4; ++i)
    {
        vec2 h   = hash22(vr.cellId + float(i));
        float ang = t*0.137 + 6.28318*h.x;
        float rad = 0.534 + 0.10*h.y;
        vec2  pos = vr.cellCenter + R*rad*vec2(cos(ang), sin(ang));
        field += 0.0110 / length(p - pos);
    }
    
    // Create different zones based on field strength
    metaBallColor = vec3(0.9, 0.85, 0.8); // default beige/border metaBallColor
    
    if (field > 0.15) {
        // Main cell interior - blue
        vec3 baseBlue = vec3(0.2, 0.4, 0.6);
        
        // Add internal texture/dots
        float dotPattern = 0.0;
        for (int i = 0; i < 3; ++i) {
            vec2 dotPos = vr.cellCenter + R * 0.3 * hash22(vr.cellId + float(i + 10));
            float dotDist = length(p - dotPos);
            dotPattern += 0.3 * exp(-dotDist * dotDist * 200.0);
        }
        
        // Add fine texture
        float fineNoise = fbm11(p * 25.0 + t * 0.2);
        
        // Combine textures
        metaBallColor = baseBlue + vec3(0.1, 0.15, 0.2) * fineNoise + vec3(0.0, 0.1, 0.2) * dotPattern;
        
        if (field > 0.25) {
            // Inner core - darker blue
            metaBallColor = mix(metaBallColor, vec3(0.1, 0.25, 0.45), smoothstep(0.25, 0.35, field));
        }
    }
    
    return field;
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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float dt = iTime;
    vec2 uv = 1.5 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv.x += dt * 0.1;   
    // With this:
    vec2 distortion = vec2(fbm11(uv * 0.1), fbm11(uv * 0.1 + vec2(50.0))) * 3.0;

    VoronoiResult d1 = voronoiExtended(uv * 1.0 , dt);  
    vec3 d2 = voronoiDistSqEdge(uv * 5.0 * distortion, dt);  

    float F1 = sqrt(d1.dists.x);
    float F2 = sqrt(d1.dists.y);
    float F3 = sqrt(d1.dists.z);
    float edgeDist = F2 - F1;          
    
    vec3  metaBallColor;
    float f      = metaballCellField(uv, d1, dt, metaBallColor);
    float blob   = smoothstep(0.4, 0.5, f);             // same threshold
    
    // Create multiple blend zones
    float nearEdge = 1.0 - smoothstep(0.0, 2.9, edgeDist);
    float farFromEdge = smoothstep(0.1, 0.4, edgeDist);

    // Metaball strength varies with distance to edge
    float metaballMask = blob * farFromEdge + blob * nearEdge * 0.5;

    // Enhanced edge blending
    float edgeEnhancement = smoothstep(0.0, 0.08, edgeDist) * (1.0 - smoothstep(0.08, 0.15, edgeDist));
    metaballMask = max(metaballMask, edgeEnhancement * blob * 0.7);

    float w   = 3.0;
    float edgeMask = smoothstep( w, 0.0, edgeDist ) *
                     smoothstep(-w, 9.0, -edgeDist);

    vec3 col2 = 20.0 * sqrt(d2);          // your edge colouring
    col2 -= vec3(col2.x);
    col2 += 5.0 * ( col2.y / (col2.y / col2.z + 1.0) - 0.5 ) - col2;

    vec3 col1 = 2.5 * sqrt(d1.dists);           // cell interior base colour
    col1 -= vec3(col1.x );
    col1 += 8.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    vec3 base      = mix(col1, col2, edgeMask);

    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColor;
    int effectIndex = int(mod(dt / 10.0, 6.0));
    colorPalette(effectIndex, uv, bg, rgbColor);

    vec3 temporColor = mix(base, metaBallColor, metaballMask);
    // vec3 temporColor = mix(base, metaBallColor, metaballMask);
    vec3 finalCol = mix(bg, rgbColor, temporColor);

    fragColor = vec4(finalCol, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
