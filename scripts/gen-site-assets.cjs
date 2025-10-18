// scripts/gen-site-assets.cjs
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.fretzcastano.com';
const ROOT = process.cwd();
const SHADERS_DIR = path.join(ROOT, 'shaders');
const PUBLIC_DIR = path.join(ROOT, 'public');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);

// collect days from filenames like day-00001.frag
const files = fs.readdirSync(SHADERS_DIR)
  .filter(f => /^day-\d{5}\.frag$/i.test(f))
  .sort();

const days = files.map(f => f.match(/^day-(\d{5})\.frag$/i)[1]);

// ----- sitemap.xml -----
const sitemap =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE}/archive</loc><changefreq>weekly</changefreq></url>
  ${days.map(d => `  <url><loc>${SITE}/?day=${d}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');

// ----- robots.txt -----
const robots = `User-agent: *
Allow: /
Sitemap: ${SITE}/sitemap.xml
`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');

// ----- archive.html (static text page with links) -----
const archive =
`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Daily GLSL Shader Archive | KuKo Visuals</title>
<meta name="description" content="Text-only archive of daily GLSL shaders by KuKo Visuals."/>
<link rel="canonical" href="${SITE}/archive"/>
<meta name="robots" content="index,follow"/>
<style>body{background:#000;color:#fff;font:14px/1.6 system-ui,Arial;margin:20px}a{color:#9cf;text-decoration:none}a:hover{text-decoration:underline}</style>
</head><body>
<h1>Daily GLSL Shader Archive</h1>
<p>Each link loads the shader on the homepage.</p>
<ul>
${days.map(d => `  <li><a href="${SITE}/?day=${d}">Day ${d}</a></li>`).join('\n')}
</ul>
</body></html>`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'archive.html'), archive, 'utf8');

console.log(`Generated sitemap.xml (${days.length} shaders), robots.txt, archive.html`);
