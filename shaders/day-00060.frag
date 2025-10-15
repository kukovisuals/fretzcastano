uniform vec3 iResolution;
uniform float iTime; 

/*
    * Forked from -> https://www.shadertoy.com/view/wcyXzV
    * Original version from  mrange 
    * This is an extended version 
*/

// CC0: Sorry for the banding
// Tunnel raymarcher with spherical distance fields
// Note: Banding artifacts present due to optimization constraints

// Configuration constants
const float MAX_RAY_STEPS = 77.0;
const float STEP_SIZE = 0.6;
const float TUNNEL_SPEED = 0.25;
const float SPHERE_RADIUS = 0.65;
const float MIN_DIST_EPSILON = 2e-3;
const float BRIGHTNESS_SCALE = 1e4;
const float COLOR_FREQUENCY = 5.0 * 2.0;

// Rotation matrix creation helper
mat2 rotate2d(float a) {
    float fx = sin(iTime * 0.035) * 3.5 + 4.5;
    return mat2(cos(a + vec4(5.0 + fx, fx, 30.0 + fx, -fx)));
}

// Distance field function - creates repeating spheres in a grid
float calculateDistanceToSpheres(vec3 p) {
    vec3 cell_p = fract(p) - 0.5;
    float d_sphere = length(cell_p);
    float d_surface = abs(d_sphere - SPHERE_RADIUS);
    
    return d_surface + MIN_DIST_EPSILON;
}

// Generate procedural color based on position
vec4 calculateProceduralColor(vec3 p) {
    float fx = sin(iTime * 1.535) * 0.5 + 0.5;
    vec4 colorPhi = vec4(1.0 + fx, 0.1, 0.2, 10);
    return 0.76 + sin(COLOR_FREQUENCY * p.x + p.z + colorPhi);
}

// Convert screen coordinates to world ray direction
vec3 screenToWorldRay(vec2 uv) {
    vec2 new_uv = uv + uv;
    vec3 rd = vec3(new_uv, 0.0) - iResolution.xyy;
    return normalize(rd);
}

// Apply tunnel motion and rotation effects
vec3 applyTunnelTransformation(vec3 p) {
    vec3 new_p = p;
    
    new_p.z -= TUNNEL_SPEED * iTime * 0.5;
    
    float delta = new_p.z;
    new_p.xy *= rotate2d(delta);
    
    return new_p;
}

void mainImage(out vec4 O, vec2 I) {
    O = vec4(0.0);
    float dt = -0.6;
    vec3 rd = screenToWorldRay(I);
    
    for (float i = 0.0; i < MAX_RAY_STEPS; i++) 
    {
        vec3 p = dt * rd;
        p = applyTunnelTransformation(p);
        float ds = calculateDistanceToSpheres(p);
        
        vec4 color = calculateProceduralColor(p);
        
        float colorA = color.w / ds;
        O += colorA * color;
        
        dt += STEP_SIZE * ds;
    }
    
    O = tanh(O / BRIGHTNESS_SCALE);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
