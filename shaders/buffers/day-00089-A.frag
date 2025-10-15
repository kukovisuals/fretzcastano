uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform int       iFrame;  
// wyattflanders.com/MeAndMyNeighborhood.pdf

#define LOOKUP(COORD) texture(iChannel0,(COORD)/iResolution.xy)
#define T iTime

const float SPEED_D1 = 0.5;

vec4 Field (vec2 position) {
    // Rule 1 : All My Energy transates with my ordered Energy
    vec2 velocityGuess = LOOKUP (position).xy;
    vec2 positionGuess = position - velocityGuess;
	return LOOKUP (positionGuess);
}


void mainImage( out vec4 O, in vec2 Me )
{
    vec2 R = iResolution.xy;
    
    // Check if resolution changed (buffer was reset)
    if (iFrame < 2) {
        // Reinitialize with some base flow
        O = vec4(0.1, 0.0, 0.0, 0.0); // Small initial velocity
        return;
    }
    
    O  =  Field(Me);
    // Neighborhood :
    vec4 pX  =  Field(Me + vec2(1,0));
    vec4 pY  =  Field(Me + vec2(0,1));
    vec4 nX  =  Field(Me - vec2(1,0));
    vec4 nY  =  Field(Me - vec2(0,1));
    
    // Rule 2 : Disordered Energy diffuses completely :
    O.b = (pX.b + pY.b + nX.b + nY.b)/4.0;
    
    // Rule 3 : Order in the disordered Energy creates Order :
    vec2 Force;
    Force.x = nX.b - pX.b;
    Force.y = nY.b - pY.b;
    O.xy += Force/4.0;
    
    // Rule 4 : Disorder in the ordered Energy creates Disorder :
    O.b += (nX.x - pX.x + nY.y - pY.y)/4.;
    
    // Gravity effect :
    O.y -= O.w/300.0;
    
    // Mass concervation :
    // internal energy and follow me?
    O.w += (nX.x*nX.w - pX.x*pX.w + nY.y*nY.w - pY.y*pY.w)/4.;
    
    //Boundary conditions :
    if(Me.x<10.||Me.y<10.||R.x-Me.x<10.||R.y-Me.y<10.)
    {
    	O.xy *= 0.;
    }
    
    float minDim = min(R.x, R.y);
    vec2 d1 = R * 0.5 + vec2(cos(T * SPEED_D1), 
              sin(T * SPEED_D1)) * minDim * 0.4;
    float r = 7.0;
    float dist = length( Me - d1);

    if (dist < r) {
        O.w = 1.0;  
    }
    if (length(Me-vec2(0.4,0.6)*R)<0.02*R.x)
        O = mix(O,vec4(0,0.7,0,1),0.01);
    
    if (length(Me-vec2(0.6,0.6)*R)<0.02*R.x)
        O = mix(O,vec4(0,0.7,0,1),0.01);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
