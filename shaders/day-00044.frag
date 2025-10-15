uniform vec3 iResolution;
uniform float iTime; 


float sdCircle(vec2 p, vec2 loc, float r)
{
    return abs(length(p + loc) - r) - 0.001;
}

// Function to create flowing sine waves around a circle
float flowingWaves(vec2 uv, vec2 center, float time) {
    vec2 toCenter = uv - center;
    float angle = atan(toCenter.y, toCenter.x);
    float dist = length(toCenter);
    
    // Create multiple sine waves with different frequencies and phases
    float wave1 = sin(angle * 5.0 + time * 2.0) * 0.02;
    float wave2 = sin(angle * 10.0 - time * 1.5) * 0.015;
    float wave3 = sin(angle * 15.0 + time * 3.0) * 0.01;
    
    // Combine waves
    float combinedWave = wave1 + wave2 + wave3;
    
    // Create a ring pattern that flows around the circle
    float targetRadius = 0.18 + combinedWave;
    float ringWidth = 0.03;
    
    // Distance from the target ring
    float ringDist = abs(dist - targetRadius);
    
    // Create flowing effect along the circumference
    float flowEffect = sin(angle * 4.0 + time * 2.5) * 0.5 + 0.5;
    
    // Fade based on distance from ring and flow effect
    float intensity = (1.0 - smoothstep(0.0, ringWidth, ringDist)) * flowEffect;
    
    return intensity;
}

// Function to create flowing pattern under the circles
float flowingBottomPattern(vec2 uv, float time) {
    // Only affect the bottom half
    if (uv.y > -0.1) return 0.0;
    
    // Clamp horizontally to stay within -0.3 to 0.3
    if (uv.x < -0.3 || uv.x > 0.3) return 0.0;
    
    float intensity = 0.0;
    
    // Create multiple flowing streams
    for (int i = 0; i < 5; i++) {
        float offset = float(i) * 0.4 - 1.0; // Spread streams across bottom
        
        // Base sine wave for the stream
        float streamY = sin(uv.x * 3.0 + time * 2.0 + float(i) * 1.5) * 0.15;
        streamY += sin(uv.x * 1.0 + time * 10.3 + float(i) * 2.0) * 0.01;
        streamY += sin(uv.x * 1.0 - time * 3.0 + float(i) * 0.8) * 0.04;
        
        // Vertical position of this stream
        float streamCenter = -0.1 + offset * 0.1 + streamY;
        
        // Distance from this stream
        float distToStream = abs(uv.y - streamCenter);
        
        // Stream width varies with position and time
        float streamWidth = 0.02 + sin(uv.x * 4.0 + time + float(i)) * 0.01;
        
        // Stream intensity
        float streamIntensity = 1.0 - smoothstep(0.0, streamWidth, distToStream);
        
        // Fade based on vertical position (stronger at bottom)
        float verticalFade = smoothstep(0.1, -0.4, uv.y);
        streamIntensity *= verticalFade;
        
        // Add horizontal fade near the edges for smooth transition
        float horizontalFade = 1.0;
        horizontalFade *= smoothstep(-0.4, -0.25, uv.x); // Fade in from left edge
        horizontalFade *= smoothstep(0.3, 0.25, uv.x);   // Fade in from right edge
        streamIntensity *= horizontalFade;
        
        // Add some turbulence
        float turbulence = sin(uv.x * 8.0 + uv.y * 6.0 + time * 2.5) * 0.2 + 0.5;
        streamIntensity *= turbulence;
        
        intensity += streamIntensity * (0.8 - float(i) * 0.15); // Each stream slightly dimmer
    }
    
    return clamp(intensity, 0.0, 1.0);
}

