uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓              🌟  KuKo Day 112  🌟                
    
    ▓  AA practice. using iqs AA method 
     
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

// Copyright Inigo Quilez, 2014 - https://iquilezles.org/
// I am the sole copyright owner of this Work.
// You cannot host, display, distribute or share this Work neither
// as it is or altered, here on Shadertoy or anywhere else, in any
// form including physical and digital. You cannot use this Work in any
// commercial or non-commercial product, website or project. You cannot
// sell this Work and you cannot mint an NFTs of it or train a neural
// network with it without permission. I share this Work for educational
// purposes, and you can link to it, through an URL, proper attribution
// and unmodified screenshot, as part of your educational material. If
// these conditions are too restrictive please contact me and we'll
// definitely work it out.

// An edge antialising experiment, without using supersampling. The idea is
// to a cone instead of a ray, and detect it overlapping with the pixel
// footprint (extended like it was a little frustum). You can then use that
// coverage as the color contribution factor of that piece of SDF geometry
// for the current pixel. See line 146.


#define ANTIALIASING


#define T iTime
#define PI 3.14159265359

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.2831853 * (c * t + d));
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

vec2 sincos( float x ) { return vec2( sin(x), cos(x) ); }

vec2 sdSegment( in vec3 p, in vec3 a, in vec3 b )
{
    
    float wave1 = sin(p.y * 6.2 - T * 2.) * 0.06;
    float wave2 = sin(p.y * 2.5 - T * 1.) * 0.03;
    vec3 wp = p; wp.x += wave1 + wave2;
    
    float r = 0.03;

    vec3 pa = wp - a, ab = b - a;
    float t = clamp(dot(pa,ab)/dot(ab,ab), 0.0, 1.0);   // axis param in [0,1]
    float d = length(pa - ab*t)- r;
    return vec2(d, t);
}

vec3 opU( vec3 d1, vec3 d2 ) { return (d1.x<d2.x) ? d1 : d2; }

vec3 map( vec3 p )
{
    p.x += T * 0.2;
    vec2 id = floor( (p.xz+1.0)/2.0);
    //p.z -= T;
    p.xz = mod( p.xz+1.0, 2.0 ) - 1.0;
    
    float ph = sin(0.5 + 3.1*id.x + sin(0.1*id.y));
    
    p.xz += 0.5*sincos(1.0+0.5*iTime+(p.y+11.0*ph)*0.8);
    
    vec3 p1 = p; p1.xz += 0.15*sincos(1.0*p.y-1.0*iTime+0.0);
    vec3 p2 = p; p2.xz += 0.15*sincos(1.0*p.y-1.0*iTime+2.0);
    vec3 p3 = p; p3.xz += 0.15*sincos(1.0*p.y-1.0*iTime+4.0);
    
    vec2 h1 = sdSegment(p2, vec3(0.0,-50.0, 0.0), vec3(0.0, 50.0, 0.0) );
    vec2 h2 = sdSegment(p2, vec3(0.0,-50.0, 0.0), vec3(0.0, 50.0, 0.0) );
    vec2 h3 = sdSegment(p2, vec3(0.0,-50.0, 0.0), vec3(0.0, 50.0, 0.0) );
    
    return opU( opU( vec3(h1.x-0.12,                                  ph + 0.0/3.0, h1.y), 
                     vec3(h2.x-0.12-0.05*cos(1000.0*h2.y - iTime*4.0), ph + 1.0/2.0, h2.y) ), 
                     vec3(h3.x-0.12-0.02*cos(2000.0*h3.y - iTime*0.5), ph + 2.0/3.0, h3.y) );
}

//-------------------------------------------------------

vec3 calcNormal( in vec3 pos, in float dt )
{
    vec2 e = vec2(1.0,-1.0)*dt;
    return normalize( e.xyy*map( pos + e.xyy ).x + 
					  e.yyx*map( pos + e.yyx ).x + 
					  e.yxy*map( pos + e.yxy ).x + 
					  e.xxx*map( pos + e.xxx ).x );
}

float calcOcc( in vec3 pos, in vec3 nor )
{
    const float h = 0.15;
	float ao = 0.0;
    for( int i=0; i<8; i++ )
    {
        vec3 dir = sin( float(i)*vec3(1.0,7.13,13.71)+vec3(0.0,2.0,4.0) );
        dir = dir + 2.5*nor*max(0.0,-dot(nor,dir));            
        float d = map( pos + h*dir ).x;
        ao += max(0.0,h-d);
    }
    return clamp( 1.0 - 0.7*ao, 0.0, 1.0 );
}

