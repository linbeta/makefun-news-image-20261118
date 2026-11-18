// render/page.mjs: the poster model (render/poster.mjs) as a 1024x1024 HTML page for headless Chrome, plus the glyph
// overview sheet.
//
// Every variable text box carries data-fit: a script in the page shrinks its type 1 px at a time down to a floor, then
// (per box) cuts it at a whole word with "…", swaps in a fallback label, or empties it. After that it audits the page:
// text outside its box or the canvas, text boxes overlapping each other or a glyph, type under 13 px, WCAG contrast of
// every text run against the colour behind it, and whether the three system fonts were really used; then, for the tile
// grid, lines per box (data-maxlines), type under a box's floor (data-floor), chip size, panels overlapping, and
// anything leaving its tile (data-in), with one row per tile in report.tiles. The result is written as JSON into
// <script id="report">, which render-entry.mjs reads back and fails on (adding the rules in render/grid.mjs).
//
// Fonts are the system TTFs Fontconfig provides (Anton, Inter, IBM Plex Mono): nothing is embedded or bundled.

import { glyphSvg, GLYPHS, GLYPH_ORDER } from './glyphs.mjs';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const C = {
  canvas: '#211644', panel: '#352357', text: '#FBF6FF', text2: '#EBDCFF', lime: '#EDFF67', rule: '#806AA4', ink: '#211644',
};
const W = 1024;
const M = 36;
const CW = W - 2 * M; // 952

// Vertical plan (px from the top). The chip is Mono 700 18/22 + 3+3 padding = 28 tall (one step up from the spec's
// 16 px / 26), so the secondary row is 6 px taller than the spec and the rows below sit up to 4 px lower.
const Y = {
  header: 23, headerH: 125,
  lead: 166, leadH: 270,
  second: 452, secondH: 108,
  covHead: 576, bar: 611, barH: 5,
  strip: 628, rowH: 98, gap: 12,
  footer: 958,
};

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${W}px; overflow: hidden; background: ${C.canvas}; }
body { position: relative; color: ${C.text}; font: 600 20px/24px 'Inter', sans-serif; font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
.abs { position: absolute; }
.anton { font-family: 'Anton', sans-serif; font-weight: 400; }
.mono { font-family: 'IBM Plex Mono', monospace; font-weight: 700; }
.panel { background: ${C.panel}; }
.chip { display: inline-block; height: 28px; padding: 3px 8px; border-radius: 4px; font: 700 18px/22px 'IBM Plex Mono', monospace;
  color: ${C.ink}; white-space: nowrap; letter-spacing: 0; }
.vbox { display: flex; align-items: center; overflow: visible; }
.vbox > .t { width: 100%; }
.nowrap { white-space: nowrap; }
.glyph { display: block; flex: none; }
`;

// A text box: absolutely placed frame (x, y, w, h) holding one text element that the fit script sizes.
// opts: size (start px), min (floor px), lh (line-height factor, or px when lhPx), mode ('shrink' | 'cut' | 'fallback' |
// 'clear'), fallback (text), cls/style extra, nowrap, valign; for the audit: maxLines (most lines allowed), floor (least
// px allowed), inTile (id of the tile panel the box must stay inside).
function fitBox(text, x, y, w, h, o) {
  const lh = o.lhPx ? `${o.lhPx}px` : String(o.lh);
  const data = `data-fit="${o.mode ?? 'shrink'}" data-size="${o.size}" data-min="${o.min}" data-lh="${o.lhPx ? `${o.lhPx}px` : o.lh}"`
    + (o.fallback ? ` data-fallback="${esc(o.fallback)}"` : '') + (o.name ? ` data-name="${esc(o.name)}"` : '')
    + (o.maxLines ? ` data-maxlines="${o.maxLines}"` : '') + (o.floor ? ` data-floor="${o.floor}"` : '');
  return `<div class="abs vbox box"${o.inTile ? ` data-in="${o.inTile}"` : ''} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${o.valign === 'top' ? 'align-items:flex-start;' : ''}">`
    + `<div class="t ${o.cls ?? ''}${o.nowrap ? ' nowrap' : ''}" ${data} style="font-size:${o.size}px;line-height:${lh};${o.style ?? ''}">${esc(text)}</div></div>`;
}

