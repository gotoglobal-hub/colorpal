# Mission 25 — Colorblind-Friendly Mode

## Goal
Add a toggle that makes swatches distinguishable for color-blind users, since color alone is currently the only way to tell paints apart at a glance.

## Why it matters
No mission or existing feature addresses accessibility. Color-vision deficiency affects a meaningful share of users (roughly 1 in 12 men), and a hobby app built entirely around visually similar paint swatches is a particularly hard case for them — two "different" reds or greens can be indistinguishable without help.

## User stories
- As a color-blind painter, I can enable a "Colorblind-Friendly Mode" toggle in settings.
- When enabled, swatches gain a distinguishing pattern/texture overlay (e.g. stripes, dots, crosshatch) in addition to color, so adjacent similar-hue swatches remain distinguishable.
- When enabled, I can pick a simulation type (protanopia/deuteranopia/tritanopia) to preview how the current palette looks under that condition — useful for painters designing palettes for others, not just for color-blind users themselves.
- The setting persists across sessions and applies everywhere swatches are rendered (All Colors, My Colors, Projects, Gradient Builder).

## Data model
- New `localStorage` key, e.g. `colors-of-mini-a11y` — `{ "patternMode": boolean, "simulate": "none"|"protanopia"|"deuteranopia"|"tritanopia" }`.
- Add `getA11ySettings()` / `saveA11ySettings()` helpers.

## UI changes
- A settings toggle (new small "Settings" panel or a control in the existing header) for pattern mode and simulation type.
- CSS pattern overlays (SVG background-image data URIs or `repeating-linear-gradient`) applied via a `.pattern-mode` class on swatches in `buildCard()` (app.js:441) — cycling through a small fixed set of patterns keyed by a hash of the color id so the same color always gets the same pattern.
- A CSS/JS color-matrix filter (`filter: url(#protanopia)` via an inline SVG `feColorMatrix`) applied to the swatch grid container when simulation is active.

## Implementation steps
1. Add `getA11ySettings`/`saveA11ySettings` storage helpers and the settings UI control.
2. Define 4–6 CSS patterns and a deterministic `patternForId(id)` function so pattern assignment is stable across renders.
3. Apply `.pattern-mode` class + pattern background to swatches in `buildCard()` when the setting is on.
4. Add inline SVG `feColorMatrix` filters for the three common color-vision-deficiency types and toggle the container class to apply them.
5. Ensure patterns/filters degrade gracefully (no layout shift) when toggled off.

## Acceptance criteria
- With pattern mode on, two visually similar but distinct-id swatches render with visibly different patterns.
- The same color id always renders the same pattern across sessions.
- Simulation filters visibly shift the rendered hues and can be toggled off instantly with no reload.
- Settings persist across reloads.
