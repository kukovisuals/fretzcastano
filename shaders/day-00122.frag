uniform vec3 iResolution;
uniform float iTime; 
uniform vec2 iMouse;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 122  🌟                
    
    ▓  Branching practice. I remember 14 years ago when I first 
    ▓  saw my first code in Processing - it was about someone 
    ▓  who created a tree with code and math. This got me hooked 
    ▓  on coding. Ever since that day, I wanted to learn how to 
    ▓  code. I didn't understand 99% of it. Now I'm happy to say
    ▓  that I understand 50% of it, haha. 
    
    ▓  This is very fun 😀
    
    ▓  Axiom: F
    ▓  Rule:  F -> [+F] F [-F] F     (classic bracketed tree)
    ▓  Turtle: F=draw forward, +=turn left, -=turn right, []=push/pop
    ▓  Based on @sillsm
    ▓  https://www.shadertoy.com/view/XtyGzh
     
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define PI 3.14159265359
#define SPEED iTime * 0.3

const int   DEPTH   = 7;             // 3^7 = 2187 paths
const float ANG     = radians(25.7);
const float LEN0    = 0.35;
const float SHRINK  = 0.66;          // per-level length shrink
const float WID     = 0.0021;        // branch radius
const int   BR      = 3;             // [+F], F, [-F]
const int   TOTAL   = 2187;          // 3^7 (keep in sync with DEPTH)

mat3 Rot(float a){
    float c=cos(a), s=sin(a);
    return mat3(c, s, 0, -s,c,0, 0,0,1);
}
mat3 Disp(vec2 d){
    return mat3(1,0,0, 0,1,0, vec3(d,1));
}

// Capsule along +Y in local space; h.x=radius, h.y=half-length-center
float sdCappedCylinder(vec2 p, vec2 h)
{
    p -= vec2(0.,h.y);
    vec2 d = abs(vec2(length(p.x),p.y)) - h;
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

vec2 treeOne(vec2 pt)
{
    // match "center" placement
    pt += vec2(0.0, 0.9);

    // trunk
    float dBranch = sdCappedCylinder(pt, vec2(WID, LEN0));
    float dLeaf   = 1e5;

    // angles to match "center"
    mat3 posR = Rot(-ANG);
    mat3 negR = Rot(+ANG);

    int c = 0;
    for (int iter = 0; iter < TOTAL && c < TOTAL; ++iter)
    {
        vec2 pLoc = pt;
        int off = TOTAL;

        // length schedule
        float l = LEN0;

        for (int i = 1; i <= DEPTH; ++i)
        {
            l *= 0.5; // now l == LEN0 / 2^i

            off /= BR;
            int dec  = c / off;
            int path = dec - BR * (dec / BR); // dec % BR

            // wind 
            mat3 wind0 = Rot(0.2 * sin(SPEED + 6.2));
            mat3 wind1 = Rot(0.2 * sin(SPEED + 1.0));

            mat3 mx;
            if (path == 0) {
                mx =         posR * Disp(vec2(0.0, -2.0*l));      // [+F]
            } else if (path == 1) {
                mx = wind0 * negR * Disp(vec2(0.0, -2.0*l));      //  F (with -ANG)
            } else { 
                mx = wind1 *        Disp(vec2(0.0, -4.0*l));      // [-F] (no rotation)
            }

            pLoc = (mx * vec3(pLoc, 1.0)).xy;

            // draw this segment
            float y = sdCappedCylinder(pLoc, vec2(WID, l));
            dBranch = min(dBranch, y);

            // noodle-bound cull
            if (y - 2.0*l > 0.0) { c += off - 1; break; }

            // tip leaf only at last level
            //if (i == DEPTH) {
                float rLeaf = 0.1531 * l;
                float leaf  = length(pLoc - vec2(0.0, 1.0*l)) - rLeaf;
                dLeaf = min(dLeaf, leaf);
            //}
        }

        c++;
    }

    return vec2(dBranch, dLeaf);
}

float glowFromSD(float sd, float px, float widthPx) {
    float x = max(sd, 0.0) / (widthPx * px); // only outside the leaf
    return exp(-x*x);                         // fast Gaussian falloff
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (I - 0.5*iResolution.xy) / iResolution.y;
    uv *= 1.0;
    // Compute distances: x=branches, y=leaves
    vec2 d = treeOne(uv);

    // Pixel AA
    float px = 1.0 / iResolution.y;

    // Branch color
    float wB = 0.0010; // visual thickness
    float mB = smoothstep(wB + 3.0*px, wB - px, d.x);
    vec3 col = mix(vec3(0.0), vec3(0.280, 0.9668, 0.874)*0.6, mB);

    // Leaf color 
    vec3 leafCol = vec3(0.522, 0.1172, 0.330);

    // leaf fill (inside circle)
    float leafCore = smoothstep(0.0, -2.0*px, d.y);   // 1 inside, 0 outside
    col = mix(col, leafCol, leafCore);

    // soft halo outside the leaf edge (width ~ 18 px)
    float halo = glowFromSD(d.y, px, 5.0);           
    col += leafCol * (0.15 * halo);                  
    // optional brighter rim right at the boundary:
    col += leafCol * 1.0 * smoothstep(6.0*px, 0.0, d.y);

    O = vec4(col, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