const chip = (s) => `<span class="chip t" style="background:${s.colour}">${esc(s.chip)}</span>`;

function header(p) {
  const h = p.header;
  return `
<div class="abs" style="left:${M}px;top:${Y.header}px;width:${CW}px;height:${Y.headerH}px;border-bottom:1px solid ${C.rule}">
  <div class="abs anton t nowrap" style="left:0;top:16px;font-size:80px;line-height:89px;letter-spacing:.005em">${esc(h.date)}</div>
  <div class="abs mono t nowrap" style="right:0;top:7px;font-size:21px;line-height:26px;letter-spacing:.13em;color:${C.text2};text-align:right">${esc(h.weekday)}</div>
  <div class="abs mono t" style="right:0;bottom:18px;font-size:19px;line-height:25px;letter-spacing:.03em;color:${C.lime};text-align:right;white-space:pre">${esc(h.stat1)}\n${esc(h.stat2)}</div>
</div>`;
}

function leadPanel(p) {
  const L = p.lead;
  const top = Y.lead;
  const panel = `<div class="abs panel" style="left:${M}px;top:${top}px;width:${CW}px;height:${Y.leadH}px;border-radius:12px"></div>`;
  if (!L) {
    return `${panel}<div class="abs anton t nowrap" style="left:60px;top:${top + 80}px;font-size:88px;line-height:94px;color:${C.text2}">NO STORIES</div>`;
  }
  const chipTop = top + 18; // 184
  const headTop = chipTop + 28 + 7; // 219
  const subTop = headTop + 122 + 8; // 349
  const head = fitBox(L.label.text.toUpperCase(), 60, headTop, 630, 122, {
    size: 88, min: 44, lh: 1.06, mode: 'fallback', fallback: 'TOP STORY', name: 'lead headline',
    cls: 'anton', style: `color:${C.lime};letter-spacing:.005em`,
  });
  // Both sub-lines are laid out; the page shows the place + first sentence pair, unless the big label is not enough to
  // stand for the headline (or falls back to TOP STORY), in which case it shows the original headline.
  const placeMode = L.sub === 'place';
  const place = fitBox(L.place, 60, subTop, 630, 30, {
    size: 22, min: 16, lhPx: 26.4, mode: 'clear', nowrap: true, name: 'lead place', cls: 'sub-place',
  });
  const sentence = fitBox(L.sentence, 60, subTop + 30, 630, 46, {
    size: 18, min: 16, lhPx: 23, mode: 'cut', name: 'lead summary', cls: 'sub-place', valign: 'top', style: `color:${C.text2}`,
  });
  const orig = fitBox(L.headline, 60, subTop, 630, 76, {
    size: 22, min: 16, lhPx: 26.4, mode: 'cut', name: 'lead original headline', cls: 'sub-head', valign: 'top',
  });
  const ring = 236;
  const icon = `<div class="abs" style="left:730px;top:${top + 17}px;width:${ring}px;height:${ring}px;border:2px solid ${L.colour};border-radius:50%;`
    + `padding:24px;color:${C.lime}">${glyphSvg(L.glyph, 184)}</div>`;
  return `${panel}<div class="abs" style="left:60px;top:${chipTop}px">${chip(L)}</div>${head}`
    + `<div id="subs" data-mode="${placeMode ? 'place' : 'headline'}">${place}${sentence}${orig}</div>${icon}`;
}

