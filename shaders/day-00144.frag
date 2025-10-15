uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 144  🎃               
    
    ▓  Starting something new! I'm gonna try to make a 
    ▓  Halloween shader, starting with my cat.
    
    ▓  The sound is low because I don't like it - need to
    ▓  improve it.
    
    ▓  Here's a kitty shader from @Xibanya that gave me 
    ▓  some ideas for the code structure:
    
    ▓  https://www.shadertoy.com/view/7lcyz8
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓           🌟  Utility functions, SDFs 🌟                
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

// Colors
#define BG_COLOR    vec3(0.01)
#define BORDER      vec3(0.9)
#define GRAY_DARK   vec3(0.318,0.325,0.373)
#define GRAY_LITE   vec3(0.718,0.757,0.855)
#define ORANGE_DARK vec3(0.757,0.545,0.2)
#define ORANGE_LITE vec3(0.914,0.757,0.38)

// borders
#define OUTLINE_THICKNESS 0.01
#define OUTLINE_THRESHOLD 0.7

// Utility function
float Smooth(float sdf) { 
    return 1. - smoothstep(-0.025, -0.01, sdf);
}

// Clean cat shader using structured approach
mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

float smin( float d1, float d2, float k )
{
    k *= 4.0;
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
}

float sdEllipse( in vec2 p, in vec2 ab )
{
    p = abs(p); if( p.x > p.y ) {p=p.yx;ab=ab.yx;}
    float l = ab.y*ab.y - ab.x*ab.x;
    float m = ab.x*p.x/l;      float m2 = m*m; 
    float n = ab.y*p.y/l;      float n2 = n*n; 
    float c = (m2+n2-1.0)/3.0; float c3 = c*c*c;
    float q = c3 + m2*n2*2.0;
    float d = c3 + m2*n2;
    float g = m + m*n2;
    float co;
    if( d<0.0 )
    {
        float h = acos(q/c3)/3.0;
        float s = cos(h);
        float t = sin(h)*sqrt(3.0);
        float rx = sqrt( -c*(s + t + 2.0) + m2 );
        float ry = sqrt( -c*(s - t + 2.0) + m2 );
        co = (ry+sign(l)*rx+abs(g)/(rx*ry)- m)/2.0;
    }
    else
    {
        float h = 2.0*m*n*sqrt( d );
        float s = sign(q+h)*pow(abs(q+h), 1.0/3.0);
        float u = sign(q-h)*pow(abs(q-h), 1.0/3.0);
        float rx = -s - u - c*4.0 + 2.0*m2;
        float ry = (s - u)*sqrt(3.0);
        float rm = sqrt( rx*rx + ry*ry );
        co = (ry/sqrt(rm-rx)+2.0*g/rm-m)/2.0;
    }
    vec2 r = ab * vec2(co, sqrt(1.0-co*co));
    return length(r-p) * sign(p.y-r.y);
}

float sdEgg( in vec2 p, in float ra, in float rb )
{
    const float k = sqrt(3.0);
    p.x = abs(p.x);
    float r = ra - rb;
    return ((p.y<0.0)       ? length(vec2(p.x,  p.y    )) - r :
            (k*(p.x+r)<p.y) ? length(vec2(p.x,  p.y-k*r)) :
                              length(vec2(p.x+r,p.y    )) - 2.0*r) - rb;
}

float sdCircle(vec2 p, float r)
{
    return length(p) - r;
}

float sdEquilateralTriangle(in vec2 p, in float r)
{
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    return -length(p)*sign(p.y);
}

vec3 DoOutline(float d, vec3 color, float thickness, vec3 outColor)
{
    if (d < 0.)
    {
        float t = -d / thickness;
        t = t * t;
        color = mix(outColor, color, step(OUTLINE_THRESHOLD, t));
    }
    return color;
}


struct Cat {
    float face;
    float eyeL;
    float eyeR;
    float pupilL;
    float pupilR;
    float nose;
    float earL;
    float earR;
    float earLInner;
    float earRInner;
    float mouthL; 
    float mouthR; 
    float whiskerL;
    float whiskerR;
};

