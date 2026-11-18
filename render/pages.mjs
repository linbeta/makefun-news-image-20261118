// render/pages.mjs: turns stories.json into HTML pages for headless Chrome.
//
//   squarePage(data, 'en' | 'zh') -> 1024x1024 front page (the English one is the entry)
//   portraitPage(data)            -> 1080-wide bilingual page for phones (English, then Traditional Chinese)
//
// Every text box that could overflow carries class "fit"; a small script in the page shrinks its type until it fits
// and records anything that still overflows in <body data-report>, which render-entry.mjs reads back and fails on.

import { ICONS, SCENES } from './art.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// A headline may hold '|' to mark a preferred line break (used for Chinese, which otherwise breaks anywhere).
const headline = (s, lang) => esc(s[lang].headline).replace(/\|/g, '<wbr>');
const plain = (s, lang) => esc(s[lang].headline.replace(/\|/g, ''));

const FONTS = {
  en: { head: "'Oswald', sans-serif", body: "'Inter', sans-serif", tight: "'Inter Tight', 'Inter', sans-serif" },
  zh: { head: "'Noto Sans CJK TC', sans-serif", body: "'Noto Sans CJK TC', sans-serif", tight: "'Noto Sans CJK TC', sans-serif" },
};

// Number every story by its position, and attach its region record.
export function prepare(data) {
  const stories = data.stories.map((s, i) => {
    const region = data.regions[s.region];
    if (!region) throw new Error(`story ${s.id}: unknown region ${s.region}`);
    if (s.tier !== 'brief' && s.tier !== 'hero' && !ICONS[s.icon]) throw new Error(`story ${s.id}: no pictogram named ${s.icon}`);
    if (s.tier === 'hero' && !SCENES[s.icon]) throw new Error(`story ${s.id}: no hero scene named ${s.icon}`);
    for (const lang of ['en', 'zh']) if (!s[lang] || !s[lang].headline) throw new Error(`story ${s.id}: missing ${lang} headline`);
    return { ...s, n: i + 1, colour: region.colour, regionName: { en: region.en, zh: region.zh } };
  });
  const tiers = { hero: [], card: [], brief: [] };
  for (const s of stories) tiers[s.tier].push(s);
  return { meta: data.meta, regions: data.regions, stories, ...tiers };
}

const breadth = (d, lang) => d.meta[lang].breadth.replace('{n}', String(d.stories.length));

// ---- The day-sweep strip: the day travels west from the date line; numbers sit in their story's time zone. ----

const CITIES = [
  [11, 'Sydney', '雪梨'], [8, 'Shenzhen', '深圳'], [5.5, 'Delhi', '德里'],
  [3, 'Gulf', '波斯灣'], [0, 'London', '倫敦'], [-5, 'New York', '紐約'], [-8, 'L.A.', '洛杉磯'], [-10, 'Cook Is.', '庫克群島'],
];

