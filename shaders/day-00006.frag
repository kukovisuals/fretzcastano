uniform vec3 iResolution;
uniform float iTime;

#define PI 3.14159265358979323846

// using for functions -> https://www.desmos.com/calculator

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}


float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

float shapeA (vec2 cellUv, float borderLeft, float borderRight, float columnRight, float borderWidth){
    float wave =  0.2 * sin(cellUv.y * 6.0) - 0.28; // amplitude * sin(freq * y + time)
    float distortedX = cellUv.x + wave;
    float waveTwo =  0.5 * cos(cellUv.y * 6.0) ;
    float distortedY = cellUv.y + waveTwo;

    float left = step(borderLeft, distortedX) - step(borderLeft + borderWidth, distortedX);
    float row = step(columnRight, cellUv.y) - step(columnRight + borderWidth, cellUv.y); //- step(0.99 , cellUv.x);
    float colR =  step(borderRight, distortedX) - step(borderRight + borderWidth, distortedX) ;

    row *= step(0.99 , cellUv.x);
    float finalShape = left + row + colR;

    return finalShape;
}

vec2 tilePattern( vec2 cellUv, vec2 cellId, float dt){
    float index  = 0.0;
    index += step(0.5, mod(cellUv.x, 2.0));
    index += step(0.5, mod(cellUv.y, 1.0)) * 2.0;

    float speed = 0.15;

    if(index == 1.0){
        cellUv = rotate2D(cellUv, PI);
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    } else if(index == 2.0){
        cellUv = rotate2D(cellUv, PI * 2.0  );
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    } else if(index == 3.0){
        cellUv = rotate2D(cellUv, PI * 0.5);
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    } else if(index == 0.0){
        cellUv = rotate2D(cellUv, PI * - 0.5);
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    }

    return cellUv;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;// * 2.0 - 0.0;
    float dt = iTime;
    vec3 color = vec3(0.0);

    float gridSize = 6.0;
    vec2 cellId = floor(uv * gridSize);
    vec2 cellUv = fract(uv * gridSize);

    cellUv = tilePattern(cellUv, cellId, dt);

    float borderLeft = 0.2;
    float borderRight = 0.7;
    float columnRight = 0.5;
    float borderWidth = 0.1;

    float finalShape = shapeA(cellUv, borderLeft, borderRight, columnRight, borderWidth);

    color = vec3(finalShape);

    fragColor = vec4(color, 1.0);
}



void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
