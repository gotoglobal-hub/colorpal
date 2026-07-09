# Mission 02 — Substitution Suggestions

## Goal
Surface "you don't own this, but you already own something close enough" everywhere a color is shown, not just inside the Palettes tab.

## Why it matters
The app already computes nearest-owned-color matching for palette analysis (`findNearestOwnedColor`, app.js:641). Painters frequently ask "do I already have something like this?" while browsing **All Colors** — that logic should be reusable there too.

## User stories
- As a painter, when I hover/tap an unowned color card in **All Colors**, I see "Closest match you own: <name>" if one exists within a reasonable distance threshold.
- If no owned color is close enough, no suggestion is shown (avoid noise).
- The suggestion links/scrolls to the matching owned color for comparison.

## Data model
No new persistent state — this is a derived, read-only feature built on existing `getOwned()` + `findNearestColor`/`findNearestOwnedColor` (app.js:611-644).

## UI changes
- Extend `buildCard()` (app.js:441) to accept an optional "suggestion" line rendered under the color name when `!isOwned`.
- Reuse `.guide-chip` / `.suggestion-chip` styling from the Palettes tab (app.js:679-733) for visual consistency.
- Add a distance threshold constant (the palette code already uses `80` as a reasonable cutoff — app.js:712).

## Implementation steps
1. Extract the "distance < threshold" check into a small shared helper, e.g. `suggestSubstitute(color)`, reusing `findNearestOwnedColor`.
2. Call it from `buildCard()` for unowned cards in the **All Colors** and **Shopping List** views.
3. Render the suggestion as a small subtext line with the matched swatch + name.
4. Debounce/memoize per render pass if performance on large grids becomes an issue (colors.json is small today, so likely unnecessary).

## Acceptance criteria
- Every unowned card with a close-enough owned match shows the suggestion.
- No suggestion appears for cards that are already owned.
- No suggestion appears when the collection is empty.
