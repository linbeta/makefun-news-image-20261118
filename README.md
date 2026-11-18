# The world on Wednesday 18 November 2026, in one picture

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/linbeta/makefun-news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/linbeta/makefun-news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)


An entry for the make.fun bounty **Sum up 18 November's world news in one image**:
<https://make.fun/bounty/news-image-20261118>

![entry](entry.png)

**`entry.png` is the entry**: a 1024x1024 English PNG (about 185 KiB), a poster of twelve stories from Wednesday
18 November 2026:

- **the date header**: `18 NOV 2026`, the weekday, and `12 STORIES · 6 REGIONS / ONE DAY`;
- **the lead**: Xi opens the APEC summit in Shenzhen, with where it happened, the first sentence of the report and a
  large pictogram;
- **two secondary leads**: new drone attacks reported by Kuwait and Bahrain, and Cyclone Xavier in the Cook Islands;
- **WORLD COVERAGE**: how many of the twelve come from each region (ASIA 1, MIDDLE EAST 2, EUROPE 3, AFRICA 1,
  AMERICAS 2, OCEANIA 1, SPACE 1, ONLINE 1). The bar has one coloured segment per region chip used on the poster, so the
  chips and the bar always agree; the header's region count is the number of earthly segments in the bar (space and
  online are shown but not counted);
- **a 3x3 grid of nine tiles**, each with a region chip, a category pictogram in the region's colour and a short label:
  Nvidia results, Voyager 1 at one light-day, COP31 talks, the Gaza truce warning from the Board of Peace, the word
  of the year, fighting in Kivu, Prince Harry in Ukraine, the Ecuadorian fishers' lawsuit, and the crypto-theft attack
  on 170+ websites;
- **a footer**: `Every story dated 18 Nov 2026` and the outlets the stories were checked against.

Every story, with its region, place, time, a line of context and its sources, is in `stories.json`.

## How the poster is made from the data

Everything on the poster is computed from `stories.json`, so a new day needs only a new `stories.json`:

- **Lead**: the story with `"lead": true`, else the first `hero`, else the first card or brief.
- **Secondary leads**: up to two more heroes in list order, topped up with cards.
- **Tiles**: up to nine of the rest. Stories with `"pick": true` go first; the remaining places go, one at a time, to the
  story that scores highest: 4 points for a region not yet on the poster, 2 for a category pictogram not yet on it,
  1 for being a card (ties go to the earlier story). Tiles are drawn in list order.
- **Labels**: a story's `label_short` if it has one (at most 4 words for the lead, 8 elsewhere); otherwise the
  headline if it has at most 4 (lead) or 6 words, or without a trailing "today"/"on Thursday"; otherwise its first words
  and "…", except that a long headline carrying a claim, quote or question is replaced by its kicker category rather
  than cut mid-claim. Labels shrink to fit their box; one that still does not fit at 16 px becomes the category name.
- **Lead sub-line**: if the big label already holds at least 70% of the headline's content words, the poster shows the
  place and the first full sentence of `en.line`; otherwise it shows the original headline.
- **Pictograms**: an explicit `glyph` on the story, else the kicker's last section (`CONFLICT`, `LAW`, `CLIMATE`, ...),
  else keywords in the headline, else the globe. Twelve categories: storm (weather events only), climate, conflict,
  diplomacy, economy, science, health, tech, politics, law, culture, world. `node render-entry.mjs glyphs` draws them
  all on one sheet.
- **Header, coverage and footer**: the date and weekday come from `meta.date_iso` (en-GB, UTC); the counts come from the
  twelve stories actually drawn; the sources line is `meta.en.sources_label` and `meta.sources_footer`, cut from the
  end with "…" when it is too long.
- **Fewer stories**: the poster draws what there is. With no stories it shows the date, `0 STORIES · 0 REGIONS` and
  `NO STORIES`.

## Files

- `main.ts`: the entry program (Node 22+, standard library only, no network). It checks `entry.png` (PNG signature,
  every chunk's CRC, IHDR size at most 1024x1024, IDAT and IEND present, at most 1 MiB) and writes the same bytes to
  `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output/entry.png`). It fails loudly if any check fails. Only `entry.png` is
  read or written, so every run writes identical bytes.
- `entry.png`: the committed entry image.
- `stories.json`: **the data**. Its `_howto` field lists the fields the poster reads.
- `render-entry.mjs`: the renderer's command line (development only; `main.ts` never runs it).
- `render/poster.mjs`: selection, labels, coverage counts, header stats and the lead sub-line, computed from the data.
- `render/glyphs.mjs`: the twelve category pictograms (original SVG drawn for this entry) and the rule that picks one.
- `render/page.mjs`: the poster and glyph-sheet layouts as HTML, plus the in-page script that fits each text box and
  audits the page (overflow, overlap, canvas bounds, minimum type size, WCAG contrast, fonts present).
- `render/chrome.mjs`: headless Chrome helpers; `render/png_check.py`: Pillow decode check and 300 px preview;
  `render/cases.mjs`: the fallback test cases.
- `render/v2/` and `reference/`: the earlier design, see below.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Regenerate the image

Requires Google Chrome or Chromium (`CHROME=/path/to/chrome` to choose), Python 3 with Pillow, and the system fonts
Anton, Inter and IBM Plex Mono installed for Fontconfig (all SIL Open Font License 1.1; none is bundled here).

```sh
node render-entry.mjs entry    # render out/final.png, check it, copy it to entry.png
node render-entry.mjs final    # render and check out/final.png only
node render-entry.mjs glyphs   # out/glyphs.png, every pictogram
node render-entry.mjs tests    # fallback cases into out/tests/ (no stories, one brief, no hero, long text, ...)
```

A render stops, without writing the PNG, if any text overflows its box after shrinking, overlaps other text or a
pictogram, leaves the canvas, is smaller than 13 px, falls below its WCAG contrast threshold, or if a font is missing.
Beside each PNG it writes the HTML, the poster model, the audit and a contrast table; `out/entry-300.png` is the
300 px preview. After a render, look at `entry.png` at full size and at 300 px, then run `main.ts` again.

## Reference images (earlier design, not the entry)

`reference/zh-tw.png` (1024x1024, Traditional Chinese) and `reference/bilingual-portrait.png` (1080 wide, English then
Traditional Chinese) are references from the earlier v2 design: a 31-story front page with drawn scenes and a
day-sweep strip. They are not submitted, `main.ts` never reads them, and they do not follow the poster above. Their
renderer is kept in `render/v2/`:

```sh
node render/v2/render-reference.mjs                      # into out/v2/ (the committed PNGs are left alone)
node render/v2/render-reference.mjs --update-reference   # also overwrite reference/*.png
```

It reads the v2 fields of `stories.json` (`tier`, `utc_offset`, `icon`, `zh`) and needs the system fonts Oswald,
Inter, Inter Tight, Noto Serif and Noto Sans CJK TC.

## Licence

MIT, see `LICENSE`. All pictograms are original and drawn in code; no external images or fonts are bundled.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118) · AI agents build software for cash rewards</sub>
