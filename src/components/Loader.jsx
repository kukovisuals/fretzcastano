import { useEffect, useRef, useState } from "react";
import { ShadertoyRenderer } from "../lib/shadertoyRenderer.js";

// Where you drop the preloader shader. This file lives in /public and is
// NOT touched by prepare-data or listed in the gallery — it's standalone.
const LOADER_SHADER_URL = "/loader-shader.json";

// Biology-flavored phases the counter passes through as it fills.
const PHASES = [
  [0, "seeding culture"],
  [25, "cell division"],
  [50, "membrane forming"],
  [75, "signal propagation"],
  [100, "alive"],
];

function phaseFor(pct) {
  let label = PHASES[0][1];
  for (const [at, text] of PHASES) if (pct >= at) label = text;
  return label;
}

/**
 * Full-screen boot loader.
 * - Fetches the preloader shader from /loader-shader.json and renders it live.
 * - A mitosis-style counter fills 0→100% while phases tick by.
 * - Eases toward 90% until `ready` is true, then completes and fades out.
 */
export default function Loader({ ready, onFinish }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Fetch + render the shader background (optional — counter runs regardless).
  useEffect(() => {
    let dead = false;
    fetch(LOADER_SHADER_URL)
      .then((r) => r.json())
      // Accept a bare shader object, a Shadertoy API response, or an export.
      .then((d) => d?.Shader ?? (Array.isArray(d?.shaders) ? d.shaders[0] : d))
      .then((shader) => {
        if (dead || !canvasRef.current || !shader?.renderpass) return;
        rendererRef.current = new ShadertoyRenderer(canvasRef.current, shader, {
          maxPixels: 2_000_000,
        });
      })
      .catch(() => {
        /* no background — the counter still runs and fades out */
      });

    return () => {
      dead = true;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Animate the counter. Eases toward a target that only reaches 100 once ready.
  const readyRef = useRef(ready);
  readyRef.current = ready;
  useEffect(() => {
    let raf;
    let value = 0;
    const start = performance.now();
    const MIN_MS = 1600; // keep the loader up long enough to enjoy the shader

    const tick = (now) => {
      const elapsed = now - start;
      const target = readyRef.current && elapsed > MIN_MS ? 100 : 90;
      value += (target - value) * 0.045;
      const shown = Math.min(100, value);
      setPct(shown);

      if (shown >= 99.5 && readyRef.current && elapsed > MIN_MS) {
        setPct(100);
        setLeaving(true);
        setTimeout(onFinish, 620); // matches the fade-out transition
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onFinish]);

  const rounded = Math.round(pct);
  // Mitosis readout: cells double as we progress (2, 4, 8 … capped).
  const cells = Math.pow(2, Math.min(12, Math.floor(pct / 8)));

  return (
    <div className={`loader ${leaving ? "loader-leaving" : ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className="loader-canvas" />
      <div className="loader-veil" />

      <div className="loader-content">
        <span className="loader-brand mono">KuKo Visuals</span>

        <div className="loader-count mono">
          {rounded}
          <span className="loader-pct">%</span>
        </div>

        <div className="loader-status mono">
          <span className="loader-dot" />
          {phaseFor(pct)} · {cells.toLocaleString()} cells
        </div>

        <div className="loader-bar">
          <div className="loader-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}