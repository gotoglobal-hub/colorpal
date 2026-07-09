# Mission 03 — Custom Paint Mixes

## Goal
Let a painter save a custom mix recipe (e.g. "70% Mephiston Red + 30% Abaddon Black") as its own entry, so it shows up like any other owned color.

## Why it matters
Experienced miniature painters rarely use paints straight from the pot — mixes are a core part of their workflow, and today there's no way to record "this is a color I effectively have" if it's a blend.

## User stories
- As a painter, I can create a new "mix" from 2+ existing colors (owned or not) with per-color ratios.
- The app computes an approximate resulting hex (weighted RGB/HSL blend) and shows it as a swatch.
- Saved mixes appear in **My Colors**, tagged as a mix (e.g. a small flask icon), and behave like owned colors for palette matching.
- I can name my mix (default: auto-generated from ingredients, e.g. "Mephiston Red + Abaddon Black").
- I can edit or delete a saved mix.

## Data model
- New `localStorage` key, e.g. `colors-of-mini-mixes` — array of:
  ```json
  { "id": "mix-<uuid>", "name": "string", "ingredients": [{ "colorId": "string", "ratio": 0.7 }], "hex": "#rrggbb" }
  ```
- Mixes are merged into the working color list (`allColors` + mixes) at render time so existing sort/family/nearest-match logic (app.js:390-644) works unmodified — mixes just need a valid `hex`.
- Mixes are implicitly "owned" (they exist because the user made them), so they should auto-populate `getOwned()` on creation.

## UI changes
- New "+ Create Mix" entry point in **My Colors** toolbar (index.html:74-87).
- A small modal/panel: pick N colors (search existing color list), set ratio sliders, live-preview swatch, name field, Save.
- Mix cards in the grid get a distinguishing badge (e.g. 🧪) via `buildCard()`.

## Implementation steps
1. Write `mixHex(ingredients)` — weighted average in RGB space (or HSL for perceptually nicer blends); can reuse `hexToRgb`/`hexToHsl` (app.js:59, 611).
2. Add `getMixes()`/`saveMixes()` storage helpers.
3. Merge mixes into color lookups: wherever code does `allColors.find/filter`, ensure mixes are included (centralize via a `getAllColorsIncludingMixes()` helper to avoid scattering the merge logic).
4. Build the mix-creation UI (modal or inline panel) and wire Save to create the mix + mark it owned.
5. Add edit/delete actions on mix cards.

## Acceptance criteria
- Creating a mix immediately shows it in **My Colors** with a plausible blended swatch.
- Mixes participate in palette gap-analysis (Mission 05 relies on the same merged list).
- Deleting a mix removes it from owned/cart/low-stock state cleanly.