export function sweepSvg(d, lang, { width, height, r, label, extraW }) {
  const F = FONTS[lang];
  const axisL = 34, axisR = width - extraW - 10; // offset +14 at axisL, -12 at axisR
  const X = (off) => axisL + ((14 - off) / 26) * (axisR - axisL);
  const baseY = height - label - 6;
  const rows = 3;
  const step = r * 2 + 2;
  const placed = [];
  const out = [];
  const lines = [];
  const onStrip = d.stories.filter((s) => s.utc_offset !== null && s.utc_offset !== undefined);
  for (const s of onStrip) {
    const x0 = X(s.utc_offset);
    let spot = null;
    for (let k = 0; k < 12 && !spot; k++) {
      const dx = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
      for (let row = 0; row < rows && !spot; row++) {
        const x = x0 + dx;
        if (x - r < axisL - 26 || x + r > axisR + 4) continue;
        if (!placed.some((p) => p.row === row && Math.abs(p.x - x) < step)) spot = { x, row };
      }
    }
    if (!spot) throw new Error(`sweep strip: no room for story ${s.n}`);
    placed.push(spot);
    const y = baseY - r - 3 - spot.row * step;
    lines.push(`<line x1="${x0.toFixed(1)}" y1="${baseY}" x2="${spot.x.toFixed(1)}" y2="${(y + r).toFixed(1)}" stroke="${s.colour}" stroke-width="1.2" opacity=".55"/>`);
    out.push(`<circle cx="${spot.x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${s.colour}" stroke="#fff" stroke-width="1.5"/><text x="${spot.x.toFixed(1)}" y="${(y + r * 0.42).toFixed(1)}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="${(r * 1.15).toFixed(1)}" fill="#fff">${s.n}</text>`);
  }
  // Hour ticks and a dawn-to-dusk band.
  const ticks = [];
  for (let off = 14; off >= -12; off--) ticks.push(`<line x1="${X(off).toFixed(1)}" y1="${baseY}" x2="${X(off).toFixed(1)}" y2="${baseY + (off % 6 === 0 ? 6 : 3)}" stroke="#7d8796" stroke-width="1"/>`);
  const cities = CITIES.map(([off, en, zh]) => `<text x="${X(off).toFixed(1)}" y="${baseY + label}" text-anchor="middle" font-family="${lang === 'en' ? 'Inter' : 'Noto Sans CJK TC'}" font-weight="700" font-size="${(label * 0.82).toFixed(1)}" fill="#46505e">${esc(lang === 'en' ? en : zh)}</text>`).join('');
  const offOnes = d.stories.filter((s) => s.utc_offset === null || s.utc_offset === undefined);
  const extras = offOnes.map((s, i) => {
    const x = width - extraW + 6 + r;
    const y = baseY - r - 3 - i * (step + 4);
    const name = s.region === 'SPACE' ? d.meta[lang].space : d.meta[lang].online;
    return `<circle cx="${x}" cy="${y.toFixed(1)}" r="${r}" fill="${s.colour}"/><text x="${x}" y="${(y + r * 0.42).toFixed(1)}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="${(r * 1.15).toFixed(1)}" fill="#fff">${s.n}</text>
      <text x="${x + r + 4}" y="${(y + r * 0.38).toFixed(1)}" font-family="${lang === 'en' ? 'Inter' : 'Noto Sans CJK TC'}" font-weight="800" font-size="${(label * 0.78).toFixed(1)}" fill="${s.colour}">${esc(name)}</text>`;
  }).join('');
  const sunX = 14, sunY = baseY - 2 * step;
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="dawn-${lang}" x1="0" x2="1"><stop offset="0" stop-color="#fff1c1"/><stop offset=".55" stop-color="#e8f0fb"/><stop offset="1" stop-color="#c9d3e6"/></linearGradient></defs>
    <rect x="${axisL - 26}" y="${baseY - rows * step - 6}" width="${axisR - axisL + 30}" height="${rows * step + 6}" rx="6" fill="url(#dawn-${lang})"/>
    <line x1="${axisL - 26}" y1="${baseY}" x2="${axisR + 4}" y2="${baseY}" stroke="#46505e" stroke-width="2"/>
    <polygon points="${axisR + 4},${baseY - 5} ${axisR + 12},${baseY} ${axisR + 4},${baseY + 5}" fill="#46505e"/>
    ${ticks.join('')}
    <g transform="translate(${sunX} ${sunY})">${Array.from({ length: 8 }, (_, i) => { const a = (i * 45 * Math.PI) / 180; return `<line x1="${(Math.cos(a) * 8).toFixed(1)}" y1="${(Math.sin(a) * 8).toFixed(1)}" x2="${(Math.cos(a) * 12).toFixed(1)}" y2="${(Math.sin(a) * 12).toFixed(1)}" stroke="#f4a100" stroke-width="2.4" stroke-linecap="round"/>`; }).join('')}<circle r="6.5" fill="#ffb703"/></g>
    ${cities}
    ${lines.join('')}
    ${out.join('')}
    ${extras}
  </svg>`;
}

// ---- Shared page script: shrink type in .fit boxes until they fit, then report. ----

const FIT_SCRIPT = `
<script>
  (function () {
    var bad = [];
    var boxes = document.querySelectorAll('.fit');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var kids = box.querySelectorAll('[data-fs]');
      var scale = 1, guard = 0;
      var over = function () { return box.scrollHeight > box.clientHeight + 1 || box.scrollWidth > box.clientWidth + 1; };
      while (over() && guard++ < 40) {
        scale *= 0.97;
        for (var k = 0; k < kids.length; k++) kids[k].style.fontSize = (parseFloat(kids[k].dataset.fs) * scale).toFixed(2) + 'px';
      }
      box._scale = scale;
      if (scale < 0.999) box.setAttribute('data-shrunk', scale.toFixed(3));
      if (over()) bad.push(box.id || box.className);
      if (scale < 0.8) bad.push((box.id || box.className) + ' shrunk to ' + scale.toFixed(2));
    }
    // Boxes in the same data-group share the smallest scale, so a list keeps one type size.
    var groups = {};
    for (var g = 0; g < boxes.length; g++) {
      var name = boxes[g].getAttribute('data-group');
      if (name) groups[name] = Math.min(groups[name] || 1, boxes[g]._scale);
    }
    for (var h = 0; h < boxes.length; h++) {
      var gn = boxes[h].getAttribute('data-group');
      if (!gn) continue;
      var ks = boxes[h].querySelectorAll('[data-fs]');
      for (var q = 0; q < ks.length; q++) ks[q].style.fontSize = (parseFloat(ks[q].dataset.fs) * groups[gn]).toFixed(2) + 'px';
    }
    // Geometry: every [data-within] element must sit wholly inside its container and clear of the footer;
    // [data-block] elements must not overlap one another and must stay on the page when the page has a fixed height.
    var R = function (el) { return el.getBoundingClientRect(); };
    var foot = document.getElementById('foot');
    var fr = foot ? R(foot) : null;
    var hits = function (a, b) { return a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5; };
    var inner = document.querySelectorAll('[data-within]');
    for (var w = 0; w < inner.length; w++) {
      var el = inner[w], box2 = document.getElementById(el.getAttribute('data-within'));
      var label = el.id || el.className;
      if (!box2) { bad.push(label + ': no container ' + el.getAttribute('data-within')); continue; }
      var a = R(el), c = R(box2);
      if (a.height < 1 || a.width < 1) bad.push(label + ' is not displayed');
      if (a.top < c.top - 0.5 || a.bottom > c.bottom + 0.5 || a.left < c.left - 0.5 || a.right > c.right + 0.5)
        bad.push(label + ' falls outside #' + box2.id + ' (top ' + a.top.toFixed(1) + ', bottom ' + a.bottom.toFixed(1) + ' vs ' + c.top.toFixed(1) + '-' + c.bottom.toFixed(1) + ')');
      if (fr && hits(a, fr)) bad.push(label + ' runs under the footer');
    }
    var blocks = document.querySelectorAll('[data-block]');
    var fixedH = document.body.getAttribute('data-fixed-height');
    for (var b1 = 0; b1 < blocks.length; b1++) {
      var r1 = R(blocks[b1]);
      if (fixedH && (r1.bottom > +fixedH + 0.5 || r1.top < -0.5)) bad.push(blocks[b1].id + ' leaves the page');
      for (var b2 = b1 + 1; b2 < blocks.length; b2++) if (hits(r1, R(blocks[b2]))) bad.push(blocks[b1].id + ' overlaps ' + blocks[b2].id);
    }
    document.body.setAttribute('data-report', JSON.stringify({ height: Math.ceil(document.documentElement.scrollHeight), bad: bad }));
  })();
