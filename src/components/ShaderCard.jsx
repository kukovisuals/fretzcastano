import { useEffect, useState } from "react";
import { getLiveThumb } from "../lib/thumbs.js";

/** Pull the day number out of names like "KuKo #169". */
function dayOf(name) {
  const m = name.match(/#\s?(\d+)/);
  return m ? m[1] : null;
}

export default function ShaderCard({ shader, onOpen }) {
  // Thumbnails are rendered locally from the shader itself — Shadertoy's CDN
  // blocks cross-origin hotlinking, so we never request it.
  const [src, setSrc] = useState(null);
  const [state, setState] = useState("rendering"); // rendering | local | none

  const renderLocally = () => {
    setState("rendering");
    getLiveThumb(shader.id).then((url) => {
      if (url) {
        setSrc(url);
        setState("local");
      } else {
        setState("none");
      }
    });
  };

  // Render every card's thumbnail locally when it mounts.
  useEffect(() => {
    renderLocally();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shader.id]);

  const day = dayOf(shader.name);
  const date = new Date(shader.date * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <button className="card" onClick={onOpen} title={shader.description || shader.name}>
      <div className="thumb-wrap">
        {state !== "none" && state !== "rendering" && (
          <img
            className="thumb"
            src={src}
            alt={shader.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            width="480"
            height="270"
            onError={() => setState("none")}
          />
        )}
        {state === "rendering" && (
          <div className="thumb thumb-fallback mono">rendering…</div>
        )}
        {state === "none" && (
          <div className="thumb thumb-fallback mono">▶ run live</div>
        )}
        {day && <span className="day mono">day {day}</span>}
        {shader.local && <span className="chip-local mono">local</span>}
        {shader.passes > 1 && (
          <span className="badge mono">{shader.passes - 1}×buffer</span>
        )}
      </div>
      <div className="card-meta">
        <span className="card-name">{shader.name}</span>
        <span className="card-stats mono">
          ♥ {shader.likes} · {shader.viewed} views · {date}
          {shader.chars
            ? ` · ${
                shader.chars >= 1000
                  ? `${(shader.chars / 1000).toFixed(1).replace(/\.0$/, "")}k`
                  : shader.chars
              } ch`
            : ""}
        </span>
      </div>
    </button>
  );
}
