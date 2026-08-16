import { useEffect, useMemo, useRef, useState } from "react";
import ShaderCard from "./components/ShaderCard.jsx";
import PlayerModal from "./components/PlayerModal.jsx";
import Tutorials from "./components/Tutorials.jsx";
import Loader from "./components/Loader.jsx";
import Hero from "./components/Hero.jsx";
import { tutorials } from "./lib/tutorials.js";
import { addFromJson, localMeta } from "./lib/localShaders.js";

const SORTS = {
  newest: (a, b) => b.date - a.date,
  oldest: (a, b) => a.date - b.date,
  likes: (a, b) => b.likes - a.likes,
  views: (a, b) => b.viewed - a.viewed,
};

// Source-length buckets (total characters across all renderpasses).
// [min, max) in characters; max = Infinity for the open-ended top bucket.
const CHAR_BUCKETS = {
  "": { label: "Any length", min: 0, max: Infinity },
  xs: { label: "Tiny · under 2k", min: 0, max: 2000 },
  s: { label: "Small · 2k–5k", min: 2000, max: 5000 },
  m: { label: "Medium · 5k–8k", min: 5000, max: 8000 },
  l: { label: "Large · 8k+", min: 8000, max: Infinity },
};

const fmtChars = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${n}`;

export default function App() {
  const [index, setIndex] = useState(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(null);
  const [charBucket, setCharBucket] = useState("");
  const [sort, setSort] = useState("newest");
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState("home"); // "home" | "tutorials"
  const [menuOpen, setMenuOpen] = useState(false);
  const [locals, setLocals] = useState(() => localMeta());
  const [notice, setNotice] = useState(null);
  const [booting, setBooting] = useState(true);
  const fileRef = useRef(null);

  const onAddFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const existing = new Set((index?.shaders ?? []).map((s) => s.id));
      const { added, skipped, error } = addFromJson(parsed, existing);
      if (error) setNotice(error);
      else if (added.length === 0) setNotice(`Nothing new — ${skipped} shader(s) already in the gallery.`);
      else setNotice(`Added ${added.length}: ${added.slice(0, 3).join(", ")}${added.length > 3 ? "…" : ""}`);
      setLocals(localMeta());
    } catch {
      setNotice("That file isn't valid JSON.");
    }
  };

  const allShaders = useMemo(() => {
    if (!index) return [];
    const staticIds = new Set(index.shaders.map((s) => s.id));
    return [...locals.filter((s) => !staticIds.has(s.id)), ...index.shaders];
  }, [index, locals]);

  useEffect(() => {
    fetch("/data/index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex({ shaders: [], numShaders: 0, error: true }));
  }, []);

  // Every tag with its count, most-used first (ties broken alphabetically).
  const allTags = useMemo(() => {
    const count = new Map();
    for (const s of allShaders)
      for (const t of s.tags) count.set(t, (count.get(t) ?? 0) + 1);
    return [...count.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
  }, [allShaders]);

  // Top slice powers the quick-pick chip row.
  const topTags = useMemo(() => allTags.slice(0, 14), [allTags]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bucket = CHAR_BUCKETS[charBucket] ?? CHAR_BUCKETS[""];
    return allShaders
      .filter((s) => {
        if (tag && !s.tags.includes(tag)) return false;
        if (charBucket) {
          const c = s.chars ?? 0;
          if (c < bucket.min || c >= bucket.max) return false;
        }
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort(SORTS[sort]);
  }, [allShaders, query, tag, charBucket, sort]);

  const openIdx = openId ? visible.findIndex((s) => s.id === openId) : -1;
  const open = openIdx >= 0 ? visible[openIdx] : null;
  const goto = (step) => {
    if (openIdx < 0 || visible.length === 0) return;
    const next = (openIdx + step + visible.length) % visible.length; // wraps around
    setOpenId(visible[next].id);
  };

  return (
    <div className="app">
      {booting && (
        <Loader ready={index !== null} onFinish={() => setBooting(false)} />
      )}
      <header className="masthead">
        <nav className="mainnav" aria-label="Primary">
          <button
            className={`nav-link ${view === "home" ? "nav-on" : ""}`}
            onClick={() => {
              setView("home");
              setMenuOpen(false);
            }}
          >
            Home
          </button>

          <div
            className="nav-item"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              className={`nav-link ${view === "tutorials" ? "nav-on" : ""}`}
              onClick={() => {
                setView("tutorials");
                setMenuOpen((o) => !o);
              }}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              Tutorials <span className="caret">▾</span>
            </button>
            {menuOpen && tutorials.length > 0 && (
              <div className="nav-menu" role="menu">
                <button
                  className="nav-menu-item nav-menu-all"
                  role="menuitem"
                  onClick={() => {
                    setView("tutorials");
                    setMenuOpen(false);
                  }}
                >
                  All tutorials
                </button>
                {tutorials.map((t) => (
                  <a
                    key={t.file}
                    className="nav-menu-item mono"
                    role="menuitem"
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.file}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="masthead-row">
          <h1 className="brand">
            KuKo<span className="brand-accent">&nbsp;Visuals</span>
          </h1>
          <p className="masthead-sub">
            {view === "tutorials" ? (
              <>Walkthroughs &amp; interactive explainers.</>
            ) : (
              <>
                <span className="mono">500+</span> of public shaders — a
                daily practice on shadertoy. Click any piece to run it live. Code can also be view in <a href="https://www.shadertoy.com/user/kukovisuals">shadertoy</a> 
              </>
            )}
          </p>
        </div>
      </header>

      {view === "home" && <Hero />}

      {view === "home" && (
        <div className="toolbar-section">
          <div className="toolbar">
            <input
              className="search"
              type="search"
              placeholder="Search name, description, tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search shaders"
            />
            <button className="btn add-btn" onClick={() => fileRef.current?.click()}>
              ＋ Add shader
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={onAddFile}
            />
            <select
              className="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort shaders"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="likes">Most liked</option>
              <option value="views">Most viewed</option>
            </select>
          </div>

          <div className="filters">
            <select
              className="sort filter-select"
              value={tag ?? ""}
              onChange={(e) => setTag(e.target.value || null)}
              aria-label="Filter by tag"
            >
              <option value="">All tags ({allTags.length})</option>
              {allTags.map(([t, n]) => (
                <option key={t} value={t}>
                  {t} ({n})
                </option>
              ))}
            </select>

            <select
              className="sort filter-select"
              value={charBucket}
              onChange={(e) => setCharBucket(e.target.value)}
              aria-label="Filter by source length"
            >
              {Object.entries(CHAR_BUCKETS).map(([key, b]) => (
                <option key={key || "any"} value={key}>
                  {b.label}
                </option>
              ))}
            </select>

            {(tag || charBucket) && (
              <button
                className="btn clear-btn"
                onClick={() => {
                  setTag(null);
                  setCharBucket("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {notice && <p className="notice mono">{notice}</p>}

          {topTags.length > 0 && (
            <div className="tags" role="listbox" aria-label="Filter by tag">
              {topTags.map(([t, n]) => (
                <button
                  key={t}
                  className={`tag ${tag === t ? "tag-on" : ""}`}
                  onClick={() => setTag(tag === t ? null : t)}
                >
                  {t} <span className="mono tag-n">{n}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "tutorials" ? (
        <main aria-live="polite">
          <Tutorials />
        </main>
      ) : (
        <main className="grid" aria-live="polite">
          {index === null && <p className="status">Loading archive…</p>}
          {index?.error && (
            <p className="status">
              Couldn't load /data/index.json. Run <code>npm run prepare-data</code> first.
            </p>
          )}
          {index && !index.error && visible.length === 0 && (
            <p className="status">No shaders match. Clear the search or tag filter.</p>
          )}
          {!booting &&
            visible.map((s) => (
              <ShaderCard key={s.id} shader={s} onOpen={() => setOpenId(s.id)} />
            ))}
        </main>
      )}

      <footer className="footer">
        <span className="mono">shadertoy.com/user/{index?.userName ?? "kukovisuals"}</span>
      </footer>

      {open && (
        <PlayerModal
          key={open.id}
          meta={open}
          position={`${openIdx + 1} / ${visible.length}`}
          onPrev={() => goto(-1)}
          onNext={() => goto(1)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
