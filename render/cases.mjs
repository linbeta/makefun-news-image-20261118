// render/cases.mjs: the day's stories.json and synthetic variants of it for `node render-entry.mjs tests`. Each one must
// still render cleanly (the page audit and the grid rules in render-entry.mjs fail the run otherwise) and meets the
// listed expectations about the poster model and the page's audit report (expect.test(poster, report)).

import { coverageRatio, firstSentence, labelFor } from './poster.mjs';
import { glyphFor } from './glyphs.mjs';

// Every drawn tile: headline at 16 px or more, on 1 or 2 lines, 18 px chip.
const tilesOk = (r) => r.tiles.every((t) => t.px >= 16 && t.lines >= 1 && t.lines <= 2 && t.chipPx === 18);

const clone = (x) => JSON.parse(JSON.stringify(x));

export function fallbackCases(base) {
  const B = clone(base);
  const brief = (over) => ({ tier: 'brief', region: 'EUROPE', place: 'Somewhere', en: { kicker: 'WORLD', headline: 'Something happened' }, ...over });
  const cases = [];

  cases.push({
    name: 'today', about: "the day's own stories.json, rendered strictly like the entry", strict: true,
    data: clone(B),
    expect: [
      { what: 'header says 15 STORIES · 6 REGIONS', test: (p) => p.header.stat1 === '15 STORIES · 6 REGIONS' },
      { what: '1 lead + 2 secondaries + 12 tiles', test: (p) => p.lead && p.seconds.length === 2 && p.tiles.length === 12 },
      { what: 'coverage counts add up to 15', test: (p) => p.coverage.reduce((a, c) => a + c.count, 0) === 15 },
      { what: 'coverage names are the chip names', test: (p) => {
        const chips = new Set([p.lead, ...p.seconds, ...p.tiles].map((s) => s.chip));
        return p.coverage.every((c) => chips.has(c.label)) && chips.size === p.coverage.length;
      } },
      { what: 'sport, election and maritime tiles are on the poster', test: (p) => ['sport', 'election', 'maritime'].every((g) => p.tiles.some((t) => t.glyph === g)) },
      { what: 'page draws a 4x3 grid of 12 tiles', test: (p, r) => r.grid.tiles === 12 && r.grid.cols === 4 && r.grid.rows === 3 },
      { what: 'every tile headline fits at 16-17 px on at most 2 lines, no fallback', test: (p, r) => tilesOk(r)
        && r.fits.filter((f) => f.name.startsWith('tile ')).every((f) => f.how === 'fit' && f.px >= 16 && f.px <= 17) },
    ],
  });

  cases.push({
    name: 'empty', about: 'no stories at all',
    data: { ...clone(B), stories: [] },
    expect: [
      { what: 'header says 0 STORIES · 0 REGIONS', test: (p) => p.header.stat1 === '0 STORIES · 0 REGIONS' },
      { what: 'no coverage bar', test: (p) => p.coverage.length === 0 },
      { what: 'no lead', test: (p) => p.lead === null },
    ],
  });

  cases.push({
    name: 'one-brief', about: 'a single brief becomes the lead',
    data: { ...clone(B), stories: [brief({ region: 'AFRICA', en: { kicker: 'ECONOMY', headline: 'Africa Fintech Summit set to open in Kigali', line: 'Investors gather. More follows.' } })] },
    expect: [
      { what: '1 STORY · 1 REGION', test: (p) => p.header.stat1 === '1 STORY · 1 REGION' },
      { what: 'no secondaries or tiles', test: (p) => p.seconds.length === 0 && p.tiles.length === 0 },
      { what: 'lead label cut to 4 words with an ellipsis', test: (p) => p.lead.label.text === 'Africa Fintech Summit set…' },
    ],
  });

  const noHero = clone(B);
  noHero.stories = noHero.stories.filter((s) => s.tier !== 'hero').map((s) => { const t = { ...s }; delete t.lead; return t; });
  cases.push({
    name: 'no-hero', about: 'no heroes, no lead flag: cards take the lead and secondary slots',
    data: noHero,
    expect: [
      { what: 'lead is the first card', test: (p) => p.lead.n === 1 && p.lead.headline.startsWith('Nvidia') },
      { what: 'two secondaries from cards', test: (p) => p.seconds.length === 2 },
      { what: 'twelve tiles, drawn 4x3', test: (p, r) => p.tiles.length === 12 && r.grid.cols === 4 && r.grid.rows === 3 && tilesOk(r) },
    ],
  });

  const few = clone(B);
  few.stories = few.stories.slice(0, 5);
  few.meta.date_iso = '2026-09-09';
  cases.push({
    name: 'five-sept', about: 'five stories, a September date (en-GB short month)',
    data: few,
    expect: [
      { what: 'two tiles only, on one row', test: (p, r) => p.tiles.length === 2 && r.grid.rows === 1 && tilesOk(r) },
      { what: 'date and weekday from the ISO date', test: (p) => p.header.weekday === 'WEDNESDAY' && /^9 SEPT? 2026$/.test(p.header.date) },
    ],
  });

  const long = clone(B);
  long.stories[0] = {
    ...long.stories[0],
    label_short: undefined,
    en: {
      ...long.stories[0].en,
      headline: 'Extraordinarily unprecedented intercontinental negotiations reconvene amid uncertainty',
      line: 'Delegates from forty-one economies argued for nine hours; officials said the communiqué would be rewritten again, and again, and again until every single delegation had signed every single annex of the agreement. A second sentence.',
    },
  };
  long.stories[1].label_short = 'Kuwait, Bahrain report new drone attacks overnight again';
  long.stories[6].label_short = 'Gaza truce at serious risk, Board of Peace warns';
  long.meta.sources_footer = [...long.meta.sources_footer, 'An Extremely Long Outlet Name That Will Not Fit', 'Another Outlet', 'Yet Another'];
  long.stories.push(brief({ region: 'ANTARCTICA', en: { kicker: 'SCIENCE', headline: 'Ice shelf calves' }, pick: true }));
  cases.push({
    name: 'long-text', about: 'long lead headline and summary, long labels, too many sources, an unknown region',
    data: long,
    expect: [
      { what: 'lead label is the first 4 words + …', test: (p) => p.lead.label.text.endsWith('…') },
      { what: 'unknown region is drawn as OTHER in the bar', test: (p) => p.coverage.some((c) => c.key === 'OTHER') },
    ],
  });

  const tooLong = clone(B);
  tooLong.stories[3].label_short = 'Extraordinarily unprecedented intercontinental semiconductor earnings astonish analysts';
  cases.push({
    name: 'long-tile', about: 'a tile label too long for 2 lines at 16 px falls back to its category name',
    data: tooLong,
    expect: [
      { what: 'the Nvidia tile shows "Economy"', test: (p, r) => r.fits.some((f) => f.name === 'tile 4' && f.how === 'fallback' && f.text === 'Economy') },
      { what: 'all tiles still 16 px+, at most 2 lines', test: (p, r) => tilesOk(r) },
    ],
  });

  const picks = clone(B);
  picks.stories.forEach((s, i) => { if (i >= 3) s.pick = true; });
  cases.push({
    name: 'many-picks', about: 'more stories flagged pick than there are tiles: the first 12 in data order',
    data: picks,
    expect: [
      { what: 'exactly 12 tiles, stories 4 to 15', test: (p) => p.tiles.map((t) => t.n).join() === '4,5,6,7,8,9,10,11,12,13,14,15' },
      { what: 'header says 15 STORIES', test: (p) => p.header.stat1.startsWith('15 STORIES') },
    ],
  });

  const claim = clone(B);
  claim.stories = [brief({ lead: true, en: { kicker: 'UKRAINE · CONFLICT', headline: 'Russia used tear gas on troops in 2024, report says' } }), ...claim.stories.slice(1)];
  cases.push({
    name: 'claim', about: 'a long attributed headline is not cut mid-claim',
    data: claim,
    expect: [{ what: 'lead label falls back to the kicker category', test: (p) => p.lead.label.text === 'Conflict' }],
  });

  // Pure-function checks that need no page: the 70% boundary, the semicolon summary, the weekday trim.
  const unit = [
    ['70% boundary: 7 of 10 content words', () => coverageRatio('k l m n o p q', 'k l m n o p q r s t') === 0.7],
    ['stop words do not count', () => coverageRatio('Xi opens summit', 'Xi opens the summit in Shenzhen') === 0.75],
    ['below 70% shows the headline', () => coverageRatio('x y', 'x y z w') < 0.7],
    ['summary keeps a semicolon sentence whole', () => firstSentence('One; two. Three.') === 'One; two.'],
    ['summary skips an ellipsis fragment', () => firstSentence('Wait for it... Then this. More.') === 'Then this.'],
    ['no complete sentence gives no summary', () => firstSentence('An unfinished line') === ''],
    ['trailing "today" is trimmed to fit', () => labelFor({ en: { headline: 'Voyager 1 hits one light-day today' } }, 'tile').text === 'Voyager 1 hits one light-day today'
      && labelFor({ en: { headline: 'Big spacecraft reaches one full light-day today' } }, 'tile').text === 'Big spacecraft reaches one full light-day'],
    // Glyphs: a ballot box only for elections, the podium for other politics; sport, boats and telecoms get their own.
    ['election result gets the ballot box', () => glyphFor({ en: { kicker: 'POLITICS', headline: 'Democrat Peltola wins Alaska Senate seat' } }) === 'election'],
    ['politics without an election gets the podium', () => glyphFor({ en: { kicker: 'POLITICS', headline: 'Coalition talks stall in parliament' } }) === 'politics'
      && glyphFor({ en: { kicker: 'WORLD', headline: 'Senate passes budget bill' } }) === 'politics'],
    ['sport kicker gets the bat and ball', () => glyphFor({ en: { kicker: 'SPORT', headline: 'Cricket Australia to hold forum' } }) === 'sport'],
    ['a missing boat gets maritime', () => glyphFor({ en: { kicker: 'ACCIDENT', headline: 'S. Korea: fishing boat with 7 aboard missing' } }) === 'maritime'],
    ['a 6G tech story gets the radio mast', () => glyphFor({ en: { kicker: 'TECH', headline: 'China approves 8 regions for 6G pilot scheme' } }) === 'signal'
      && glyphFor({ en: { kicker: 'CYBER', headline: '170+ websites compromised in crypto-theft attack' } }) === 'tech'],
    ['word of the year keeps the trophy (culture)', () => glyphFor({ en: { kicker: 'CULTURE · LANGUAGE', headline: 'Word of the year' } }) === 'culture'],
  ];
  return Object.assign(cases, { unit });
}
