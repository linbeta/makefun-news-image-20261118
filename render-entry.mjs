// render-entry.mjs: draws the images from stories.json with headless Chrome.
//
//   node render-entry.mjs            -> entry.png (the English entry, 1024x1024)
//                                       reference/zh-tw.png (Traditional Chinese, 1024x1024, not the entry)
//                                       reference/bilingual-portrait.png (1080 wide, English then Chinese, not the entry)
//   node render-entry.mjs entry      -> only entry.png   (also: zh, portrait)
//   CHROME=/path/to/chrome node render-entry.mjs
//
// This is a development tool. main.ts never runs it: main.ts only checks and copies the committed entry.png.
// Needs Google Chrome or Chromium and the system fonts Oswald, Inter, Inter Tight, Noto Serif and Noto Sans CJK TC.
// For each page it first asks Chrome for the laid-out DOM and stops if any text box still overflows after the
// in-page shrink-to-fit step, then takes the screenshot at the measured size.

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { squarePage, portraitPage } from './render/pages.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'stories.json'), 'utf8'));
const chrome = process.env.CHROME ?? 'google-chrome';
const outDir = join(here, 'out');
mkdirSync(outDir, { recursive: true });
mkdirSync(join(here, 'reference'), { recursive: true });

const BASE_FLAGS = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--font-render-hinting=none', '--disable-lcd-text', '--disable-extensions', '--no-first-run', '--virtual-time-budget=4000'];

function layoutReport(htmlPath, width, height) {
  const dom = execFileSync(chrome, [...BASE_FLAGS, `--window-size=${width},${height}`, '--dump-dom', `file://${htmlPath}`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const m = dom.match(/data-report="([^"]*)"/);
  if (!m) throw new Error(`${htmlPath}: page did not report its layout`);
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

function render(name, html, target, width, height) {
  const htmlPath = join(outDir, `${name}.html`);
  writeFileSync(htmlPath, html);
  const report = layoutReport(htmlPath, width, height ?? 2000);
  if (report.bad.length) throw new Error(`${name}: text does not fit: ${report.bad.join(', ')}`);
  const h = height ?? report.height;
  execFileSync(chrome, [...BASE_FLAGS, '--default-background-color=ffffffff', `--window-size=${width},${h}`,
    `--screenshot=${target}`, `file://${htmlPath}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  console.log(`wrote ${target.slice(here.length + 1)}: ${width}x${h}, ${statSync(target).size} bytes`);
}

const which = new Set(process.argv.slice(2));
const want = (k) => which.size === 0 || which.has(k);

if (want('entry')) render('entry', squarePage(data, 'en'), join(here, 'entry.png'), 1024, 1024);
if (want('zh')) render('zh-tw', squarePage(data, 'zh'), join(here, 'reference', 'zh-tw.png'), 1024, 1024);
if (want('portrait')) render('bilingual-portrait', portraitPage(data), join(here, 'reference', 'bilingual-portrait.png'), 1080);
