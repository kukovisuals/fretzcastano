uniform vec3 iResolution;
uniform float iTime; 

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

// HSV to RGB conversion function
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    uv = I / iResolution.xy;
    
    // Create 2x4 grid
    vec2 grid = floor(uv * vec2(4.0, 3.0));
    vec2 cell_uv = fract(uv * vec2(4.0, 3.0));
    
    // Calculate cell index (0-8)
    int cell_id = int(grid.y * 4.0 + grid.x);
    
    vec3 color = vec3(0.0);
    
    vec4 text = texture(iChannel0, cell_uv);
    vec4 text2 = texture(iChannel1, cell_uv);
    
    if (cell_id == 0) {
        float circle_fx = length(cell_uv - 0.5) - 0.5;
        circle_fx = sin(circle_fx * 40.0 - iTime);
        float hue = 0.2 * 0.3 + 0.7;
        color = hsv2rgb(vec3(hue, 1.0, 1.0));
    }
    else if (cell_id == 1) {
        // bottom left 1st rows column 1 
        float circle_fx = length(cell_uv - 0.5) - 0.5;
        circle_fx = sin(circle_fx * 30. - iTime);
        float hue = circle_fx * 0.2 + 1.6;
        color = hsv2rgb(vec3(hue, 1.0, 1.));
    }
    else if (cell_id == 2) {
        // 1st rows column 2
        float patter1 = sin(cell_uv.x * 10.0 + iTime) * cos(cell_uv.y * 10.0);
        float hue = patter1 * 0.2 + 0.6;
        color = hsv2rgb(vec3(hue, 1.0, 1.0));
    }
    else if (cell_id == 3) {
        // 1st rows column 3
        float hue = iTime * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.14159) + 0.5;
        float pattern2 = sin(cell_uv.x * 4.0 + iTime);
        float rotating_hue = (angle + hue * 0.2 + 0.2) + (pattern2 * 0.2);
        float controlled_hue = mod(rotating_hue, 0.5) * 0.6 + 0.43;
        color = hsv2rgb(vec3(controlled_hue, cell_uv.y + 0.3, 1.0));
    }
    else if (cell_id == 4) {
        // 1st rows column 4
        float hue = -iTime * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.14159) + 0.5;
        float pattern2 = sin(cell_uv.x * 4.0 + iTime) * cos(cell_uv.y * 5.0 + iTime);
        float rotate_hue = (angle + hue * 0.2 + 0.2) + (pattern2 * 0.3);
        float controlled_hue = mod(rotate_hue, 0.5) * 0.6 + 0.4;
        color = hsv2rgb(vec3(controlled_hue, cell_uv.x, 1.0));
    }
    else if (cell_id == 5) {
        // 2nd rows column 1
        float hue = iTime * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float circle = length(uv - 0.5) - 0.5;
        circle = sin(circle * 30. - iTime * 0.4);
        float rotate_hue = (angle + hue * 0.2 + 0.2) + (circle * 0.3);
        float controlled_hue = mod(rotate_hue, 0.5) * 0.6 + 0.4;
        color = hsv2rgb(vec3(controlled_hue, 1.0, 1.0));
    }
    else if (cell_id == 6) {
        // 2nd rows column 2
        float hue = (iTime * 0.5) * 0.2 + 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float circle = length(uv - 0.5) - 0.5;
        circle = sin(circle * 40. + iTime);
        float rotate_hue = (angle + hue) + (circle * 0.3);
        float conHue = mod(rotate_hue, 0.5) * 0.6 + 0.5;
        color = hsv2rgb(vec3(conHue, 1.0, 1.0));
    }
    else if (cell_id == 7) {
        // 2nd rows column 3
        float hue = (iTime * 0.2) * 0.2 + 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float pattern3 = sin(cell_uv.x * 4.0 - iTime * 0.3) * cos(cell_uv.y * 5.0 - iTime * 0.3);
        float pattern1 = sin(cell_uv.x * 3. - iTime * 0.3);
        float rotate_hue = (angle + hue) + (pattern1 + pattern3 * 0.5);
        float conHue = mod(rotate_hue, 0.5) * 0.8 + 0.2;
        color = hsv2rgb(vec3(conHue, 1.0, 1.0));
    }
    else if (cell_id == 8) {
        // 2nd rows column 4
        float circle_fx = length(cell_uv - 0.5) - 0.5;
        circle_fx = sin(circle_fx * 40.0 - iTime);

        vec2 animated_uv = cell_uv + vec2(circle_fx * 0.1, circle_fx * 0.1);
        vec4 tex = texture(iChannel0, animated_uv);
        float texture_influence = tex.r;

        float light_blue_hue = 0.52;
        float brightness = 0.5 + 0.55 * circle_fx * texture_influence;
        float saturation = 0.3 + texture_influence * 0.9;
        color = hsv2rgb(vec3(light_blue_hue, brightness, saturation));
    }
    else if (cell_id == 9) {
        // 3nd rows column 1
        float patter1 = sin(cell_uv.x * 10.0 + iTime) * cos(cell_uv.y * 10.0);
        vec2 fx_uv = cell_uv + vec2(patter1 * 0.1, patter1 * 0.1);
        vec4 text = texture(iChannel3, fx_uv);
        
        float light_blue_hue = 0.53;
        float brightness = 0.5 + 0.55 * patter1 * text.r;
        float saturation = 0.3 + text.r * 0.9;
        color = hsv2rgb(vec3(light_blue_hue, brightness, saturation));
    }
    else if (cell_id == 10) {
        // 3nd rows column 2
        float hue = iTime * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.14159) + 0.5;
        float pattern2 = sin(cell_uv.x * 4.0 + iTime);
        float rotating_hue = ((angle + hue * 0.2 + 0.2 + pattern2) * 0.1); //(angle + hue * 0.2 + 0.2); //+ (pattern2 * 0.2);
        float controlled_hue = mod(rotating_hue, 0.5) * 0.5 + 0.43;

        vec2 fx_uv = cell_uv + vec2((angle + pattern2) * 0.3, (pattern2 + angle) * 0.3);
        vec4 text = texture(iChannel2, fx_uv);

        float light_blue_hue = 0.53;

        float brightness = 0.6 + 0.51 * (pattern2 + angle) * text.r;
        float saturation = 0.5 + text.r * 0.9;

        color = hsv2rgb(vec3(light_blue_hue, saturation, brightness));
    }
    else if (cell_id == 11) {
        // 3nd rows column 3
        float hue = iTime * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float a_pattern = sin(angle * 8.0 + iTime);

        vec2 fx_uv = cell_uv + vec2(a_pattern * 0.1, a_pattern * 0.1);
        vec4 tex = texture(iChannel1, fx_uv);
        
        float ligh_blue = 0.53;
        float brightness = 0.5 + 0.55 * a_pattern * tex.r; 
        float saturation = 0.3 + tex.r * 0.9;

        color = hsv2rgb(vec3(ligh_blue, saturation, brightness));
    }
    else if (cell_id == 12) {
        // 3nd rows column 4
        float hue = iTime * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float rotate_hue = (angle + hue * 0.2 + 0.2);
        float controlled_hue = mod(rotate_hue, 0.5) * 0.6 + 0.4;
        color = hsv2rgb(vec3(controlled_hue, 1.0, 1.0));
    }
    
    // Add subtle grid lins to separate cells
    vec2 grid_lines = abs(fract(uv * vec2(4.0, 3.0)) - 0.5);
    float line_width = 0.000;
    float grid_mask = 1.0 - step(line_width, min(grid_lines.x, grid_lines.y));
    color = mix(color, vec3(0.2), grid_mask * 0.3);

    O = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
