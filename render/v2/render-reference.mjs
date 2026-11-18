// render/v2/render-reference.mjs: redraws the two v2 reference images (the earlier 31-story front-page design) from
// stories.json. They are not the entry and main.ts never reads them.
//
//   node render/v2/render-reference.mjs                      -> out/v2/zh-tw.png, out/v2/bilingual-portrait.png
//   node render/v2/render-reference.mjs zh                   -> only the Chinese page (also: portrait, en)
//   node render/v2/render-reference.mjs --update-reference   -> also copies them over reference/*.png
//
// "en" draws the v2 English front page (the former entry) to out/v2/en.png for comparison only.
// Needs the system fonts Oswald, Inter, Inter Tight, Noto Serif and Noto Sans CJK TC, and the v2 fields of
// stories.json (tier, utc_offset, icon, zh).

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { squarePage, portraitPage } from './pages.mjs';
import { dumpDom, screenshot } from '../chrome.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const data = JSON.parse(readFileSync(join(root, 'stories.json'), 'utf8'));
const outDir = join(root, 'out', 'v2');
mkdirSync(outDir, { recursive: true });

// The v2 pages record their layout check in <body data-report="...">.
function layoutReport(htmlPath, width, height) {
  const m = dumpDom(htmlPath, width, height).match(/data-report="([^"]*)"/);
  if (!m) throw new Error(`${htmlPath}: page did not report its layout`);
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

function render(name, html, width, height) {
  const htmlPath = join(outDir, `${name}.html`);
  const pngPath = join(outDir, `${name}.png`);
  writeFileSync(htmlPath, html);
  const report = layoutReport(htmlPath, width, height ?? 2000);
  if (report.bad.length) throw new Error(`${name}: text does not fit: ${report.bad.join(', ')}`);
  const h = height ?? report.height;
  screenshot(htmlPath, width, h, pngPath, ['--default-background-color=ffffffff']);
  console.log(`wrote ${relative(root, pngPath)}: ${width}x${h}, ${statSync(pngPath).size} bytes`);
  return pngPath;
}

const args = process.argv.slice(2);
const update = args.includes('--update-reference');
const which = new Set(args.filter((a) => !a.startsWith('--')));
const want = (k) => (which.size === 0 ? k !== 'en' : which.has(k));
const done = [];
if (want('en')) render('en', squarePage(data, 'en'), 1024, 1024);
if (want('zh')) done.push(['zh-tw', render('zh-tw', squarePage(data, 'zh'), 1024, 1024)]);
if (want('portrait')) done.push(['bilingual-portrait', render('bilingual-portrait', portraitPage(data), 1080)]);
if (update) {
  for (const [name, png] of done) {
    copyFileSync(png, join(root, 'reference', `${name}.png`));
    console.log(`copied -> reference/${name}.png`);
  }
}