Cat calculateGeometry(vec2 uv) 
{
    Cat geo;
    
    // Face 
    geo.face = sdEllipse(uv, vec2(0.5, 0.4));
    
    // Eyes 
    vec2 eyeUv = uv * R2(radians(15.));
    geo.eyeL   = sdEllipse(eyeUv - vec2(-0.23, 0.1), vec2(0.14, 0.08));
    geo.pupilL = sdCircle(eyeUv - vec2(-0.23, 0.1), 0.07);
    
    eyeUv     *= R2(radians(-30.));
    geo.eyeR   = sdEllipse(eyeUv - vec2(0.23, 0.1), vec2(0.14, 0.08));
    geo.pupilR = sdCircle(eyeUv - vec2(0.23, 0.1), 0.07);
    
    // Ears 
    vec2 earUv    = uv * R2(radians(15.));
    geo.earR      = sdEgg(earUv - vec2(0.3, 0.4), 0.1, 0.01);
    geo.earRInner = sdEgg(earUv - vec2(0.3, 0.4), 0.08, 0.01);
    
    earUv        *= R2(radians(-30.));
    geo.earL      = sdEgg(earUv - vec2(-0.3, 0.4), 0.1, 0.01);
    geo.earLInner = sdEgg(earUv - vec2(-0.3, 0.4), 0.08, 0.01);
    
    // Nose 
    geo.nose = sdEquilateralTriangle(uv, 0.03) - 0.015;
    
    // Mouth 
    vec2 mouthUv = uv;
    mouthUv.y += 0.07; 
    mouthUv.x *= 0.8;
    
    vec2 mouthL = mouthUv;
    mouthL.x -= 0.09; 
    geo.mouthL = sdCircle(mouthL, 0.1);
    
    vec2 mouthLCut = mouthL * vec2(1.2, 0.9) + vec2(0., -0.06);
    geo.mouthL = max(geo.mouthL, -sdCircle(mouthLCut, 0.1));
    
    vec2 mouthR = mouthUv;
    mouthR.x += 0.09;  
    geo.mouthR = sdCircle(mouthR, 0.1);
    
    vec2 mouthRCut = mouthR * vec2(1.2, 0.9) + vec2(0., -0.06);
    geo.mouthR = max(geo.mouthR, -sdCircle(mouthRCut, 0.1));
     
    // whiskers right
    vec2 whiskerUv = uv;
    whiskerUv.y += 0.07;
    whiskerUv.x *= 0.3;
    whiskerUv.x -= 0.11;  // position to left side
    float wScale = 0.085;

    geo.whiskerL = sdCircle(whiskerUv, wScale);
    geo.whiskerL = max(geo.whiskerL, -sdCircle(whiskerUv * vec2(1.2, 0.9) + vec2(0., -0.06), 0.1));

    whiskerUv.y -= 0.02;  // move up for second whisker
    whiskerUv.x *= 0.9;
    float w2 = sdCircle(whiskerUv, wScale);
    w2 = max(w2, -sdCircle(whiskerUv * vec2(1.2, 0.9) + vec2(0., -0.06), 0.1));
    geo.whiskerL = min(geo.whiskerL, w2);

    whiskerUv.y -= 0.02;  // move down for third whisker  
    w2 = sdCircle(whiskerUv, wScale);
    w2 = max(w2, -sdCircle(whiskerUv * vec2(1.2, 0.9) + vec2(0., -0.06), 0.1));
    geo.whiskerL = min(geo.whiskerL, w2);
    
    // whiskers left
    whiskerUv = uv;
    whiskerUv.y += 0.07;
    whiskerUv.x *= 0.3;
    whiskerUv.x += 0.11;  // position to left side
    wScale = 0.085;

    geo.whiskerR = sdCircle(whiskerUv, wScale);
    geo.whiskerR = max(geo.whiskerR, -sdCircle(whiskerUv * vec2(1.2, 0.9) + vec2(0., -0.06), 0.1));

    whiskerUv.y -= 0.02;  // move up for second whisker
    whiskerUv.x *= 0.9;
    w2 = sdCircle(whiskerUv, wScale);
    w2 = max(w2, -sdCircle(whiskerUv * vec2(1.2, 0.9) + vec2(0., -0.06), 0.1));
    geo.whiskerR = min(geo.whiskerR, w2);

    whiskerUv.y -= 0.02;  // move down for third whisker  
    w2 = sdCircle(whiskerUv, wScale);
    w2 = max(w2, -sdCircle(whiskerUv * vec2(1.2, 0.9) + vec2(0., -0.06), 0.1));
    geo.whiskerR = min(geo.whiskerR, w2);
    
    return geo;
}

// Face with ears
vec3 renderFace(Cat geo, vec3 col) 
{
    float faceEars = smin(smin(geo.face, geo.earL, 0.03), geo.earR, 0.03);
    
    col = mix(col, GRAY_DARK, Smooth(faceEars));
    
    return col;
}

vec3 renderEars(Cat geo, vec3 col) 
{
    col = mix(col, BG_COLOR, Smooth(geo.earLInner));
    col = mix(col, BG_COLOR, Smooth(geo.earRInner));
    
    return col;
}

