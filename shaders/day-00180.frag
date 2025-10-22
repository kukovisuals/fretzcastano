uniform vec3 iResolution;
uniform float iTime; 

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    
    ▓                KuKo Day 180
    
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓ Noise rust from @fewer
    ▓ https://www.shadertoy.com/view/wXlcDX
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

#define FAR 30.0
// https://www.shadertoy.com/view/XsXfRH
float hash(ivec3 p)
{
    int n = p.x*3 + p.y*113 + p.z*311;
	n = (n << 13) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    return -1.0+2.0*float( n & 0x0fffffff)/float(0x0fffffff);
}

// https://iquilezles.org/articles/morenoise/
vec4 noised(in vec3 x)
{
    ivec3 i = ivec3(floor(x));
    vec3 w = fract(x);
    vec3 u = w*w*(3.0-2.0*w);
    //vec3 u = w*w*w*(w*(w*6.0-10.0)+5.0);
    vec3 du = 6.0*w*(1.0-w); 
    float a = hash(i+ivec3(0,0,0));
    float b = hash(i+ivec3(1,0,0));
    float c = hash(i+ivec3(0,1,0));
    float d = hash(i+ivec3(1,1,0));
    float e = hash(i+ivec3(0,0,1));
	float f = hash(i+ivec3(1,0,1));
    float g = hash(i+ivec3(0,1,1));
    float h = hash(i+ivec3(1,1,1));
    float k0 =   a;
    float k1 =   b - a;
    float k2 =   c - a;
    float k3 =   e - a;
    float k4 =   a - b - c + d;
    float k5 =   a - c - e + g;
    float k6 =   a - b - e + f;
    float k7 = - a + b + c - d + e - f - g + h;
    return vec4( k0 + k1*u.x + k2*u.y + k3*u.z + k4*u.x*u.y + k5*u.y*u.z + k6*u.z*u.x + k7*u.x*u.y*u.z, 
                 du * vec3( k1 + k4*u.y + k6*u.z + k7*u.y*u.z,
                            k2 + k5*u.z + k4*u.x + k7*u.z*u.x,
                            k3 + k6*u.x + k5*u.y + k7*u.x*u.y ) );
}

vec4 noisedFBM(in vec3 x, int octaves, float gain)
{
    vec4 result = vec4(0.);
    float a = 1.0;
    float s = 0.0;
    for (int i = 0; i < octaves; i++)
    {
        result += noised(x * 0.109 ) * a;
        s += a;
        x *= 2.0;
        a *= gain;
    }
    return result / s;
}

mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }

