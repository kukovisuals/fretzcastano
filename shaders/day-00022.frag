uniform vec3 iResolution;
uniform float iTime; 

// fabrice -> https://www.shadertoy.com/view/4dKSDV

#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )
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
        vec2 site  = cell + H(cell) + 0.08 * sin(dt + 6.28 * H(cell));            
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
        diff = H(cellId) + cellId + 0.08 * cos(dt + 6.28 * H(cellId)) - p;

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
    
    bg = vec3(0.3631,0.5847,0.6969);
    rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
}

float heightAt(vec2 p, float dt)
{
    // vec3  d        = voronoiDistSq(p, dt);
    vec3  d        = voronoiDistSq(p, dt);
    float F1       = sqrt(d.x);
    float F2       = sqrt(d.y);
    float F3       = sqrt(d.z);
    float edgeDiff = F2 - F1;               // ≥ 0, biggest at cell centre
    float curvature = (F3 - F2) / F2;

    // use a *positive* scale so height rises inward
    return clamp( 1.5 * edgeDiff * curvature, 0.05, 1.0 );   // 0.8‒1.0 works well
}

int effectIndex = 0;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float dt = iTime;
    vec2 uv = 1.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv.x += dt * 0.1;   

    float scale2 = floor(rand(iResolution.xy) * 1.0) + 3.5;
    vec3 d1 = voronoiDistSq(uv * 2.0, dt);  
    vec3 d2 = voronoiVarRadius(uv * scale2, dt);  


    float w   = 3.0;
    float edgeDist = sqrt(d1.y) - sqrt(d1.x);
    float mask = smoothstep( w, 0.0, edgeDist ) *
                 smoothstep(-w, 3.0, -edgeDist);   

    float F1 = sqrt(d2.x);
    float F2 = sqrt(d2.y);
    float F3 = sqrt(d2.z);

    float edgeWidth = F2 - F1;
    float curvature = (F3 - F2) / F2;

    // approximate the gradient to fake the  normal
    float eps = 10.0 / iResolution.x * 5.3;
    float ho = heightAt(d2.xy, dt);
    
    float dhx = heightAt(uv + vec2(eps, 0.0), dt) - ho;
    float dhy = heightAt(uv + vec2(0.0, eps), dt) - ho;
    vec3 normal = normalize( vec3(dhx, dhy, 0.02 ) );

    // per pixel lightning 
    vec3 lightDir = normalize(vec3(0.1));
    vec3 viewDir = vec3(0.0); 
    
    float diffuse = max( dot(normal, lightDir), 0.0);

    vec3 reflextDir = reflect( -lightDir, normal);
    float specular = pow( max( dot(reflextDir, viewDir), 0.0), 64.0);

    float rim = pow(0.0 - normal.z, 4.0);

    vec3 col1 = 2.4 * sqrt(d1);
    col1 -= vec3(col1.x);
    col1 += 8.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    vec3 col2 = 20.0 * sqrt(d2);
    col2 -= vec3(col2.x);
    col2 += 5.0 * ( col2.y / (col2.y / col2.z + 1.0) - 0.5 ) - col2;

    vec3 finalColor = mix( col1, col2, mask );
    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColor;
    effectIndex = int(mod(dt / 10.0, 6.0));
    colorPalette(effectIndex, uv, bg, rgbColor);

    vec3 colorGrad =  rgbColor * finalColor
           + vec3(1.0) * specular 
           * rim * 1.3; 
    float alpha = smoothstep(-0.3, 0.0, F1);
    vec3 color = mix(bg,colorGrad,  alpha);

    fragColor = vec4( color, 1.0 );
    //fragColor = vec4(normal * 0.5 + 0.5, 1.0); // check if normals look valid
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