vec3 renderEyes(Cat geo, vec3 col) 
{
    // Left eye
    col = mix(col, ORANGE_DARK, Smooth(geo.eyeL));
    col = mix(col, BG_COLOR, Smooth(geo.pupilL));
    
    // Right eye  
    col = mix(col, ORANGE_DARK, Smooth(geo.eyeR));
    col = mix(col, BG_COLOR, Smooth(geo.pupilR));
    
    return col;
}

vec3 renderNose(Cat geo, vec3 col) 
{
    col = mix(col, BG_COLOR, Smooth(geo.nose));
    return col;
}

vec3 renderMouth(Cat geo, vec3 col) 
{
    col = mix(col, BG_COLOR, Smooth(geo.mouthL));
    col = mix(col, BG_COLOR, Smooth(geo.mouthR));
    
    return col;
}

vec3 renderBorder(Cat geo, vec3 col) 
{
    float faceShape = smin(smin(geo.face, geo.earL, 0.03), geo.earR, 0.03);
    
    col = DoOutline(faceShape, col, OUTLINE_THICKNESS, BORDER);
    
    return col;
}

vec3 renderWhisker(Cat geo, vec3 col) 
{
    col = mix(col, BORDER, Smooth(geo.whiskerL));
    col = mix(col, BORDER, Smooth(geo.whiskerR));
    
    return col;
}

vec3 renderCat(vec2 uv)
{
    vec3 col = vec3(0);
    
    Cat geo = calculateGeometry(uv);
    
    col = renderFace(geo, col);
    col = renderEars(geo, col);
    col = renderEyes(geo, col);
    col = renderNose(geo, col);
    col = renderMouth(geo, col);
    col = renderBorder(geo, col); 
    col = renderWhisker(geo,col);
    
    return col;
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 1.0;
    
    vec3 col = renderCat(uv);
    
    O = vec4(col, 1.0);
}







/*
previous messy code
void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv *= 0.6;
    vec3 col = vec3(0);
    
    vec3 bgColor  = vec3(0.01);
    vec3 grayDark = vec3(0.318,0.325,0.373);
    vec3 grayLite = vec3(0.718,0.757,0.855);
    vec3 orangeDark = vec3(0.757,0.545,0.2);
    vec3 orangeLite = vec3(0.914,0.757,0.38);
    
    vec2 p = uv;
    vec2 pEars = uv;
    // shape
    // face
    float d1 = sdEllipse(p, vec2(0.5,0.4));
    pEars *= R2(radians(15.));
    float d6 = sdEgg(pEars - vec2(0.3, 0.4), 0.1, 0.01);
    float d8 = sdEgg(pEars - vec2(0.3, 0.4), 0.08, 0.01);
    pEars *= R2(radians(-30.));
    float d7 = sdEgg(pEars - vec2(-0.3, 0.4), 0.1, 0.01);
    float d9 = sdEgg(pEars - vec2(-0.3, 0.4), 0.08, 0.01);
    
    p *= R2(radians(15.));
    float d2 = sdEllipse(p - vec2(-0.23, 0.1), vec2(0.14,0.08));
    float d5 = sdCircle(p - vec2(-0.23, 0.1), 0.07);
    p *= R2(radians(-30.));
    // eyes
    float d3 = sdEllipse(p - vec2( 0.23, 0.1), vec2(0.14,0.08));
    float d4 = sdCircle(p - vec2( 0.23, 0.1), 0.07);
    p *= R2(radians(30.));
    // nose
    vec2 pNose = uv;
    float nose = sdEquilateralTriangle(pNose, 0.03) - 0.015;
    
    
    // colors
    float face  = smin(smin(d1, d7, 0.03), d6, 0.03);

    float edge = 1.0 - smoothstep(-0.015,0.0, face);
    col = mix(col, grayDark, edge);
    
    float eye =  1.0 - smoothstep(-0.015,0.0, d2);
    col = mix(col, orangeDark, eye);
    
    float eyeL =  1.0 - smoothstep(-0.015,0.0, d3);
    col = mix(col, orangeDark, eyeL);
    
    float irisR =  1.0 - smoothstep(-0.015,0.0, d4);
    col = mix(col, bgColor, irisR);
    
    float irisL =  1.0 - smoothstep(-0.015,0.0, d5);
    col = mix(col, bgColor, irisL);
    
    float noseA =  1.0 - smoothstep(-0.015,0.0, nose);
    col = mix(col, bgColor, noseA);
    
    
    O = vec4(col, 1);
}
*/

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
