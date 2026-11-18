// render-entry.mjs: draws the v5 poster from stories.json with headless Chrome. Development tool only: main.ts never
// runs it, it only checks and copies the committed entry.png.
//
//   node render-entry.mjs entry   -> out/final.png (checked), copied to ./entry.png
//   node render-entry.mjs final   -> out/final.png only
//   node render-entry.mjs glyphs  -> out/glyphs.png is not drawn in v5; the glyph set lives in render/glyphs.mjs
//   node render-entry.mjs tests   -> data checks (every story once, counts agree, tile rules) and the audit
//
// A render stops, and writes no PNG, if text overflows, overlaps other text, leaves the canvas, is under 13 px, misses
// its WCAG contrast threshold, a font is missing, or a tile headline is under 16 px or over 2 lines. The PNG is then
// decoded with Pillow (render/png_check.py), which also writes out/entry-300.png. Needs Chrome/Chromium
// (CHROME=...), Python 3 + Pillow (PYTHON=...), and system fonts Anton, Inter, IBM Plex Mono.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { buildModel, posterPage, TILES, LIST_MAX, label } from './render/v5.mjs';
import { readReport, screenshot } from './render/chrome.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out');
const python = process.env.PYTHON ?? 'python3';
const data = () => JSON.parse(readFileSync(join(here, 'stories.json'), 'utf8'));

function dataProblems(m, d) {
  const p = [];
  const shown = [m.lead, ...m.seconds, ...m.tiles, ...m.rest];
  if (new Set(shown).size !== d.stories.length || shown.length !== d.stories.length) p.push('every story must be shown exactly once');
  if (m.tiles.length !== TILES) p.push(`expected ${TILES} tiles, got ${m.tiles.length}`);
  if (m.rest.length > LIST_MAX) p.push('list too long');
  if (m.all.length < 26) p.push('fewer than 26 stories');
  if (!m.header.count.startsWith(`${m.all.length} STORIES`)) p.push('header count disagrees with the data');
  for (const s of d.stories) if (!d.regions[s.region]) p.push(`unknown region ${s.region}`);
  for (const s of m.tiles) if (label(s).length > 48) p.push(`tile label too long: ${label(s)}`);
  return p;
}

function render() {
  const d = data();
  const m = buildModel(d);
  const problems = dataProblems(m, d);
  if (problems.length) throw new Error(`data problems:\n  ${problems.join('\n  ')}`);
  mkdirSync(out, { recursive: true });
  const html = join(out, 'final.html');
  const png = join(out, 'final.png');
  writeFileSync(html, posterPage(m));
  const report = readReport(html, 1024, 1024);
  writeFileSync(join(out, 'final-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
  const csv = ['text,px,fg,bg,ratio,need,pass', ...report.contrast.map((c) => [JSON.stringify(c.text), c.px, JSON.stringify(c.fg), JSON.stringify(c.bg), c.ratio, c.need, c.pass ? 'PASS' : 'FAIL'].join(','))];
  writeFileSync(join(out, 'final-contrast.csv'), `${csv.join('\n')}\n`);
  if (report.bad.length) throw new Error(`${report.bad.length} layout problem(s):\n  ${report.bad.join('\n  ')}`);
  screenshot(html, 1024, 1024, png);
  const res = JSON.parse(execFileSync(python, ['-I', join(here, 'render', 'png_check.py'), png, join(out, 'entry-300.png')], { encoding: 'utf8' }).trim());
  if (!res.ok) throw new Error(res.problems.join(', '));
  console.log(`wrote ${relative(here, png)}: ${res.width}x${res.height}, ${res.bytes} bytes; min type ${report.minFont}px, min contrast ${report.minContrast}:1; ${m.header.count}`);
  console.log(`  lead + ${m.seconds.length} secondary + ${m.tiles.length} tiles + ${m.rest.length} listed = ${m.all.length}`);
  return png;
}

for (const job of process.argv.slice(2).length ? process.argv.slice(2) : ['final']) {
  if (job === 'final' || job === 'tests') render();
  else if (job === 'entry') {
    copyFileSync(render(), join(here, 'entry.png'));
    console.log(`copied to entry.png (${statSync(join(here, 'entry.png')).size} bytes)`);
  } else { console.error(`unknown job "${job}" (entry, final, tests)`); process.exit(2); }
}
