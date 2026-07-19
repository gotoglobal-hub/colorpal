# Mission 24 — Paint Freshness / Dry-Out Reminders

## Goal
Let a painter record when a paint pot was opened and get a gentle warning once it's past typical shelf life, so they can use it up or replace it before it dries out mid-project.

## Why it matters
Hobby paints (acrylics especially) dry out or separate over time, particularly once opened. This is a real, recurring pain point distinct from Mission 01's low-stock flag — a pot can be full but *old*, or nearly empty but *fresh*. Nothing in the app currently tracks paint age.

## User stories
- As a painter, I can mark an owned color as "opened today" (or pick a date) from its card.
- A paint shows a "may be drying out" badge once it passes a configurable age threshold (default ~18 months, editable in settings).
- As a painter, I can dismiss/snooze the warning for a paint I've checked and confirmed is still fine.
- **My Colors** can be filtered/sorted to surface aging paints first, similar to the low-stock filter.

## Data model
- New `localStorage` key, e.g. `colors-of-mini-opened` — object keyed by color id:
  ```json
  { "citadel-base-abaddon-black": { "openedDate": "2025-01-15", "snoozedUntil": null } }
  ```
- Add `getOpenedDates()` / `saveOpenedDates()` / `setOpenedDate(id, date)` helpers alongside `getOwned`/`getCart` (app.js:15-33).
- A module-level constant `DRY_OUT_THRESHOLD_DAYS` (default 540) for the warning cutoff.

## UI changes
- A small "date opened" control on `buildCard()` (app.js:441) — a date input or "mark opened today" button, visible only when owned.
- A "may be drying out" badge/icon once `today - openedDate > DRY_OUT_THRESHOLD_DAYS`, with a "snooze" action that sets `snoozedUntil`.
- A "Freshness" sort/filter pill in `renderMine()` (app.js:1206), next to the existing Low Stock pill from Mission 01.

## Implementation steps
1. Add storage helpers (`getOpenedDates`, `saveOpenedDates`, `setOpenedDate`) next to `getLow`/`toggleLow`.
2. Add the date-opened UI control to `buildCard()`, defaulting to unset (no warning) until a painter records a date.
3. Compute "is stale" per card at render time; add badge styling in [style.css](../style.css).
4. Add the snooze action, storing `snoozedUntil` and suppressing the badge until that date passes.
5. Add the Freshness filter/sort pill in the **My Colors** toolbar.
6. Include `openedDate`/`snoozedUntil` in Export/Import JSON (Mission 22) so the data survives device moves.

## Acceptance criteria
- Setting an opened date persists across reloads and shows the correct badge state relative to today.
- Paints with no recorded opened date never show the dry-out badge (no false positives).
- Snoozing a warning hides it until the snooze period elapses, then it reappears if still stale.
- Freshness data survives Export → Import round-trip.
