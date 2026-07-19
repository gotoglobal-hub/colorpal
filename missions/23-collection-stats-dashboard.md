# Mission 23 — Collection Stats Dashboard

## Goal
Give painters a single view that summarizes their collection: how many paints they own by brand and color family, total estimated spend, and how complete they are against common ranges.

## Why it matters
Right now the app only shows the collection as a grid — there's no "big picture" view. A stats view gives users a reason to open the app even when they're not actively shopping or painting, and it's pure derived data from state that already exists (`getOwned()`, tags from Mission 07, prices from Mission 08).

## User stories
- As a painter, I can see a breakdown of my owned paints by brand/company and by color family.
- As a painter, I can see my total estimated collection value (using per-paint prices where available).
- As a painter, I can see completion % for each brand/range (owned vs. total available in that range).
- As a painter, I can see my most-used tags (from Mission 07) if tagging is present, e.g. "12 paints tagged NMM."

## Data model
- No new storage — this is a read-only aggregation over existing data: `getOwned()` (app.js:25), the static color catalog, `getPrices()` (Mission 08) if present, and `getNotes()` (Mission 07) if present.
- Optional: cache the last-computed summary in a `colors-of-mini-stats-cache` key if computation becomes expensive on large collections, invalidated whenever `saveOwned` runs.

## UI changes
- New "Stats" tab in `.tab-nav` (index.html:28), following the existing `data-tab` pattern.
- A dashboard of simple stat tiles/bars (owned count, brand breakdown as a horizontal bar list, color-family breakdown, total value, top tags) — no charting library, plain divs with CSS-driven bar widths per the "no new dependencies" convention.

## Implementation steps
1. Add the "Stats" tab button and panel scaffold, mirroring the `data-tab="learn"` pattern.
2. Write a `computeStats(owned)` function that walks the color catalog and `getOwned()` to produce brand/family counts and range completion.
3. If Mission 08's price data exists, sum owned paint prices for a total value figure; degrade gracefully (hide the tile) if no prices are set.
4. If Mission 07's tag data exists, compute top-N tag frequency; degrade gracefully if absent.
5. Render tiles/bars with plain CSS, reusing existing color-family swatch colors for the breakdown bars.
6. Recompute on tab activation rather than on every `saveOwned`, to keep it cheap.

## Acceptance criteria
- Stats tab shows accurate owned counts matching what's shown in **My Colors**.
- Brand/family breakdowns sum to the total owned count.
- Total value tile is hidden (not zero) when no price data exists, rather than showing $0.
- Dashboard updates correctly after adding/removing owned colors and reopening the tab.