float sdRoundBox( vec3 p, vec3 b, float r )
{
    vec3 q = abs(p) - b + r;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sdBoxFrame( vec3 p, vec3 b, float e )
{
    p = abs(p  )-b;
    vec3 q = abs(p+e)-e;
    return min(min(
    length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
    length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
    length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

vec2 combineMin(vec2 a, vec2 b)
{
    return (a.x < b.x)? a : b;
}

vec3 _noisePos;
vec3 glow;
const vec3  FRAME_B = vec3(1.96, 1.5, 0.96);
const float FRAME_E = 0.01;

const vec3  GLOW_COLOR   = vec3(1); 
const float GLOW_STRENGTH= 0.014;                  
const float GLOW_FALLOFF = 20.0;                 

const float dMax = 28.0;

// Simple noise algorithm contributed by Trisomie21 (Thanks!)
float snoise( vec2 p ) 
{
	vec2 f = fract(p);
	p = floor(p);
	float v = p.x+p.y*1000.0;
	vec4 r = vec4(v, v+1.0, v+1000.0, v+1001.0);
	r = fract(100000.0*sin(r*.001));
	f = f*f*(3.0-2.0*f);
	return 2.0*(mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y))-1.0;
}

float terrain( vec2 p, int octaves ) 
{	
	float h = 0.0; // height
	float w = 0.5; // octave weight
	float m = 0.4; // octave multiplier
	for (int i=0; i<16; i++) {
		if (i<octaves) {
			h += w * snoise((p * m));
		}
		else break;
		w *= 0.4;
		m *= 2.0;
	}
	return h;
}

vec2 map( vec3 p ) 
{
    int octaves = 4;
	float dMin = dMax; // nearest intersection
	float d; // depth
	float mID = -1.0; // material ID
	
	// terrain
	float h = terrain(p.xz, octaves);
	h += smoothstep(-0.3, 1.1, h); // exaggerate the higher terrain
	h *= smoothstep(-1.5, -0.3, h); // smooth out the lower terrain
	d = p.y - h;	
	if (d<dMin) { 
		dMin = d;
		mID = 0.0;
	}
	
	// trees
	if (h<0.0) { // no need to check for trees at higher elevations
		float f = terrain(p.xz*10.0, octaves);
		f = (0.06*f) - 0.43; // limit the altitude of the trees
		d = p.y - f;
		if (d<dMin) { 
			dMin = d;
			mID = 1.0;
		}
	}	

	return vec2(dMin, mID);
}

float softShadow(in vec3 ro, in vec3 rd, float dis )
{
    float minStep = clamp(dis*0.01,0.0,1.0);

    float res = 1.0;
    float t = 0.001;
	for( int i=0; i<80; i++ )
	{
	    vec3  p = ro + t*rd;
        float h = p.y - terrain( p.xz, 4 );
		res = min( res, 16.0*h/t );
		t += max(minStep,h);
		if( res<0.001 ||p.y>(30.0) ) break;
	}
	return clamp( res, 0.0, 1.0 );
}


vec2 rayMarch(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    float id = 0.0;
    glow = vec3(0.0);
    
    for(int i=0; i<50; i++)
    {
        vec3 p = ro + rd * dt;
        float cell = 4.0;
        
        vec3 q    = vec3(mod((p.x) + 0.0,10.0) - 5., p.y, mod((p.z),cell) - 1.5);
        vec3 pf   = vec3(mod((p.x) + 0.0,10.0) - 5., p.y, mod((p.z),cell) - 1.5);
        
        vec2 d = map(p);
        _noisePos = q;
        //_noisePos.xy *= R2(_noisePos.z * 0.15 + iTime * 0.3);
        
        if(abs(d.x) < 0.00001 )
        {
            id = d.y;
            break;
        }
        
        float dFrame = sdBoxFrame(pf, FRAME_B, FRAME_E);
        
        float stepLen = clamp(d.x, 0.1, 0.2);          
        float fall    = 1.0 / (1.0 + dFrame*dFrame*GLOW_FALLOFF);
        float mask    = smoothstep(0.25, 0.0, abs(dFrame));
        
        float fogAmount = exp(-0.0005*dt*dt*dt);
        float fx = sin(iTime * 5.) * 2.0;
        glow += GLOW_COLOR * (GLOW_STRENGTH * stepLen * fall * mask *  fx ) * fogAmount;

        dt += d.x;
        if( dt > FAR) break;
    }
    
    if(dt > FAR)
    {
       float dt = -1.0;
       float id = -1.0; 
    }
    
    return vec2(dt, id);
}

vec3 calcNormal(vec3 p)
{
    float e = 0.001;
    return normalize(vec3(
        map(p + vec3(e,0,0)).x - map(p - vec3(e,0,0)).x,
        map(p + vec3(0,e,0)).x - map(p - vec3(0,e,0)).x,
        map(p + vec3(0,0,e)).x - map(p - vec3(0,0,e)).x
    ));
}

vec3 rustCol(float noise01, float nl, vec3 l, vec3 col, vec2 dt)
{
    vec3 darkMet = vec3(0.055,0.114,0.008); // dark metal
    vec3 rustOra = vec3(0.310,0.110,0.227); // dark purple
    vec3 stains  = vec3(0.055,0.027,0.004); // deeper stains
    vec3 darkPat = vec3(0.01, 0.0, 0.0);      // darker patches
    
    float rust  = smoothstep(0.566, 0.6458, noise01);
    float stain = smoothstep(0.655, 0.425, noise01);
    float stain2= smoothstep(0.275, 0.5625,  noise01);

    vec3 albedo = mix(darkMet, rustOra, rust);
    albedo = mix(albedo, stains, stain);
    albedo = mix(albedo, darkPat, stain2);
    col = albedo * vec3(max(0.2, nl));

    float spot = dot(l, vec3(0, 1, 0));
    col *= smoothstep(0.3, 0.575, spot);
   
    return col;
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0);//vec3(uv.y);
    
    
    vec3 ro = vec3(-5,0,-0.9 - iTime * 1.1);
    ro.y = terrain( ro.xz, 4 ) + 1.1;
    vec3 rd = normalize(vec3(uv, -1));
    
    vec2 dt = rayMarch(ro, rd);
    
    if(dt.x < FAR)
    {
        vec3 p = ro + rd * dt.x;
        
        vec3 norm = calcNormal(p);

        vec3 l = normalize(vec3(1,.7,0.5));
        float nl = dot(norm, l);
        
        vec4 noise = noisedFBM(_noisePos * vec3(0.2, 1.75, 2) * 2.0 + vec3(3,0,0), 10, 0.95);
        norm = normalize(norm + noise.yzw * 0.8);
        
        float noise01 = noise.x * 0.35 + 0.5;
        
        if(dt.y > 1.9)
        {
            col = vec3(0);
        } else {
            col = rustCol(noise01, nl, l, col, dt);
            
            vec3 view = normalize(ro - p);
            vec3 halfVec = normalize(l + view);
            float spec = pow(max(0.0, dot(norm, halfVec)), 24.0);
            
            float sh = 1.0; sh = softShadow(ro,l,dt.y);
            l += nl*vec3(8.00,5.00,3.00)*2.3*vec3( sh, sh*sh*0.5+0.5*sh, sh*sh*0.8+0.2*sh );
            
            col += vec3(0.596,0.176,0.035) * spec * 0.105; //vec3(0.388,0.31,0.067)           

            float backLight = max(0.0, dot(norm, -l)) * .2054;
            col += vec3(0.047,0.051,0.047) * backLight;
        }
        
        // fog 
        col = mix( col, vec3(0.0), 1.0-exp( -0.0005*dt.x*dt.x*dt.x ) );
    }
    //col += glow; 
    
    col *= 20.0;
    
    col = pow(col, vec3(1.1 / 2.2));
    
    O = vec4(col,1.0);
}
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