</script>`;

const fs = (px) => `data-fs="${px}" style="font-size:${px}px"`;

// ---- 1024 x 1024 front page ----

export function squarePage(raw, lang) {
  const d = prepare(raw);
  const M = d.meta[lang];
  const F = FONTS[lang];
  const zh = lang === 'zh';
  const W = 1024, PAD = 12, GAP = 8;
  const colW = (W - 2 * PAD - 2 * GAP) / 3;
  // Vertical plan, top to bottom. Every block's top follows from the one above; the brief list must end above the footer.
  const MAST = 150, BAND = 36, HERO = 232, CARD = 96, SWEEP = 82, FOOT = 26;
  const ROW = 19, LIST_HEAD = 20, LIST_GAP = 4;
  const perCol = Math.ceil(d.brief.length / 3);
  const heroTop = MAST + BAND + GAP;
  const cardsTop = heroTop + HERO + GAP;
  const cardsH = 3 * CARD + 2 * GAP;
  const sweepTop = cardsTop + cardsH + GAP;
  const alsoTop = sweepTop + SWEEP + GAP;
  const alsoH = LIST_HEAD + LIST_GAP + perCol * ROW;
  const footTop = W - FOOT;
  if (alsoTop + alsoH > footTop - 2) throw new Error(`square page: ${d.brief.length} briefs need ${alsoTop + alsoH}px but the footer starts at ${footTop}px; trim the list or the blocks above`);
  if (d.hero.length !== 3 || d.card.length !== 9) throw new Error('square page: needs exactly 3 heroes and 9 cards');

  const hero = (s, i) => `
    <div class="hero" style="left:${PAD + i * (colW + GAP)}px;--c:${s.colour}" id="herobox-${s.n}" data-within="heroes">
      <svg class="scene" viewBox="0 0 330 110" preserveAspectRatio="xMidYMid slice">${SCENES[s.icon](s.colour, lang)}</svg>
      <div class="tab">${esc(s.regionName[lang])}</div>
      <div class="badge big">${s.n}</div>
      <div class="htext fit" id="hero-${s.n}">
        <div class="kick" ${fs(zh ? 13 : 12.5)}>${esc(s[lang].kicker)}</div>
        <div class="hl" ${fs(zh ? 25 : 27)}>${headline(s, lang)}</div>
        <div class="ln" ${fs(zh ? 14 : 13.5)}>${esc(s[lang].line)}</div>
      </div>
    </div>`;

  const card = (s, i) => `
    <div class="card" style="left:${PAD + (i % 3) * (colW + GAP)}px;top:${(Math.floor(i / 3)) * (CARD + GAP)}px;--c:${s.colour}" id="cardbox-${s.n}" data-within="cards">
      <div class="ic"><svg viewBox="0 0 120 120" width="74" height="74">${ICONS[s.icon](s.colour)}</svg><div class="badge">${s.n}</div></div>
      <div class="ctext fit" id="card-${s.n}">
        <div class="kick" ${fs(zh ? 12 : 11.5)}>${esc(s[lang].kicker)}</div>
        <div class="hl" ${fs(zh ? 19 : 21)}>${headline(s, lang)}</div>
        <div class="ln" ${fs(zh ? 13 : 12.5)}>${esc(s[lang].line)}</div>
      </div>
    </div>`;

  const cols = [0, 1, 2].map((c) => d.brief.slice(c * perCol, (c + 1) * perCol));
  const brief = (s) => `<div class="bi fit" data-group="brief" data-within="also" id="brief-${s.n}"><span class="bn" style="background:${s.colour}">${s.n}</span><span class="bt" ${fs(13.5)}>${plain(s, lang)}</span></div>`;
  const legend = Object.entries(d.regions)
    .filter(([k]) => d.stories.some((s) => s.region === k))
    .map(([, r]) => `<span class="lg"><i style="background:${r.colour}"></i>${esc(r[lang])}</span>`).join('');

  const sweepW = W - 2 * PAD - 200;
  return `<!doctype html>
