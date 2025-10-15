uniform vec3 iResolution;
uniform float iTime; 


// sdf of a circle 
float sdCircle(in vec3 p, float r){ return length(p) - r; }
// sdf of box 
float sdBox(in vec3 p, vec3 wh)
{
    p = abs(p) - wh;
    return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}
// unions
float sdUnion(float sdf1, float sdf2){ return min(sdf1, sdf2); }
// subtraction
float sdSubtract(float sdf1, float sdf2){ return max(-sdf1, sdf2); }
// intersection 
float sdIntersect(float sdf1, float sdf2){ return max(sdf1, sdf2); }
//
float sdXor(float sdf1, float sdf2){ return max(min(sdf1, sdf2), -max(sdf1, sdf2)); }

// Y-axis rotation matrix  
mat3 rotateY(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
          c, 0.0,   s,
        0.0, 1.0, 0.0,
         -s, 0.0,   c
    );
}


// Scene SDFS
float map(vec3 p)
{
    float planeDist = p.y + 50.0;
    
    // Rotate around Y-axis
    vec3 rotated_p = p;
    float angle = iTime * 2.3;
    rotated_p = rotateY(angle) * rotated_p;
    float c = sdCircle(rotated_p - vec3(0.0, 0.3, -7.0), 5.5);
    
    // don't distord uv make a copy of it
    vec3 p_distorted = p;
    float fx = sin(iTime * 0.5) * 2.5 + 3.5;
    float distortAmount = 0.5 + 0.2 * sin(iTime * 6.0); // Animated between 0.1-0.5
    p_distorted.x += (0.5 + 0.5 * sin(p.x * fx)) * cos(p.y * 2.5) * distortAmount; // Reduced amplitude
    
    
    c = sdCircle(p_distorted - vec3(0.0, 0.0, -15.0), 7.5);
    
    return sdUnion(c, planeDist);
}

// Raymarch 
float raycast(vec3 ro, vec3 rd)
{
    float t = 0.0;

    for(int i = 0; i < 64; i++)
    {
        vec3 p = ro + t * rd;
        float d = map(p);

        if(d < 0.001 || t > 100.0) break;

        t += d;
    }

    return t;
}

// create camera ray
vec3 getRayDirection(vec2 uv, vec3 ro, vec3 ta)
{
    vec3 forward = normalize(ta - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);

    return normalize(uv.x * right + uv.y * up + 2.0 * forward);
}

vec3 GetNormal( vec3 p )
{
    vec2 e = vec2(1.0, -1.0) * 0.0005;
    vec3 n = normalize(
        e.xyy * map(p + e.xyy) +
        e.yyx * map(p + e.yyx) +
        e.yxy * map(p + e.yxy) +
        e.xxx * map(p + e.xxx)
    );
    return n;
}

float GetLight(vec3 p)
{
    //float lightZ = (sin(u_time * 1.1) * 10.5 + 10.5);
    vec3 lightPos = vec3(20, 20,20);
    //lightPos.xz += vec2(sin(u_time)*2.0, cos(u_time)*2.0);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    float dif = clamp(dot(n, l), 0.0, 1.0);
    float d = raycast(p + n* 0.01 * 2.0, l);
    if (d < length(lightPos - p)) dif *= 0.2;
    return dif;
}



void  mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    float an = iTime * 0.3;
    vec3 ro = vec3(0.0, 0.0, 2.0);
    vec3 ta = vec3(0.0, 0.0, 0.0);

    vec3 rd = getRayDirection(uv, ro, ta);

    //Raymarch scene
    float t = raycast(ro, rd);

    float specialFx = sin(iTime * 6.0) * 0.2 + 0.2;
    vec3 color = vec3(specialFx);
    
    int dtFx = int(mod(iTime / 3.0, 6.0));

    if(t < 60.0)
    {
        vec3 p = ro + t * rd;
        float d = map(p);

        float diff = GetLight(p);

        vec3 baseColor = vec3(0.922,0.275,0.188);
        if(p.y > -10.0){

            if(dtFx == 0){
                baseColor = vec3(
                    (0.22,0.275,0.6188),
                    0.5 + 0.5 * sin(p.x * 3.0 + iTime + 0.1),
                    1.5 + 0.5 * sin(p.x * 3.0 + iTime + 0.5)
                );
            } else if (dtFx == 1 ){
                // 🔥 EXAMPLE 2: Fire colors - hot at top, cool at bottom
                float heat = (p.y + 2.0) / 4.0; // Normalize height
                baseColor = mix(
                    vec3(0.1, 0.0, 0.5),  // Cool blue/purple at bottom
                    vec3(1.0, 0.5, 0.0),  // Hot orange at top
                    heat
                );
            } else if( dtFx == 2){
                 // gummy    
                float pattern1 = sin(p.x * 2.0 + iTime) * cos(p.y * 3.0);
                float pattern2 = sin(p.z * 4.0 + iTime * 0.5);
                float combined = pattern1 + pattern2;
                baseColor = vec3(
                    0.6 + 0.4 * sin(combined),
                    0.4 + 0.6 * cos(combined + 1.0),
                    0.5 + 0.5 * sin(combined + 2.0)
                );
            } else if( dtFx == 3){
                // 🌊 EXAMPLE 4: Animated wave pattern
                float wave = sin(p.x * 5.0 + iTime) * cos(p.z * 5.0 + iTime * 0.7);
                baseColor = vec3(
                    0.3 + 0.7 * wave,
                    0.5 + 0.3 * wave,
                    0.8 - 0.3 * wave
                );
            } else if( dtFx == 4){
                float noise = sin(p.x * 3.0) * sin(p.y * 2.0) * cos(p.z * 4.0);
                float marble = 0.5 + 0.5 * sin(6.0 * (p.x + 0.5 * noise));
                baseColor = mix(
                    vec3(0.9, 0.9, 0.8),  // Light marble
                    vec3(0.4, 0.3, 0.2),  // Dark veins
                    marble
                );
            } else if( dtFx == 5){            
                // 🎯 EXAMPLE 9: Concentric rings (target pattern)
                float ringDist = length(p.xz - vec2(0.0, -7.0)); // Distance from center in XZ plane
                float rings = sin(ringDist * 8.0 + iTime * 4.0);
                baseColor = mix(
                    vec3(0.8, 0.1, 0.1),  // Red rings
                    vec3(0.1, 0.1, 0.8),  // Blue rings
                    0.5 + 0.5 * rings
                );
            } else if( dtFx == 6){
                // 🌟 EXAMPLE 10: Complex multi-layered pattern
                float pattern1 = sin(p.x * 4.0 + iTime) * cos(p.y * 3.0);
                float pattern2 = sin(p.z * 6.0 + iTime * 0.5);
                float combined = pattern1 + pattern2;
                baseColor = vec3(
                    0.6 + 0.4 * sin(combined),
                    0.4 + 0.6 * cos(combined + 1.0),
                    0.5 + 0.5 * sin(combined + 2.0)
                );
            }

        }
        // simple coloring of 2d 
        // color += vec3(diff);
        // color *= 1.0 - exp(-6. * abs(d));
        // color += vec3(d);
        color = baseColor * vec3(diff);
        // color *= 0.8 + 1.2 * cos( d * 10.);
    }
    O = vec4(color, 1.0);
}



void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
