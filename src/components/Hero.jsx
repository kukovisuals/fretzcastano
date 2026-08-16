import { useEffect, useRef } from "react";
import { ShadertoyRenderer } from "../lib/shadertoyRenderer.js";
import { loadShader } from "../lib/localShaders.js";

const HERO_SHADER_ID = "fcdXRM"; // Day 478.1 — Physarum agents
const MAX_PIXELS = 3_000_000; // same hard budget as the player modal
const WARMUP_FRAMES = 30; // static frame shown for prefers-reduced-motion

export default function Hero() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    let dead = false;
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    loadShader(HERO_SHADER_ID)
      .then((shader) => {
        if (dead || !canvasRef.current) return;
        const renderer = new ShadertoyRenderer(canvasRef.current, shader, {
          maxPixels: MAX_PIXELS,
          manual: reduceMotion,
          onError: () => {}, // decorative — fail silently, canvas stays black
        });
        rendererRef.current = renderer;

        if (reduceMotion) {
          for (let i = 0; i < WARMUP_FRAMES; i++) renderer.step(1 / 60);
        } else if (document.hidden) {
          renderer.pause();
        }
      })
      .catch(() => {});

    return () => {
      dead = true;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      const renderer = rendererRef.current;
      if (!renderer || renderer.manual) return;
      if (document.hidden) renderer.pause();
      else renderer.play();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className="hero" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-canvas" />
      <h2 className="hero-title">KUKO</h2>
    </div>
  );
}
