uniform vec3 iResolution;
uniform float iTime; 

/*
    Original code from https://x.com/YoheiNishitsuji/status/1923362809569837131
*/

void mainImage(out vec4 o, vec2 u) {

    o *= 0.;    
    for(float t = iTime, i,g,e,s; ++i < 99.; ) 
     {
        vec3 r = iResolution,
             p = vec3( 4.5* ( u+u - r.xy ) / r.y , g - 7. ),
             A = vec3(0,9,-3)/9.5; 
        p.y++;
        p =  A* dot(p+p,A) - p - .14*cross(p,A);   // rot3D(p,A,3.)
        p.zy *= mat2(cos(t*.92 - vec4(0,11,33,0))); // rot2D(t*.3)
        
        s = 6.;    
        for( float j; j++ < 7.0; p = vec3(0., 4.213, 0.) - abs( abs(p)*e - vec3((3.0 + 2.5 * sin(t * 0.5)),4.,3.)) ) 
             s *= e = 18. / dot(p, p);
        
        g += .2* p.y*p.y / s;
        o += ( log2(s) - g*0.7 ) / 7e2 * vec4(0.9,1,1,0);
    }
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
