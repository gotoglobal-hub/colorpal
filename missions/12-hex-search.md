# Mission 12 — Hex / RGB Color Search

## Goal
Let a painter type or paste a hex code (or pick from a native color picker) into the search box and jump straight to the closest matching paints, instead of only text-matching names.

## Why it matters
Painters often have a color reference (a photo, a swatch, a competitor's paint code converted online) as a hex/RGB value, not a paint name. The existing search (`filteredColors()`, app.js) only matches name/brand/company substrings.

## User stories
- Typing a valid hex string (`#1a3d7c`, `1a3d7c`, or `rgb(26,61,124)`) into the existing search box switches **All Colors** into "closest match" mode: results are sorted by color distance to that value instead of the default order, with a distance/percent-match indicator on each card.
- A small native `<input type="color">` swatch next to the search box lets a painter pick a color visually instead of typing hex.
- Clearing the search returns to normal name-search behavior.

## Data model
No persistent storage — derived from existing `colorDistance`/`findNearestColor` (app.js:673-701).

## UI changes
- Add a small color-picker input (`<input type="color">`) next to `#search` in the toolbar (index.html:42-65).
- When in hex-match mode, show a "N% match" or distance badge on each card (reuse the `.color-substitute`-style small text row).

## Implementation steps
1. Write `parseColorInput(str)` that accepts `#rgb`, `#rrggbb`, or `rgb(r,g,b)` and returns a normalized hex or `null` if unparseable.
2. In the search input handler, detect a parseable color string; if found, switch `filteredColors()`/`renderAll()` to sort by `colorDistance` to that hex instead of the default/company order.
3. Wire the `<input type="color">` to write its value into the search box (or a separate hidden state) and trigger the same closest-match render path.
4. Add the match-quality badge to `buildCard()` only when in hex-match mode (pass via `opts`, following the pattern already used for `opts.showPrice`).

## Acceptance criteria
- Typing `#1a3d7c` shows paints ordered nearest-to-furthest from that color, with a visible match indicator.
- Typing a normal name (e.g. "blue") still does plain substring search, unaffected.
- The color-picker input produces the same result as typing the equivalent hex.
