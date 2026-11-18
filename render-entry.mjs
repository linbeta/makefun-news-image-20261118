// render-entry.mjs: draws the poster from stories.json with headless Chrome. Development tool only: main.ts never
// runs it, it only checks and copies the committed entry.png.
//
//   node render-entry.mjs entry    -> out/final.png, checked, then copied to ./entry.png (the entry)
//   node render-entry.mjs final    -> out/final.png only (entry.png untouched)
//   node render-entry.mjs glyphs   -> out/glyphs.png, the overview of every category glyph
//   node render-entry.mjs tests    -> out/tests/*.png: fallback cases (no stories, one brief, no hero, long text, ...)
//   node render-entry.mjs          -> final + glyphs
//
// Each render writes beside its PNG: the HTML, the poster model (*-model.json), the page's audit (*-audit.json) and,
// for the poster, a contrast table (*-contrast.csv). A render stops with an error, and writes no PNG, if any text box
// overflows after shrinking, text overlaps text or a glyph, leaves the canvas, is under 13 px, misses its WCAG
// contrast threshold, or a font is missing. The PNG is then decoded with Pillow (render/png_check.py), which also
// writes a 300x300 preview (out/entry-300.png for the poster).
//
// Needs Google Chrome or Chromium (CHROME=/path/to/chrome), Python 3 with Pillow (PYTHON=...), and the system fonts
// Anton, Inter and IBM Plex Mono installed for Fontconfig.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { buildPoster } from './render/poster.mjs';
import { posterPage, glyphSheet } from './render/page.mjs';
import { readReport, screenshot } from './render/chrome.mjs';
import { fallbackCases } from './render/cases.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out');
const rel = (p) => relative(here, p);
const python = process.env.PYTHON ?? 'python3';

function pngCheck(png, preview) {
  const args = ['-I', join(here, 'render', 'png_check.py'), png];
  if (preview) args.push(preview);
  const res = JSON.parse(execFileSync(python, args, { encoding: 'utf8' }).trim());
  if (!res.ok) throw new Error(`${rel(png)}: ${res.problems.join(', ')}`);
  return res;
}

function renderPage(name, html, dir, { model, preview } = {}) {
  mkdirSync(dir, { recursive: true });
  const htmlPath = join(dir, `${name}.html`);
  const pngPath = join(dir, `${name}.png`);
  writeFileSync(htmlPath, html);
  if (model) writeFileSync(join(dir, `${name}-model.json`), `${JSON.stringify(model, null, 2)}\n`);
  const report = readReport(htmlPath, 1024, 1024);
  writeFileSync(join(dir, `${name}-audit.json`), `${JSON.stringify(report, null, 2)}\n`);
  const csv = ['text,px,weight,fg,bg,ratio,need,pass',
    ...report.contrast.map((c) => [JSON.stringify(c.text), c.px, c.weight, JSON.stringify(c.fg), JSON.stringify(c.bg), c.ratio, c.need, c.pass ? 'PASS' : 'FAIL'].join(','))];
  writeFileSync(join(dir, `${name}-contrast.csv`), `${csv.join('\n')}\n`);
  if (report.bad.length) throw new Error(`${name}: ${report.bad.length} layout problem(s):\n  ${report.bad.join('\n  ')}`);
  screenshot(htmlPath, 1024, 1024, pngPath);
  const check = pngCheck(pngPath, preview);
  console.log(`wrote ${rel(pngPath)}: ${check.width}x${check.height} ${check.mode}, ${check.bytes} bytes; `
    + `min type ${report.minFont}px, min contrast ${report.minContrast}:1, fonts ${Object.entries(report.fonts).map(([f, ok]) => `${f} ${ok ? 'ok' : 'MISSING'}`).join(', ')}`
    + (preview ? `; preview ${rel(preview)}` : ''));
  for (const f of report.fits) if (f.how !== 'fit') console.log(`  note: ${f.name}: ${f.how} -> "${f.text}"`);
  return { pngPath, report };
}

function renderPoster() {
  const data = JSON.parse(readFileSync(join(here, 'stories.json'), 'utf8'));
  const poster = buildPoster(data);
  const res = renderPage('final', posterPage(poster), out, { model: poster, preview: join(out, 'entry-300.png') });
  const all = [poster.lead, ...poster.seconds, ...poster.tiles].filter(Boolean);
  console.log(`  ${poster.header.stat1} · ${poster.header.stat2}; coverage ${poster.coverage.map((c) => `${c.label} ${c.count}`).join(', ')}`);
  for (const s of all) console.log(`  #${String(s.n).padEnd(2)} ${s.chip.padEnd(11)} ${s.glyph.padEnd(9)} ${s.label.text}`);
  return res;
}

const args = process.argv.slice(2);
const jobs = args.length ? args : ['final', 'glyphs'];
for (const job of jobs) {
  if (job === 'final') renderPoster();
  else if (job === 'entry') {
    const { pngPath } = renderPoster();
    copyFileSync(pngPath, join(here, 'entry.png'));
    console.log(`copied ${rel(pngPath)} -> entry.png (${statSync(join(here, 'entry.png')).size} bytes)`);
  } else if (job === 'glyphs') renderPage('glyphs', glyphSheet(), out);
  else if (job === 'tests') {
    const cases = fallbackCases(JSON.parse(readFileSync(join(here, 'stories.json'), 'utf8')));
    for (const [what, test] of cases.unit) {
      const ok = test();
      console.log(`unit ${ok ? 'ok  ' : 'FAIL'} ${what}`);
      if (!ok) process.exitCode = 1;
    }
    for (const c of cases) {
      const poster = buildPoster(c.data);
      console.log(`case ${c.name}: ${c.about}`);
      renderPage(c.name, posterPage(poster), join(out, 'tests'), { model: poster, preview: join(out, 'tests', `${c.name}-300.png`) });
      for (const expect of c.expect ?? []) {
        const ok = expect.test(poster);
        console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${expect.what}`);
        if (!ok) process.exitCode = 1;
      }
    }
  } else {
    console.error(`unknown job "${job}" (use entry, final, glyphs or tests)`);
    process.exit(2);
  }
}
