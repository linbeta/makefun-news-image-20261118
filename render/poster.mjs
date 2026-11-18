// render/poster.mjs: turns stories.json into the poster's content model. No layout, no DOM: everything here is
// computed from the data, so the evening run only has to replace stories.json.
//
//   buildPoster(data) -> { date, header, lead, seconds, tiles, coverage, footer, empty }
//
// Selection (see README "How the poster is made from the data"): 15 stories at most.
//   lead     first story with lead === true, else the first hero, card, brief, else the first story
//   seconds  up to 2 remaining heroes in data order, topped up with cards in data order
//   tiles    up to 12 of the rest: stories with pick === true first (data order), then a greedy fill that scores each
//            candidate 4 for a coverage segment not yet shown, 2 for a news beat not yet shown (glyphs.mjs beatOf:
//            the ballot box counts as politics, the radio mast as tech) and 1 for being a card (or a spare hero);
//            ties go to data order. Tiles are drawn in data order, 4 to a row.

import { glyphFor, GLYPHS, kickerWord, beatOf } from './glyphs.mjs';

export const MAX_TILES = 12;
export const MAX_SECONDS = 2;

// Region chips and coverage segments. The coverage bar has exactly one segment per chip name, so the chips and the
// bar always agree: MIDDLE EAST is its own segment, never folded into ASIA.
export const SEGMENTS = [
  { key: 'ASIA', colour: '#ABF19D', earth: true },
  { key: 'MIDEAST', colour: '#FFAE83', earth: true },
  { key: 'EUROPE', colour: '#B4D9FF', earth: true },
  { key: 'AFRICA', colour: '#FFE17C', earth: true },
  { key: 'AMERICAS', colour: '#FFACCF', earth: true },
  { key: 'OCEANIA', colour: '#D6BDFF', earth: true },
  { key: 'SPACE', colour: '#F4B6FF', earth: false },
  { key: 'ONLINE', colour: '#C6CBE8', earth: false },
  { key: 'OTHER', colour: '#C6CBE8', earth: false },
];
const SEGMENT = Object.fromEntries(SEGMENTS.map((s) => [s.key, s]));
const segmentOf = (regionKey) => (SEGMENT[regionKey] && regionKey !== 'OTHER' ? regionKey : 'OTHER');

// ---- words and labels ----

export const normSpace = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
export const words = (s) => (normSpace(s) ? normSpace(s).split(' ') : []);

// Word caps: a label written by the editor (label_short) may run longer for secondaries and tiles than a mechanical cut,
// so a headline like "Gaza truce at risk, Board of Peace warns" can keep its attribution whole. The layout still has to
// fit it (the page shrinks the type and fails the render if it cannot).
export const CAPS = {
  lead: { auto: 4, override: 4 },
  second: { auto: 6, override: 8 },
  tile: { auto: 6, override: 8 },
};

// Claims, quotes, uncertainty and questions are not cut mid-sentence: a cut could drop who said it.
const DELICATE = /[“”"‘?]|\b(says?|said|warns?|claims?|alleged(ly)?|accus\w*|reportedly|report says|may|might|could|suspected)\b/i;

const titleCase = (s) => s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

export function labelFor(story, kind) {
  const cap = CAPS[kind];
  const override = normSpace(story.label_short ?? story.en?.label_short);
  // An override longer than this slot allows (say a tile label on a story that became the lead) is set aside, and
  // the mechanical rules below apply instead.
  if (override && words(override).length <= cap.override) return { text: override, how: 'label_short' };
  const headline = normSpace(story.en?.headline);
  if (!headline) return { text: 'World news', how: 'empty headline' };
  if (words(headline).length <= cap.auto) return { text: headline, how: 'headline' };
  const trimmed = headline.replace(/\s+(today|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday))[.!]?$/i, '');
  if (trimmed !== headline && words(trimmed).length <= cap.auto) return { text: trimmed, how: 'headline minus day' };
  if (DELICATE.test(headline)) {
    const k = titleCase(kickerWord(story));
    if (k && words(k).length <= cap.auto) return { text: k, how: 'kicker (claim kept whole elsewhere)' };
    return { text: 'World news', how: 'World news (claim)' };
  }
  const cut = words(headline).slice(0, cap.auto).join(' ').replace(/[,;:–—-]+$/, '');
  return { text: `${cut}…`, how: 'first words' };
}

// ---- lead sub-line: does the short label already say what the headline says? ----

const STOP = new Set(('a an the and or but nor as at by for from in into of on onto to with about over under after before '
  + 'is am are was were be been being').split(' '));

