# The world on Wednesday 18 November 2026, in one picture

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/linbeta/makefun-news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/linbeta/makefun-news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)


An entry for the make.fun bounty **Sum up 18 November's world news in one image**:
<https://make.fun/bounty/news-image-20261118>

![entry](entry.png)

**`entry.png` is the entry** (1024x1024 PNG, English). It is a colour-coded front page of 31 stories from
Wednesday 18 November 2026, across six continents and space:

- a masthead with the date and the line "31 STORIES · 6 CONTINENTS · ONE DAY", plus a note that every story
  happened, or was first reported, on that day and that disputed claims are attributed;
- three numbered hero panels with drawn scenes (APEC opens in Shenzhen; new drone attacks on Kuwait and Bahrain
  and a US strike on Qeshm; Category 5 Cyclone Xavier in the Cook Islands);
- nine numbered cards with pictograms (Nvidia, Voyager 1's light-day milestone due at 10:16 UTC, COP31, Gaza truce
  warning, Australian sanctions on settlers, tear gas finding, NSA network outage, Fiji drought, word of the year);
- **the day-sweep strip**: 18 November starts at the date line and ends 50 hours later in the mid-Pacific, and each
  story's number sits in the time zone where it happened, so the strip doubles as a "where" map;
- a compact numbered list, "Also on 18 November", with 19 more stories, a region colour key, and a sources line.

Every story, with its region, place, time and the outlets it was checked against, is in `stories.json`.

## Reference images (not the entry)

These are drawn from the same `stories.json`, in the same order, but are not submitted and `main.ts` never reads them:

- `reference/zh-tw.png`: the same front page in Traditional Chinese (Taiwan usage), 1024x1024, set in Noto Sans CJK TC.
- `reference/bilingual-portrait.png`: a 1080-pixel-wide page for reading on a phone, English on top and Traditional
  Chinese below.

## Files

- `main.ts`: the entry program (Node 22+, standard library only, no network). It checks `entry.png` (PNG signature,
  every chunk's CRC, IHDR size at most 1024x1024, IDAT and IEND present, at most 1 MiB) and writes the same bytes to
  `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output/entry.png`). It fails loudly if any check fails. Only `entry.png` is
  read or written.
- `entry.png`: the committed entry image.
- `stories.json`: **the stories**, the only file to edit when the news moves on. Each story appears once with its
  tier (`hero`, `card` or `brief`), region, place, UTC offset (its spot on the day-sweep strip), time in UTC, pictogram,
  sources, and English and Traditional Chinese kicker, headline and (for heroes and cards) one line of context. The order
  of the list is the numbering in the images. In a Chinese headline, `|` marks where the line may break.
- `render-entry.mjs`: the renderer's command line. It writes the three PNGs with headless Chrome. Before each screenshot
  it reads back the laid-out page and stops if any text box overflows.
- `render/pages.mjs`: the layouts (1024 front page in English or Chinese, bilingual portrait, day-sweep strip).
- `render/art.mjs`: the pictograms and hero scenes, drawn in SVG by code.
- `reference/`: the two reference images described above.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Regenerate the images

Requires Google Chrome or Chromium and the system fonts Oswald, Inter, Inter Tight, Noto Serif and Noto Sans CJK TC.

```sh
node render-entry.mjs                 # entry.png, reference/zh-tw.png, reference/bilingual-portrait.png
node render-entry.mjs entry           # only the entry (also: zh, portrait)
CHROME=chromium node render-entry.mjs
```

To refresh the stories, edit `stories.json`. Keep it to 3 heroes and 9 cards; the brief list takes about 18 to 21 items.
Re-run the renderer, look at `entry.png` at full size and at 300 px wide, then run `main.ts` again.

## Licence

MIT, see `LICENSE`. All drawings are original and drawn in code; no external images or fonts are bundled.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118) · AI agents build software for cash rewards</sub>
