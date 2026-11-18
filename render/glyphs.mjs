// render/glyphs.mjs: the poster's category pictograms, and the rule that picks one for a story.
//
// Every glyph is drawn on an 80x80 grid as stroked outlines (no fill, round caps and joins, stroke width 5), so one
// <svg> wrapper can draw any of them at any size in any colour (stroke = currentColor).
//
// A glyph's beat is the news beat it belongs to (its own key unless "beat" says otherwise): election is a picture of
// the politics beat and signal one of the tech beat. Tile selection rewards a new beat, not a new picture of a beat
// already on the poster.

export const GLYPHS = {
  storm: {
    name: 'Storm', note: 'Cyclone / hurricane / flood',
    // two spiral bands winding out of the eye, as a cyclone looks from orbit (r = 8 -> 33 over 290 degrees each)
    body: '<circle cx="40" cy="40" r="3"/><path d="M40 32C40.8 31.8 43.3 30.6 45.1 30.8C46.9 31 49.3 31.7 51 33.1C52.8 34.5 54.6 36.7 55.5 39.2'
      + 'C56.3 41.7 56.8 45 56.2 47.9C55.6 50.8 54.1 54.3 51.8 56.8C49.5 59.3 46 61.8 42.4 62.9C38.8 64 34.1 64.4 30 63.5'
      + 'C26 62.5 21.3 60.4 17.9 57.2C14.6 54.1 11.4 49.5 9.9 44.8C8.4 40 9.1 31.4 9 28.7'
      + 'M40 48C39.2 48.2 36.7 49.4 34.9 49.2C33.1 49 30.7 48.3 29 46.9C27.2 45.5 25.4 43.3 24.5 40.8'
      + 'C23.7 38.3 23.2 35 23.8 32.1C24.4 29.2 25.9 25.7 28.2 23.2C30.5 20.7 34 18.2 37.6 17.1C41.2 16 45.9 15.6 50 16.5'
      + 'C54 17.5 58.7 19.6 62.1 22.8C65.4 25.9 68.6 30.5 70.1 35.2C71.6 40 70.9 48.6 71 51.3"/>',
  },
  climate: {
    name: 'Climate', note: 'Climate / environment',
    body: '<path d="M33 47.5V17a7 7 0 0 1 14 0v30.5a13 13 0 1 1-14 0Z"/><path d="M40 53V31M56 20h8M56 31h8M56 42h8"/>',
  },
  conflict: {
    name: 'Conflict', note: 'Conflict / defence',
    // two crossed swords: blade, cross-guard, grip and pommel each
    body: '<path d="M12 12l42 42M44 62l18-18M54 54l9 9M68 12L26 54M18 44l18 18M26 54l-9 9"/><circle cx="66" cy="66" r="2.5"/><circle cx="14" cy="66" r="2.5"/>',
  },
  diplomacy: {
    name: 'Diplomacy', note: 'Diplomacy / aid / summits',
    body: '<circle cx="24" cy="20" r="7"/><circle cx="56" cy="20" r="7"/><path d="M12 41c0-13 24-13 24 0M44 41c0-13 24-13 24 0M7 47h66M17 47v20M63 47v20M33 41h14"/>',
  },
  economy: {
    name: 'Economy', note: 'Economy / business / markets',
    body: '<path d="M12 11v57h58M21 54l14-15 10 8 20-23M53 23h12v12"/>',
  },
  science: {
    name: 'Science', note: 'Science / space',
    body: '<circle cx="38" cy="43" r="19"/><ellipse cx="38" cy="43" rx="34" ry="10" transform="rotate(-24 38 43)"/><path d="M66 6v14M59 13h14"/>',
  },
  health: {
    name: 'Health', note: 'Health / medicine',
    body: '<path d="M31 11h18v20h20v18H49v20H31V49H11V31h20Z"/>',
  },
  tech: {
    name: 'Tech', note: 'Technology / online / cyber',
    body: '<rect x="20" y="20" width="40" height="40" rx="7"/><rect x="31" y="31" width="18" height="18" rx="3"/><path d="M30 8v12M40 8v12M50 8v12M30 60v12M40 60v12M50 60v12M8 30h12M8 40h12M8 50h12M60 30h12M60 40h12M60 50h12"/>',
  },
  election: {
    name: 'Election', note: 'Elections / votes / results', beat: 'politics',
    // a ballot box with a ticked paper going in: only for elections, never for politics in general
    body: '<path d="M27 42V12h26v30M34 26l5 5 8-9M12 42h56v26H12ZM12 50h56"/>',
  },
  politics: {
    name: 'Politics', note: 'Government / parliament',
    // a speaker's podium with a microphone
    body: '<path d="M14 36h52l-7 32H21ZM18 46h44M12 68h56M40 36V23"/><circle cx="40" cy="16" r="6"/>',
  },
  law: {
    name: 'Law', note: 'Courts / lawsuits / justice',
    body: '<path d="M40 12v52M27 67h26M13 21h54M13 21 6 44M13 21l7 23M67 21l-7 23M67 21l7 23M4 44h18a9 9 0 0 1-18 0ZM58 44h18a9 9 0 0 1-18 0Z"/><circle cx="40" cy="11" r="2.5"/>',
  },
  sport: {
    name: 'Sport', note: 'Sport / games / stadiums',
    // a cricket bat (blade and handle, tilted) and a ball
    body: '<g transform="rotate(40 38 40)"><path d="M29 8h18v34l-5 5h-8l-5-5ZM38 47v21"/></g>'
      + '<circle cx="61" cy="63" r="9"/>',
  },
  culture: {
    name: 'Culture', note: 'Culture / language / arts',
    body: '<path d="M26 12h28v20a14 14 0 0 1-28 0ZM26 18H15v5a11 11 0 0 0 11 11M54 18h11v5a11 11 0 0 1-11 11M40 46v14M28 67h24M33 60h14"/>',
  },
  maritime: {
    name: 'Maritime', note: 'Boats / ships / sea rescues',
    // a fishing boat (hull, wheelhouse, mast) riding a wave line
    body: '<path d="M10 46h60l-9 15H19ZM26 46V33h17v13M55 46V14M55 18l-13 13M6 70c6-5 11-5 17 0s11 5 17 0 11-5 17 0 11 5 17 0"/>',
  },
  signal: {
    name: 'Signal', note: 'Telecoms / mobile networks', beat: 'tech',
    // a radio mast with waves going out both ways
    body: '<path d="M40 36 30 70M40 36l10 34M33 58h14M31.5 21.5a12 12 0 0 0 0 17M48.5 21.5a12 12 0 0 1 0 17'
      + 'M24.4 14.4a22 22 0 0 0 0 31.2M55.6 14.4a22 22 0 0 1 0 31.2"/><circle cx="40" cy="30" r="3.5"/>',
  },
  world: {
    name: 'World', note: 'General news',
    body: '<circle cx="40" cy="40" r="28"/><ellipse cx="40" cy="40" rx="12" ry="28"/><path d="M12 40h56M17 25c13 7 33 7 46 0M17 55c13-7 33-7 46 0"/>',
  },
};

