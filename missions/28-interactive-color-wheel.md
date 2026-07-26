# Mission 28 — Interactive Color Wheel

## Goal
Give painters a visual hue wheel that plots their owned paints by hue/saturation, highlights complementary/analogous/triadic partners already in their collection, and exposes hue gaps at a glance.

## Why it matters
Mission 19 (Color Theory Helper) already computes harmony suggestions, but only as a text/chip list attached to one paint at a time. Dedicated miniature-painting color-wheel tools (Citadel Colour app, The Paint Picker, physical pocket wheels) exist precisely because seeing color relationships *spatially* is faster and more intuitive than reading a list — and it's the only way to spot "I own nothing in yellow-green" the way Mission 23's bar chart can't.

## User stories
- As a painter, I can open a Color Wheel view showing a hue ring with every color I own plotted as a dot (position = hue angle, distance from center = saturation).
- I can pick a base/seed color (dropdown, or by clicking a dot) and choose a harmony type — Complementary, Split Complementary, Analogous, Triadic, or Tetradic.
- The wheel highlights owned dots that fall near the chosen harmony's target angles, and shows target markers even where I don't own a matching paint.
- Below the wheel, a list shows the closest owned match (if any) for each harmony target, reusing the existing nearest-color logic.
- Clicking any owned dot re-centers the wheel on that paint as the new seed.

## Data model
- No new storage — this is a read-only visualization over `getOwned()` and the existing `hexToHsl`/`hslToHex` helpers (app.js:160+). Reuses `findNearestColor` for the "closest owned match" list, same as `renderHarmonySuggestions` (app.js:2010).

## UI changes
- New "Color Wheel" tab (`data-tab="wheel"`), following the existing tab pattern.
- A circular hue wheel built with a CSS `conic-gradient` background (no canvas needed) and absolutely-positioned dot elements for each owned paint.
- A seed-color `<select>` and harmony-mode `<select>`, reusing `populateColorSelect` (app.js:1748).
- Target markers (open rings, un-filled) at each harmony angle so gaps are visible even with nothing owned there.

## Implementation steps
1. Add the wheel container CSS: a square div with `background: conic-gradient(hsl(0,100%,50%), hsl(60,100%,50%), ..., hsl(360,100%,50%))`, `border-radius: 50%`.
2. Write `wheelPosition(hueDeg, satPct)` converting hue/saturation to an (x, y) point on the wheel, matching `conic-gradient`'s 0°-at-top, clockwise convention.
3. Write `harmonyTargetAngles(mode)` returning the offset list per harmony type (complementary `[180]`, split-complementary `[150, 210]`, analogous `[-30, 30]`, triadic `[120, 240]`, tetradic `[90, 180, 270]`).
4. Write `renderColorWheel()`: plot one dot per owned paint, flag dots within a small angular tolerance of a target as "match," plot target ring markers, and call `renderWheelMatches()` for the sidebar list.
5. Wire the seed/mode selects and per-dot click-to-reseed to re-run `renderColorWheel()`.
6. Populate the seed select and render on tab activation, mirroring how `gradient`/`stats` are dispatched in the tab-switch handler.

## Acceptance criteria
- Every owned paint appears as exactly one dot at the correct hue/saturation position.
- Changing harmony mode updates both the highlighted dots and the target markers without a page reload.
- The "closest owned match" list correctly shows "nothing owned" when no owned paint falls near a target.
- Clicking a dot updates the seed selector and re-renders around the new seed.
