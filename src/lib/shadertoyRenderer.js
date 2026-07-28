/**
 * shadertoyRenderer.js
 * --------------------
 * A small WebGL2 runtime that plays shaders straight from the Shadertoy
 * export JSON (renderpass array, unmodified).
 *
 * Supports:
 *   - Image pass + Buffer A–D passes with ping-pong (self-reads = previous frame)
 *   - "Common" pass code injected into every pass
 *   - Standard Shadertoy uniforms (time, frame, mouse, date, channel res, ...)
 *   - Texture channels loaded from a local /textures folder (noise fallback if missing)
 *   - Float render targets for buffers when the hardware allows it
 *   - A hard pixel budget so huge monitors never render more than maxPixels
 *
 * Not supported (rare in this archive): sound passes, keyboard/video/cubemap inputs.
 */

const VERT = `#version 300 es
layout(location=0) in vec2 p;
void main(){ gl_Position = vec4(p,0.,1.); }
`;

// Everything Shadertoy silently prepends before a pass's own code.
const FRAG_HEADER = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
precision highp sampler2D;
#else
precision mediump float;
precision mediump int;
precision mediump sampler2D;
#endif
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform float iFrameRate;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iSampleRate;
uniform vec3 iChannelResolution[4];
uniform float iChannelTime[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
out vec4 kuko_fragColor;
`;

const FRAG_FOOTER = `
void main(){
  vec4 c = vec4(0.,0.,0.,1.);
  mainImage(c, gl_FragCoord.xy);
  kuko_fragColor = c;
}
`;

export class ShadertoyRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} shader   full shader object from the export JSON
   * @param {object} opts     { maxPixels?: number, onError?: (msg)=>void }
   */
  constructor(canvas, shader, opts = {}) {
    this.canvas = canvas;
    this.shader = shader;
    this.maxPixels = opts.maxPixels ?? 3_000_000;
    this.manual = opts.manual ?? false;          // no RAF loop; drive with step()
    this.dprOverride = opts.dpr ?? null;         // force a device pixel ratio
    this.onError = opts.onError ?? (() => {});
    this.onFps = opts.onFps ?? (() => {});

    this.gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: opts.preserveDrawingBuffer ?? false,
      powerPreference: "high-performance",
    });
    if (!this.gl) {
      this.onError("WebGL2 is not available in this browser.");
      return;
    }

    this.playing = true;
    this.destroyed = false;
    this.frame = 0;
    this.time = 0;
    this.lastT = 0;
    this.mouse = [0, 0, 0, 0];
    this._fpsAcc = 0;
    this._fpsN = 0;

    this._initGL();
    this._build();
    if (!this.manual) {
      this._bindMouse();
      this._raf = requestAnimationFrame((t) => this._loop(t));
    }
  }

  /* ---------------- public controls ---------------- */

  play() { this.playing = true; }
  pause() { this.playing = false; }
  restart() { this.time = 0; this.frame = 0; this._clearBuffers(); }
  get isPlaying() { return this.playing; }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this._raf);
    if (!this.manual) this._unbindMouse();
    const gl = this.gl;
    if (!gl) return;
    for (const p of this.passes ?? []) gl.deleteProgram(p.program);
    for (const b of Object.values(this.buffers ?? {})) {
      gl.deleteTexture(b.tex[0]); gl.deleteTexture(b.tex[1]);
      gl.deleteFramebuffer(b.fbo[0]); gl.deleteFramebuffer(b.fbo[1]);
    }
    for (const t of this._mediaTex ?? []) gl.deleteTexture(t);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  /** Resize the drawing buffer, honoring the pixel budget. */
  resize() {
    const gl = this.gl;
    if (!gl) return;
    const dpr = this.dprOverride ?? window.devicePixelRatio ?? 1;
    const cssW = this.canvas.clientWidth || 1;
    const cssH = this.canvas.clientHeight || 1;
    let w = Math.round(cssW * dpr);
    let h = Math.round(cssH * dpr);
    const px = w * h;
    if (px > this.maxPixels) {
      const s = Math.sqrt(this.maxPixels / px);
      w = Math.max(1, Math.floor(w * s));
      h = Math.max(1, Math.floor(h * s));
    }
    if (
      w === this.canvas.width &&
      h === this.canvas.height &&
      Object.values(this.buffers ?? {}).every((b) => b.w === w && b.h === h)
    ) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this._allocBuffers(w, h);
  }

  /* ---------------- setup ---------------- */

  _initGL() {
    const gl = this.gl;
    // Fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Pick the best renderable float format for buffer passes.
    this.floatExt = gl.getExtension("EXT_color_buffer_float");
    this.floatLinear = !!gl.getExtension("OES_texture_float_linear");
    this._mediaTex = [];
  }

  _build() {
    const passes = this.shader.renderpass ?? [];
    const common = passes.find((p) => p.type === "common")?.code ?? "";
    const bufferPasses = passes.filter((p) => p.type === "buffer");
    const imagePass = passes.find((p) => p.type === "image");

    // Buffers are identified by their output id in the JSON.
    this.buffers = {};
    for (const p of bufferPasses) {
      const id = p.outputs?.[0]?.id;
      if (id) this.buffers[id] = { tex: [null, null], fbo: [null, null], front: 0, w: 0, h: 0 };
    }

    this.passes = [];
    for (const p of [...bufferPasses, imagePass].filter(Boolean)) {
      const program = this._compile(common, p.code, p.name);
      if (!program) continue;
      this.passes.push({
        def: p,
        program,
        isImage: p.type === "image",
        outputId: p.outputs?.[0]?.id ?? null,
        uni: this._locations(program),
        channels: this._prepareChannels(p.inputs ?? []),
      });
    }
    this.resize();
  }

  _compile(common, code, passName) {
    const gl = this.gl;
    const link = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        this.onError(`Compile error in ${passName}: ${log?.split("\n")[0] ?? "unknown"}`);
        gl.deleteShader(s);
        return null;
      }
      return s;
    };
    const vs = link(gl.VERTEX_SHADER, VERT);
    const fs = link(gl.FRAGMENT_SHADER, FRAG_HEADER + common + "\n" + code + FRAG_FOOTER);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      this.onError(`Link error in ${passName}: ${gl.getProgramInfoLog(prog)}`);
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  _locations(program) {
    const gl = this.gl;
    const u = (n) => gl.getUniformLocation(program, n);
    return {
      iResolution: u("iResolution"),
      iTime: u("iTime"),
      iTimeDelta: u("iTimeDelta"),
      iFrameRate: u("iFrameRate"),
      iFrame: u("iFrame"),
      iMouse: u("iMouse"),
      iDate: u("iDate"),
      iSampleRate: u("iSampleRate"),
      iChannelResolution: u("iChannelResolution[0]"),
      iChannelTime: u("iChannelTime[0]"),
      iChannel: [u("iChannel0"), u("iChannel1"), u("iChannel2"), u("iChannel3")],
    };
  }

  /** Build channel descriptors for a pass from its JSON `inputs`. */
  _prepareChannels(inputs) {
    const channels = [null, null, null, null];
    for (const input of inputs) {
      const c = input.channel ?? 0;
      if (input.type === "buffer") {
        channels[c] = { kind: "buffer", id: input.id };
      } else if (input.type === "texture") {
        channels[c] = { kind: "texture", tex: this._loadMediaTexture(input), res: [256, 256, 1] };
      }
      // keyboard / video / cubemap inputs are not used in this archive
    }
    return channels;
  }

  _loadMediaTexture(input) {
    const gl = this.gl;
    const sampler = input.sampler ?? {};
    const tex = gl.createTexture();
    this._mediaTex.push(tex);

    // Start with a small noise fallback so the shader always has data.
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const n = 64;
    const noise = new Uint8Array(n * n * 4);
    for (let i = 0; i < noise.length; i++) noise[i] = (Math.random() * 256) | 0;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, noise);
    this._applySampler(sampler, true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (this.destroyed) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, sampler.vflip === "true");
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      this._applySampler(sampler, true);
      const ch = this._findChannelByTexture(tex);
      if (ch) ch.res = [img.width, img.height, 1];
    };
    img.onerror = () => { /* keep the noise fallback */ };
    // Local, same-origin path (e.g. /textures/texture1.png). No Shadertoy fetch.
    img.src = input.filepath;
    return tex;
  }

  _findChannelByTexture(tex) {
    for (const p of this.passes ?? [])
      for (const ch of p.channels)
        if (ch?.kind === "texture" && ch.tex === tex) return ch;
    return null;
  }

  _applySampler(sampler, canMipmap) {
    const gl = this.gl;
    const wrap = sampler.wrap === "repeat" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    if (sampler.filter === "nearest") {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else if (sampler.filter === "mipmap" && canMipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
  }

  /* ---------------- buffers (ping-pong) ---------------- */

  _bufferFormat() {
    const gl = this.gl;
    if (this.floatExt) return { internal: gl.RGBA32F, type: gl.FLOAT };
    return { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE };
  }

  _allocBuffers(w, h) {
    const gl = this.gl;
    const fmt = this._bufferFormat();
    for (const b of Object.values(this.buffers)) {
      b.w = w; b.h = h; b.front = 0;
      for (let i = 0; i < 2; i++) {
        if (b.tex[i]) { gl.deleteTexture(b.tex[i]); gl.deleteFramebuffer(b.fbo[i]); }
        b.tex[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, b.tex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, gl.RGBA, fmt.type, null);
        const filt = fmt.type === gl.FLOAT && !this.floatLinear ? gl.NEAREST : gl.LINEAR;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        b.fbo[i] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, b.tex[i], 0);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _clearBuffers() {
    const gl = this.gl;
    for (const b of Object.values(this.buffers)) {
      for (let i = 0; i < 2; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo[i]);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /* ---------------- per-frame ---------------- */

  _loop(t) {
    if (this.destroyed) return;
    this._raf = requestAnimationFrame((tt) => this._loop(tt));

    const dt = this.lastT ? Math.min((t - this.lastT) / 1000, 0.1) : 1 / 60;
    this.lastT = t;
    if (!this.playing) return;
    this.time += dt;

    // fps readout (updated ~2x/sec)
    this._fpsAcc += dt; this._fpsN++;
    if (this._fpsAcc >= 0.5) {
      this.onFps(Math.round(this._fpsN / this._fpsAcc));
      this._fpsAcc = 0; this._fpsN = 0;
    }

    this._renderFrame(dt);
  }

  /** Advance exactly one frame (manual mode, used by the thumbnail queue). */
  step(dt = 1 / 60) {
    if (this.destroyed) return;
    this.time += dt;
    this._renderFrame(dt);
  }

  _renderFrame(dt) {
    this.resize(); // cheap no-op unless the element size changed
    const gl = this.gl;
    const W = this.canvas.width, H = this.canvas.height;

    const now = new Date();
    const date = [
      now.getFullYear(), now.getMonth(), now.getDate(),
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000,
    ];

    for (const pass of this.passes) {
      const out = pass.isImage ? null : this.buffers[pass.outputId];
      if (out) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo[1 - out.front]); // write to back
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.viewport(0, 0, W, H);
      gl.useProgram(pass.program);

      const u = pass.uni;
      gl.uniform3f(u.iResolution, W, H, 1);
      gl.uniform1f(u.iTime, this.time);
      gl.uniform1f(u.iTimeDelta, dt);
      gl.uniform1f(u.iFrameRate, dt > 0 ? 1 / dt : 60);
      gl.uniform1i(u.iFrame, this.frame);
      gl.uniform4f(u.iMouse, ...this.mouse);
      gl.uniform4f(u.iDate, ...date);
      gl.uniform1f(u.iSampleRate, 44100);

      const chRes = new Float32Array(12);
      const chTime = new Float32Array([this.time, this.time, this.time, this.time]);
      for (let c = 0; c < 4; c++) {
        const ch = pass.channels[c];
        gl.activeTexture(gl.TEXTURE0 + c);
        if (ch?.kind === "buffer") {
          const b = this.buffers[ch.id];
          gl.bindTexture(gl.TEXTURE_2D, b.tex[b.front]); // read front (prev result)
          chRes.set([b.w, b.h, 1], c * 3);
        } else if (ch?.kind === "texture") {
          gl.bindTexture(gl.TEXTURE_2D, ch.tex);
          chRes.set(ch.res, c * 3);
        } else {
          gl.bindTexture(gl.TEXTURE_2D, null);
        }
        if (u.iChannel[c]) gl.uniform1i(u.iChannel[c], c);
      }
      if (u.iChannelResolution) gl.uniform3fv(u.iChannelResolution, chRes);
      if (u.iChannelTime) gl.uniform1fv(u.iChannelTime, chTime);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (out) out.front = 1 - out.front; // swap: newest becomes readable
    }

    this.frame++;
  }

  /* ---------------- mouse (Shadertoy semantics) ---------------- */

  _bindMouse() {
    const el = this.canvas;
    const pos = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * el.width;
      const y = (1 - (e.clientY - r.top) / r.height) * el.height;
      return [x, y];
    };
    this._down = (e) => {
      const [x, y] = pos(e);
      this.mouse = [x, y, x, y];
      this._dragging = true;
    };
    this._move = (e) => {
      if (!this._dragging) return;
      const [x, y] = pos(e);
      this.mouse[0] = x; this.mouse[1] = y;
      this.mouse[2] = Math.abs(this.mouse[2]);
      this.mouse[3] = -Math.abs(this.mouse[3]);
    };
    this._up = () => {
      this._dragging = false;
      this.mouse[2] = -Math.abs(this.mouse[2]);
      this.mouse[3] = -Math.abs(this.mouse[3]);
    };
    el.addEventListener("pointerdown", this._down);
    window.addEventListener("pointermove", this._move);
    window.addEventListener("pointerup", this._up);
  }

  _unbindMouse() {
    this.canvas.removeEventListener("pointerdown", this._down);
    window.removeEventListener("pointermove", this._move);
    window.removeEventListener("pointerup", this._up);
  }
}