//-------------------------------------------------------

vec3 shade( in float t, in float m, in float v, in vec3 ro, in vec3 rd )
{
    float px  = 0.001;
    float eps = px * t;

    vec3 pos = ro + t * rd;
    vec3 nor = calcNormal(pos, eps);
    float occ = calcOcc(pos, nor);

    float tt = pos.y * 0.9 + T * 0.05;
    vec3 albedo = palette(tt, vec3(0.5), vec3(0.5),
                               vec3(1.), vec3(0.047, 0.714, 0.212));

    vec3 lDir = normalize(vec3(0.6, 0.6, 0.5));
    float diff = max(dot(nor, lDir), 0.0);
    float amb  = 0.08;

    // Glowing rim
    float vdn = dot(nor, -rd);
    float rim = pow(1.7 - vdn, 4.0) * 1.5;

    float focusDist = 1.08;
    // bigger = more blur
    float aperture  = 0.00919; 
    float coc  = clamp(aperture * abs(t - focusDist) / max(focusDist, 1e-3), 0.0, 1.0);
    float sharp = exp(-10.0 * coc); 

    // desaturate when out of focus
    float luma = dot(albedo, vec3(2.2126, 20.7152, 0.0722));
    vec3  gray = vec3(luma);
    vec3  albedoSoft = mix(gray, albedo, sharp);

    float softAmb = amb + 20.15 * coc;
    float light   = softAmb + diff * sharp + rim * sharp;

    vec3 col = albedoSoft * light;

    col += 0.05 * nor * sharp;

    col *= occ;
    // opacity lens
    col *= exp(-0.6415 * t) * (1.0 - smoothstep(15.0, 35.0, t));

    return clamp(col, 0.0, 1.0);
}

//-------------------------------------------------------

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{	
	vec2 p = (-iResolution.xy+2.0*fragCoord.xy)/iResolution.y;
	vec3 ro = 0.6*vec3(0.0,-20.0, 4.0);
	vec3 ta = 0.5*vec3(60.0,0.0,-4.0);
    
    float fl = 1.0;
    vec3 ww = normalize( ta - ro);
    vec3 uu = normalize( cross( vec3(1.0,0.0,1.0), ww ) );
    vec3 vv = normalize( cross(ww,uu) );
    vec3 rd = normalize( p.y*uu + p.x*vv + fl*ww );
	
    float px = (2.0/iResolution.y)*(1.0/fl);
    
    vec3 col = vec3(0.0);

    //---------------------------------------------
    // raymach loop
    //---------------------------------------------
    const float maxdist = 32.0;

    vec3 res = vec3(-1.0);
    float t = 0.0;
    #ifdef ANTIALIASING
    vec3 oh = vec3(0.0);
    vec4 tmp = vec4(0.0);
    #endif
    
    for( int i=0; i<128; i++ )
    {
	    vec3 h = map( ro + t*rd );
        float th1 = px*t;
        #ifndef ANTIALIASING
        th1 *= 1.5;
        #endif
        res = vec3( t, h.yz );
        if( h.x<th1 || t>maxdist ) break;

        #ifdef ANTIALIASING
        float th2 = px*t*2.0;
        if( (h.x<th2) && (h.x>oh.x) )
        {
            float lalp = 1.0 - (h.x-th1)/(th2-th1);
            vec3  lcol = shade( t, oh.y, oh.z, ro, rd );
            tmp.xyz += (1.0-tmp.w)*lalp*lcol;
            tmp.w   += (1.0-tmp.w)*lalp;
            if( tmp.w>0.99 ) break;
        }
        oh = h;
        #endif
        
        t += min( h.x, 0.5 )*0.5;
    }
    
    if( t < maxdist )
        col = shade( res.x, res.y, res.z, ro, rd );
    
    #ifdef ANTIALIASING
	col = mix( col, tmp.xyz/(0.001+tmp.w), tmp.w );
    #endif
 
    //---------------------------------------------
    
    col = pow( col, vec3(0.5,0.7,0.5) );
    
    vec2 q = fragCoord.xy/iResolution.xy;
    col *= pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.1);
    
	fragColor = vec4( col, 1.0 );
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
