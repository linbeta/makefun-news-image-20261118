// render/chrome.mjs: headless Chrome helpers shared by the poster renderer and the v2 reference renderer.
//
//   readReport(htmlPath, w, h) -> the JSON the page wrote into <script id="report"> after its fit/audit pass
//   dumpDom(htmlPath, w, h)   -> the serialised DOM after the page's scripts ran
//   screenshot(htmlPath, w, h, pngPath[, extraFlags])
//
// CHROME picks the browser binary (default google-chrome). DPR is pinned to 1, so a 1024 page is a 1024 PNG.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const chrome = process.env.CHROME ?? 'google-chrome';

const FLAGS = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--font-render-hinting=none', '--disable-lcd-text', '--disable-extensions', '--no-first-run', '--mute-audio',
  '--disable-background-networking', '--virtual-time-budget=5000'];

// The page's DOM after its scripts ran (and the virtual-time budget ran out).
export function dumpDom(htmlPath, width, height) {
  return execFileSync(chrome, [...FLAGS, `--window-size=${width},${height}`, '--dump-dom', pathToFileURL(htmlPath).href],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

export function readReport(htmlPath, width, height) {
  const dom = dumpDom(htmlPath, width, height);
  const m = dom.match(/<script type="application\/json" id="report">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`${htmlPath}: the page wrote no report`);
  const report = JSON.parse(m[1]);
  if (report.pending) throw new Error(`${htmlPath}: the page's fit/audit script did not run`);
  return report;
}

export function screenshot(htmlPath, width, height, pngPath, extraFlags = []) {
  execFileSync(chrome, [...FLAGS, ...extraFlags, `--window-size=${width},${height}`, `--screenshot=${pngPath}`, pathToFileURL(htmlPath).href],
    { stdio: ['ignore', 'ignore', 'ignore'] });
}
