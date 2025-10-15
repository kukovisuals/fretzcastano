uniform vec3 iResolution;
uniform float iTime; 


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓              🌟  KuKo Day 77  🌟              
    ▓  📚 Bought a Book: “Molecular Biology of the  
    ▓  Cell” — I wanna turn some of it into shaders                                     
    ▓                                                 
    ▓     ✨   (smooth blends from iq)            

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define T iTime
#define PI 3.14159265
mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float sdCircle( in vec2 p, in float r){return length(p) -  r;}
float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}
float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
float sout( float d1, float d2, float k )
{
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h);
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓      Monomers are the building blocks of     ▓
    ▓                   our DNA                    ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
vec3 monomers(vec2 uv)
{
    vec2 offset_1 = vec2(0.0,0.1);
    vec2 offset_2 = vec2(0.12,0.0);
    vec2 offset_3 = vec2(-0.12,0.0);

    float d1 = sdBox(uv           , vec2(0.1,0.05));
    float d2 = sdBox(uv + offset_1, vec2(0.05,0.1));

    float c1 = sdCircle(uv + offset_2, 0.045);
    float c2 = sdCircle(uv + offset_3, 0.05);
    
    float b3 = max(d1, -c2);
    float b  = smin(b3, d2, 0.04);
    float b2 = smin(b, c1, 0.03);

    float result = smoothstep(0.01, 0.0, b2);
    return vec3(result);
}

vec2 animation(vec2 p0, vec2 p1, float td)
{
    float t1  = clamp(T / td, 0.0, 1.0);
    float e   = t1 * t1 * (3.0 - 2.0 * t1);
    return  mix(p0, p1, e);
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                     Main                     ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv.x += T * 0.1;
    uv.y += sin(uv.x * 1.0 + T * 0.1) * 0.5 + 0.5; 
    
    vec3 color = vec3(0.094,0.094,0.094);

    vec3 green  = vec3(0.094,0.212,0.204);
    vec3 pink   = vec3(0.69,0.435,0.459); 
    vec3 blue   = vec3(0.1,0.3,0.5);
    vec3 yellow = vec3(0.737,0.612,0.318);  
    vec3 black  = vec3(0.0);

    vec2 cell = fract(uv * 1.5) - 0.5;
    // we wanna create some monomers
    float speed = 4.0;
    vec2 offset = vec2(-0.3, 0.4);
    cell += offset;
    
    // upper strip 
    vec3 mon0 = monomers(cell + vec2( 0.8, -0.5));
    color += mix(black, blue, mon0);

    vec2  pos = animation(vec2( 0.8 , -0.0),vec2(0.56, -0.5), speed);
    vec3 mon1 = monomers(cell + pos);
    color += mix(black, pink, mon1);
    
    vec2 pos2 = animation(vec2( 0.0, -0.2), vec2(0.32, -0.5), speed + 1.0);
    vec3 mon2 = monomers(cell + pos2);
    color += mix(black, yellow, mon2);

    vec2 pos3 = animation(vec2(-0.4 , -0.4),vec2(0.08, -0.5), speed + 2.0);
    vec3 mon3 = monomers(cell + pos3);
    color += mix(black, yellow, mon3);

    vec2 pos4 = animation(vec2(-0.8,  0.0), vec2(-0.16, -0.5), speed + 4.0);
    vec3 mon4 = monomers(cell + pos4);
    color += mix(black, green, mon4);

    vec2 pos5 = animation(vec2(-0.6, -0.9), vec2(-0.4, -0.5), speed + 6.0);
    vec3 mon5 = monomers(cell + pos5);
    color += mix(black, blue, mon5);

    // lower strip
    cell = rotate2D(PI) * cell;
    cell.y -= 0.8;
    cell.x *= -1.0;
    
    vec2 pos6 = animation(vec2(-0.2, -0.9), vec2( 0.8,0.9), speed + 3.0);
    vec3 mon6 = monomers(cell + pos6);
    color += mix(black, yellow, mon6);

    vec2 pos7 = animation(vec2(-0.4,  0.4), vec2(0.56,0.9), speed + 5.0);
    vec3 mon7 = monomers(cell + pos7);
    color += mix(black, green, mon7);

    vec2 pos8 = animation(vec2( 0.4,  0.4), vec2(0.32,0.9), speed + 6.0);
    vec3 mon8 = monomers(cell + pos8);
    color += mix(black, blue, mon8);

    vec2 pos9 = animation(vec2(-0.9,  0.8), vec2(0.08,0.9), speed + 7.0);
    vec3 mon9 = monomers(cell + pos9);
    color += mix(black, blue, mon9);

    vec2 pos10 = animation(vec2( 0.6,  0.6), vec2(-0.16,0.9), speed + 8.0);
    vec3 mon10 = monomers(cell + pos10);
    color += mix(black, blue, mon10);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
