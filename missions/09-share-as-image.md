# Mission 09 — Share Recipe/Palette as Image

## Goal
Let a painter export a gradient recipe, palette, or shopping list as a shareable image (PNG) for posting to Discord, forums, or social media.

## Why it matters
Painters share color recipes constantly in hobby communities. A visual, self-contained image (swatches + names, no login/app required to view) is far more shareable than a link or a JSON export.

## User stories
- As a painter, from a saved gradient recipe (Mission 04), a project (Mission 06), or the Shopping List, I can click "Share as image" and get a downloadable PNG.
- The image includes: title, ordered swatches with names/brands, and a small "Colors of Mini" footer/watermark.
- No server round-trip — rendering happens fully client-side.

## Data model
No new persistent storage — this is a rendering feature over existing data (ramps, projects, shopping list, or the current owned collection).

## UI changes
- A "Share as image" button wherever a shareable list already renders: Gradient Builder result (Mission 04), Project detail (Mission 06), Shopping List toolbar (index.html:120-127).

## Implementation steps
1. Choose a canvas approach: draw directly to an HTML `<canvas>` (swatch rectangles + `fillText` for labels) — this avoids adding an external library dependency, consistent with the project's current zero-dependency, vanilla JS/CSS/HTML approach.
2. Write a generic `renderSwatchesToCanvas(title, items)` where `items` is `[{ hex, name, brand }]`, laying out a simple grid or vertical list.
3. Convert the canvas to a PNG via `canvas.toDataURL('image/png')` and trigger a download (same pattern as the existing JSON export in app.js around line 959-975, swapped to a Blob/data URL for the image).
4. Wire the "Share as image" button into each relevant view, passing the appropriate item list.

## Acceptance criteria
- Generated PNGs are legible (readable swatch labels, no compressed watermark).
- Works fully offline/client-side with no new external dependencies.
- Available from at least the Shopping List and one other view (Gradient Builder or Projects, whichever ships first).