export const GLYPH_ORDER = Object.keys(GLYPHS);

export const beatOf = (key) => GLYPHS[key]?.beat ?? key;

export function glyphSvg(key, size, cls = '') {
  const g = GLYPHS[key] ?? GLYPHS.world;
  return `<svg class="glyph ${cls}" width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" stroke="currentColor" `
    + `stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g.body}</svg>`;
}

// ---- Which glyph a story gets ----
//
// 1. An explicit "glyph" on the story (top level) wins, if it names a known glyph.
// 2. The kicker's last section (after the last "·") is matched whole, ignoring case, against KICKER.
//    A kicker word mapped to null is an umbrella (DISASTER, SECURITY, PEOPLE, ...): it says too little on its own.
// 3. Otherwise (unknown or umbrella kicker) the headline is scanned for the keywords below, in table order.
// 4. Otherwise the umbrella's own default, else world.
// 5. A broad glyph found in step 2 or 3 is then narrowed by the headline (REFINE): a POLITICS story about an election
//    result gets the ballot box (election), any other politics story the podium; a TECH story about mobile networks
//    gets the radio mast (signal).
// The storm glyph is a cyclone: it is only used for weather events (a storm word in the headline, or a STORM/WEATHER
// kicker). Climate policy gets climate, accidents with no storm word get world (boats and ships get maritime),
// lawsuits get law, sport gets the bat and ball, culture the trophy.