<html lang="${zh ? 'zh-Hant-TW' : 'en'}"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${W}px; overflow: hidden; }
  body { background: #e6eaf0; font-family: ${F.body}; color: #141414; position: relative; }
  .mast { position: absolute; left: 0; top: 0; width: ${W}px; height: ${MAST}px; background: #10192b; color: #fff; padding: 10px 26px 0; }
  .mast .row { display: flex; justify-content: space-between; align-items: baseline; height: 34px; }
  .mast .wd { font-family: ${F.head}; font-weight: 700; font-size: ${zh ? 28 : 30}px; letter-spacing: ${zh ? 4 : 7}px; color: #ffc93c; line-height: 1; }
  .mast .tag { font-family: ${F.body}; font-weight: 800; font-size: ${zh ? 17 : 15}px; letter-spacing: ${zh ? 3 : 2}px; color: #c6cfdd; }
  .mast .date { font-family: ${F.head}; font-weight: 700; line-height: 1; white-space: nowrap; margin-top: ${zh ? 2 : 0}px; letter-spacing: ${zh ? 2 : 1}px; }
  .band { position: absolute; left: 0; top: ${MAST}px; width: ${W}px; height: ${BAND}px; background: #ffc93c; color: #10192b; display: flex; align-items: center; padding: 0 16px 0 26px; gap: 18px; }
  .band .br { font-family: ${F.head}; font-weight: 700; font-size: ${zh ? 19 : 21}px; letter-spacing: ${zh ? 2 : 1}px; white-space: nowrap; }
  .band .note { font-weight: 700; font-size: ${zh ? 12.5 : 12}px; line-height: 1.2; color: #10192b; flex: 1; }
  .heroes { position: absolute; top: ${heroTop}px; left: 0; width: ${W}px; height: ${HERO}px; }
  .hero { position: absolute; top: 0; width: ${colW}px; height: ${HERO}px; background: #fff; border-radius: 8px; overflow: hidden; border-bottom: 5px solid var(--c); }
  .hero .scene { display: block; width: ${colW}px; height: 104px; }
  .tab { position: absolute; left: 0; top: 0; background: var(--c); color: #fff; font-weight: 800; font-size: ${zh ? 13 : 11.5}px; letter-spacing: ${zh ? 2 : 1.5}px; padding: 3px 10px 3px 10px; border-bottom-right-radius: 8px; }
  .badge { position: absolute; width: 24px; height: 24px; border-radius: 50%; background: var(--c); color: #fff; font-family: 'Oswald'; font-weight: 700; font-size: 14px; line-height: 24px; text-align: center; border: 2px solid #fff; }
  .badge.big { width: 38px; height: 38px; line-height: 34px; font-size: 22px; left: 10px; top: 84px; border-width: 3px; }
  .htext { position: absolute; left: 0; top: 104px; right: 0; bottom: 0; padding: 7px 12px 4px 54px; overflow: hidden; }
  .htext .kick, .ctext .kick { font-weight: 800; letter-spacing: ${zh ? 1.5 : 1.2}px; color: var(--c); line-height: 1.25; white-space: nowrap; }
  ${zh ? '.hl { word-break: keep-all; }' : ''}
  .htext .hl { text-wrap: balance; font-family: ${F.head}; font-weight: 700; line-height: ${zh ? 1.18 : 1.05}; margin-top: 2px; color: #111; }
  .htext .ln { font-weight: ${zh ? 400 : 600}; line-height: ${zh ? 1.4 : 1.28}; color: #333; margin-top: 4px; }
  .cards { position: absolute; top: ${cardsTop}px; left: 0; width: ${W}px; height: ${cardsH}px; }
  .card { position: absolute; width: ${colW}px; height: ${CARD}px; background: #fff; border-radius: 8px; border-left: 8px solid var(--c); display: flex; align-items: center; padding-left: 8px; }
  .card .ic { position: relative; flex: 0 0 74px; height: 74px; }
  .card .ic .badge { left: -9px; top: -9px; }
  .ctext { flex: 1; height: ${CARD - 6}px; padding: 0 8px 0 10px; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
  .ctext .hl { text-wrap: balance; font-family: ${F.head}; font-weight: 700; line-height: ${zh ? 1.2 : 1.05}; color: #111; margin-top: 1px; }
  .ctext .ln { font-weight: ${zh ? 400 : 600}; line-height: ${zh ? 1.35 : 1.25}; color: #3a3a3a; margin-top: 3px; }
  .sweep { position: absolute; top: ${sweepTop}px; left: ${PAD}px; width: ${W - 2 * PAD}px; height: ${SWEEP}px; background: #fff; border-radius: 8px; display: flex; overflow: hidden; }
  .sweep .sl { flex: 0 0 200px; height: ${SWEEP}px; overflow: hidden; background: #10192b; color: #fff; padding: 6px 10px 4px 12px; }
  .sweep .st { font-family: ${F.head}; font-weight: 700; font-size: ${zh ? 18 : 20}px; letter-spacing: 1px; color: #ffc93c; line-height: 1.05; }
  .sweep .ss { font-size: ${zh ? 10.5 : 10}px; line-height: 1.25; color: #d5dbe5; margin-top: 3px; font-weight: 500; }
  .also { position: absolute; top: ${alsoTop}px; left: ${PAD}px; width: ${W - 2 * PAD}px; height: ${alsoH}px; }
  .also .ah { display: flex; align-items: center; justify-content: space-between; height: ${LIST_HEAD}px; border-bottom: 2px solid #10192b; }
  .also .at { font-family: ${F.head}; font-weight: 700; font-size: ${zh ? 15 : 16}px; letter-spacing: 1.5px; color: #10192b; }
  .lg { font-weight: 800; font-size: ${zh ? 11 : 10}px; letter-spacing: 1px; color: #333; margin-left: 10px; white-space: nowrap; }
  .lg i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: -1px; }
  .acols { display: flex; gap: 10px; margin-top: ${LIST_GAP}px; }
  .acol { flex: 1; min-width: 0; }
  .bi { height: ${ROW}px; display: flex; align-items: center; white-space: nowrap; overflow: hidden; }
  .bn { flex: 0 0 auto; min-width: 22px; height: 16px; border-radius: 8px; color: #fff; font-family: 'Oswald'; font-weight: 700; font-size: 11.5px; line-height: 16px; text-align: center; margin-right: 6px; padding: 0 4px; }
  .bt { font-family: ${F.tight}; font-weight: ${zh ? 700 : 600}; color: #1b1b1b; }
  .foot { position: absolute; left: 0; top: ${footTop}px; width: ${W}px; height: ${FOOT}px; background: #10192b; color: #c9d1dd; font-size: ${zh ? 11 : 10.5}px; font-weight: 600; display: flex; align-items: center; justify-content: center; letter-spacing: .2px; white-space: nowrap; }
</style></head><body data-fixed-height="${W}">
  <div class="mast" id="mast" data-block>
    <div class="row"><div class="wd">${esc(M.weekday)}</div><div class="tag">${esc(M.tagline)}</div></div>
    <div class="date" id="date">${esc(M.date)}</div>
  </div>
  <div class="band" id="band" data-block><div class="br">${esc(breadth(d, lang))}</div><div class="note">${esc(M.note)}</div></div>
  <div class="heroes" id="heroes" data-block>${d.hero.map(hero).join('')}</div>
  <div class="cards" id="cards" data-block>${d.card.map(card).join('')}</div>
  <div class="sweep" id="sweep" data-block>
    <div class="sl fit" id="sweep-label"><div class="st" ${fs(zh ? 18 : 20)}>${esc(M.sweep_title)} →</div><div class="ss" ${fs(zh ? 10.5 : 10.5)}>${esc(M.sweep_sub)}</div></div>
    ${sweepSvg(d, lang, { width: sweepW, height: SWEEP, r: 8.5, label: 12, extraW: 108 })}
  </div>
  <div class="also" id="also" data-block>
    <div class="ah"><div class="at">${esc(M.also)}</div><div>${legend}</div></div>
    <div class="acols">${cols.map((c) => `<div class="acol">${c.map(brief).join('')}</div>`).join('')}</div>
  </div>
  <div class="foot" id="foot" data-block>${esc(M.sources_label)}: ${esc(d.meta.sources_footer.join(' · '))}</div>
  <script>
    // Fit the date line to the masthead width.
    (function () {
      var el = document.getElementById('date');
      var size = ${zh ? 104 : 118};
      el.style.fontSize = size + 'px';
      while (el.scrollWidth > ${W - 52} && size > 60) el.style.fontSize = (--size) + 'px';
    })();
  </script>
  ${FIT_SCRIPT}
</body></html>`;
}

// ---- 1080-wide bilingual portrait for phones ----

export function portraitPage(raw) {
  const d = prepare(raw);
  const W = 1080, PAD = 24;
  const inner = W - 2 * PAD;

  const section = (lang) => {
    const M = d.meta[lang];
    const F = FONTS[lang];
    const zh = lang === 'zh';
    const hero = (s) => `
      <div class="p-hero" style="--c:${s.colour}">
        <div class="p-scene"><svg viewBox="0 0 330 110" width="300" height="100">${SCENES[s.icon](s.colour, lang)}</svg><div class="p-badge big">${s.n}</div></div>
        <div class="p-htext">
          <div class="p-kick">${esc(s.regionName[lang])} · ${esc(s[lang].kicker)}</div>
          <div class="p-hl" style="font-family:${F.head}">${headline(s, lang)}</div>
          <div class="p-ln">${esc(s[lang].line)}</div>
        </div>
      </div>`;
    const card = (s) => `
      <div class="p-card" style="--c:${s.colour}" id="p-card-${lang}-${s.n}" data-within="p-cards-${lang}">
        <div class="p-ic"><svg viewBox="0 0 120 120">${ICONS[s.icon](s.colour)}</svg><div class="p-badge">${s.n}</div></div>
        <div class="p-kick">${esc(s[lang].kicker)}</div>
        <div class="p-chl" style="font-family:${F.head}">${headline(s, lang)}</div>
        <div class="p-cln">${esc(s[lang].line)}</div>
      </div>`;
    const brief = (s) => `<div class="p-bi" id="p-brief-${lang}-${s.n}" data-within="p-also-${lang}"><span class="p-bn" style="background:${s.colour}">${s.n}</span><span class="p-bt">${plain(s, lang)}</span></div>`;
    return `
    <section class="sec ${lang}" lang="${zh ? 'zh-Hant-TW' : 'en'}" style="font-family:${F.body}">
      <div class="p-mast">
        <div class="p-row"><div class="p-wd" style="font-family:${F.head}">${esc(M.weekday)}</div><div class="p-tag">${esc(M.tagline)}</div></div>
        <div class="p-date" style="font-family:${F.head}">${esc(M.date)}</div>
        <div class="p-band"><div class="p-br" style="font-family:${F.head}">${esc(breadth(d, lang))}</div><div class="p-note">${esc(M.note)}</div></div>
      </div>
      <div class="p-body">
        ${d.hero.map(hero).join('')}
        <div class="p-cards" id="p-cards-${lang}">${d.card.map(card).join('')}</div>
        <div class="p-also" id="p-also-${lang}"><div class="p-at" style="font-family:${F.head}">${esc(M.also)}</div>
          <div class="p-blist">${d.brief.map(brief).join('')}</div>
        </div>
      </div>
    </section>`;
  };

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; overflow: hidden; }
  body { background: #e6eaf0; color: #141414; }
  .sec { padding-bottom: 14px; }
  .sec.zh { border-top: 10px solid #ffc93c; }
  .p-mast { background: #10192b; color: #fff; padding: 14px ${PAD + 8}px 0; }
  .p-row { display: flex; justify-content: space-between; align-items: baseline; }
  .p-wd { font-weight: 700; font-size: 36px; letter-spacing: 8px; color: #ffc93c; line-height: 1; }
  .p-tag { font-weight: 800; font-size: 21px; letter-spacing: 2px; color: #c6cfdd; }
  .zh .p-tag { letter-spacing: 4px; font-size: 25px; }
  .p-date { font-weight: 700; font-size: 104px; line-height: 1.0; white-space: nowrap; margin-top: 2px; }
  .zh .p-date { font-size: 92px; margin: 4px 0 2px; }
  .p-band { margin: 8px -${PAD + 8}px 0; background: #ffc93c; color: #10192b; padding: 10px ${PAD + 8}px 12px; }
  .p-br { font-weight: 700; font-size: 30px; letter-spacing: 1px; line-height: 1.1; }
  .p-note { font-weight: 700; font-size: 21px; line-height: 1.3; margin-top: 3px; }
  .p-body { padding: 12px ${PAD}px 0; display: flex; flex-direction: column; gap: 10px; }
  .p-hero { background: #fff; border-radius: 12px; overflow: hidden; display: flex; border-left: 10px solid var(--c); }
  .p-scene { position: relative; flex: 0 0 300px; height: 100px; align-self: center; margin: 10px 0 10px 10px; border-radius: 8px; overflow: hidden; }
  .p-scene svg { display: block; }
  .p-badge { position: absolute; width: 32px; height: 32px; border-radius: 50%; background: var(--c); color: #fff; font-family: 'Oswald'; font-weight: 700; font-size: 19px; line-height: 28px; text-align: center; border: 3px solid #fff; left: -6px; top: -6px; }
  .p-badge.big { width: 48px; height: 48px; line-height: 42px; font-size: 28px; left: 6px; top: auto; bottom: 6px; }
  .p-htext { flex: 1; padding: 8px 14px 10px 14px; }
  .p-kick { font-weight: 800; font-size: 19px; letter-spacing: 1.2px; color: var(--c); line-height: 1.25; }
  .p-hl { font-weight: 700; font-size: 34px; line-height: 1.06; margin-top: 3px; color: #111; text-wrap: balance; }
  .zh .p-hl, .zh .p-chl { word-break: keep-all; }
  .zh .p-hl { font-size: 33px; line-height: 1.25; }
  .p-ln { font-weight: 600; font-size: 22px; line-height: 1.3; margin-top: 6px; color: #333; }
  .zh .p-ln { font-weight: 400; font-size: 23px; line-height: 1.4; }
  .p-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .p-card { background: #fff; border-radius: 12px; border-top: 8px solid var(--c); padding: 10px 14px 12px; display: grid; grid-template-columns: 52px 1fr; column-gap: 10px; align-items: center; align-content: start; }
  .p-ic { position: relative; width: 52px; height: 52px; }
  .p-ic svg { width: 52px; height: 52px; }
  .p-card .p-kick { font-size: 17px; letter-spacing: .8px; }
  .p-chl { grid-column: 1 / -1; font-weight: 700; font-size: 27px; line-height: 1.08; margin-top: 6px; color: #111; text-wrap: balance; }
  .zh .p-chl { font-size: 25px; line-height: 1.28; }
  .p-cln { grid-column: 1 / -1; font-weight: 600; font-size: 21px; line-height: 1.27; margin-top: 6px; color: #3a3a3a; }
  .zh .p-cln { font-weight: 400; font-size: 22px; line-height: 1.4; }
  .p-sweep { background: #fff; border-radius: 12px; padding: 12px 14px 8px; font-family: 'Inter', sans-serif; }
  .p-sweep.shared { margin: 0 ${PAD}px 14px; }
  .p-st { font-weight: 700; font-size: 30px; color: #10192b; letter-spacing: 1px; }
  .p-ss { font-size: 21px; line-height: 1.3; color: #46505e; margin: 2px 4px 4px; font-weight: 500; }
  .p-also { background: #fff; border-radius: 12px; padding: 10px 14px 10px; }
  .p-at { font-weight: 700; font-size: 30px; letter-spacing: 1.5px; color: #10192b; border-bottom: 3px solid #10192b; padding-bottom: 3px; margin-bottom: 4px; }
  .p-blist { display: grid; grid-template-columns: 1fr 1fr; column-gap: 18px; }
  .p-bi { display: flex; align-items: flex-start; padding: 4px 0; border-bottom: 1px solid #e3e7ee; }
  .p-bn { flex: 0 0 auto; min-width: 34px; height: 26px; border-radius: 13px; color: #fff; font-family: 'Oswald'; font-weight: 700; font-size: 18px; line-height: 26px; text-align: center; margin-right: 8px; padding: 0 5px; margin-top: 1px; }
  .p-bt { font-family: 'Inter Tight', 'Inter', sans-serif; font-weight: 600; font-size: 22px; line-height: 1.25; color: #1b1b1b; }
  .zh .p-bt { font-family: 'Noto Sans CJK TC', sans-serif; font-weight: 700; font-size: 21px; line-height: 1.35; }
  .p-foot { background: #10192b; color: #c9d1dd; font-family: 'Inter', 'Noto Sans CJK TC', sans-serif; font-size: 20px; line-height: 1.4; font-weight: 600; padding: 16px ${PAD + 8}px 18px; }
</style></head><body>
  ${section('en')}
  ${section('zh')}
  <div class="p-sweep shared">
    <div class="p-st" style="font-family:'Oswald'">${esc(d.meta.en.sweep_title)} → <span style="font-family:'Noto Sans CJK TC'">${esc(d.meta.zh.sweep_title)}</span></div>
    <div class="p-ss">${esc(d.meta.en.sweep_sub)}</div>
    <div class="p-ss" style="font-family:'Noto Sans CJK TC'">${esc(d.meta.zh.sweep_sub)}</div>
    ${sweepSvg(d, 'en', { width: inner - 28, height: 136, r: 14, label: 21, extraW: 150 })}
  </div>
  <div class="p-foot" id="foot">${esc(d.meta.en.sources_label)} / ${esc(d.meta.zh.sources_label)}: ${esc(d.meta.sources_footer.join(' · '))}</div>
  ${FIT_SCRIPT}
</body></html>`;
}