export function contentWords(s) {
  const t = String(s ?? '').normalize('NFKC').toLowerCase().replace(/’/g, "'");
  const out = t.match(/\p{L}[\p{L}\p{N}]*(?:'\p{L}+)?|\p{N}+(?:[.,]\p{N}+)*\+?/gu) ?? [];
  return [...new Set(out.filter((w) => !STOP.has(w)))];
}

export function coverageRatio(label, headline) {
  const h = contentWords(headline);
  if (!h.length) return 0;
  const l = new Set(contentWords(label));
  return h.filter((w) => l.has(w)).length / h.length;
}

export function firstSentence(text) {
  const s = normSpace(text);
  if (!s) return '';
  const seg = new Intl.Segmenter('en', { granularity: 'sentence' });
  for (const { segment } of seg.segment(s)) {
    const t = segment.trim();
    if (/(\.\.\.|…)["'”’)\]]*$/.test(t)) continue;
    if (/[.?!]["'”’)\]]*$/.test(t)) return t;
  }
  return '';
}

// ---- date ----

export function dateParts(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`meta.date_iso "${iso}" is not a date`);
  const get = (opts) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts })
    .formatToParts(d).map((p) => [p.type, p.value]));
  const p = get({ weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const dmy = `${p.day} ${p.month} ${p.year}`;
  return { weekday: p.weekday.toUpperCase(), head: dmy.toUpperCase(), foot: dmy };
}

// ---- selection ----

function pickLead(list) {
  return list.find((s) => s.lead === true)
    ?? list.find((s) => s.tier === 'hero') ?? list.find((s) => s.tier === 'card')
    ?? list.find((s) => s.tier === 'brief') ?? list[0];
}

export function select(list) {
  if (!list.length) return { lead: null, seconds: [], tiles: [] };
  const lead = pickLead(list);
  const used = new Set([lead]);
  const rest = () => list.filter((s) => !used.has(s));
  const seconds = [...rest().filter((s) => s.tier === 'hero'), ...rest().filter((s) => s.tier === 'card')].slice(0, MAX_SECONDS);
  seconds.forEach((s) => used.add(s));

  const seenSeg = new Set([lead, ...seconds].map((s) => s.segment));
  const seenBeat = new Set([lead, ...seconds].map((s) => beatOf(s.glyph)));
  const chosen = [];
  const take = (s) => { chosen.push(s); used.add(s); seenSeg.add(s.segment); seenBeat.add(beatOf(s.glyph)); };

  for (const s of rest()) if (s.pick === true && chosen.length < MAX_TILES) take(s);
  const score = (s) => (s.segment !== 'OTHER' && !seenSeg.has(s.segment) ? 4 : 0)
    + (!seenBeat.has(beatOf(s.glyph)) ? 2 : 0) + (s.tier === 'card' || s.tier === 'hero' ? 1 : 0);
  while (chosen.length < MAX_TILES) {
    let best = null;
    let bestScore = -1;
    for (const s of rest()) {
      const v = score(s);
      if (v > bestScore) { best = s; bestScore = v; } // strict ">" keeps the earlier story on a tie
    }
    if (!best) break;
    take(best);
  }
  chosen.sort((a, b) => a.n - b.n);
  return { lead, seconds, tiles: chosen };
}

// ---- the whole poster ----

export function buildPoster(data) {
  const meta = data.meta ?? {};
  const regions = data.regions ?? {};
  const date = dateParts(meta.date_iso);
  const list = (data.stories ?? []).map((s, i) => {
    const segment = segmentOf(s.region);
    const regionName = normSpace(regions[s.region]?.en) || (segment === 'OTHER' ? normSpace(s.region) || 'WORLD' : segment);
    return { ...s, n: i + 1, segment, colour: SEGMENT[segment].colour, chip: regionName.toUpperCase(), glyph: glyphFor(s) };
  });
  const { lead, seconds, tiles } = select(list);
  const shown = [lead, ...seconds, ...tiles].filter(Boolean);

  const counts = new Map();
  for (const s of shown) counts.set(s.segment, (counts.get(s.segment) ?? 0) + 1);
  // One coverage item per segment shown, labelled with the same name as its chips.
  const chipName = (seg) => shown.find((s) => s.segment === seg)?.chip ?? seg;
  const coverage = SEGMENTS.filter((g) => counts.has(g.key))
    .map((g) => ({ key: g.key, label: g.key === 'OTHER' ? 'OTHER' : chipName(g.key), count: counts.get(g.key), colour: g.colour }));
  const nRegions = coverage.filter((c) => SEGMENT[c.key].earth).length;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  const deco = (s, kind) => ({
    n: s.n, chip: s.chip, colour: s.colour, glyph: s.glyph, glyphName: GLYPHS[s.glyph].name,
    headline: normSpace(s.en?.headline), label: labelFor(s, kind),
    fallback: s.glyph === 'world' ? 'World news' : GLYPHS[s.glyph].name,
  });

  let leadModel = null;
  if (lead) {
    const d = deco(lead, 'lead');
    const ratio = coverageRatio(d.label.text, d.headline);
    leadModel = {
      ...d,
      ratio,
      // >= 70% of the headline's content words already in the big label: show where and the first sentence instead.
      sub: ratio >= 0.7 ? 'place' : 'headline',
      place: normSpace(lead.place),
      sentence: firstSentence(lead.en?.line),
    };
  }

  const sourcesLabel = normSpace(meta.en?.sources_label) || 'Checked against';
  return {
    date,
    empty: shown.length === 0,
    header: {
      date: date.head,
      weekday: date.weekday,
      stat1: `${plural(shown.length, 'STORY', 'STORIES')} · ${plural(nRegions, 'REGION', 'REGIONS')}`,
      stat2: 'ONE DAY',
    },
    lead: leadModel,
    seconds: seconds.map((s) => deco(s, 'second')),
    tiles: tiles.map((s) => deco(s, 'tile')),
    coverage,
    counts: { stories: shown.length, regions: nRegions },
    footer: {
      dated: `Every story dated ${date.foot}`,
      sourcesLabel,
      sources: (meta.sources_footer ?? []).map(normSpace).filter(Boolean),
    },
  };
}
