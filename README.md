# The world on Wednesday 18 November 2026, in one picture

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/linbeta/makefun-news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/linbeta/makefun-news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)

## What the image is (v5)

One 1024x1024 picture of Wednesday 18 November 2026: **31 stories, 6 regions plus deep space and online, one day**,
all drawn from `stories.json` (nothing is typed into the layout).

- **Header**: the date in large type, the weekday and a count line computed from the data.
- **Lead**: the day's main story (Xi opens the APEC summit in Shenzhen) with a large headline and pictogram, and two
  secondary leads (drone attacks on Kuwait and Bahrain; Cyclone Xavier on the Cook Islands).
- **Day-sweep strip** (the layout's backbone): a UTC-offset axis from +12 to -10 with UTC+0 (London) dashed, city names
  and offsets, and every story as a numbered dot in its time zone. Stories are numbered in time order (earliest UTC
  first), so the numbers in the tiles and list read along the same axis. Deep space and online stories sit in a "no zone" box.
- **4x3 icon tiles**: twelve stories, each with its number, region chip, category pictogram (render/glyphs.mjs) and a headline at 17 px.
- **Also on 18 November**: the other sixteen stories, 14 px, one line each.
- **Footer**: the sources the stories were checked against.

Palette: cool grey-blue page (#eef1f5), navy ink, darker region colours (every chip and text passes WCAG AA, audited on
each render). Type: Anton for the date and lead, Inter for text, IBM Plex Mono for chips. No type is under 13 px.

## Files

- `main.ts`: the entry program (Node 22+, standard library only, no network). It checks `entry.png` (PNG signature,
  every chunk's CRC, size at most 1024x1024, IDAT and IEND present, at most 1 MiB) and writes the same bytes to
  `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output/entry.png`). Every run writes identical bytes.
- `entry.png`: the committed entry image.
- `stories.json`: the data (31 stories, regions with colours, sources).
- `render-entry.mjs`: command line of the renderer (development only; `main.ts` never runs it).
- `render/v5.mjs`: the poster model (time order, tile and list selection, counts) and the HTML page with its in-page
  audit (overflow, overlap, canvas bounds, 13 px minimum, WCAG contrast, fonts, tile headlines at 16 px or more on at most two lines).
- `render/glyphs.mjs`: the category pictograms (original SVG) and the rule that picks one per story.
- `render/chrome.mjs`, `render/png_check.py`: headless Chrome helpers; Pillow decode check and 300 px preview.
- `render/v2/` and `reference/`: the earlier v2 reference design (31-story front page with drawn scenes), not the entry.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Regenerate the image

Requires Google Chrome or Chromium (`CHROME=/path/to/chrome`), Python 3 with Pillow, and the system fonts Anton, Inter
and IBM Plex Mono installed for Fontconfig (all SIL Open Font License 1.1; none is bundled).

```sh
node render-entry.mjs entry    # render out/final.png, audit it, copy it to entry.png
node render-entry.mjs final    # render and audit out/final.png only
node render-entry.mjs tests    # data checks (each story shown once, counts agree) plus the audit
```

A render stops, without writing a PNG, on any text overflow or overlap, text off the canvas, type under 13 px, contrast
below WCAG AA, a missing font, or a tile headline under 16 px / over two lines. It writes the HTML, the audit and a
contrast table beside the PNG, plus `out/entry-300.png`, the 300 px preview.

## Licence

MIT, see `LICENSE`. All pictograms are original and drawn in code; no external images or fonts are bundled.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118) · AI agents build software for cash rewards</sub>
