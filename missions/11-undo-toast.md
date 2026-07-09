# Mission 11 — Undo Toast for Destructive Actions

## Goal
Replace blocking `confirm()` dialogs on destructive actions with a toast that includes an "Undo" button, giving painters a faster, less disruptive safety net.

## Why it matters
`confirm()` stops the whole page and reads like a browser warning, not part of the app. A toast with a short undo window (existing `showToast()` already auto-dismisses after ~3.2s) is faster for the common case and still reversible.

## User stories
- Clearing the collection, clearing the shopping list, or deleting a mix/project no longer shows a native `confirm()` — the action happens immediately.
- A toast appears: "Collection cleared · Undo", staying up long enough to click.
- Clicking Undo restores the exact prior state (owned set, cart, mixes, or project) as it was before the action.
- If the toast expires or a new action fires, the undo window closes and the change is final.

## Data model
No persistent storage — hold the pre-action snapshot in a short-lived module variable, e.g. `let lastUndo = null;` (`{ label, restore: () => void }`), cleared after use or timeout.

## UI changes
- Extend `showToast()` (app.js) to accept an optional action button: `showToast(msg, { isError, actionLabel, onAction })`.
- Toast CSS gets a small inline button variant.

## Implementation steps
1. Extend `showToast` to render an optional action button inside the toast, wired to a callback, and to cancel/replace any previous undo state when a new toast fires.
2. For "Clear all" (app.js `btn-clear`): snapshot `getOwned()`/`getLow()` before clearing, drop the `confirm()`, call the clear, then `showToast('Collection cleared', { actionLabel: 'Undo', onAction: () => { saveOwned(snapshot); saveLow(lowSnapshot); renderMine(); updateBadges(); } })`.
3. Repeat the same pattern for "Clear shopping list" (`btn-clear-cart`), mix delete, and project delete.
4. Keep `confirm()` only where an undo snapshot would be impractical (none identified — all current confirms are simple set/array replacements).

## Acceptance criteria
- No native confirm dialogs remain on Clear all / Clear cart / delete mix / delete project.
- Clicking Undo within the toast window restores state exactly, verified by re-checking counts/badges.
- Undo is single-level (no redo/undo stack) — a second destructive action replaces the pending undo.