function secondRow(p) {
  const n = p.seconds.length;
  if (!n) return '';
  const colW = n === 1 ? CW : (CW - 12) / 2;
  return p.seconds.map((s, i) => {
    const x = M + i * (colW + 12);
    const padX = 14;
    const iconW = 80;
    const textX = x + 4 + padX + iconW + 13;
    const textW = colW - 4 - 2 * padX - iconW - 13;
    const innerTop = Y.second + 9;
    return `<div class="abs panel" style="left:${x}px;top:${Y.second}px;width:${colW}px;height:${Y.secondH}px;border-left:4px solid ${s.colour};border-radius:8px"></div>`
      + `<div class="abs" style="left:${x + 4 + padX}px;top:${Y.second}px;width:${iconW}px;height:${Y.secondH}px;display:flex;align-items:center;justify-content:center;color:${s.colour}">${glyphSvg(s.glyph, 68)}</div>`
      + `<div class="abs" style="left:${textX}px;top:${innerTop}px">${chip(s)}</div>`
      + fitBox(s.label.text, textX, innerTop + 28 + 4, textW, 58, {
        size: 26, min: 16, lh: 1.12, mode: 'fallback', fallback: s.fallback, name: `secondary ${s.n}`,
        style: 'font-weight:750;letter-spacing:-.02em',
      });
  }).join('');
}

function coverage(p) {
  if (!p.coverage.length) return '';
  const total = p.coverage.reduce((a, c) => a + c.count, 0);
  const gap = 3;
  const free = CW - gap * (p.coverage.length - 1);
  let x = M;
  // Integer widths that add up exactly: the rounding remainder goes to the last segment.
  const segs = p.coverage.map((c, i) => {
    const w = i === p.coverage.length - 1 ? M + CW - x : Math.round((free * c.count) / total);
    const out = `<div class="abs" style="left:${x}px;top:${Y.bar}px;width:${w}px;height:${Y.barH}px;border-radius:2px;background:${c.colour}"></div>`;
    x += w + gap;
    return out;
  }).join('');
  const items = p.coverage.map((c) => `<span class="cov-item t" style="border-bottom:3px solid ${c.colour}">${esc(c.label)}&nbsp;${c.count}</span>`).join('');
  return `<div class="abs mono t nowrap" style="left:${M}px;top:${Y.covHead}px;font-size:20px;line-height:26px;letter-spacing:.07em;color:${C.lime}">WORLD COVERAGE</div>`
    + `<div class="abs mono nowrap" id="cov-items" data-fit-row="1" style="right:${M}px;top:${Y.covHead + 1}px;display:flex;gap:11px;font-size:16px;line-height:22px;color:${C.text}">${items}</div>`
    + segs;
}

// Tile grid: 4 columns x 3 rows across the content width (x 36..988), columns 226 wide with 16 px gutters, rows 98
// tall and 12 apart (v3's rows). Inside a tile (4 px region rule on the left, 10 px padding): a top row with the 36 px
// category glyph and the region chip (Mono 18 px), then the headline, Inter 750 from 17 px down to a floor of 16 px,
// on at most 2 lines. A headline that does not fit at 16 px in 2 lines falls back to the glyph's name; the entry
// render refuses that (render-entry.mjs), so the label_short in stories.json has to be shortened instead.
export const GRID = (() => {
  const cols = 4; const rows = 3; const gutter = 16;
  const colW = (CW - gutter * (cols - 1)) / cols; // 226
  const rule = 4; const padX = 10; const padY = 9;
  const glyph = 36; const glyphGap = 8; const headGap = 4;
  const head = { size: 17, min: 16, lh: 1.12, lines: 2 };
  const headH = Math.ceil(head.size * head.lh * head.lines); // 39: 2 lines at 17 px, never 3 at 16 px (53.8)
  return { cols, rows, max: cols * rows, gutter, colW, rowH: Y.rowH, rowGap: Y.gap, rule, padX, padY, glyph, glyphGap, headGap, head, headH,
    innerW: colW - rule - 2 * padX }; // 202
})();