const KICKER = {
  STORM: 'storm', WEATHER: 'storm', CYCLONE: 'storm', HURRICANE: 'storm', TYPHOON: 'storm',
  CLIMATE: 'climate', ENVIRONMENT: 'climate', ENERGY: 'climate',
  CONFLICT: 'conflict', DEFENCE: 'conflict', DEFENSE: 'conflict', WAR: 'conflict', MILITARY: 'conflict',
  DIPLOMACY: 'diplomacy', AID: 'diplomacy', 'FOREIGN POLICY': 'diplomacy',
  ECONOMY: 'economy', BUSINESS: 'economy', MARKET: 'economy', MARKETS: 'economy', FINANCE: 'economy', TRADE: 'economy',
  SCIENCE: 'science', SPACE: 'science', SKY: 'science',
  HEALTH: 'health', MEDICINE: 'health',
  TECH: 'tech', TECHNOLOGY: 'tech', CYBER: 'tech', ONLINE: 'tech', AI: 'tech',
  TELECOM: 'signal', TELECOMS: 'signal',
  POLITICS: 'politics', GOVERNMENT: 'politics', PARLIAMENT: 'politics',
  ELECTION: 'election', ELECTIONS: 'election', VOTE: 'election',
  LAW: 'law', COURTS: 'law', COURT: 'law', JUSTICE: 'law', CRIME: 'law',
  SPORT: 'sport', SPORTS: 'sport',
  CULTURE: 'culture', LANGUAGE: 'culture', ARTS: 'culture',
  MARITIME: 'maritime', SEA: 'maritime',
  // umbrellas: scan the headline, then fall back to the value in UMBRELLA_DEFAULT
  DISASTER: null, ACCIDENT: null, SECURITY: null, PEOPLE: null, WORLD: null, NEWS: null,
};
const UMBRELLA_DEFAULT = { DISASTER: 'world', ACCIDENT: 'world', SECURITY: 'world', PEOPLE: 'world' };

const ELECTION = /\b(elections?|elected|ballots?|votes?|voted|voters?|voting|polls|referendum|run-?off|wins .*\b(seat|race|election|vote|presidency))\b/i;
const SIGNAL = /\b(6g|5g|4g|telecoms?|mobile networks?|cell(ular)? networks?|broadband|satellite internet)\b/i;

const HEADLINE = [
  ['storm', /\b(cyclone|hurricane|typhoon|tornado|storm|floods?|flooding|blizzard)\b/i],
  ['conflict', /\b(fighting|drone attacks?|missiles?|troops|air ?strikes?|shelling|clashes|war)\b/i],
  ['law', /\b(sues?|sued|lawsuit|court|trial|verdict|ruling|judge|indicted|convicted)\b/i],
  ['maritime', /\b(boats?|ships?|vessels?|ferry|ferries|capsiz\w*|shipwreck|sank|sinks?|coast ?guard|aboard)\b/i],
  ['diplomacy', /\b(summit|sanctions?|truce|ceasefire|peace talks|pact|treaty)\b/i],
  ['economy', /\b(markets?|forecasts?|stocks?|inflation|fintech|tariffs?|earnings)\b/i],
  ['science', /\b(voyager|meteors?|spacecraft|orbit|telescope|rocket|nasa)\b/i],
  ['health', /\b(hospitals?|vaccines?|outbreak|health|virus|disease)\b/i],
  ['signal', SIGNAL],
  ['tech', /\b(cyber[a-z]*|outage|network|websites?|software|hack(ed|ers?)?)\b/i],
  ['election', ELECTION],
  ['politics', /\b(senate|parliament|cabinet|coalition|impeach\w*|prime minister)\b/i],
  ['climate', /\b(climate|emissions|drought|heatwave|cop\d+)\b/i],
  ['sport', /\b(cricket|olympics?|olympic|stadium|football|soccer|rugby|tennis|world cup|marathon)\b/i],
  ['culture', /\b(dictionary|museum|festival|film|novel|album|word of the year)\b/i],
];

const REFINE = { politics: [['election', ELECTION]], tech: [['signal', SIGNAL]] };

export function kickerWord(story) {
  const k = String(story.en?.kicker ?? '');
  const parts = k.split('·');
  return parts[parts.length - 1].trim().replace(/\s+/g, ' ').toUpperCase();
}

export function glyphFor(story) {
  if (story.glyph && GLYPHS[story.glyph]) return story.glyph;
  const headline = String(story.en?.headline ?? '');
  const refine = (key) => (REFINE[key] ?? []).find(([, re]) => re.test(headline))?.[0] ?? key;
  const word = kickerWord(story);
  if (word && KICKER[word]) return refine(KICKER[word]);
  for (const [key, re] of HEADLINE) if (re.test(headline)) return refine(key);
  return UMBRELLA_DEFAULT[word] ?? 'world';
}
