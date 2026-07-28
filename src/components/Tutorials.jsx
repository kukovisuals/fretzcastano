import { tutorials } from "../lib/tutorials.js";

export default function Tutorials() {
  if (tutorials.length === 0) {
    return (
      <p className="status">
        No tutorials yet. Drop an <code>.html</code> file into{" "}
        <code>src/tutorials/</code> and rebuild.
      </p>
    );
  }

  return (
    <div className="grid" aria-label="Tutorials">
      {tutorials.map((t) => (
        <a
          key={t.file}
          className="tut-card"
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="tut-head">
            <span className="tut-tag mono">{t.tag}</span>
          </div>
          <div className="tut-meta">
            <span className="tut-title">{t.title}</span>
            {t.description && <span className="tut-desc">{t.description}</span>}
            <span className="tut-file mono">{t.file} ↗</span>
          </div>
        </a>
      ))}
    </div>
  );
}
