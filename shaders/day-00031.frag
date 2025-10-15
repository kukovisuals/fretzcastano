uniform vec3 iResolution;
uniform float iTime; 

mat2 rotate2D(float r) { return mat2(cos(r), sin(r), -sin(r), cos(r));}

float sdLine( in vec2 p, in vec2 a, in vec2 b )
{   
    float h = min(1.0 , 
        max(0.0, dot(p - a, b - a) / dot(b - a, b - a)));
    
    return length(p - a - (b - a) * h);
}

float opRound( in vec2 p, in vec2 a, in vec2 b,  in float r )
{
    return sdLine(p, a, b) - r;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float t = iTime;
    vec2 uv = (2.0 * fragCoord - iResolution.xy)/iResolution.y;
    uv *= 1.5;
    uv *= rotate2D( t * 0.3);

    uv *= atan(uv * 1.0);
    vec2 sinRotation = -abs(sin(vec2(-0.1) * t * 1.0)) * (rotate2D( t * 0.5) * uv);
    vec2 cosRotation = 0.3 - cos(vec2(-0.2) * t * 5.0) * (rotate2D( t * 0.1) * uv);
    uv *= atan(uv * 1.0);

    float d = opRound(uv, sinRotation, cosRotation, 0.5);
    
    vec3 color = d > 0.0 ? vec3(0.0,0.6,0.6) : vec3(0.0, 0.9, 0.6);
    color *= 1.3 - exp(-5.0*abs(d));
    color *= 0.8 + 0.2*cos(50.0*d);

    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
