// render/v2/art.mjs: (v2, earlier design) original pictograms drawn in code (SVG). No external images.
//
// ICONS[name](colour)  -> SVG content for a 120x120 viewBox (rounded tile), used on the numbered cards.
// SCENES[name](colour) -> SVG content for a 330x110 viewBox, used as the illustration of a hero panel.

const f1 = (n) => n.toFixed(1);

export const ICONS = {
  // Computer chip with a rising bar chart (Nvidia results).
  chip: (c) => `
    <rect width="120" height="120" rx="18" fill="#e3ecfa"/>
    <g stroke="#7f8ea6" stroke-width="4" stroke-linecap="round">
      ${[30, 42, 54, 66].map((v) => `<line x1="${v}" y1="20" x2="${v}" y2="28"/><line x1="${v}" y1="68" x2="${v}" y2="76"/><line x1="12" y1="${v - 2}" x2="20" y2="${v - 2}"/><line x1="76" y1="${v - 2}" x2="84" y2="${v - 2}"/>`).join('')}
    </g>
    <rect x="20" y="26" width="56" height="44" rx="6" fill="#2b2f36"/>
    <rect x="30" y="34" width="36" height="28" rx="3" fill="#76b900"/>
    <rect x="58" y="96" width="12" height="16" fill="${c}"/><rect x="74" y="86" width="12" height="26" fill="${c}"/><rect x="90" y="70" width="12" height="42" fill="${c}"/>
    <path d="M52 92 L80 74 L98 54" stroke="#0f9d58" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="104,44 103,62 88,52" fill="#0f9d58"/>`,

  // Voyager: dish on a boom, far from a small blue Earth, joined by a dashed signal line.
  voyager: () => `
    <rect width="120" height="120" rx="18" fill="#0b0f2a"/>
    ${[[14, 20], [40, 10], [98, 14], [108, 60], [70, 104], [30, 64], [56, 40], [90, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff" opacity=".85"/>`).join('')}
    <circle cx="18" cy="100" r="9" fill="#3a86ff"/><path d="M12 96 q5 -4 9 0 q-2 6 -7 4z" fill="#3ccf6e"/>
    <path d="M28 92 L66 58" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="4 5"/>
    <g transform="translate(80 46) rotate(-30)">
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#c9ced8" stroke-width="2.5"/>
      <rect x="22" y="-4" width="10" height="8" fill="#c9ced8"/>
      <rect x="-8" y="2" width="16" height="10" fill="#b38b4d"/>
      <path d="M-20 -6 Q0 -30 20 -6 Z" fill="#f2f4f8"/>
      <line x1="0" y1="-12" x2="0" y2="-24" stroke="#f2f4f8" stroke-width="2"/>
    </g>
    <rect x="62" y="96" width="50" height="16" rx="8" fill="#ffd166"/>
    <text x="87" y="108.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="12" fill="#0b0f2a">24 h</text>`,

  // Globe with a thermometer and an oil drop (COP31).
  climate: () => `
    <rect width="120" height="120" rx="18" fill="#dff3ec"/>
    <circle cx="50" cy="62" r="38" fill="#3a86ff"/>
    <path d="M28 40 q10 -10 22 -4 q4 10 -6 14 q-6 10 -16 6 q-6 -8 0 -16z M56 70 q12 -4 18 6 q-2 14 -14 16 q-8 -8 -4 -22z M60 30 q10 0 16 8 q-6 4 -14 0z" fill="#3ccf6e"/>
    <rect x="88" y="16" width="16" height="70" rx="8" fill="#fff" stroke="#555" stroke-width="3"/>
    <rect x="93" y="34" width="6" height="56" fill="#e63946"/>
    <circle cx="96" cy="94" r="12" fill="#e63946" stroke="#555" stroke-width="3"/>
    <path d="M22 88 q-9 13 0 20 q9 -7 0 -20z" fill="#222"/>`,

  // Document with a red SANCTIONS stamp.
  sanction: () => `
    <rect width="120" height="120" rx="18" fill="#dff1f8"/>
    <polygon points="26,12 80,12 96,28 96,108 26,108" fill="#fff" stroke="#556" stroke-width="3"/>
    <polygon points="80,12 80,28 96,28" fill="#cfd6df"/>
    ${[36, 46, 56, 88, 98].map((y) => `<rect x="36" y="${y}" width="${y > 80 ? 30 : 48}" height="4" rx="2" fill="#9aa5b4"/>`).join('')}
    <g transform="translate(62 72) rotate(-14)">
      <rect x="-40" y="-13" width="80" height="26" rx="4" fill="#fff" stroke="#d62828" stroke-width="4"/>
      <text x="0" y="6.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="17" fill="#d62828" textLength="66" lengthAdjust="spacingAndGlyphs">SANCTIONS</text>
    </g>`,

  // Open dictionary with the word "human".
  dictionary: (c) => `
    <rect width="120" height="120" rx="18" fill="#e6f4ef"/>
    <path d="M10 34 Q34 26 60 36 L60 100 Q34 90 10 98 Z" fill="#fff" stroke="#555" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 34 Q86 26 60 36 L60 100 Q86 90 110 98 Z" fill="#fff" stroke="#555" stroke-width="3" stroke-linejoin="round"/>
    <path d="M10 98 Q34 90 60 100 Q86 90 110 98 L110 104 Q86 96 60 106 Q34 96 10 104 Z" fill="${c}"/>
    <text x="35" y="62" text-anchor="middle" font-family="Noto Serif" font-weight="800" font-style="italic" font-size="16" fill="#222" textLength="40" lengthAdjust="spacingAndGlyphs">human</text>
    ${[74, 82].map((y) => `<rect x="18" y="${y}" width="34" height="3" rx="1.5" fill="#aaa"/>`).join('')}
    ${[48, 56, 64, 72, 80].map((y) => `<rect x="68" y="${y}" width="34" height="3" rx="1.5" fill="#bbb"/>`).join('')}`,

  // A white dove with an olive twig above a cracked line, and a warning sign (truce at risk).
  dove: () => `
    <rect width="120" height="120" rx="18" fill="#fff0e0"/>
    <path d="M8 96 L36 96 L42 88 L48 102 L56 90 L62 96 L112 96" stroke="#c0392b" stroke-width="4" fill="none" stroke-linejoin="round"/>
    <path d="M36 64 L12 54 L16 66 L10 74 Z" fill="#fff" stroke="#556" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="56" cy="64" rx="26" ry="14" transform="rotate(-12 56 64)" fill="#fff" stroke="#556" stroke-width="2.5"/>
    <circle cx="82" cy="50" r="10" fill="#fff" stroke="#556" stroke-width="2.5"/>
    <polygon points="91,48 101,51 91,55" fill="#f4a261"/>
    <circle cx="84" cy="48" r="2" fill="#333"/>
    <path d="M46 60 Q36 30 64 18 Q60 40 68 58 Z" fill="#fff" stroke="#556" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M98 54 Q104 64 100 76" stroke="#2d6a4f" stroke-width="2.5" fill="none"/>
    <ellipse cx="104" cy="64" rx="5" ry="2.6" transform="rotate(50 104 64)" fill="#52b788"/>
    <ellipse cx="97" cy="70" rx="5" ry="2.6" transform="rotate(-30 97 70)" fill="#52b788"/>
    <g transform="translate(94 22)">
      <polygon points="0,-14 15,12 -15,12" fill="#e46a00" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-1.8" y="-6" width="3.6" height="10" rx="1.5" fill="#fff"/><circle cx="0" cy="8" r="2" fill="#fff"/>
    </g>`,

  // A gas mask in a drifting yellow cloud (tear gas finding).
  gasmask: () => `
    <rect width="120" height="120" rx="18" fill="#e8efe4"/>
    <g fill="#e9d45a" opacity=".85">
      <circle cx="20" cy="30" r="12"/><circle cx="36" cy="22" r="14"/><circle cx="54" cy="28" r="11"/>
      <circle cx="88" cy="96" r="12"/><circle cx="104" cy="88" r="10"/><circle cx="96" cy="78" r="9"/>
    </g>
    <path d="M30 48 Q30 26 60 26 Q90 26 90 48 L90 70 Q90 92 60 98 Q30 92 30 70 Z" fill="#4a5a48"/>
    <circle cx="46" cy="54" r="11" fill="#bfe3f2" stroke="#2c3a2a" stroke-width="4"/>
    <circle cx="74" cy="54" r="11" fill="#bfe3f2" stroke="#2c3a2a" stroke-width="4"/>
    <circle cx="43" cy="51" r="3" fill="#fff"/><circle cx="71" cy="51" r="3" fill="#fff"/>
    <rect x="48" y="74" width="24" height="26" rx="6" fill="#2c3a2a"/>
    ${[80, 86, 92].map((y) => `<rect x="52" y="${y}" width="16" height="2.5" rx="1" fill="#6b7d68"/>`).join('')}
    <rect x="26" y="44" width="6" height="16" rx="2" fill="#2c3a2a"/><rect x="88" y="44" width="6" height="16" rx="2" fill="#2c3a2a"/>`,

  // A server rack with a red fault light and a padlock (classified network outage).
  outage: () => `
    <rect width="120" height="120" rx="18" fill="#e3ecfa"/>
    <rect x="18" y="16" width="56" height="88" rx="6" fill="#2b2f36"/>
    ${[24, 46, 68].map((y, i) => `<rect x="24" y="${y}" width="44" height="16" rx="3" fill="#454b55"/>
      <circle cx="31" cy="${y + 8}" r="3" fill="${i === 1 ? '#e63946' : '#4f5966'}"/>
      ${[40, 46, 52, 58].map((x) => `<rect x="${x}" y="${y + 5}" width="3" height="6" fill="#6b7480"/>`).join('')}`).join('')}
    <path d="M74 60 L86 60 L80 70 L92 70" stroke="#ffd166" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <g transform="translate(94 82)">
      <path d="M-9 -4 V-11 Q-9 -20 0 -20 Q9 -20 9 -11 V-4" stroke="#1d5fbf" stroke-width="5" fill="none"/>
      <rect x="-14" y="-5" width="28" height="22" rx="4" fill="#1d5fbf"/>
      <circle cx="0" cy="5" r="3.5" fill="#fff"/>
    </g>
    <g transform="translate(96 30)"><circle r="13" fill="#e63946"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`,

  // Cracked dry ground, a fierce sun and an empty water drop (drought).
  drought: () => `
    <rect width="120" height="120" rx="18" fill="#fdf0d8"/>
    <g transform="translate(84 32)">
      ${Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return `<line x1="${f1(Math.cos(a) * 18)}" y1="${f1(Math.sin(a) * 18)}" x2="${f1(Math.cos(a) * 26)}" y2="${f1(Math.sin(a) * 26)}" stroke="#f4a100" stroke-width="4" stroke-linecap="round"/>`; }).join('')}
      <circle r="14" fill="#ffb703"/>
    </g>
    <path d="M30 18 Q16 38 16 48 A14 14 0 0 0 44 48 Q44 38 30 18 Z" fill="none" stroke="#0a86b0" stroke-width="4" stroke-dasharray="6 4"/>
    <path d="M8 70 L112 70 L112 106 Q112 112 106 112 L14 112 Q8 112 8 106 Z" fill="#c8894a"/>
    <path d="M14 76 L30 88 L26 104 M30 88 L52 84 L60 100 M52 84 L62 74 M60 100 L84 96 L90 108 M84 96 L96 80 L108 84" stroke="#7a4b20" stroke-width="3" fill="none" stroke-linejoin="round"/>
    <path d="M70 66 q-6 -10 2 -16 q0 8 6 8 q2 -6 -2 -10 q10 6 6 18 z" fill="#e63946"/>`,
};

