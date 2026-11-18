// render/grid.mjs: the tile grid's rules, checked after a render on the page's audit report (render/page.mjs) against
// the poster model (render/poster.mjs). render-entry.mjs adds the problems to the page's own audit and stops on any.
//
//   gridProblems(poster, report, { strict }) -> [problem, ...]
//
// strict (the entry render): a tile or secondary label that only fits as its fallback is a problem too, so the
// label_short in stories.json gets shortened rather than a category name printed.

import { MAX_TILES } from './poster.mjs';
import { GRID } from './page.mjs';

export function gridProblems(poster, report, { strict = false } = {}) {
  const bad = [];
  const tiles = report.tiles ?? [];
  if (MAX_TILES !== GRID.max) bad.push(`MAX_TILES ${MAX_TILES} != grid ${GRID.cols}x${GRID.rows}`);
  if (poster.tiles.length > GRID.max) bad.push(`${poster.tiles.length} tiles in the model, the grid holds ${GRID.max}`);
  if (tiles.length !== poster.tiles.length) bad.push(`${tiles.length} tiles drawn, ${poster.tiles.length} in the model`);
  if (report.grid && (report.grid.cols > GRID.cols || report.grid.rows > GRID.rows)) bad.push(`grid is ${report.grid.cols}x${report.grid.rows}`);
  const xs = [...new Set(tiles.map((t) => t.x))].sort((a, b) => a - b);
  const wantXs = Array.from({ length: Math.min(GRID.cols, tiles.length) }, (_, i) => Math.round(36 + i * (GRID.colW + GRID.gutter)));
  if (xs.join() !== wantXs.join()) bad.push(`tile columns at x ${xs.join(', ')}, expected ${wantXs.join(', ')}`);
  for (const t of tiles) {
    if (t.w !== Math.round(GRID.colW) || t.h !== GRID.rowH) bad.push(`${t.id}: ${t.w}x${t.h}, expected ${GRID.colW}x${GRID.rowH}`);
    if (!(t.px >= GRID.head.min)) bad.push(`${t.id}: headline ${t.px} px < ${GRID.head.min}`);
    if (!(t.lines >= 1 && t.lines <= GRID.head.lines)) bad.push(`${t.id}: headline on ${t.lines} lines`);
    if (t.chipPx !== 18) bad.push(`${t.id}: chip ${t.chipPx} px`);
    if (t.glyphPx !== GRID.glyph) bad.push(`${t.id}: glyph ${t.glyphPx} px`);
  }
  const covSum = poster.coverage.reduce((a, c) => a + c.count, 0);
  if (covSum !== poster.counts.stories) bad.push(`coverage adds up to ${covSum}, header says ${poster.counts.stories}`);
  const chips = new Set([poster.lead, ...poster.seconds, ...poster.tiles].filter(Boolean).map((s) => s.chip));
  const labels = new Set(poster.coverage.filter((c) => c.key !== 'OTHER').map((c) => c.label));
  for (const c of chips) if (!labels.has(c) && !poster.coverage.some((x) => x.key === 'OTHER')) bad.push(`chip ${c} has no coverage segment`);
  for (const l of labels) if (!chips.has(l)) bad.push(`coverage ${l} matches no chip`);
  if (strict) {
    for (const f of report.fits) {
      if (/^(tile|secondary) /.test(f.name) && f.how !== 'fit') bad.push(`${f.name}: label "${f.original}" only fits as "${f.text}"; shorten its label_short`);
    }
  }
  return bad;
}
