uniform vec3 iResolution;
uniform float iTime;
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    float dt = iTime;

    float sinX = 0.5 + 0.5 * abs(sin(dt * 2.5));
    float sinX2 = 0.5 + 0.5 * abs(sin(dt * 2.0));
    float sinX3 = 0.5 + 0.5 * abs(sin(dt * 5.5));

    float sinSmooth = smoothstep(0.6, 0.9, sinX2);
    
    float stepX = step(0.5, uv.x);
    float stepYPow = pow(uv.y, 2.0);
    float stepYfact = 0.5 * fract(uv.x);

    float stepY = step(0.5, uv.y);
    float fade = smoothstep(0.0, 0.5, dt);
    

    // Auto-cycle through effects every 3 seconds
    int effectIndex = int(mod(dt / 1.0, 8.0));
    vec3 col; 

    if(effectIndex == 0) col = vec3(sinSmooth, stepY, stepY);
    else if(effectIndex == 2) col = vec3(sinX3, stepX, stepX);
    else if(effectIndex == 3) col = vec3(sinSmooth, stepY, stepY);
    else if(effectIndex == 5) col = vec3(stepX, stepY, sinSmooth);
    else if(effectIndex == 6) col = vec3(stepY, sinSmooth, sinSmooth);
    else if(effectIndex == 7) col = vec3(sinSmooth, stepY, sinSmooth);
    else if(effectIndex == 8) col = vec3(sinX3, sinSmooth, stepYPow);
    else col = vec3(stepX, sinSmooth, stepY);
    
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}