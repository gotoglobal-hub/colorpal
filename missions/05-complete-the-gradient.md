# Mission 05 — Complete-the-Gradient Suggestions

## Goal
Given two colors a painter already owns, suggest a third owned color that sits between them in hue/lightness, so they can blend without buying anything new.

## Why it matters
Not every painter wants to shop for a whole new ramp (see Mission 04) — sometimes the best answer is "you already have what you need, here's how to use it." This is the low-friction, zero-cost companion to the Gradient Builder.

## User stories
- From **My Colors**, I can select any two owned colors ("From" / "To") and see whether a third owned color naturally sits between them.
- The app shows the ordered 3-step blend (or says "no good in-between match — consider buying X" and points at Mission 04's ramp builder / a nearest-catalog suggestion).
- This should also run automatically: on the **My Colors** view, small "blend-ready" hints could appear for color pairs that already form a natural ramp (stretch goal — keep optional/off by default to avoid clutter).

## Data model
No new persistent storage — purely derived from `getOwned()` + existing HSL utilities (app.js:59-58, 390-419).

## UI changes
- A lightweight "Find a blend" tool: two color pickers scoped to owned colors only, a "Find" button, and a result row showing shadow→mid→highlight swatches.
- Reuses the ramp-preview component from Mission 04 if built first (recommend sequencing Mission 04 before this one, or building the shared preview component once and having both missions consume it).

## Implementation steps
1. Write `findMidpointOwned(hexA, hexB)`: interpolate the midpoint hue/lightness between A and B, then run `findNearestColor` restricted to `getOwned()` colors, with a distance/hue-direction sanity check (the match must actually sit "between" A and B, not just be numerically close).
2. Build the two-picker UI (reuse patterns from Mission 04's color search).
3. Render the 3-step result, or a clear "no match — here's the closest buyable option" fallback using `findNearestColor` against the full catalog.
4. (Stretch) Auto-detect + badge candidate pairs in **My Colors** without explicit user action.

## Acceptance criteria
- For two owned colors with a reasonable owned in-between match, the tool returns a sensible 3-step blend using only owned paints.
- When no good in-between match exists, the user gets a clear "nothing owned fits — here's what to buy" fallback rather than a bad/misleading suggestion.
