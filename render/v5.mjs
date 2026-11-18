// render/v5.mjs: model and page for the v5 poster, all computed from stories.json.
//
// Layout: header (date, weekday, counts) / lead + two secondary leads / the day-sweep strip (time axis, UTC offsets,
// every story as a numbered dot) / a 4x3 grid of icon tiles / "Also on 18 November" list / sources line.
// Stories are numbered in time order (earliest UTC first: offset descending; deep space and online last).

import { glyphFor, glyphSvg } from './glyphs.mjs';

export const TILES = 12;
export const LIST_MAX = 16;
// the 12 tiles after the three leads: cards first, then these briefs (one per region that cards miss)
export const TILE_BRIEFS = ['drc', 'boat', 'websites'];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const label = (s) => s.label_short ?? s.en.headline;

export function dateParts(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const g = (o) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).formatToParts(d).map((p) => [p.type, p.value]));
  const p = g({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const q = g({ day: 'numeric', month: 'long' });
  return { weekday: p.weekday.toUpperCase(), head: `${p.day} ${p.month} ${p.year}`.toUpperCase(), also: `${q.day} ${q.month}` };
}

export function buildModel(data) {
  const list = data.stories.map((s, i) => ({ ...s, idx: i, glyph: glyphFor(s) }));
  // time order: offset descending, no-zone stories last, ties keep list order
  const key = (s) => (s.utc_offset === null || s.utc_offset === undefined ? -99 : s.utc_offset);
  const ordered = [...list].sort((a, b) => key(b) - key(a) || a.idx - b.idx);
  ordered.forEach((s, i) => { s.n = i + 1; });
  const lead = list.find((s) => s.lead) ?? list.find((s) => s.tier === 'hero');
  const seconds = list.filter((s) => s !== lead && s.tier === 'hero').slice(0, 2);
  const cards = list.filter((s) => s.tier === 'card');
  const briefsPicked = TILE_BRIEFS.map((id) => list.find((s) => s.id === id)).filter(Boolean);
  const tiles = [...cards, ...briefsPicked].slice(0, TILES).sort((a, b) => a.n - b.n);
  const shown = new Set([lead, ...seconds, ...tiles]);
  const rest = list.filter((s) => !shown.has(s)).sort((a, b) => a.n - b.n);
  const geo = new Set(list.map((s) => s.region).filter((r) => r !== 'SPACE' && r !== 'ONLINE'));
  const extra = ['SPACE', 'ONLINE'].filter((r) => list.some((s) => s.region === r));
  const d = dateParts(data.meta.date_iso);
  return {
    date: d, lead, seconds, tiles, rest, all: ordered, regions: data.regions,
    header: {
      count: `${list.length} STORIES · ${geo.size} REGIONS · ONE DAY`,
      sub: extra.length ? `+ ${extra.map((r) => data.regions[r].en.toLowerCase()).join(' and ').toUpperCase()}` : '',
    },
    footer: `Every story dated ${d.also} ${data.meta.date_iso.slice(0, 4)}, checked against: ${data.meta.sources_footer.join(' · ')}`,
    also: data.meta.en.also,
  };
}

// ---- strip geometry ----
const AX0 = 36; const AXW = 840; const HOUR = AXW / 22; // offsets +12 (left) .. -10 (right)
const xOf = (o) => AX0 + (12 - o) * HOUR;
const CITIES = [[11, 'Sydney'], [8, 'Shenzhen'], [3, 'Gulf'], [0, 'London'], [-5, 'New York'], [-8, 'L.A.'], [-10, 'Cook Is.']];
const fmtOff = (o) => (o === 0 ? 'UTC+0' : `UTC${o > 0 ? '+' : '−'}${Math.abs(o)}`);

function strip(m) {
  const groups = new Map();
  for (const s of m.all) {
    if (s.utc_offset === null || s.utc_offset === undefined) continue;
    groups.set(s.utc_offset, [...(groups.get(s.utc_offset) ?? []), s]);
  }
  const dots = [];
  for (const [o, g] of groups) {
    const two = g.length > 3;
    const rowsN = two ? Math.ceil(g.length / 2) : g.length;
    g.forEach((s, i) => {
      const c = two ? i % 2 : 0; const r = two ? Math.floor(i / 2) : i;
      const x = xOf(o) + (two ? (c ? 10 : -10) : 0) - 10;
      dots.push(`<i class="dot pd" style="left:${x}px;bottom:${46 + r * 22}px;background:${m.regions[s.region].colour}">${s.n}</i>`);
    });
    if (rowsN > 3) throw new Error(`too many dots in zone ${o}`);
  }
  const ticks = [];
  for (let o = 12; o >= -10; o--) ticks.push(`<b class="tick" style="left:${xOf(o) - 0.5}px"></b>`);
  const cities = CITIES.map(([o, c]) => `<span class="city" style="left:${xOf(o) - 50}px"><b>${esc(c)}</b><u>${fmtOff(o)}</u></span>`).join('');
  const noz = m.all.filter((s) => s.utc_offset === null || s.utc_offset === undefined)
    .map((s) => `<span class="nz"><i class="dot st" style="background:${m.regions[s.region].colour}">${s.n}</i>${esc(m.regions[s.region].en)}</span>`).join('');
  return `<section class="strip"><div class="sh"><b>THE DAY SWEEPS WEST</b><span>Each dot is a story, placed by its time zone · day begins at the date line</span></div>`
    + `<div class="plot"><i class="zero" style="left:${xOf(0)}px"></i><i class="axis"></i>${ticks.join('')}${dots.join('')}${cities}</div>`
    + `<div class="nzbox"><em>NO ZONE</em>${noz}</div></section>`;
}

function chip(m, s, cls = '') { return `<span class="chip ${cls}" style="background:${m.regions[s.region].colour}">${esc(m.regions[s.region].en)}</span>`; }
const num = (m, s) => `<i class="dot nb" style="background:${m.regions[s.region].colour}">${s.n}</i>`;
const col = (m, s) => m.regions[s.region].colour;

export function posterPage(m) {
  const L = m.lead;
  const lead = L ? `<section class="lead" style="border-color:${col(m, L)}"><div class="lt"><div class="row">${num(m, L)}${chip(m, L)}<span class="place">${esc(L.place)}</span></div>`
    + `<h1 class="fit" data-max="60" data-min="44" style="color:${col(m, L)}">${esc(label(L)).toUpperCase()}</h1>`
    + `<p class="fit" data-max="18" data-min="16">${esc(L.en.line)}</p></div><div class="lg" style="color:${col(m, L)}">${glyphSvg(L.glyph, 104)}</div></section>` : '';
  const sec = m.seconds.map((s) => `<article class="sec" style="border-color:${col(m, s)}"><div class="row">${num(m, s)}${chip(m, s)}<span class="gl" style="color:${col(m, s)}">${glyphSvg(s.glyph, 30)}</span></div>`
    + `<h2 class="fit" data-max="22" data-min="18">${esc(label(s))}</h2></article>`).join('');
  const tiles = m.tiles.map((s) => `<article class="tile" style="border-color:${col(m, s)}"><div class="row">${num(m, s)}${chip(m, s)}<span class="gl" style="color:${col(m, s)}">${glyphSvg(s.glyph, 32)}</span></div>`
    + `<h3 class="fit" data-max="17" data-min="16">${esc(label(s))}</h3></article>`).join('');
  const rest = m.rest.map((s) => `<li>${num(m, s)}<span class="fit1" data-max="14" data-min="13">${esc(s.en.headline)}</span></li>`).join('');
  const css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1024px;height:1024px;overflow:hidden;background:#eef1f5;color:#14202e;font-family:Inter,sans-serif}
body{padding:14px 20px 0;position:relative}
header{display:flex;justify-content:space-between;align-items:flex-end;height:92px;border-bottom:3px solid #14202e;padding-bottom:6px}
header .date{font-family:Anton,sans-serif;font-size:80px;line-height:1;letter-spacing:1px;color:#14202e;white-space:nowrap}
header .r{text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:700}
header .wd{font-size:24px;letter-spacing:4px;color:#14202e}
header .ct{font-size:17px;white-space:nowrap;margin-top:6px;color:#1a4f9f}
header .sb{font-size:14px;margin-top:2px;color:#3b4654}
.row{display:flex;align-items:center;gap:7px}
.dot{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;color:#fff;font:700 13px/1 Inter,sans-serif;font-style:normal;position:absolute}
.nb,.row .dot,li .dot{position:static;flex:none}
.pd{width:20px;height:20px}
.chip{display:inline-block;padding:3px 8px;border-radius:5px;color:#fff;font:700 13px/16px 'IBM Plex Mono',monospace;letter-spacing:.5px;white-space:nowrap}
.gl{margin-left:auto;display:flex}
.place{font-size:14px;font-weight:600;color:#3b4654}
.lead,.sec,.tile{background:#fff;border-left:6px solid;border-radius:8px;box-shadow:0 1px 0 #cfd6df}
.top{display:grid;grid-template-columns:640px 1fr;gap:10px;margin-top:8px;height:202px}
.lead{display:flex;padding:10px 12px;gap:6px}
.lt{flex:1;min-width:0;display:flex;flex-direction:column}
.lead h1{font-family:Anton,sans-serif;font-weight:400;font-size:56px;line-height:1.02;margin:14px 0 8px;height:66px;white-space:nowrap}
.lead p{font-size:17px;line-height:1.3;height:66px;color:#26323f;font-weight:500}
.lg{display:flex;align-items:center}
.secs{display:grid;grid-template-rows:1fr 1fr;gap:10px}
.sec{padding:7px 10px}
.sec h2{font-size:21px;line-height:1.15;font-weight:800;margin-top:4px;height:49px;color:#14202e}
.strip{position:relative;margin-top:8px;height:146px;background:#fff;border-radius:8px;box-shadow:0 1px 0 #cfd6df}
.sh{position:absolute;left:12px;top:6px;display:flex;gap:12px;align-items:baseline;font-size:14px;color:#3b4654}
.sh b{font:400 20px Anton,sans-serif;letter-spacing:1px;color:#14202e}
.plot{position:absolute;left:0;top:0;width:930px;height:146px}
.axis{position:absolute;left:36px;width:840px;bottom:42px;height:2px;background:#14202e}
.tick{position:absolute;bottom:38px;width:1px;height:8px;background:#14202e}
.zero{position:absolute;bottom:42px;top:36px;border-left:2px dashed #14202e;opacity:.35}
.city{position:absolute;bottom:2px;width:100px;text-align:center;line-height:17px}
.city b{display:block;font-size:15px;font-weight:700;color:#14202e}
.city u{display:block;text-decoration:none;font-size:13px;color:#3b4654}
.nzbox{position:absolute;right:8px;top:34px;width:84px;font-size:13px;font-weight:700;line-height:15px;color:#14202e}
.nzbox em{display:block;font-style:normal;font-size:13px;color:#3b4654;margin-bottom:4px;letter-spacing:.3px}
.nz{display:flex;align-items:center;gap:5px;margin:4px 0;font-size:13px}
.nz .dot{position:static}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
.tile{padding:6px 9px;height:87px}
.tile h3{font-size:17px;line-height:1.2;font-weight:800;margin-top:6px;height:41px;color:#14202e}
.also{margin-top:8px}
.also h4{font:400 20px Anton,sans-serif;letter-spacing:1px;color:#14202e;margin-bottom:4px}
.also ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;grid-auto-flow:column;grid-template-rows:repeat(8,22px);column-gap:20px}
.also li{display:flex;align-items:center;gap:8px;min-width:0}
.also li .dot{width:20px;height:20px}
.also li span{white-space:nowrap;font-size:14px;font-weight:600;color:#14202e}
footer{position:absolute;left:0;right:0;bottom:0;height:44px;background:#14202e;color:#e6ebf2;font-size:13px;font-weight:500;line-height:19px;padding:3px 20px}
.fit{overflow:hidden}`;
  const script = `
(async()=>{
await document.fonts.ready;
const bad=[];const fits=[];
const lum=(c)=>{const v=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
for(const el of document.querySelectorAll('.fit,.fit1')){
  const max=+el.dataset.max,min=+el.dataset.min;let px=max;el.style.fontSize=px+'px';
  const ov=()=>el.classList.contains('fit1')?el.getBoundingClientRect().width>el.parentElement.clientWidth-30:(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1);
  while(ov()&&px>min){px-=0.5;el.style.fontSize=px+'px';}
  if(ov())bad.push('overflow: '+el.textContent.slice(0,50));
  fits.push({text:el.textContent.slice(0,40),px});
}
let minFont=99;const contrast=[];
const bgOf=(e)=>{for(let n=e;n;n=n.parentElement){const b=getComputedStyle(n).backgroundColor;if(!b.startsWith('rgba(0, 0, 0, 0')&&b!=='transparent')return b}return 'rgb(255,255,255)'};
for(const el of document.querySelectorAll('body *')){
  if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  const cs=getComputedStyle(el);const px=parseFloat(cs.fontSize);minFont=Math.min(minFont,px);
  const fg=cs.color,bg=bgOf(el);const l1=lum(fg),l2=lum(bg);const r=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  const large=px>=24||(px>=18.66&&+cs.fontWeight>=700);const need=large?3:4.5;
  contrast.push({text:el.textContent.trim().slice(0,30),px,fg,bg,ratio:+r.toFixed(2),need,pass:r>=need});
  if(r<need)bad.push('contrast '+r.toFixed(2)+': '+el.textContent.trim().slice(0,30));
  if(px<13)bad.push('type under 13px: '+el.textContent.trim().slice(0,30));
  const b=el.getBoundingClientRect();if(b.right>1024.5||b.bottom>1024.5||b.left<-.5)bad.push('off canvas: '+el.textContent.trim().slice(0,30));
}
// overlap: leaf text boxes must not intersect each other
const leaves=[...document.querySelectorAll('body *')].filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
const rect=(el)=>{const r=document.createRange();r.selectNodeContents(el);return r.getBoundingClientRect()};
for(let i=0;i<leaves.length;i++)for(let j=i+1;j<leaves.length;j++){
  if(leaves[i].contains(leaves[j])||leaves[j].contains(leaves[i]))continue;
  const a=rect(leaves[i]),b=rect(leaves[j]);
  if(a.width&&b.width&&a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)bad.push('overlap: '+leaves[i].textContent.slice(0,25)+' / '+leaves[j].textContent.slice(0,25));
}
const fonts={Anton:document.fonts.check('40px Anton'),Inter:document.fonts.check('700 16px Inter'),'IBM Plex Mono':document.fonts.check('700 13px "IBM Plex Mono"')};
for(const [f,ok] of Object.entries(fonts))if(!ok)bad.push('font missing '+f);
const tiles=[...document.querySelectorAll('.tile h3')].map(e=>({px:parseFloat(getComputedStyle(e).fontSize),lines:Math.round(e.scrollHeight/parseFloat(getComputedStyle(e).lineHeight))}));
for(const t of tiles)if(t.px<16||t.lines>2)bad.push('tile headline '+JSON.stringify(t));
const lastBottom=Math.max(...[...document.querySelectorAll('.also li')].map(e=>e.getBoundingClientRect().bottom));
if(lastBottom>document.querySelector('footer').getBoundingClientRect().top)bad.push('list runs into footer');
document.getElementById('report').textContent=JSON.stringify({bad,fits,minFont,minContrast:Math.min(...contrast.map(c=>c.ratio)),contrast,fonts,tiles:tiles.length});
})();`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(m.date.head)}</title><style>${css}</style></head><body>
<header><div class="date">${esc(m.date.head)}</div><div class="r"><div class="wd">${esc(m.date.weekday)}</div><div class="ct">${esc(m.header.count)}</div><div class="sb">${esc(m.header.sub)}</div></div></header>
<div class="top">${lead}<div class="secs">${sec}</div></div>
${strip(m)}
<div class="grid">${tiles}</div>
<section class="also"><h4>ALSO ON ${esc(m.date.also.toUpperCase())}</h4><ul>${rest}</ul></section>
<footer>${esc(m.footer)}</footer>
<script type="application/json" id="report">{"pending":true}</script><script>${script}</script></body></html>`;
}
