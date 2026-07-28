/**
 * tutorials.js
 * ------------
 * Auto-discovers every .html file in ../tutorials at build time and turns it
 * into a card entry. Drop a new .html into src/tutorials/, rebuild, and it
 * shows up in the grid + the nav dropdown automatically — no manifest to edit.
 *
 * Each tutorial file may declare metadata in its <head>:
 *   <title>Nice Title</title>
 *   <meta name="description" content="One-line summary." />
 *   <meta name="tag" content="automata" />
 */

// Raw source (for reading <title>/<meta>) and the emitted asset URL (for linking).
const raw = import.meta.glob("../tutorials/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});
const urls = import.meta.glob("../tutorials/*.html", {
  query: "?url",
  import: "default",
  eager: true,
});

function pick(html, re, fallback = "") {
  const m = html.match(re);
  return (m?.[1] ?? fallback).trim();
}

/** Turn "automata" -> "Automata". */
function titleCase(s) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const tutorials = Object.keys(raw)
  .map((path) => {
    const file = path.split("/").pop(); // e.g. "automata.html"
    const slug = file.replace(/\.html$/i, "");
    const html = raw[path];
    return {
      file,
      slug,
      url: urls[path],
      title: pick(html, /<title>([\s\S]*?)<\/title>/i, titleCase(slug)),
      description: pick(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
      ),
      tag: pick(
        html,
        /<meta[^>]+name=["']tag["'][^>]+content=["']([^"']*)["']/i,
        slug
      ),
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));