// Alternative: More organic flowing pattern
float organicFlowPattern(vec2 uv, float time) {
    // Only affect bottom area
    if (uv.y > -0.05) return 0.0;
    
    float intensity = 0.0;
    
    // Create flowing organic shapes
    vec2 flow1 = vec2(sin(time * 1.2), cos(time * 0.8)) * 0.2;
    vec2 flow2 = vec2(cos(time * 1.5), sin(time * 1.1)) * 0.125;
    
    // Multiple noise layers for organic feel
    float noise1 = sin(uv.x * 4.0 + uv.y * 6.0 + time * 1.5) * 0.5 + 0.5;
    float noise2 = sin((uv.x + flow1.x) * 6.0 + (uv.y + flow1.y) * 4.0 + time * 2.0) * 0.3 + 0.7;
    float noise3 = sin((uv.x + flow2.x) * 8.0 + (uv.y + flow2.y) * 3.0 - time * 2.5) * 0.2 + 0.8;
    
    // Combine noise layers
    float combinedNoise = noise1 * noise2 * noise3;
    
    // Create threshold for organic shapes
    float threshold = 0.4 + sin(time * 0.7) * 0.1;
    intensity = smoothstep(threshold - 0.1, threshold + 0.1, combinedNoise);
    
    // Fade based on vertical position
    float verticalFade = smoothstep(-0.05, -0.5, uv.y);
    intensity *= verticalFade;
    
    // Add some flowing streaks
    float streaks = 0.0;
    for (int i = 0; i < 3; i++) {
        float streakX = -0.6 + float(i) * 0.6;
        float streakFlow = sin(uv.y * 5.0 + time * 3.0 + float(i) * 2.0) * 0.1;
        float distToStreak = abs(uv.x - (streakX + streakFlow));
        float streakIntensity = 1.0 - smoothstep(0.0, 0.05, distToStreak);
        streakIntensity *= smoothstep(-0.05, -0.4, uv.y);
        streaks += streakIntensity * 0.3;
    }
    
    intensity = max(intensity, streaks);
    
    return clamp(intensity, 0.0, 0.1);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    float time = iTime;
    
    float circle = length(uv) - 0.5;
    vec3 color = vec3(1.0);

    // colors
    vec3 red = vec3(0.7, 0.2, 0.2);
    vec3 blue = vec3(0.2, 0.4, 0.8);
    vec3 white = vec3(1.0);
    vec3 waveColor = vec3(0.3, 0.7, 1.0); // Cyan for waves
    vec3 flowColor = vec3(0.8, 0.9, 1.0); // Light blue for bottom flow

    vec2 new_uv = fract(uv) - 0.5;
    
    // Left eye
    vec2 left_eye_loc = vec2(0.25, -0.25);
    float left_eye = sdCircle(new_uv, left_eye_loc, 0.15);
    left_eye = smoothstep(0.0, 0.1, left_eye);
    color *= mix(white, white, left_eye);
    
    // Right eye
    vec2 right_eye_loc = vec2(-0.25, -0.25);
    float right_eye = sdCircle(new_uv, right_eye_loc, 0.15);
    right_eye = smoothstep(0.0, 0.1, right_eye);
    color *= mix(white, white, right_eye);
    
    // Add flowing waves around circles
    vec2 leftCenter = -left_eye_loc;
    vec2 rightCenter = -right_eye_loc;
    
    float leftWaves = flowingWaves(new_uv, leftCenter, time);
    float rightWaves = flowingWaves(new_uv, rightCenter, time);
    
    // Apply wave colors
    color *= mix(white, waveColor, leftWaves * 0.6);
    color *= mix(white, red, rightWaves * 0.6);
    
    // Add flowing bottom pattern
    // Choose one of these methods:
    
    // Method 1: Sine wave streams
    float bottomFlow = flowingBottomPattern(new_uv, time);
    
    // Method 2: Organic flowing pattern (uncomment to use instead)
    // float bottomFlow = organicFlowPattern(new_uv, time);
    
    // Apply bottom flow pattern
    color = mix(color, flowColor, bottomFlow * 0.7);
    
    // Optional: Add some shimmer effect to the bottom pattern
    float shimmer = sin(new_uv.x * 10.0 + new_uv.y * 8.0 + time * 4.0) * 0.1 + 0.9;
    if (bottomFlow > 0.1) {
        color *= shimmer;
    }
    
    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