function strip(p) {
  const G = GRID;
  return p.tiles.slice(0, G.max).map((s, i) => {
    const x = M + (i % G.cols) * (G.colW + G.gutter);
    const y = Y.strip + Math.floor(i / G.cols) * (G.rowH + G.rowGap);
    const id = `tile-${i}`;
    const innerX = x + G.rule + G.padX;
    const topY = y + G.padY;
    const headY = topY + G.glyph + G.headGap;
    return `<div class="abs panel tile" id="${id}" data-n="${s.n}" style="left:${x}px;top:${y}px;width:${G.colW}px;height:${G.rowH}px;border-left:${G.rule}px solid ${s.colour};border-radius:8px"></div>`
      + `<div class="abs" data-in="${id}" style="left:${innerX}px;top:${topY}px;width:${G.glyph}px;height:${G.glyph}px;color:${s.colour}">${glyphSvg(s.glyph, G.glyph)}</div>`
      + `<div class="abs" data-in="${id}" data-chip="18" style="left:${innerX + G.glyph + G.glyphGap}px;top:${topY + (G.glyph - 28) / 2}px">${chip(s)}</div>`
      + fitBox(s.label.text, innerX, headY, G.innerW, G.headH, {
        size: G.head.size, min: G.head.min, lh: G.head.lh, mode: 'fallback', fallback: s.fallback, name: `tile ${s.n}`,
        valign: 'top', style: 'font-weight:750;letter-spacing:-.02em;text-wrap:balance', maxLines: G.head.lines, floor: G.head.min, inTile: id,
      });
  }).join('');
}

function footer(p) {
  const f = p.footer;
  const dated = p.empty ? '' : `<div class="t" style="font-size:16px;line-height:21px">${esc(f.dated)}</div>`;
  const src = f.sources.length
    ? `<div class="t nowrap" id="sources" data-label="${esc(f.sourcesLabel)}" data-items="${esc(JSON.stringify(f.sources))}" `
      + `style="font-size:13px;line-height:18px;color:${C.text2};width:${CW}px;overflow:hidden"></div>`
    : '';
  return `<div class="abs" id="footer" style="left:${M}px;top:${Y.footer}px;width:${CW}px;border-top:1px solid ${C.rule};padding-top:7px">${dated}${src}</div>`;
}

// ---- the in-page fit + audit script (runs in Chrome) ----

