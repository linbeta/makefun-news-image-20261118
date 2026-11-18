// render-entry.mjs: draws entry.png from stories.json.
// It builds one HTML page (layout and hand-drawn SVG pictograms) and screenshots it at 1024x1024 with headless Chrome.
// This is a development tool, separate from main.ts, which only copies and checks the committed entry.png.
//
//   node render-entry.mjs                 -> writes out/entry.html and ./entry.png
//   CHROME=/path/to/chrome node render-entry.mjs
//
// Needs Google Chrome (or Chromium) and the Oswald and Inter fonts installed on the system.

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'stories.json'), 'utf8'));
const SIZE = 1024;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Colour by region tag, so the spread across the world is visible at a glance.
const REGION_COLOURS = {
  'ASIA-PACIFIC': '#d62828',
  'MIDDLE EAST': '#e46a00',
  'AMERICAS': '#1d5fbf',
  'SPACE': '#5b3fa8',
  'EUROPE': '#0f8a6c',
  'OCEANIA': '#0a86b0',
  'AFRICA': '#b07a00',
  'CULTURE': '#9a2f6a',
};

// ---- Pictograms: each is SVG content for a 120x120 viewBox, drawn from simple shapes. ----
const ICONS = {
  // A lectern marked APEC in front of a city skyline.
  apec: (c) => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#fde8e8"/>
    <g fill="#e9a3a3">
      <rect x="10" y="40" width="12" height="44"/><rect x="24" y="26" width="10" height="58"/>
      <rect x="36" y="48" width="12" height="36"/><rect x="74" y="34" width="12" height="50"/>
      <rect x="88" y="18" width="9" height="66"/><polygon points="88,18 92.5,8 97,18"/>
      <rect x="99" y="44" width="12" height="40"/>
    </g>
    <rect x="6" y="84" width="108" height="4" fill="#c98b8b"/>
    <path d="M60 34 q-10 -2 -12 10" stroke="#333" stroke-width="3" fill="none"/>
    <circle cx="47" cy="47" r="4.5" fill="#333"/>
    <polygon points="34,56 86,56 80,112 40,112" fill="${c}"/>
    <rect x="30" y="52" width="60" height="8" rx="2" fill="#8f1414"/>
    <text x="60" y="88" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="19" fill="#fff" letter-spacing="1">APEC</text>`,

  // A delta-wing drone diving, with an interception burst and a dashed trail.
  drone: (c) => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#1f2a3c"/>
    <circle cx="20" cy="18" r="1.6" fill="#fff"/><circle cx="102" cy="26" r="1.3" fill="#fff"/><circle cx="66" cy="12" r="1.2" fill="#fff"/>
    <path d="M8 100 L40 92 L60 98 L84 90 L112 96 L112 120 L8 120 Z" fill="#33445e"/>
    <path d="M112 8 L78 36" stroke="#9fb3cf" stroke-width="2.5" stroke-dasharray="5 5"/>
    <g transform="translate(62 50) rotate(-130)">
      <polygon points="0,-30 26,16 8,12 0,20 -8,12 -26,16" fill="#d9dee6" stroke="#8a97aa" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-4" y="-26" width="8" height="42" rx="4" fill="#b8c1ce"/>
      <rect x="22" y="6" width="5" height="12" rx="1" fill="#8a97aa"/><rect x="-27" y="6" width="5" height="12" rx="1" fill="#8a97aa"/>
    </g>
    <path d="M14 104 Q18 92 30 84" stroke="#ffd166" stroke-width="2.5" fill="none" stroke-dasharray="3 4"/>
    <g transform="translate(36 80)">
      <polygon points="0,-18 5,-6 17,-10 9,0 17,10 5,6 0,18 -5,6 -17,10 -9,0 -17,-10 -5,-6" fill="${c}"/>
      <circle r="6" fill="#ffd166"/>
    </g>`,

  // A computer chip with a rising bar chart.
  chip: (c) => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#e3ecfa"/>
    <g stroke="#7f8ea6" stroke-width="4" stroke-linecap="round">
      ${[30, 42, 54, 66].map((v) => `<line x1="${v}" y1="20" x2="${v}" y2="28"/><line x1="${v}" y1="68" x2="${v}" y2="76"/><line x1="12" y1="${v - 2}" x2="20" y2="${v - 2}"/><line x1="76" y1="${v - 2}" x2="84" y2="${v - 2}"/>`).join('')}
    </g>
    <rect x="20" y="26" width="56" height="44" rx="6" fill="#2b2f36"/>
    <rect x="30" y="34" width="36" height="28" rx="3" fill="#76b900"/>
    <rect x="58" y="96" width="12" height="16" fill="${c}"/><rect x="74" y="86" width="12" height="26" fill="${c}"/><rect x="90" y="70" width="12" height="42" fill="${c}"/>
    <path d="M52 92 L80 74 L98 54" stroke="#0f9d58" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="104,44 103,62 88,52" fill="#0f9d58"/>`,

  // Voyager: dish antenna on a long boom, far from a small blue Earth, joined by a dashed line.
  voyager: () => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#0b0f2a"/>
    ${[[14, 20], [40, 10], [98, 14], [108, 60], [70, 104], [30, 64], [56, 40], [90, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff" opacity=".85"/>`).join('')}
    <circle cx="18" cy="100" r="9" fill="#3a86ff"/><path d="M12 96 q5 -4 9 0 q-2 6 -7 4z" fill="#3ccf6e"/>
    <path d="M28 92 L66 58" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="4 5"/>
    <g transform="translate(80 46) rotate(-30)">
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#c9ced8" stroke-width="2.5"/>
      <rect x="22" y="-4" width="10" height="8" fill="#c9ced8"/>
      <rect x="-8" y="2" width="16" height="10" fill="#b38b4d"/>
      <path d="M-20 -6 Q0 -30 20 -6 Z" fill="#f2f4f8"/>
      <line x1="0" y1="-12" x2="0" y2="-24" stroke="#f2f4f8" stroke-width="2"/>
    </g>`,

  // Globe with a rising thermometer and an oil drop.
  climate: (c) => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#dff3ec"/>
    <circle cx="50" cy="62" r="38" fill="#3a86ff"/>
    <path d="M28 40 q10 -10 22 -4 q4 10 -6 14 q-6 10 -16 6 q-6 -8 0 -16z M56 70 q12 -4 18 6 q-2 14 -14 16 q-8 -8 -4 -22z M60 30 q10 0 16 8 q-6 4 -14 0z" fill="#3ccf6e"/>
    <rect x="88" y="16" width="16" height="70" rx="8" fill="#fff" stroke="#555" stroke-width="3"/>
    <rect x="93" y="34" width="6" height="56" fill="${c === '#0f8a6c' ? '#e63946' : c}"/>
    <circle cx="96" cy="94" r="12" fill="#e63946" stroke="#555" stroke-width="3"/>
    <path d="M24 92 q-8 12 0 18 q8 -6 0 -18z" fill="#222"/>`,

  // A document with a red SANCTIONS stamp.
  sanction: (c) => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#dff1f8"/>
    <polygon points="26,12 80,12 96,28 96,108 26,108" fill="#fff" stroke="#556" stroke-width="3"/>
    <polygon points="80,12 80,28 96,28" fill="#cfd6df"/>
    ${[36, 46, 56, 88, 98].map((y) => `<rect x="36" y="${y}" width="${y > 80 ? 30 : 48}" height="4" rx="2" fill="#9aa5b4"/>`).join('')}
    <g transform="translate(62 72) rotate(-14)">
      <rect x="-40" y="-13" width="80" height="26" rx="4" fill="#fff" stroke="#d62828" stroke-width="4"/>
      <text x="0" y="6.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="17" fill="#d62828" textLength="66" lengthAdjust="spacingAndGlyphs">SANCTIONS</text>
    </g>`,

  // A virus particle with a rising case curve.
  virus: (c) => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#fbf0d9"/>
    <g transform="translate(48 56)">
      ${Array.from({ length: 10 }, (_, i) => { const a = (i * 36 * Math.PI) / 180; const x1 = Math.cos(a) * 26, y1 = Math.sin(a) * 26, x2 = Math.cos(a) * 38, y2 = Math.sin(a) * 38; return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#a4161a" stroke-width="4"/><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="5" fill="#a4161a"/>`; }).join('')}
      <circle r="28" fill="#e5383b"/>
      <circle cx="-9" cy="-8" r="6" fill="#ba181b"/><circle cx="10" cy="6" r="5" fill="#ba181b"/><circle cx="-4" cy="12" r="3.5" fill="#ba181b"/>
    </g>
    <path d="M70 108 L84 100 L94 90 L104 70" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="108,60 110,78 96,72" fill="${c}"/>`,

  // An open dictionary with the word "human".
  dictionary: (c) => `
    <rect x="0" y="0" width="120" height="120" rx="18" fill="#f6e3ee"/>
    <path d="M10 34 Q34 26 60 36 L60 100 Q34 90 10 98 Z" fill="#fff" stroke="#555" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 34 Q86 26 60 36 L60 100 Q86 90 110 98 Z" fill="#fff" stroke="#555" stroke-width="3" stroke-linejoin="round"/>
    <path d="M10 98 Q34 90 60 100 Q86 90 110 98 L110 104 Q86 96 60 106 Q34 96 10 104 Z" fill="${c}"/>
    <text x="35" y="62" text-anchor="middle" font-family="Noto Serif" font-weight="800" font-style="italic" font-size="16" fill="#222" textLength="40" lengthAdjust="spacingAndGlyphs">human</text>
    ${[74, 82].map((y) => `<rect x="18" y="${y}" width="34" height="3" rx="1.5" fill="#aaa"/>`).join('')}
    ${[48, 56, 64, 72, 80].map((y) => `<rect x="68" y="${y}" width="34" height="3" rx="1.5" fill="#bbb"/>`).join('')}`,
};

function panel(s) {
  const colour = REGION_COLOURS[s.region] ?? '#333';
  const icon = ICONS[s.icon];
  if (!icon) throw new Error(`no pictogram named ${s.icon}`);
  return `
  <div class="panel" style="--c:${colour}">
    <svg class="icon" viewBox="0 0 120 120" width="148" height="148">${icon(colour)}</svg>
    <div class="text">
      <div class="tag">${esc(s.region)} · ${esc(s.field)}</div>
      <div class="hl">${esc(s.headline)}</div>
      <div class="sub">${esc(s.sub)}</div>
    </div>
  </div>`;
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${SIZE}px; height: ${SIZE}px; overflow: hidden; }
  body { background: #f3eee3; font-family: 'Inter', sans-serif; color: #141414; }
  .mast { height: 206px; background: #10192b; color: #fff; padding: 16px 28px 0; position: relative; }
  .mast .row { display: flex; justify-content: space-between; align-items: baseline; }
  .mast .wd { font-family: 'Oswald'; font-weight: 700; font-size: 46px; letter-spacing: 6px; color: #ffc93c; line-height: 1; }
  .mast .kick { font-family: 'Inter'; font-weight: 800; font-size: 19px; letter-spacing: 2px; color: #c6cfdd; }
  .mast .date { font-family: 'Oswald'; font-weight: 700; font-size: 136px; line-height: 1; letter-spacing: 1px; margin-top: 4px; white-space: nowrap; }
  .grid { position: absolute; top: 220px; left: 14px; right: 14px; bottom: 44px;
          display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, 1fr); gap: 12px; }
  .panel { background: #fff; border-left: 12px solid var(--c); border-radius: 6px; display: flex; align-items: center;
           padding: 0 12px 0 14px; gap: 14px; box-shadow: 0 1px 0 rgba(0,0,0,.12); overflow: hidden; }
  .icon { flex: 0 0 auto; }
  .text { flex: 1 1 auto; min-width: 0; }
  .tag { font-weight: 800; font-size: 15px; letter-spacing: 1.5px; color: var(--c); margin-bottom: 4px; }
  .hl { font-family: 'Oswald'; font-weight: 700; font-size: 33px; line-height: 1.06; color: #111; }
  .sub { font-weight: 600; font-size: 20px; line-height: 1.2; color: #3a3a3a; margin-top: 6px; }
  .foot { position: absolute; left: 0; right: 0; bottom: 0; height: 38px; background: #10192b; color: #d9dfe8;
          font-weight: 600; font-size: 15.5px; display: flex; align-items: center; justify-content: center; letter-spacing: .3px; }
</style></head><body>
  <div class="mast">
    <div class="row"><div class="wd">${esc(data.date.weekday)}</div><div class="kick">${esc(data.date.kicker)}</div></div>
    <div class="date">${esc(data.date.day)}</div>
  </div>
  <div class="grid">${data.stories.map(panel).join('')}</div>
  <div class="foot">${esc(data.footer)}</div>
  <script>
    // Shrink the date line until it fits the masthead width.
    const d = document.querySelector('.date');
    let fs = 160;
    d.style.fontSize = fs + 'px';
    while (d.scrollWidth > d.parentElement.clientWidth - 56 && fs > 60) d.style.fontSize = (--fs) + 'px';
  </script>
</body></html>`;

const outDir = join(here, 'out');
mkdirSync(outDir, { recursive: true });
const htmlPath = join(outDir, 'entry.html');
writeFileSync(htmlPath, html);

const chrome = process.env.CHROME ?? 'google-chrome';
const target = resolve(here, process.env.ENTRY_PNG ?? 'entry.png');
execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--default-background-color=00000000', '--font-render-hinting=none', '--disable-lcd-text',
  `--window-size=${SIZE},${SIZE}`, `--screenshot=${target}`, `file://${htmlPath}`,
], { stdio: 'inherit' });
console.log(`wrote ${target} (${statSync(target).size} bytes)`);
