uniform vec3 iResolution;
uniform float iTime; 

#define PI 3.14159265358979323846

vec3 checkboard(vec2 uv)
{
    vec2 id = floor(uv) * 1.0;
    vec2 check = fract(uv) * 1.0;

    vec2 d1 = abs(check) - 0.9;
    float sqX = length(max(d1, 0.0));
    vec3 color = vec3(0.0);

    if(sqX > 0.0){
        color = vec3(0.0, sqX, sqX);
    } else {
        if(int(mod(id.y,2.0)) == 0 && int(mod(id.x,2.0)) == 0){
            color = vec3(1.0);
        } else {
            color = vec3(0.0);
        }
    }

    return color;
}

vec2 rotate2D(vec2 uv, float a)
{
    uv -= 0.5;
    uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;
    uv += 0.5;
    return uv;
}

void mainImage( out vec4 O, in vec2 I )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (2. * I - iResolution.xy) / iResolution.y;
    uv *= 2.0 - 1.0;
    float t = iTime;

    int effectIndex = int(mod(t / 1.0, 10.0));

    float gd = mod(t, 3.);
    uv += 2.0;
    float limit = clamp(0.0,2.0,uv.x * gd * 1.);
    vec3 color = vec3(limit);
    uv -= 2.0;
    
    // // 2. Linear gradient (Y-axis)
    if(effectIndex == 0){
        float clap = mod(t, 3.0); 
        uv.x += sin(uv.x * 10.1 * clap * 2.0);
        
        float d = step(0.3, uv.x);
        color = vec3(d);
        // 3. Radial gradient from center
        float center = length(uv) - 0.5;

        color = vec3(center);
    }
    // 4. Checkerboard pattern
    if(effectIndex == 1){
        uv.x += cosh(uv.x * 3.1);
        uv.x += t * 1.0;
        uv = fract(uv) * 2.5;
        color = checkboard(uv);
    }
    // 5. Horizontal stripes
    if(effectIndex == 2){
        uv.y += sinh(uv.y * 2.3);
        uv.y += t * 1.0;
        uv *= 2.0;
        uv = fract(uv) * 2.0;
        float d = step(0.5, uv.y);
        //float lines = length(uv.y * uv.y - 1.0) + 0.0;
        color = vec3(d);
    }
    // 6. Vertical stripes
    if(effectIndex == 3){
        uv.x += sinh(uv.y * 2.2);
        uv.x += t * 1.0;
        uv *= 2.0;
        uv = fract(uv) * 2.0;
        float d = step(0.5, uv.x);
        //float vertical = length(uv.x * uv.x - 1.0) + 0.0;
        color = vec3(d);
    }
    // 7. Diagonal stripes
    if(effectIndex == 4){
        
        uv.y += atan(uv.x * 2.1 * 2.0);
        uv.y += t * 1.0;
        uv = rotate2D(uv, PI/5.0);
        uv *= 2.0;
        uv = fract(uv) * 2.0;
        float d = step(0.5, uv.x);
        //float diagonal = length(uv.x * uv.x) + 0.2;
        color = vec3(d, d, d);
    }
    float speed = 5.0;
    // 8. Circle in center
    if(effectIndex == 5){
        uv.x += sin(uv.x * 5.1);
        // uv = fract(uv) * 10.0;
        float pulse = .5 - 2.5 * sin(t * 2.0) - 4.5;
        float circle = length(uv * pulse) - 0.5;
        color = vec3(circle);
    }
    // 9. Animated pulse

    if(effectIndex == 6){
        uv.x += sin(uv.x * 5.1);
        float pulse = .5 - 2.5 * sin(t * 2.0) - 4.5;
        float circle = length(uv * pulse) - 0.5;
        float colorX = -1.5 * 1.0 * sin(t * 5.1);
        color = vec3(circle * colorX);
    }
    // 10. Color rotation
    if(effectIndex == 7)
    {
        float clap = mod(t, 3.0);
        uv.x += cos(uv.y * 1.0 * clap * 5.2);
        uv.x += t * 1.5;
        
        float newColor = clamp(sin(clap), 0.3, 0.6);
        uv = fract(uv) * 10.0;
        if(uv.x > 6.0){
            color = vec3(0.5, clap, newColor);
        } else if(uv.x > 3.0){
            uv = rotate2D(uv, PI/5.);
            color = vec3(1.0, newColor, 1.0);
        } else {
            color = vec3(newColor ,clap, 1.0);
        }
    }
    
    if(effectIndex == 8)
    {
        float n,d;
        vec3 p = vec3(uv,1);
        color = vec3(2,4,6);
        for (n = 1.; n < 8.; n *= 1.4142 ) // try n += n too
            color -= abs(dot(sin(t+p*n*8.), vec3(1.))) / n;
        color *= color;
        color = tanh(color/4.);
    }
    

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