const PAGE_SCRIPT = String.raw`
(() => {
  const report = { bad: [], overlaps: [], fits: [], contrast: [], fonts: {}, minFont: 99, minContrast: 99, notes: [] };
  // A text run's box: the ink-wide span of its glyphs (Range), clipped to its line boxes (the element). Anton's
  // content area is taller than its 1.06 line height, so the Range alone would overstate the vertical extent.
  const rectOf = (el) => {
    const r = document.createRange(); r.selectNodeContents(el);
    const a = r.getBoundingClientRect(); const b = el.getBoundingClientRect();
    const left = Math.max(a.left, b.left); const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top); const bottom = Math.min(a.bottom, b.bottom);
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  };
  const box = (el) => el.parentElement;
  const fits = (el) => {
    const b = box(el).getBoundingClientRect();
    const r = el.getBoundingClientRect(); // the block: its height is the sum of its line boxes
    return el.scrollWidth <= el.clientWidth + 0.5 && r.height <= b.height + 0.5 && r.width <= b.width + 0.5;
  };
  const setSize = (el, px) => {
    el.style.fontSize = px + 'px';
    const lh = el.dataset.lh;
    el.style.lineHeight = lh.endsWith('px') ? lh : String(parseFloat(lh));
  };
  const shrink = (el) => {
    const max = +el.dataset.size; const min = +el.dataset.min;
    for (let px = max; px >= min; px--) { setSize(el, px); if (fits(el)) return px; }
    return 0;
  };
  // Longest run of whole words + "…" that fits at the floor size.
  const cut = (el) => {
    const words = el.textContent.split(' ');
    let lo = 1; let hi = words.length - 1; let best = '';
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      el.textContent = words.slice(0, mid).join(' ').replace(/[,;:–—-]+$/, '') + '…';
      if (fits(el)) { best = el.textContent; lo = mid + 1; } else hi = mid - 1;
    }
    el.textContent = best;
    return best !== '';
  };
  const subs = document.getElementById('subs');
  for (const el of document.querySelectorAll('[data-fit]')) {
    const name = el.dataset.name || el.textContent;
    const original = el.textContent;
    let px = shrink(el);
    let how = 'fit';
    if (!px) {
      const mode = el.dataset.fit;
      if (mode === 'cut') { how = cut(el) ? 'cut' : 'cleared'; px = +el.dataset.min; }
      else if (mode === 'clear') { el.textContent = ''; how = 'cleared'; px = +el.dataset.min; }
      else if (mode === 'fallback') {
        el.textContent = el.dataset.fallback; how = 'fallback'; px = shrink(el);
        if (name === 'lead headline' && subs) subs.dataset.mode = 'headline';
      }
      if (!px || (el.textContent && !fits(el))) report.bad.push(name + ': does not fit');
    }
    report.fits.push({ name, px, how, text: el.textContent, original });
  }
  if (subs) {
    const mode = subs.dataset.mode;
    for (const el of subs.querySelectorAll(mode === 'place' ? '.sub-head' : '.sub-place')) box(el).remove();
  }

  // Coverage items: shrink the row together if it would run into the WORLD COVERAGE title.
  const cov = document.getElementById('cov-items');
  if (cov) {
    const title = cov.previousElementSibling;
    let px = 16;
    while (px > 11 && cov.getBoundingClientRect().left < title.getBoundingClientRect().right + 16) {
      px--; cov.style.fontSize = px + 'px';
    }
    if (cov.getBoundingClientRect().left < title.getBoundingClientRect().right + 8) report.bad.push('coverage items collide with title');
    report.notes.push('coverage items ' + px + 'px');
  }

  // Sources: label, then outlets in order; drop from the end (adding " …") until it fits; omit if even one won't.
  const src = document.getElementById('sources');
  if (src) {
    const items = JSON.parse(src.dataset.items);
    const label = src.dataset.label + ': ';
    let shownN = 0;
    for (let n = items.length; n >= 1; n--) {
      src.textContent = label + items.slice(0, n).join(' · ') + (n < items.length ? ' …' : '');
      if (src.scrollWidth <= src.clientWidth) { shownN = n; break; }
    }
    if (!shownN) src.remove();
    report.notes.push('sources shown ' + shownN + ' of ' + items.length);
  }

  // ---- audit ----
  const texts = [...document.querySelectorAll('.t')].filter((el) => el.textContent.trim() !== '');
  const glyphs = [...document.querySelectorAll('svg.glyph')];
  const lum = (rgb) => {
    const ch = rgb.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const bgOf = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor; const v = parse(c);
      if (v.length >= 3 && (v.length < 4 || v[3] > 0)) return v.slice(0, 3);
    }
    // No painted ancestor: the panel or the canvas under it, whichever covers the text's centre.
    return null;
  };
  const panels = [...document.querySelectorAll('.panel')];
  const under = (r) => {
    const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
    const hit = panels.find((p) => { const b = p.getBoundingClientRect(); return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom; });
    return parse(getComputedStyle(hit || document.body).backgroundColor).slice(0, 3);
  };
  const rects = [];
  for (const el of texts) {
    const r = rectOf(el);
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    const name = el.dataset.name || el.textContent.slice(0, 40);
    report.minFont = Math.min(report.minFont, px);
    if (px < 13) report.bad.push(name + ': type under 13 px');
    if (r.left < 0 || r.top < 0 || r.right > 1024 || r.bottom > 1024) report.bad.push(name + ': outside the canvas');
    if (el.dataset.fit && !fits(el)) report.bad.push(name + ': overflows its box');
    const fg = parse(cs.color).slice(0, 3);
    const bg = bgOf(el) || under(r);
    const a = lum(fg); const b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const weight = parseFloat(cs.fontWeight);
    const need = px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5;
    report.contrast.push({ text: el.textContent.slice(0, 48), px, weight, fg: cs.color, bg: 'rgb(' + bg.join(', ') + ')', ratio: +ratio.toFixed(3), need, pass: ratio >= need });
    report.minContrast = Math.min(report.minContrast, ratio);
    if (ratio < need) report.bad.push(name + ': contrast ' + ratio.toFixed(2) + ' < ' + need);
    rects.push({ name, r, el });
  }
  for (const g of glyphs) rects.push({ name: 'glyph', r: g.getBoundingClientRect(), el: g });
  const hit = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const A = rects[i]; const B = rects[j];
    if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
    if (hit(A.r, B.r)) report.overlaps.push(A.name + ' / ' + B.name);
  }
  if (report.overlaps.length) report.bad.push('overlapping text: ' + report.overlaps.join('; '));

  // Lines a text run occupies: distinct line tops among its Range's client rects.
  const lineCount = (el) => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter((q) => q.width > 0.5).map((q) => Math.round(q.top));
    return new Set(tops).size;
  };
  for (const el of document.querySelectorAll('[data-maxlines]')) {
    if (!el.textContent.trim()) continue;
    const n = lineCount(el); const max = +el.dataset.maxlines;
    if (n > max) report.bad.push((el.dataset.name || 'text') + ': ' + n + ' lines > ' + max);
  }
  for (const el of document.querySelectorAll('[data-floor]')) {
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (el.textContent.trim() && px < +el.dataset.floor) report.bad.push((el.dataset.name || 'text') + ': ' + px + ' px < floor ' + el.dataset.floor);
  }
  for (const el of document.querySelectorAll('[data-chip] .chip')) {
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px !== +el.parentElement.dataset.chip) report.bad.push('chip ' + el.textContent + ': ' + px + ' px, not ' + el.parentElement.dataset.chip);
  }

  // Panels (lead, secondaries, tiles) must not overlap one another, and tiles stay in the content width (36..988) and
  // above the footer rule. Everything tagged data-in="tile-i" (glyph, chip, headline) stays inside its tile.
  const panelRects = [...document.querySelectorAll('.panel')].map((el) => ({ el, r: el.getBoundingClientRect() }));
  for (let i = 0; i < panelRects.length; i++) for (let j = i + 1; j < panelRects.length; j++) {
    if (hit(panelRects[i].r, panelRects[j].r)) report.bad.push('panels overlap: ' + (panelRects[i].el.id || 'panel ' + i) + ' / ' + (panelRects[j].el.id || 'panel ' + j));
  }
  const footerEl = document.getElementById('footer');
  const footerTop = footerEl ? footerEl.getBoundingClientRect().top : 1024;
  const inside = (a, b) => a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5;
  report.tiles = [];
  for (const tile of document.querySelectorAll('.tile')) {
    const tr = tile.getBoundingClientRect();
    if (tr.left < 36 - 0.5 || tr.right > 988 + 0.5) report.bad.push(tile.id + ': outside the content width');
    if (tr.bottom > footerTop - 4) report.bad.push(tile.id + ': runs into the footer');
    const parts = [...document.querySelectorAll('[data-in="' + tile.id + '"]')];
    for (const part of parts) {
      const t = part.querySelector('.t');
      const g = part.querySelector('svg.glyph');
      const r = t ? rectOf(t) : (g || part).getBoundingClientRect();
      if (!inside(r, tr)) report.bad.push(tile.id + ': ' + (t ? (t.dataset.name || 'chip ' + t.textContent) : 'glyph') + ' leaves the tile');
    }
    const head = parts.map((q) => q.querySelector('[data-maxlines]')).find(Boolean);
    const chipEl = parts.map((q) => q.querySelector('.chip')).find(Boolean);
    const glyphEl = parts.map((q) => q.querySelector('svg.glyph')).find(Boolean);
    report.tiles.push({
      id: tile.id, n: +tile.dataset.n, x: Math.round(tr.left), y: Math.round(tr.top), w: Math.round(tr.width), h: Math.round(tr.height),
      text: head ? head.textContent : '', px: head ? parseFloat(getComputedStyle(head).fontSize) : 0, lines: head ? lineCount(head) : 0,
      chip: chipEl ? chipEl.textContent : '', chipPx: chipEl ? parseFloat(getComputedStyle(chipEl).fontSize) : 0,
      glyphPx: glyphEl ? Math.round(glyphEl.getBoundingClientRect().width) : 0,
    });
  }
  report.grid = { tiles: report.tiles.length, cols: new Set(report.tiles.map((t) => t.x)).size, rows: new Set(report.tiles.map((t) => t.y)).size };

  // Fonts: a family that is missing falls back, so text in it measures the same as in the fallback.
  const probe = (family, weight) => {
    const c = document.createElement('canvas').getContext('2d');
    const s = 'Hamburgefonstiv 0123456789 WMQ';
    c.font = weight + ' 40px monospace'; const mono = c.measureText(s).width;
    c.font = weight + " 40px '" + family + "', monospace"; const real = c.measureText(s).width;
    c.font = weight + ' 40px serif'; const serif = c.measureText(s).width;
    c.font = weight + " 40px '" + family + "', serif"; const real2 = c.measureText(s).width;
    return real !== mono && real2 !== serif && Math.abs(real - real2) < 0.01;
  };
  report.fonts = { Anton: probe('Anton', 400), Inter: probe('Inter', 600), 'IBM Plex Mono': probe('IBM Plex Mono', 700) };
  for (const [f, ok] of Object.entries(report.fonts)) if (!ok) report.bad.push('font missing: ' + f);
  report.minContrast = +report.minContrast.toFixed(3);
  document.getElementById('report').textContent = JSON.stringify(report).replace(/</g, '\\u003c');
})();
`;

