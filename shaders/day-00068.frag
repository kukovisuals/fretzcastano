uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
// forked - https://www.shadertoy.com/view/4sfGRn
// I wanted to create something I saw in my dreams
// thanks to iq for the example

// Created by inigo quilez - iq/2013
//   https://www.youtube.com/c/InigoQuilez
//   https://iquilezles.org/
// I share this piece (art and code) here in Shadertoy and through its Public API, only for educational purposes. 
// You cannot use, sell, share or host this piece or modifications of it as part of your own commercial or non-commercial product, website or project.
// You can share a link to it or an unmodified screenshot of it provided you attribute "by Inigo Quilez, @iquilezles and iquilezles.org". 
// If you are a teacher, lecturer, educator or similar and these conditions are too restrictive for your needs, please contact me and we'll work it out.

vec3 deform( in vec2 p )
{
    float time = 0.2*iTime;
    
    vec2 q =  vec2(0.0,0.0);
    
    float r = sqrt( dot(q,q));

    vec2 uv = p*sqrt(1.0+r*r);
    //uv += sin( vec2(0.0,1.6) + vec2(0.20,0.2 + time) );
     uv.y += time;   
    return texture( iChannel0, uv*0.43).xxx;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = -1.0 + 2.0*fragCoord/iResolution.xy;

    vec3  col = vec3(0.0);
    vec2  d = (vec2(0.0,1.0)-p)/64.0;
    float w = 0.70;
    vec2  s = p;
    for( int i=0; i<50; i++ )
    {
        float distH = (s.y - 1.0);
        float width = abs(distH) * 0.5; 
        
        float trianMask = step(abs(s.x), width);
        float center = 1.0 - smoothstep(0.0, width, abs(s.x));
        
        vec3 res = deform( s );
        col += w * smoothstep( 0.0, 1.0, res ) * trianMask * center;
        w *= .99;
        s += d;
    }
    col = col * 3.5 / 64.0;

	fragColor = vec4( col, 1.0 );
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
