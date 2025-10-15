uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                KuKo Day - 69                 ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

const int ARR_SIZE = 10;
float sdCircle(vec2 p, float r)
{
    return length(p) - r;
}
vec2 map(vec2 p)
{
    vec2 shape[ARR_SIZE];
    shape[0] = vec2( 0.0, 0.0);
    shape[1] = vec2( 0.4,-0.4);
    shape[2] = vec2( 0.5,-0.6);
    shape[3] = vec2( 0.3,0.5);
    shape[4] = vec2(-0.6,-0.5);
    shape[5] = vec2(-0.6,-0.1);
    shape[6] = vec2(-0.4,-0.3);
    shape[7] = vec2(-0.5, 0.6);
    shape[8] = vec2( 0.3, 0.3);
    shape[9] = vec2( 0.1, 0.4);

    float size = 0.1;
    float d1  = sdCircle(p + shape[0], size + 0.2);
    float d2  = sdCircle(p + shape[1], size);
    float d3  = sdCircle(p + shape[2], size - 0.04);
    float d4  = sdCircle(p + shape[3], size);
    float d5  = sdCircle(p + shape[4], size - 0.04);
    float d6  = sdCircle(p + shape[5], size - 0.04);
    float d7  = sdCircle(p + shape[6], size);
    float d8  = sdCircle(p + shape[7], size + 0.1);
    float d9  = sdCircle(p + shape[8], size - 0.04);
    float d10 = sdCircle(p + shape[9], size);

    float sp = min(d1, d2); sp = min(sp, d3); sp = min(sp, d4); sp = min(sp, d5); sp = min(sp, d6); sp = min(sp, d7); sp = min(sp, d8); sp = min(sp, d9);
    
    vec2 result = vec2(min(sp, d10), 0.0);
    
    if(d1 == result.x) result.y = 0.0;
    else if(d2 == result.x) result.y = 1.0;
    else if(d3 == result.x) result.y = 2.0;
    else if(d4 == result.x) result.y = 3.0;
    else if(d5 == result.x) result.y = 4.0;
    else if(d6 == result.x) result.y = 5.0;
    else if(d7 == result.x) result.y = 6.0;
    else if(d8 == result.x) result.y = 7.0;
    else if(d9 == result.x) result.y = 8.0;
    else result.y = 9.0;

    return result;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.086,0.078,0.082);

    vec2 d = map(uv);
    float dist = d.x;
    float id = d.y;

    vec3 colors[ARR_SIZE];

    if(dist < 0.001)
    {
        colors[0] = vec3(0.063,0.122,0.337);
        colors[1] = vec3(0.69,0.435,0.459);
        colors[2] = vec3(0.686,0.596,0.227);
        colors[3] = vec3(0.094,0.212,0.204);
        colors[4] = vec3(0.569,0.145,0.094);
        colors[5] = vec3(0.749,0.431,0.008);
        colors[6] = vec3(0.737,0.612,0.318);
        colors[7] = vec3(0.573,0.525,0.604);
        colors[8] = vec3(0.38,0.541,0.722);
        colors[9] = vec3(0.176,0.314,0.471);

        color = colors[int(id)];
    }

    O = vec4(color, 1.0);
}

/*
    I've been having problems coloring shapes in 3D 
    no wonder I could barely color the circles using 
    some sort of map. It's good training I like it. 
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