// ---- Hero scenes: 330x110 ----

// Number of points along one logarithmic spiral arm, for the cyclone.
function spiralArm(cx, cy, turn, a, b, steps, sx = 1) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 1.55;
    const r = a * Math.exp(b * t);
    pts.push(`${f1(cx + Math.cos(t + turn) * r * sx)},${f1(cy + Math.sin(t + turn) * r)}`);
  }
  return pts.join(' ');
}

export const SCENES = {
  // Shenzhen skyline, the APEC lectern, a container stack for trade and an AI chip.
  apec: (c) => `
    <defs><linearGradient id="sky-apec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe1d6"/><stop offset="1" stop-color="#fff4ec"/></linearGradient></defs>
    <rect width="330" height="110" fill="url(#sky-apec)"/>
    <circle cx="276" cy="30" r="15" fill="#ffb4a2"/>
    <g fill="#eab0a6">
      <rect x="8" y="58" width="16" height="40"/><rect x="26" y="44" width="14" height="54"/><rect x="42" y="62" width="18" height="36"/>
      <rect x="196" y="50" width="16" height="48"/><rect x="214" y="16" width="14" height="82"/><polygon points="214,16 221,2 228,16"/>
      <rect x="230" y="40" width="18" height="58"/><rect x="250" y="60" width="16" height="38"/><rect x="268" y="48" width="14" height="50"/>
      <rect x="284" y="66" width="18" height="32"/><rect x="304" y="54" width="18" height="44"/>
    </g>
    <rect x="0" y="96" width="330" height="14" fill="#d98c80"/>
    <g transform="translate(64 64)">
      ${[[0, 0, '#1d5fbf'], [22, 0, '#0f8a6c'], [44, 0, '#e46a00'], [11, -14, '#b07a00'], [33, -14, '#d62828']].map(([x, y, col]) => `<rect x="${x}" y="${y}" width="20" height="13" fill="${col}"/><g stroke="rgba(255,255,255,.45)" stroke-width="1.5">${[5, 10, 15].map((d) => `<line x1="${x + d}" y1="${y + 2}" x2="${x + d}" y2="${y + 11}"/>`).join('')}</g>`).join('')}
      <path d="M-6 14 L70 14 L62 30 L2 30 Z" fill="#5c677d"/>
    </g>
    <g transform="translate(165 0)">
      <path d="M0 40 q-12 -2 -14 12" stroke="#333" stroke-width="3" fill="none"/>
      <circle cx="-15" cy="54" r="4.5" fill="#333"/>
      <polygon points="-30,60 30,60 24,110 -24,110" fill="${c}"/>
      <rect x="-34" y="55" width="68" height="9" rx="2" fill="#8f1414"/>
      <text x="0" y="90" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="20" fill="#fff" letter-spacing="1">APEC</text>
      <text x="0" y="104" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="11" fill="#ffd6d6" letter-spacing="2">2026</text>
    </g>
    <g transform="translate(118 38)">
      <rect x="-14" y="-14" width="28" height="28" rx="4" fill="#2b2f36"/>
      <rect x="-8" y="-8" width="16" height="16" rx="2" fill="#ffd166"/>
      <text x="0" y="4" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="10" fill="#2b2f36">AI</text>
      <g stroke="#7f8ea6" stroke-width="2.5" stroke-linecap="round">${[-7, 0, 7].map((v) => `<line x1="${v}" y1="-14" x2="${v}" y2="-19"/><line x1="${v}" y1="14" x2="${v}" y2="19"/><line x1="-14" y1="${v}" x2="-19" y2="${v}"/><line x1="14" y1="${v}" x2="19" y2="${v}"/>`).join('')}</g>
    </g>`,

  // A schematic Gulf map: drones heading for Kuwait and Bahrain, a US strike on Qeshm.
  gulf: (c, lang = 'en') => {
    const L = lang === 'zh'
      ? { kw: '科威特', bh: '巴林', qe: '格什姆島', ir: '伊朗', gs: '海灣國家' }
      : { kw: 'KUWAIT', bh: 'BAHRAIN', qe: 'QESHM', ir: 'IRAN', gs: 'GULF STATES' };
    const burst = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><polygon points="0,-14 4,-5 13,-8 7,0 13,8 4,5 0,14 -4,5 -13,8 -7,0 -13,-8 -4,-5" fill="${c}"/><circle r="4.5" fill="#ffd166"/></g>`;
    const drone = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><polygon points="0,-9 8,5 2,3 0,7 -2,3 -8,5" fill="#e6eaf0" stroke="#8a97aa" stroke-width="1.2" stroke-linejoin="round"/></g>`;
    const label = (x, y, t, anchor = 'start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${lang === 'zh' ? 'Noto Sans CJK TC' : 'Inter'}" font-weight="${lang === 'zh' ? 700 : 800}" font-size="${lang === 'zh' ? 11 : 9.5}" letter-spacing=".8" fill="#fff">${t}</text>`;
    return `
    <rect width="330" height="110" fill="#1d3a5c"/>
    <path d="M0 0 L330 0 L330 40 C310 44 296 52 282 50 C262 46 236 34 206 28 C170 21 130 16 96 10 C70 6 50 4 40 0 Z" fill="#33445e"/>
    <path d="M0 18 C14 22 26 30 34 40 C44 52 56 60 72 66 C90 74 98 84 112 88 C122 92 130 82 140 84 C150 86 152 100 162 100 C190 96 226 92 252 84 C276 78 300 70 330 64 L330 110 L0 110 Z" fill="#4a5a43"/>
    <ellipse cx="124" cy="78" rx="4" ry="6" fill="#4a5a43"/>
    <ellipse cx="272" cy="46" rx="16" ry="3.6" transform="rotate(-12 272 46)" fill="#5b6b52" stroke="#ffd166" stroke-width="1.2"/>
    ${[[60, 8], [150, 6], [230, 12], [310, 10], [20, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#fff" opacity=".8"/>`).join('')}
    <path d="M262 44 Q170 6 44 34" stroke="#ffd166" stroke-width="1.6" stroke-dasharray="4 4" fill="none"/>
    <path d="M262 50 Q200 46 132 74" stroke="#ffd166" stroke-width="1.6" stroke-dasharray="4 4" fill="none"/>
    ${drone(150, 20, -100)}${drone(196, 52, -110)}
    ${burst(42, 36, 1)}${burst(128, 72, 0.9)}
    <path d="M318 104 Q300 70 280 52" stroke="#9fd0ff" stroke-width="2" stroke-dasharray="5 4" fill="none"/>
    <g transform="translate(300 76) rotate(-125)"><polygon points="0,-10 3,-2 11,3 3,3 2,9 -2,9 -3,3 -11,3 -3,-2" fill="#cfe6ff" stroke="#5b7aa0" stroke-width="1"/></g>
    ${burst(272, 46, 0.8)}
    ${label(10, 52, L.kw)}${label(100, 98, L.bh)}${label(lang === 'zh' ? 250 : 258, 30, L.qe)}
    ${label(222, 15, L.ir)}${label(196, 104, L.gs)}`;
  },

  // A satellite view of a category 5 cyclone over the ocean, with atolls and a gust reading.
  cyclone: (c) => {
    const cx = 168, cy = 56;
    const arms = [0, 1, 2, 3].map((k) => `<polyline points="${spiralArm(cx, cy, k * Math.PI / 2, 7, 0.62, 40, 1.35)}" fill="none" stroke="#fff" stroke-width="${9 - k}" stroke-linecap="round" opacity="${f1(0.78 - k * 0.08)}"/>`).join('');
    return `
    <defs><radialGradient id="cy-sea" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#14608a"/><stop offset="1" stop-color="#0a2f4a"/></radialGradient>
      <radialGradient id="cy-cloud" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#e9f3fb" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="330" height="110" fill="url(#cy-sea)"/>
    ${[[40, 86], [62, 30], [262, 88], [286, 34], [118, 98]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="none" stroke="#9be7c4" stroke-width="2"/>`).join('')}
    <ellipse cx="${cx}" cy="${cy}" rx="70" ry="52" fill="url(#cy-cloud)"/>
    ${arms}
    <circle cx="${cx}" cy="${cy}" r="7" fill="#0a2f4a"/><circle cx="${cx}" cy="${cy}" r="7" fill="none" stroke="#fff" stroke-width="3"/>
    <g transform="translate(250 72)"><rect width="60" height="24" rx="5" fill="${c}"/><text x="30" y="17.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="15" fill="#fff" letter-spacing="1">CAT 5</text></g>
    <g transform="translate(244 12)"><rect width="76" height="24" rx="5" fill="#fff"/><text x="38" y="17.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="14" fill="#0a2f4a">315 km/h</text></g>
    <path d="M14 92 L32 92 M18 100 L36 100 M10 84 L26 84" stroke="#cfe6ff" stroke-width="2.5" stroke-linecap="round"/>`;
  },
};
