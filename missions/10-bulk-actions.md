# Mission 10 — Bulk / Multi-Select Actions

## Goal
Let a painter select multiple color cards at once in **All Colors** and apply an action (add to collection, add to shopping list) to all of them in one step.

## Why it matters
Right now every add/own/cart action is one click per paint. Painters who just bought a full range of a brand's core set, or who want to bulk-populate the shopping list from a search result, have to click dozens of times.

## User stories
- A "Select" mode toggle in the **All Colors** toolbar turns on checkboxes on every visible card.
- Clicking cards while in select mode toggles their selection (checkbox + highlighted border), without triggering the normal add/cart actions.
- A selection toolbar appears showing "N selected" with **Add to collection** and **Add to shopping list** buttons, plus **Clear selection**.
- Exiting select mode (toggle off) clears the selection and hides the checkboxes.

## Data model
No new persistent storage — selection is transient UI state (`let selectMode = false; let selectedIds = new Set();`).

## UI changes
- A "Select" toggle button in the `#toolbar-all` row (index.html:42-65).
- A checkbox overlay on `.color-circle` when `selectMode` is on (CSS class `.select-mode .color-circle` shows a checkbox instead of triggering the note modal).
- A selection action bar, similar to `.mine-toolbar`, shown above the grid only while `selectedIds.size > 0`.

## Implementation steps
1. Add `selectMode`/`selectedIds` state and a toggle button wired to `renderAll()`.
2. In `buildCard()` (app.js:493), when `selectMode` is true, render a checkbox in place of the normal circle click behavior and toggle `selectedIds`.
3. Render a floating/sticky selection bar with count + bulk actions; wire "Add to collection" to loop `selectedIds` through the same logic as `toggleOwned` (batched, single `saveOwned` call for efficiency), same pattern for cart.
4. Clear selection and exit select mode after a bulk action completes; show a toast summarizing what happened.

## Acceptance criteria
- Selecting 5 colors and clicking "Add to collection" owns all 5 in a single action.
- Selection state resets when leaving the All Colors tab or toggling select mode off.
- Normal (non-select-mode) card behavior is unaffected.
