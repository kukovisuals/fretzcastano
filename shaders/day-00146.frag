uniform vec3 iResolution;
uniform float iTime; 
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              🎃  KuKo Day 146  🎃            
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define S(a,b,c) smoothstep(a,b,c)
#define STEM			5.0

vec2 combineMin(vec2 a, vec2 b)
{
    return (a.x < b.x)? a : b;
}

mat2 R2(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a));}

mat4 rotationY( in float angle ) {
    
    float c = cos(angle);
    float s = sin(angle);
    
	return mat4( c, 0,	 s,	0,
			 	 0,	1.0, 0,	0,
				-s,	0,	 c,	0,
				 0, 0,	 0,	1);
}

// https://iquilezles.org/articles/smin
float smax( float a, float b, float k )
{
    float h = max(k-abs(a-b),0.0);
    return max(a, b) + h*h*0.25/k;
}


// https://iquilezles.org/articles/distfunctions
float sdEllipsoidPrecise( in vec3 p, in vec3 r ) // approximated
{
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

// https://iquilezles.org/articles/distfunctions
float sdEllipsoid( in vec3 p, in vec3 r )
{
    float k1 = length(p/r);
    return (k1-1.0)*min(min(r.x,r.y),r.z);
}

vec2 SDFPumpkin(vec3 pos)
{  

    float proxy = length(pos - vec3(0.0, 0.2, 0.0));
    
    if (proxy > 4.0)
    {
    	return vec2(proxy - 3.0, 0.0);
    }
    else   
    {   
        float angle = atan(pos.x, pos.z);

        float section = smax(0.05, abs(sin(angle * 4.0)), 0.05) * 0.13;

        float longLen = length(pos.xz);

        float pinch = S(1.4, -0.2, longLen);

        float pumpkin = sdEllipsoid(pos, vec3(1.7, 1.5, 1.7)) + pinch * 0.6;
        
        float pumpkinDisplace =  ((sin(angle * 25.0) + sin(angle * 43.0)) * 0.0015 - section) * S(0.2, 1.3, longLen);

        pumpkin +=   pumpkinDisplace;

        float stem = longLen - 0.29 + S(1.1, 1.5, pos.y) * 0.15 + sin(angle * 4.0) * 0.01;
        
        float stemDisplace = sin(angle * 10.0);
        
        stem += stemDisplace * 0.005;

        stem -= (pos.y - 1.2) * 0.1;
        
        stem *= 0.8;
        
        float stemCut =  pos.y - 1.6 + pos.x * 0.3;

        stem = smax(stem, stemCut, 0.05);

        stem = max(stem, 1.0 - pos.y);


        float pumpkinID = clamp(pumpkinDisplace * 4.0 + 0.5, 0.0, 0.999);//, PUMPKIN_INSIDE, S(0.03, -0.05, pumpkin));
        
	    float stemID = STEM + (0.5 + stemDisplace * 0.2) * S(0.1, -0.6, stemCut);
        
        
        pumpkin = abs(pumpkin) - 0.05;

        float face = length(pos.xy - vec2(0.0, 0.3)) - 1.1;
        face = max(face, -(length(pos.xy - vec2(0.0, 1.8)) - 2.0));
        
        float teeth = abs(pos.x - 0.4) - 0.16;
        teeth = smax(teeth, -0.45 - pos.y + pos.x * 0.1, 0.07);
        
        float teeth2 = abs(pos.x + 0.40) - 0.16;
        teeth2 = smax(teeth2, 0.5 + pos.y + pos.x * 0.05, 0.07);
        
        
        face = smax(face, -min(teeth, teeth2), 0.07);

        vec2 symPos = pos.xy;
        symPos.x = abs(symPos.x);

        float nose = -pos.y + 0.1;
        nose = max(nose, symPos.x - 0.25 + symPos.y* 0.5);

        float eyes = -pos.y + 0.48 - symPos.x * 0.17;
        eyes = max(eyes, symPos.x - 1.0 + symPos.y * 0.5);
        eyes = max(eyes, -symPos.x - 0.05 + symPos.y * 0.5);


        face = min(face, nose);
        face = min(face, eyes);

        face = max(face, pos.z);

        pumpkin = smax(pumpkin, -face, 0.03);

        vec2 res = vec2(pumpkin, pumpkinID);
		res = combineMin(res, vec2(stem, stemID));

        return res;
    }
}

float sdfBox(vec3 p, vec3 b, float r)
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

#define T iTime
#define FX sin(2.0 - T * 2.2) * 0.2 + 0.25

float map(vec3 p)
{
    //float T = iTime;
    
    vec3 newp = p;
    newp.zx *= R2(2.9);
    vec2 d1 = SDFPumpkin(newp - vec3(-1.53,0.1 + FX ,3));
    
    float fd = abs(dot(p, vec3(0,4,0)));
    float fg = pow(fd, 1.0) * cos(length(p + vec3(0,0,5)) * 3.0 - T * 2.2)
             * sin(length(p.yxy + vec3(0,0,5)) * 2.0 - T * 0.3);

    float d2 = sdfBox(p + vec3(0,5,0), vec3(50,3.5,50), 0.4) - fg * 0.07;
 
    return min(d1.x, d2);
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    
    for(int i=0; i<100; i++)
    {
        float d = map(ro + rd * dt);
        dt += d;
        if(abs(d) < 0.001 || dt > 20.0) break;
    }
    
    return dt;
}

vec3 calcNormal(vec3 p)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0)) - map(p - vec3(e,0,0)),
        map(p + vec3(0,e,0)) - map(p - vec3(0,e,0)),
        map(p + vec3(0,0,e)) - map(p - vec3(0,0,e))
    ));
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0);
    float T = iTime;
    
    vec3 ta = vec3(0);
    vec3 ro = ta + vec3(8.0*cos(1.), 2.0, 8.0*sin(1.)); 
    //vec3 ro = ta + vec3(4.0*cos(-1.5), 2.0, 7.0*sin(-1.3)); 
    //vec3 ro = ta + vec3(7.0*cos(0.5*T), 2.0, 7.0*sin(0.5*T)); 
    
    mat3 ca = setCamera(ro, ta, 0.0);
    
    vec3 rd = ca * normalize(vec3(uv, 3.0));
    
    float dt = rayMarch(ro, rd);
    
    if(dt < 20.0)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        
        vec3 L = normalize(vec3(2,3,2));
        float diff = clamp(dot(L, norm),0.0,1.0);
        vec3 halfV = normalize(reflect(-L, norm));
        float spec = clamp(dot(-rd, halfV), 0.0, 1.0);
        spec = pow(spec, 16.0);
        
        vec3 lightCol = vec3(3.0);
        //vec3 bgCol = vec3(0.780,0.416,0.000);
        vec3 bgCol = vec3(0.651,0.247,0.012) * 1.;
        
        vec3 diffC = diff * lightCol * 0.5;
        vec3 specC = spec * lightCol * 0.5;
       
        vec3 finalLight = 0.6 + diffC + specC; 
        
        col = bgCol * finalLight;
        col *= 0.2 + 0.4 * texture(iChannel0, fract(2.5 * p.xy)).xyz;
        
        // see normals
        //col = 0.2 + 0.6*norm.yxz;
       
        col = mix( col, vec3(0.0), 1.0-exp( -0.001*dt*dt*dt) );
    }
    col = pow(col * 1.0, vec3(1.1 / 2.2));
    
    // light source from one of diatribes' shader
    vec2 u = uv;
    vec4 o = vec4(col, 1.0);
    o += vec4(1.0, 0.6, 0.2, 0.0) * 0.02; // Add some light color
    o += tanh(o /2. / dot(u+=vec2(1.3,-0.7), u));
    
    O = o;
    //O = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
