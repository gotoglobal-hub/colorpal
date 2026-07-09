# Mission 13 — Sticky Toolbar & Tab Bar

## Goal
Keep the tab navigation and the active view's toolbar (search/filter/sort controls) visible while scrolling through a long color grid, instead of scrolling off-screen.

## Why it matters
Company sections like Citadel run to hundreds of paints. Once scrolled past the toolbar, a painter has to scroll all the way back up to search, change sort, or switch tabs — pure CSS-only fix, no logic change.

## Why it's separate from the other UI missions
Purely presentational (CSS `position: sticky`); no state, storage, or JS logic changes, so it's safe to ship independently and quickly.

## User stories
- The `.tab-nav` bar stays pinned to the top of the viewport while scrolling any tab's content.
- Each view's toolbar (`#toolbar-all`, `.mine-toolbar`, `#shopping-toolbar`) stays pinned directly beneath the tab bar while scrolling that view's grid.
- On narrow/mobile widths, the sticky toolbar collapses appropriately (existing `@media (max-width: 600px)` rules apply).

## Data model
None.

## Implementation steps
1. Add `position: sticky; top: 0; z-index: <above card content>;` to `.tab-nav` (style.css) and background matching `--bg-2` so content doesn't show through.
2. Add `position: sticky; top: <tab-nav height>;` to `#toolbar-all` and the `.mine-toolbar` variants used across tabs, with a matching solid background and a subtle bottom shadow to separate from scrolled content beneath.
3. Verify stacking order (`z-index`) so sticky bars sit above card grids but below modals/toasts.
4. Spot-check on a long grid (e.g. Citadel, unfiltered) that sticky behavior doesn't clip dropdowns (brand pills, sort pills) or cause layout shift.

## Acceptance criteria
- Scrolling any tab keeps the tab bar and that tab's toolbar visible and usable.
- No visual overlap/clipping with the sticky bars over card content.
- Modal (Mission 07) and toasts still render above the sticky bars.
