// render/cases.mjs: synthetic variants of stories.json for `node render-entry.mjs tests`. Each one must still render
// cleanly (the page audit fails the run otherwise) and meets the listed expectations about the poster model.

import { coverageRatio, firstSentence, labelFor } from './poster.mjs';

const clone = (x) => JSON.parse(JSON.stringify(x));

export function fallbackCases(base) {
  const B = clone(base);
  const brief = (over) => ({ tier: 'brief', region: 'EUROPE', place: 'Somewhere', en: { kicker: 'WORLD', headline: 'Something happened' }, ...over });
  const cases = [];

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
      { what: 'nine tiles', test: (p) => p.tiles.length === 9 },
    ],
  });

  const few = clone(B);
  few.stories = few.stories.slice(0, 5);
  few.meta.date_iso = '2026-09-09';
  cases.push({
    name: 'five-sept', about: 'five stories, a September date (en-GB short month)',
    data: few,
    expect: [
      { what: 'two tiles only', test: (p) => p.tiles.length === 2 },
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
  ];
  return Object.assign(cases, { unit });
}
