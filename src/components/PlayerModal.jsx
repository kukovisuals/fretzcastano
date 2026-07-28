import { useEffect, useRef, useState } from "react";
import { ShadertoyRenderer } from "../lib/shadertoyRenderer.js";
import { loadShader } from "../lib/localShaders.js";

const MAX_PIXELS = 3_000_000; // hard budget: never render more than ~3 MP

export default function PlayerModal({ meta, position, onPrev, onNext, onClose }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [fps, setFps] = useState(0);
  const [res, setRes] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the full shader only when the modal opens (lazy).
  useEffect(() => {
    let dead = false;
    setLoading(true);
    setError(null);

    loadShader(meta.id)
      .then((shader) => {
        if (dead || !canvasRef.current) return;
        rendererRef.current = new ShadertoyRenderer(canvasRef.current, shader, {
          maxPixels: MAX_PIXELS,
          onError: (msg) => setError(msg),
          onFps: (f) => {
            setFps(f);
            const c = canvasRef.current;
            if (c) setRes(`${c.width}×${c.height}`);
          },
        });
        setLoading(false);
      })
      .catch((e) => {
        if (!dead) {
          setError(`Couldn't load this shader (${e.message}).`);
          setLoading(false);
        }
      });

    return () => {
      dead = true;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [meta.id]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
      if (e.key === " " && rendererRef.current) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggle = () => {
    const r = rendererRef.current;
    if (!r) return;
    r.isPlaying ? r.pause() : r.play();
    setPlaying(r.isPlaying);
  };

  const restart = () => rendererRef.current?.restart();

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={meta.name}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{meta.name}</h2>
            {meta.description && <p className="modal-desc">{meta.description}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="stage">
          <canvas ref={canvasRef} className="stage-canvas" />
          <button className="nav nav-prev" onClick={onPrev} aria-label="Previous shader">‹</button>
          <button className="nav nav-next" onClick={onNext} aria-label="Next shader">›</button>
          {loading && <div className="stage-note mono">loading shader…</div>}
          {error && <div className="stage-note stage-error mono">{error}</div>}
          {meta.hasSound && !error && (
            <div className="stage-hint mono">visual only — sound pass not played</div>
          )}
        </div>

        <div className="modal-foot">
          <div className="controls">
            <button className="btn" onClick={toggle}>{playing ? "Pause" : "Play"}</button>
            <button className="btn" onClick={restart}>Restart</button>
          </div>
          <div className="readout mono">
            {position && <span>{position}</span>}
            {res && <span>{res}</span>}
            {fps > 0 && <span>{fps} fps</span>}
            <a
              href={`https://www.shadertoy.com/view/${meta.id}`}
              target="_blank"
              rel="noreferrer"
            >
              open on Shadertoy ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
