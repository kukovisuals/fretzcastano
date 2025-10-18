import { promises as fs } from 'fs';
import { join } from 'path';

const site = 'https://fretzcastano.com';
const shadersDir = join(process.cwd(), 'shaders');

const files = (await fs.readdir(shadersDir))
  .filter(f => /^day-\d{5}\.frag$/.test(f))
  .sort(); // lexicographic by day

const urls = files.map(f => {
  const day = f.match(/^day-(\d{5})\.frag$/)[1];
  return `${site}/?day=${day}`;
});

const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${site}/</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${site}/archive</loc><changefreq>weekly</changefreq></url>
  ${urls.map(u=>`<url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n  ')}
</urlset>`;

await fs.writeFile(join(process.cwd(), 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml written with ${urls.length} shader URLs`);
