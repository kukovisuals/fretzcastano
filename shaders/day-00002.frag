uniform vec3 iResolution;
uniform float iTime;

// using for functions -> https://www.desmos.com/calculator
//

float pulsate(float time, float amplitude, float frequency, float phase) {
    return amplitude * abs(sin(time * frequency + phase));
}

float powSine(float time, float power, float frequency, float phase) {
    return pow(sin(phase + frequency * time), power);
    // pow(sin(0.0 + 0.0 * x), 8);
}

float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
}

float compositeSine(float time, float baseOffset, float amplitude1, float frequency1,
                    float amplitude2, float frequency2) {
    return baseOffset + amplitude1 * sin(frequency1 * time) + 
           amplitude2 * sin(frequency2 * time);
}

// Function to create a rectangular mask
float rectMask(vec2 uv, vec2 bottomLeft, vec2 topRight) {
    vec2 steps = step(bottomLeft, uv) * step(uv, topRight);
    return steps.x * steps.y;
}

// Cell data structure to hold position and color index
struct Cell {
    int x;      
    int y;     
    int colorIndex;  
};

// Function to get cell mask from a Cell structure
float getCellMask(vec2 uv, float hBorders[6], float vBorders[6], Cell cell) {
    float left = hBorders[cell.x];
    float right = hBorders[cell.x + 1];
    float bottom = vBorders[cell.y];
    float top = vBorders[cell.y + 1];
    
    return rectMask(uv, vec2(left, bottom), vec2(right, top));
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    float dt = iTime;


    vec3 colorPalette[11] = vec3[11](
        vec3(0.008,0.059,0.349),
        vec3(0.008,0.075,0.451),
        vec3(0.224,0.314,0.722),
        vec3(0.388,0.463,0.835),
        vec3(0.729,0.773,0.949),
        vec3(0.216, 0.251, 0.09),    
        vec3(0.898, 0.949, 0.714),   
        vec3(0.682, 0.749, 0.435),   
        vec3(0.396, 0.451, 0.196), 
        vec3(0.443, 0.851, 0.502),   
        vec3(0.553, 0.651, 0.337)
    );


    // animate color 
    float dc1 = pulsate(dt, 1.0, 1.14, 2.0);
    float dc2 = powSine(dt, 8.0, 0.4, 2.34);
    float dc3 = modulatedSine(dt, 0.4, 0.4, 1.0, 5.0, 2.9);
    float dc4 = compositeSine(dt, 0.5, 0.434, 3.0, 0.17, 1.0);

    // mix of colors 
    vec3 colMix1 = mix(colorPalette[0], colorPalette[4], dc1);
    vec3 colMix2 = mix(colorPalette[1], colorPalette[4], dc2);
    vec3 colMix3 = mix(colorPalette[4], colorPalette[5], dc3);
    vec3 colMix4 = mix(colorPalette[4], colorPalette[5], dc3);
    vec3 colMix5 = mix(colorPalette[1], colorPalette[9], dc4);
    vec3 colMix6 = mix(colorPalette[1], colorPalette[9], dc4);

    // Define your grid borders (6 values for 5 cells in each dimension)
    float hBorders[6] = float[6](0.0, 0.2, 0.4, 0.6, 0.8, 1.0);
    float vBorders[6] = float[6](0.0, 0.2, 0.4, 0.6, 0.8, 1.0);
    
    // Define your color palette
    vec3 colorPaletteMix[6] = vec3[6](
        colMix1,     
        colMix2,    
        colMix3,  
        colMix4,        
        colMix5,
        colMix6
    );
    
    // Define each cell with its position and color
    const int CELL_COUNT = 9 + 4; // Currently 9 cells, expandable to 25
    Cell cells[CELL_COUNT] = Cell[CELL_COUNT](
        Cell(0, 4, 0), // mTl - top left - colMix2
        Cell(2, 4, 1), // mMt - middle top - colMix1
        Cell(4, 4, 0), // mTr - top right - colMix1
        
        Cell(4, 2, 1), // mMr - middle right - colMix4
        Cell(4, 0, 0), // mBr - bottom right - colMix3

        Cell(2, 0, 1), // mMb - middle bottom - colMix2
        Cell(0, 0, 0), // mBl - bottom left - colMix4

        Cell(0, 2, 1), // mMl - middle left - colMix4
        // end of outside border 

        Cell(1, 3, 2), // mMtl - middle top left
        Cell(3, 3, 2), // mMtr - middle top right
        Cell(3, 1, 3), // mRbr - middle right bottom right
        Cell(1, 1, 3), // mRtr - middle right top right

        Cell(2, 2, 4)  // mMm - middle middle - colMix4
    );
    

    vec3 col = vec3(0.0);

    // Process all cells
    for (int i = 0; i < CELL_COUNT; i++) {
        float mask = getCellMask(uv, hBorders, vBorders, cells[i]);
        col += colorPaletteMix[cells[i].colorIndex] * mask;
    }
    
    
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}