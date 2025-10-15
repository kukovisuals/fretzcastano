uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    * Day 168 
    * Day 4 of work retreat, last day it was hard to do shaders on a work retreat 
    
    * AA practice using FXAA from a 2009 paper
    * https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf?
*/

float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
// helper to avoid multiple luma calls
vec3 cN(vec3 x){return x;}

vec3 fxaa(sampler2D tex, vec2 uv, vec2 rcpFrame)
{
    // 3x3 neighborhood
    vec3 cM = texture(tex, uv).rgb;
    float lM = luma(cM);
    float lN = luma(texture(tex, uv + vec2(0.0, -rcpFrame.y)).rgb);
    float lS = luma(texture(tex, uv + vec2(0.0,  rcpFrame.y)).rgb);
    float lW = luma(texture(tex, uv + vec2(-rcpFrame.x, 0.0)).rgb);
    float lE = luma(texture(tex, uv + vec2( rcpFrame.x, 0.0)).rgb);

    // edge direction (FXAA uses luma gradient)
    float lH = (lW + lE) - 2.0*lM;
    float lV = (lN + lS) - 2.0*lM;

    // choose primary direction (bigger magnitude)
    bool horiz = abs(lH) >= abs(lV);
    float dirSign = horiz ? sign(lH) : sign(lV);
    vec2 dir = horiz ? vec2(dirSign, 0.0) : vec2(0.0, dirSign);

    // reduce step size on weak edges (similar to FXAA's reduce logic)
    float lMin = min(lM, min(min(lN,lS), min(lW,lE)));
    float lMax = max(lM, max(max(lN,lS), max(lW,lE)));
    float contrast = lMax - lMin;
    if(contrast < 0.031) return cM; // skip very low-contrast regions

    // sample along edge normal (per FXAA, filter is perpendicular to gradient)
    vec2 stepUV = dir.yx * rcpFrame; // rotate 90°
    // short & long taps (FXAA adapts; keep it tiny to avoid blur)
    vec3 c1 = texture(tex, uv + stepUV*0.5).rgb;
    vec3 c2 = texture(tex, uv - stepUV*0.5).rgb;
    vec3 c3 = texture(tex, uv + stepUV*1.5).rgb;
    vec3 c4 = texture(tex, uv - stepUV*1.5).rgb;

    vec3 blendNarrow = 0.5*(c1 + c2);
    vec3 blendWide   = 0.5*(c3 + c4);

    // pick narrow vs wide depending on how strong the edge is (very rough analog)
    float edgeStrength = clamp(contrast*8.0, 0.0, 1.0);
    vec3  result = mix(blendNarrow, blendWide, edgeStrength*0.5);

    // clamp to neighborhood to avoid overshoot (FXAA uses neighborhood bounds)
    result = clamp(result, min(min(cM, min(cN(c1), cN(c2))), min(c3, c4)),
                           max(max(cM, max(cN(c1), cN(c2))), max(c3, c4)));
    return result;
}


void mainImage(out vec4 O, vec2 I)
{
    vec2 R = iResolution.xy;
    vec2 uv  = I / R;
    vec2 rcp = 1.0 / R;

    vec3 colAA = fxaa(iChannel0, uv, rcp);
    O = vec4(colAA, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
