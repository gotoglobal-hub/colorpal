# Mission 15 — Starter-Kit List

## Goal
Give a brand-new painter a short, curated "buy these first" list — independent of what they currently own — so the very first shopping trip isn't paralysis-by-choice across hundreds of catalog paints.

## Why it matters
The existing Palettes tab is gap-analysis *against a theme*, which assumes some starting collection. A total beginner needs a much simpler answer to "what do I even buy first," e.g. a black, a white, a few primaries, one metallic, one wash/shade.

## User stories
- A "Starter Kit" card (in the new Learn tab from Mission 14, or on first-visit — see Mission 17) lists ~8-12 essential paints: a shade/wash, a black base, a white, primary-ish red/blue/yellow, one metallic, one skin tone, covering the basics needed for most factions/genres.
- Each entry shows the real matched paint(s) from `colors.json` per company (so a Citadel painter and a Vallejo painter each see their own brand's equivalent), reusing the nearest-color/paint-guide pattern already used in `PAINT_GUIDES` (app.js:302-412).
- A "Add all to shopping list" button on the starter kit adds every recommended paint (respecting the painter's already-selected company filter, if any) to the cart in one action.

## Data model
A static `STARTER_KIT` array of role/description entries, each with per-company paint ID lists (same shape as `PAINT_GUIDES` entries: `{ role, ids: [...] }`). No `localStorage` key needed — "add all" just writes into the existing cart storage.

## UI changes
- A dedicated card/section, likely inside the Learn tab, listing the starter kit roles with paint chips (reuse the `.guide-chip`/`.guide-row` styling already built for `buildPaletteCard()`, app.js:729-767).
- "Add all to shopping list" button.

## Implementation steps
1. Define `STARTER_KIT` content: ~8-12 roles (e.g. "Black Base", "White Base", "All-purpose Shade", "Red", "Blue", "Yellow", "Metallic Gold/Silver", "Skin Tone"), each with paint IDs across the companies present in `colors.json`.
2. Render it using the existing guide-chip pattern, filtered to the painter's currently selected company if `activeCompany !== 'all'`, else showing one company's worth by default to avoid an overwhelming wall of chips.
3. Wire "Add all to shopping list" to loop the visible chip set into `getCart()`/`saveCart()` in one batch, then `showToast`.

## Acceptance criteria
- The starter kit resolves to real, valid paint IDs from `colors.json` for at least 2 companies.
- "Add all" populates the shopping list with the full starter set in one click and reflects immediately in the Shopping List tab badge.
- The list is filterable by company so it doesn't just dump every brand's version of every role at once.