function shell(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head>`
    + `<body>${body}<script type="application/json" id="report">{"pending":true}</script>`
    + `<script>document.fonts.ready.then(() => {${PAGE_SCRIPT}});</script></body></html>`;
}

export function posterPage(p) {
  const body = header(p) + leadPanel(p) + secondRow(p) + coverage(p) + strip(p) + footer(p);
  return shell(`World news ${p.header.date}`, body);
}

export function glyphSheet() {
  // 4 columns like the tile grid; each cell shows the glyph large (88 px, lime) and at tile size (36 px, white).
  const cols = 4; const gap = 12; const cellH = 196;
  const colW = (CW - gap * (cols - 1)) / cols;
  const cells = GLYPH_ORDER.map((key, i) => {
    const g = GLYPHS[key];
    const x = M + (i % cols) * (colW + gap);
    const y = 124 + Math.floor(i / cols) * (cellH + gap);
    return `<div class="abs panel" style="left:${x}px;top:${y}px;width:${colW}px;height:${cellH}px;border-radius:8px"></div>`
      + `<div class="abs" style="left:${x + (colW - 88) / 2}px;top:${y + 12}px;color:${C.lime}">${glyphSvg(key, 88)}</div>`
      + `<div class="abs" style="left:${x + colW - 46}px;top:${y + 10}px;color:${C.text}">${glyphSvg(key, 36)}</div>`
      + `<div class="abs mono t nowrap" style="left:${x}px;top:${y + 108}px;width:${colW}px;text-align:center;font-size:22px;line-height:28px">${esc(g.name.toUpperCase())}</div>`
      + `<div class="abs t" style="left:${x + 10}px;top:${y + 138}px;width:${colW - 20}px;text-align:center;font-size:16px;line-height:21px;color:${C.text2}">${esc(g.note)}</div>`;
  }).join('');
  const title = `<div class="abs anton t nowrap" style="left:${M}px;top:24px;font-size:66px;line-height:79.2px;color:${C.lime}">NEWS GLYPHS</div>`
    + `<div class="abs t nowrap" style="right:${M}px;top:58px;font-size:18px;line-height:24px;color:${C.text2};text-align:right">${GLYPH_ORDER.length} category pictograms · 88 px and tile size 36 px</div>`;
  return shell('News glyphs', title + cells);
}
