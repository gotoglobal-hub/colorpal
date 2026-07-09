# Mission 01 — Low-Stock Tracker

## Goal
Let a painter flag a paint they own as "running low" so it's easy to remember what to rebuy, without digging through the full collection.

## Why it matters
Hobby painters often notice a pot is nearly empty mid-project. Today the only way to remember to rebuy it is to manually add it to the Shopping List — this mission makes that a one-click, visible state distinct from "don't own at all."

## User stories
- As a painter, I can mark any color I own as "low" from its card (in **All Colors** or **My Colors**).
- A "low" color shows a distinct badge/icon on its card wherever it appears.
- Marking a color "low" automatically adds it to the **Shopping List** (but doesn't remove ownership).
- Unmarking "low" (or removing from the shopping list) clears the flag.
- **My Colors** can be filtered/sorted to show low-stock paints first.

## Data model
- New `localStorage` key, e.g. `colors-of-mini-low` — a JSON array of owned color `id`s, mirroring the existing `getOwned()` / `getCart()` pattern in [app.js](../app.js).
- Add `getLow()`, `saveLow(set)`, `toggleLow(id)` helpers alongside `getOwned`/`getCart` (app.js:15-33).

## UI changes
- Add a third icon button to `buildCard()` (app.js:441) — e.g. a "battery low" glyph — only enabled/visible when the color is owned.
- Add a `.low-stock` class + CSS badge in [style.css](../style.css), similar to `.owned`.
- In `renderMine()`, add a "Low stock" sort/filter pill next to the existing Company/Color family pills (index.html:74-79).

## Implementation steps
1. Add storage helpers (`getLow`, `saveLow`, `toggleLow`) next to `getOwned`.
2. Wire a new button into `buildCard()`, mirroring the cart-toggle button's event handling.
3. On toggle-to-low: call `toggleCart` logic to also add to the shopping list (reuse `toggleCart(id)`).
4. Add badge styling and a low-stock filter pill in the **My Colors** toolbar.
5. Update `updateBadges()` (app.js:875) if a low-stock count badge is desired on the tab.

## Acceptance criteria
- Toggling "low" on an owned color adds it to the shopping list immediately.
- Removing a color from "My Colors" also clears its low-stock flag.
- Low-stock state persists across reloads (localStorage) and survives Export/Import if included in the exported JSON.
