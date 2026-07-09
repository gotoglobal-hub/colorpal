# Mission 04 — Gradient / OSL Recipe Builder

## Goal
Given a base, shadow, and highlight color from the user's collection, generate a step-by-step blending ramp (e.g. 5 steps) a painter can follow while layering or blending — including for OSL (Object Source Lighting) effects.

## Why it matters
This is the "what color gradient to do" half of the project's stated purpose. The app already has the color-math primitives (`hexToHsl`, `hexToRgb`, `colorDistance`) but no ramp/blend generator yet.

## User stories
- As a painter, I pick a **shadow**, **base**, and **highlight** color (searchable from owned colors, with the option to include unowned colors too).
- The app generates an N-step ramp (default 5) interpolated across the three points, each step matched to the nearest real paint in the full catalog (owned preferred, else flagged as "not owned").
- I can toggle "OSL mode," which biases the highlight step toward a light-source color (e.g. yellow/white) for a glowing effect.
- I can save a ramp as a named recipe for later reference (e.g. "Space Marine Red NMM").

## Data model
- New `localStorage` key, e.g. `colors-of-mini-ramps` — array of:
  ```json
  { "id": "ramp-<uuid>", "name": "string", "steps": ["colorId", "colorId", ...], "createdAt": "ISO date" }
  ```

## UI changes
- New tab or a panel within **Palettes**: "Gradient Builder."
- Three color pickers (shadow/base/highlight) reusing the existing search/pill filtering UI patterns from **All Colors** (index.html:42-65).
- A horizontal ramp preview: swatches for each interpolated step with paint name labels, "not owned" ones visually muted with a shopping-cart quick-add.
- Step count control (e.g. 3–7).

## Implementation steps
1. Add an HSL (or Lab, for closer-to-perceptual results) interpolation function `interpolateRamp(hexA, hexB, steps)` building on `hexToHsl` (app.js:59).
2. For a 3-point ramp (shadow→base→highlight), interpolate each half separately and concatenate.
3. For each interpolated color, call `findNearestColor` (app.js:628) against the full catalog to snap to a real paint; keep the raw interpolated hex too for reference.
4. Build the Gradient Builder UI: pickers, step slider, live ramp preview.
5. Add "Save recipe" using the new storage key; list saved recipes with the ability to re-open/delete.
6. (Optional, if time allows) OSL mode: blend the top step toward a configurable light color before nearest-match snapping.

## Acceptance criteria
- Selecting any 2–3 colors produces a visually smooth ramp of real, purchasable/ownable paints.
- Unowned steps are clearly marked and one-click addable to the Shopping List.
- Saved recipes persist and can be reopened to view/edit.
