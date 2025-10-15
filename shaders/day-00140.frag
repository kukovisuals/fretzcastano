uniform vec3 iResolution;
uniform float iTime;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 140  🌟                
    
    ▓  Light practice, improving the light of the building 
    ▓  thing. I wanna play more with the building, 
    ▓  Make some different version of it, try different 
    ▓  types of light. 
    
    ▓  Very sad day for America with the death charlie kirk
    ▓  I hope these chaos bring more peace to the states. 
     
    ▓  The order is in the render() function 
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  SDF, MAP  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 10.0
#define AA 2 
const float DOT_SPEED = 0.1; 
const vec3 BOX_SIZE = vec3(0.4);

// @iquilez 
float sdfBox(vec3 p, vec3 b, float r)
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float building(vec3 p, float T)
{
    vec3 newp = p + vec3(0,0.5,0);
    vec3 cellSize = vec3(7.0, 2.0, 5.0);
    vec3 cellOff  = vec3(3.0, 0.0, 0.0);
    
    vec3 id  = floor((newp + cellOff) / cellSize);
    vec3 cell = vec3(mod(newp.x + 3.0, 7.0) - 2.5,  mod(newp.y + 0.0,2.0) - 0.5, mod(newp.z + 0.0,5.0) - 2.5);
    float rnd = fract(sin(dot(id, vec3(12.9898, 78.233, 109.3594))) * 43758.5453)  * 0.5 + 0.5;
    vec3 b  = BOX_SIZE;
    float r = 0.1;
    
    return sdfBox(p, b, r);
}

vec4 map(vec3 p, float T)
{
    vec3 offsets[6];
    offsets[0] = vec3(-2.0,  1.0, 0.0); // bottom Left
    offsets[1] = vec3( 0.0,  1.0, 0.0); // bottom middle
    offsets[2] = vec3(-2.0, -1.0, 0.0); // top Left
    offsets[3] = vec3( 0.0, -1.0, 0.0); // top middle
    offsets[4] = vec3( 2.0, -1.0, 0.0); // top Right
    offsets[5] = vec3( 2.0,  1.0, 0.0); // Bottom Right

    float d1 = building(p + offsets[0], T);
    float d2 = building(p + offsets[1], T);
    float d3 = building(p + offsets[2], T);
    float d4 = building(p + offsets[3], T);
    float d5 = building(p + offsets[4], T);
    float d6 = building(p + offsets[5], T);
    
    float minDist = d1;
    float id = 1.0;
    
    if (d2 < minDist) { minDist = d2; id = 2.0; }
    if (d3 < minDist) { minDist = d3; id = 3.0; }
    if (d4 < minDist) { minDist = d4; id = 4.0; }
    if (d5 < minDist) { minDist = d5; id = 5.0; }
    if (d6 < minDist) { minDist = d6; id = 6.0; }
    
    return vec4(minDist, id, 0.0, 1.0);
}
vec2 rayMarch(vec3 ro, vec3 rd, float T)
{
    float m = -1.0;
    float dt = 0.0;
    
    for(int i = 0; i < 140; i++)
    {
        vec4 d = map(ro + rd * dt, T);
        
        m = d.y; 
        dt += d.x;
        if(abs(d.x) < 0.001 || dt > 20.) break;
    }
    
    if(dt > 20.0){
        m  = -1.0;
        dt = -1.0;
    }
    
    return vec2(dt, m);
}

vec3 calcNormal(vec3 p, float T)
{
    float e = 0.0001;
    return normalize(vec3(
        map(p + vec3(e,0,0), T).x - map(p - vec3(e,0,0), T).x,
        map(p + vec3(0,e,0), T).x - map(p - vec3(0,e,0), T).x,
        map(p + vec3(0,0,e), T).x - map(p - vec3(0,0,e), T).x
    ));
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

float saturate(float x){ return clamp(x, 0.0, 1.0); }

vec3 render(vec3 ro, vec3 rd, float T)
{
    vec3 col = vec3(0.01);
    
    vec2 dt = rayMarch(ro, rd, T);
    if(dt.y > 0.0)
    {
        vec3 p = ro + rd * dt.x;
        vec3 norm = calcNormal(p, T);
        vec3 bgCol = vec3(0);
        vec3 k_ambient = vec3(0);
        vec3 k_diffuse = vec3(0); 
        vec3 k_specular = vec3(0);
        vec3 nVis = 0.5 + 0.5*norm; 
        
        float ambient = 0.5;
        vec3  L    = normalize(vec3(2, 2, 1));
        float diff = saturate(dot(norm, L));
        float fre  = clamp(1.3 + dot(norm, rd), 0., 1.);
        vec3  hal  = normalize(L - rd) * sin(T) * 0.5 + 0.5;
        float spec = saturate(dot(norm, hal));
        
        if(dt.y > 5.5){
            // Bottom Right - FRESNEL
            col = vec3(pow(fre, 16.));  
        } else if(dt.y > 4.5){
            // Top Right - all
            col += 5. * vec3(.7, .3, .2) * pow(vec3(spec), vec3(10, 30, 30));
            col += 5. * (1. - diff * diff) * pow(fre, 16.) * vec3(.8, .0, .1);
            col += 2. * diff * vec3(.5, .1, .1);
        } else if(dt.y > 3.5){
            // Top Middle - NORMAL
            col = norm;
        } else if(dt.y > 2.5){
            // Top Left - HALF WAY VECTOR
            col = hal * 1.1;
        } else if(dt.y > 1.5){
            // Bottom Middle - SPECULAR
            col = vec3(spec);
        } else {
            // DIFFUSE
            col = vec3(diff);
        }
        
        // Fog
        col = mix( col, vec3(0.01), 1.0-exp( -0.0005*dt.x*dt.x*dt.x ) );
    }
    
    return col;
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  MAIN  🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

void mainImage(out vec4 O, in vec2 I)
{
    float T = iTime * 1.0;
    
    vec3 ta = vec3(0.0, 0.0, 0.0); 
    vec3 ro = ta + vec3(4.0*cos(0.3 * T), 2.0, 4.0*sin(0.3 * T)); 
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 tot = vec3(0.0);
    
    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
        vec2 off = vec2(m, n) / float(AA) - 0.5;
        vec2 uv = (2.0 * (I + off) - iResolution.xy) / iResolution.y;
        
        vec3 rd = ca * normalize(vec3(uv, 2.0));
        vec3 col = render(ro, rd, T); 
        
        col = pow(col * 1.0, vec3(1.1 / 2.2));
        
        tot += col;
    }
    
    tot /= float(AA * AA);
    
    O = vec4(tot, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
