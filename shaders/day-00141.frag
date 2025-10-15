uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🌟  KuKo Day 141  🌟                
    
    ▓  Light practice, playing with light. this line was
    ▓  very fun to play with. 
    
    ▓  float irid = sin(dot(norm, vec3(0,0,1)) * freq + T) * 0.5 + 0.5;
    
    ▓  The world needs art right now. 
    
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
const vec3 BOX_SIZE = vec3(0.3);

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
    vec3 offsets[15];
    offsets[0] = vec3(-1.0,  1.5, 0.0); // bottom Left
    offsets[1] = vec3( 0.0,  1.5, 0.0); // bottom middle
    offsets[5] = vec3( 1.0,  1.5, 0.0); // Bottom Right
    offsets[6] = vec3( 2.0,  1.5, 0.0); // Bottom Right
    offsets[7] = vec3(-2.0,  1.5, 0.0); // Bottom Right
    offsets[2] = vec3(-1.0, -1.0, 0.0); // top Left
    offsets[3] = vec3( 0.0, -1.0, 0.0); // top middle
    offsets[4] = vec3( 1.0, -1.0, 0.0); // top Right
    offsets[8] = vec3( 2.0, -1.0, 0.0); // Bottom Right
    offsets[9] = vec3(-2.0, -1.0, 0.0); // Bottom Right
    
    offsets[10] = vec3(-1.0, 0.0, 0.0); // top Left
    offsets[11] = vec3( 0.0, 0.0, 0.0); // top middle
    offsets[12] = vec3( 1.0, 0.0, 0.0); // top Right
    offsets[13] = vec3( 2.0, 0.0, 0.0); // Bottom Right
    offsets[14] = vec3(-2.0, 0.0, 0.0); // Bottom Right

    float d1 = building(p + offsets[0], T);
    float d2 = building(p + offsets[1], T);
    float d3 = building(p + offsets[2], T);
    float d4 = building(p + offsets[3], T);
    float d5 = building(p + offsets[4], T);
    float d6 = building(p + offsets[5], T);
    float d7 = building(p + offsets[6], T);
    float d8 = building(p + offsets[7], T);
    float d9 = building(p + offsets[8], T);
    float d10= building(p + offsets[9], T);
    
    float d11 = building(p + offsets[10], T);
    float d12 = building(p + offsets[11], T);
    float d13 = building(p + offsets[12], T);
    float d14 = building(p + offsets[13], T);
    float d15 = building(p + offsets[14], T);
    
    float minDist = d1;
    float id = 1.0;
    
    if (d2 < minDist) { minDist = d2; id = 2.0; }
    if (d3 < minDist) { minDist = d3; id = 3.0; }
    if (d4 < minDist) { minDist = d4; id = 4.0; }
    if (d5 < minDist) { minDist = d5; id = 5.0; }
    if (d6 < minDist) { minDist = d6; id = 6.0; }
    if (d7 < minDist) { minDist = d7; id = 7.0; }
    if (d8 < minDist) { minDist = d8; id = 8.0; }
    if (d9 < minDist) { minDist = d9; id = 9.0; }
    if (d10 < minDist) { minDist = d10; id = 10.0; }
    
    if (d11 < minDist) { minDist = d11; id = 11.0; }
    if (d12 < minDist) { minDist = d12; id = 12.0; }
    if (d13 < minDist) { minDist = d13; id = 13.0; }
    if (d14 < minDist) { minDist = d14; id = 14.0; }
    if (d15 < minDist) { minDist = d15; id = 15.0; }
    
    
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
    float e = 0.001;
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

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

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
        vec3  hal  = normalize(L - rd); // * sin(T) * 0.5 + 0.5;
        float spec = saturate(dot(norm, hal));
        
        float backL  = saturate(dot(norm, -L));
        float sss    = pow(saturate(backL), 3.0);
        vec3 tangent = normalize(cross(norm, vec3(0,1,0)));
        
        vec3 bitangent = cross(norm, tangent);
        float aniso  = dot(reflect(-L, norm), sin(tangent + T) * 0.3+ 0.3);
        
        float irid1 = sin(dot(norm, rd) * 3.0 + T * 0.5) * 0.5 + 0.5; 

        vec3 warm = vec3(1.0, 0.8, 0.6);
        vec3 cool = vec3(0.6, 0.8, 1.0);
        
        float u    = dot(p, tangent);
        float v    = dot(p, bitangent);
        float NoV  = saturate(dot(norm, -rd));    
        float rim  = pow(1.0 - NoV, 3.0);

        if(dt.y > 14.5)
        {
            // middle row right
            vec3 sc  = reflect(rd, norm) + sin(p * 10.0 + T) * 0.4;
            float sl = cos(dot(sc, vec3(0,1,0)) * 10.0) * 0.5 + 0.5;
            
            vec3 albedo = palette(sl, vec3(0.25), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));

            col += albedo;
            
        } else if(dt.y > 13.5){
        
            // middle row left
            vec3 ris  = refract(norm, tangent, 1.0);
            float rl = cos(dot(ris, vec3(0,1,0)) * 4. + T) * 0.5 + 0.5;
            
            vec3 albedo = palette(rl, vec3(0.5), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            
            col += albedo;
            
        } else if(dt.y > 12.5){
        
            // middle row 2nd
            float caustic = sin(p.y * 20.0 + T * 2.0);
            caustic *= sin(dot(norm, -rd) * 5.0 + T);
            
            vec3 albedo = palette(abs(caustic), vec3(0.5), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            
            col += albedo;
            
        } else if(dt.y > 11.5){
        
            // MIDDLE ROW MIDDLE
            vec3 fe  = normalize(p + sin(T * 1.2) * 0.5);
            float fd = abs(dot(fe, rd));
            float fg = pow(fd, 6.0) * sin(length(p) * 50.0 - T * 3.0);
            
            vec3 albedo = palette(abs(fg), vec3(0.25), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            
            col += albedo;
            
        } else if(dt.y > 10.5){
        
            // middle row 2nd
            float a  = atan(p.z, p.z) + T * 0.8;
            float r  = length(p.zy);
            float pl = sin(a * 3.0 + r * 20.0 - T * 2.0);
            pl *= sin(dot(norm, vec3(1,0,0)) * 4.0 + T);
            
            vec3 albedo = palette(abs(pl), vec3(0.5), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            col += albedo;
            
        } else if(dt.y > 9.5){
            
            // TOP ROW
            float freq = 2.0 + sin(T * 0.1) * 5.0; 
            float irid = sin(dot(norm, vec3(0,1,0)) * freq + T) * 0.5 + 0.5;
            
            vec3 albedo = palette((irid), vec3(0.5), vec3(0.5), vec3(0.30), vec3(0.4347,0.31714,0.91212));
            col += albedo;
            
        } else if(dt.y > 8.5){
            
            // TOP RIGHT
            float freq = 2.0 + sin(T * 0.1) * 5.0; 
            float irid = sin(dot(norm, vec3(0,0,1)) * freq + T) * 0.5 + 0.5;
            
            vec3 albedo = palette((irid), vec3(0.5), vec3(0.5), vec3(0.30), vec3(0.4347,0.31714,0.91212));
            col += albedo;
        
        } else if(dt.y > 7.5){
        
            // BOTTOM ROW
            float caustic = sin(p.y * 20.0 + T * 2.0);
            caustic *= sin(dot(norm, -rd) * 5.0 + T);
            
            vec3 albedo = palette(abs(caustic), vec3(0.25), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            
            col += albedo * 0.6;
            col += 2. * vec3(.8, .5, .2) * pow(vec3(spec), vec3(30,20, 10));
            col += 5. * (1. - diff * diff) * pow(fre, 16.) * vec3(.0, .04, .2);
            col += 2. * diff * vec3(.0, .1, .3);
            
        } else if(dt.y > 6.5){
        
            // BOTTOM ROW left
            vec3 off_n = norm + sin(p * 30.0 + T) * 0.1;
            float irid = sin(dot(off_n, vec3(1,1,0)) * 8.0 + T * 1.8) * 0.5 + 0.5;
           
           vec3 albedo = palette((irid), vec3(0.25), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
           
           col += albedo;
        
            col += 2. * vec3(.8, .5, .2) * pow(vec3(spec), vec3(30,20, 10));
            col += 5. * (1. - diff * diff) * pow(fre, 16.) * vec3(.0, .04, .2);
            col += 2. * diff * vec3(.0, .1, .3);
            col *= .3 + .5 * texture(iChannel0, fract(0.3 * p.zx)).xyz;
            

        } else if(dt.y > 5.5){
        
            // BOTTOM ROW 2nd
            float caustic = sin(p.y * 5.0 + T * 2.0);
            caustic *= sin(dot(norm, -rd) * 10.0 + T);
            
            vec3 albedo = palette(abs(caustic), vec3(0.35), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            
            col += albedo;
            col += 2. * vec3(.8, .5, .2) * pow(vec3(spec), vec3(30,20, 10));
            col += 5. * (1. - diff * diff) * pow(fre, 16.) * vec3(.0, .04, .2);
            col += 2. * diff * vec3(.0, .1, .3);
            col *= .3 + .5 * texture(iChannel0, fract(0.3 * p.zx)).xyz;
            
        } else if(dt.y > 4.5){
            
            // TOP ROW
            vec3 off_n = norm + sin(p * 30.0 + T) * 0.1;
            float irid = sin(dot(off_n, vec3(1,1,0)) * 8.0 + T * 1.8) * 0.5 + 0.5;
           
           vec3 albedo = palette((irid), vec3(0.5), vec3(0.5), vec3(0.30), vec3(0.4347,0.31714,0.91212));
           
           col += albedo;
        
        } else if(dt.y > 3.5){
        
            // TOP ROW 
            float spiral = atan(p.x, p.z) * 5.0;
            float irid = sin(dot(norm, vec3(1,0,1)) * 10.0 + T + spiral) * 0.5 + 0.5;
            
            vec3 albedo = palette((irid), vec3(0.5), vec3(0.5), vec3(0.30), vec3(0.4347,0.31714,0.91212));
            
            col += albedo;
            
       } else if(dt.y > 2.5){
            
            // TOP ROW
            vec3 ri  = p + sin(length(p.xz) * 10.0 - T * 0.5) * 0.2;
            float rl = sin(dot(ri, norm) * 4.0) * 0.5 + 0.5;
            
            vec3 albedo = palette(rl, vec3(0.5), vec3(0.5), vec3(0.30), vec3(0.4347,0.31714,0.91212));
            
            col += albedo;
            
        } else if(dt.y > 1.5){
            
            // BOTTOM ROW - middle
            vec3 fe  = normalize(p - sin(T * 0.2) * 20.5 + 1.0);
            float fd = abs(dot(fe, rd + vec3(0,-1,0)));
            float fg = pow(fd, 2.0) * sin(length(p) * 20.0 - T * 1.0);
            
            vec3 albedo = palette(abs(fg), vec3(0.25), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            
            col += albedo;
            
            col += 1. * vec3(.8, .5, .2) * pow(vec3(spec), vec3(30,20, 10));
            col += 2. * (1. - diff * diff) * pow(fre, 16.) * vec3(.0, .04, .2);
            col += 1. * rim * vec3(.0, .1, .3);
            col *= .3 + .5 * texture(iChannel0, fract(0.4 * p.zx)).xyz;
            
        } else {
            
            // BOTTOM ROW 2nd
            float a  = atan(p.x, p.x) + T * 0.8;
            float r  = length(p.yy);
            float pl = sin(a * 3.0 + r * 3.0 - T * 2.0);
            pl *= sin(dot(norm, vec3(0,1,0)) * 4.0 + T);
            
            vec3 albedo = palette(abs(pl), vec3(0.45), vec3(0.5), vec3(0.30), vec3(.347,0.1714,0.1212));
            col += albedo;
            
            col += 1. * vec3(.8, .5, .2) * pow(vec3(spec), vec3(30,20, 10));
            col += 2. * (1. - diff * diff) * pow(fre, 16.) * vec3(.0, .04, .2);
            col += 1. * rim * vec3(.0, .1, .3);
            col *= .3 + .5 * texture(iChannel0, fract(0.4 * p.xy)).xyz;
        }
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
