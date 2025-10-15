uniform vec3 iResolution;
uniform float iTime; 

#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718

// using for functions -> https://www.desmos.com/calculator

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

vec3 triangle(vec2 cellUV){
    float d = 0.0;
    // Number of sides of your shape
    int N = 3;
    // Angle and radius from the current pixel
    float a = atan(cellUV.x,cellUV.y) + PI;
    float r = TWO_PI / float(N);
    // Shaping function that modulate the dicellUVance
    d = cos(floor(0.5 + a/r) * r-a) * length(cellUV);
    vec3 shape = vec3(1.0 - smoothstep(0.4, 0.41, d));

    return shape;
}

vec2 tileAnimation(vec2 cellUV, vec2 tileIndex, float dt) {
    float speed = 1.0;

    float modX = mod(tileIndex.x + 5.0, 4.0); // shift to positive range
    float phase = mod(floor(dt), 2.0); // 0 or 1 every second
    
    if(phase == 0.0){
        // go up and down 
        if (modX == 0.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) + vec2(0.0, dt * speed)) * 2.0 - 1.0;
        } else if (modX == 2.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) - vec2(0.0, dt * speed)) * 2.0 - 1.0;
        }
    } else {
        // go side ways 
        if (modX == 0.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) + vec2(dt * speed, 0.0)) * 2.0 - 1.0;
        } else if (modX == 2.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) - vec2( dt * speed, 0.0)) * 2.0 - 1.0;
        }
    }

    return cellUV;
}

vec3 trianglePattern(vec2 cellUV){
    vec2 p1 = cellUV - vec2(-1.0, -0.6);
    
    cellUV = rotate2D(cellUV, PI);
    vec2 p2 = cellUV - vec2(0.0, 0.4);

    cellUV = rotate2D(cellUV, TWO_PI);
    vec2 p3 = cellUV - vec2(2.0, 0.4);

    cellUV = rotate2D(cellUV, PI);
    vec2 p4 = cellUV - vec2(1.0, -0.6);

    return triangle(p1) + triangle(p2) + triangle(p3) + triangle(p4);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float dt = iTime;
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(0.0);

    vec2 grid = vec2(5.0);  // how many tiles you want * 2 
    vec2 tileIndex = floor(uv * grid) * 2.0 - 1.0;
    vec2 cellUV = fract(uv * grid) * 2.0 - 1.0;

    cellUV = tileAnimation(cellUV, tileIndex, dt);

    color = trianglePattern(cellUV);
    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
