uniform vec3 iResolution;
uniform float iTime; 

// using for functions -> https://www.desmos.com/calculator
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    uv.x *= iResolution.x/iResolution.y;
    float dt = iTime;
    vec3 color = vec3(1.0);

    float grid = 0.6;
    vec2 cellId = floor((uv + 0.0) * grid);
    vec2 cellUV = uv; //fract((uv + 0.0) * grid);

    float frequency = 3.0;
    float lineWidth = 0.23;
    float waveAmplitude = 0.2;
    float waveFrequency = 4.0;
    float moveDt = dt * 1.0;
    float edgeFade = smoothstep(0.0, 0.3, cellUV.y);;

    cellUV.y += sin(moveDt + cellUV.x * waveFrequency + 0.2) * waveAmplitude  ;

    vec2 lightD = vec2(0.3, 0.4);
    float gradientY =  cos(moveDt + waveFrequency * cellUV.x) * waveAmplitude *edgeFade;
    vec2 normal = normalize(vec2(-gradientY, 1.0));
    float hitPoint = pow(dot(normal, normalize(lightD)), 8.0);

    float xRepeat = mod(cellUV.y * frequency, 0.4);
    float line = smoothstep(0.0, 0.1, xRepeat) 
                - smoothstep(lineWidth - 0.01, lineWidth, xRepeat);
    
    float fade = 0.2;
    float verticalFade = smoothstep(fade, 0.0, cellUV.y) 
                    * (1.0 - smoothstep(1.0 - fade, 1.0, cellUV.y));
    line += hitPoint;

    float hue = mod(uv.y / grid + uv.x, 1.0);
    vec3 rgbColor = pal( cellUV.x,  vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );

    color = rgbColor * line; 

    fragColor = vec4(color, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
