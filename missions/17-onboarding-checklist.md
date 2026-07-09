# Mission 17 — Onboarding Checklist

## Goal
Give a first-time visitor a short, dismissible checklist that orients them around the app's main features instead of landing on an empty "All Colors" grid with no explanation.

## Why it matters
The app now has 6 tabs (All Colors, My Colors, Palettes, Gradient Builder, Projects, Shopping List) plus a Learn tab (Missions 14/16) and a starter kit (Mission 15). A brand-new visitor has no way to know what order to explore things in.

## User stories
- On first visit (detected via a `localStorage` flag, not shown again after dismissal), a banner or panel appears with a short checklist:
  1. Mark paints you already own in **All Colors**
  2. Check the **Learn** tab for a starter-kit if you're just beginning
  3. Browse **Palettes** for ready-made color scheme ideas
  4. Try the **Gradient Builder** for a blending ramp
  5. Build a **Shopping List** for what's missing
- Each checklist item links (switches tab) to the relevant view when clicked.
- A "Don't show this again" / close (✕) control dismisses it permanently; a link (e.g. in the footer or header) allows re-opening it later for users who dismissed it by accident.

## Data model
A single `localStorage` flag, e.g. `colors-of-mini-onboarding-dismissed` = `'1'`.

## UI changes
- A dismissible banner/panel at the top of `<main>` (index.html), shown only when the flag is unset.
- A small "?" or "Getting started" link in the header (`.site-header`) to re-open it on demand regardless of dismissal state.

## Implementation steps
1. Add the banner markup (hidden by default) and the header re-open link.
2. On init, check the `localStorage` flag; show the banner if unset.
3. Wire each checklist item to switch `activeTab` to the relevant view (reuse the existing tab-button click logic — trigger a click on the matching `.tab-btn` rather than duplicating tab-switch logic).
4. Wire the close button to set the flag and hide the banner; wire the header link to show it regardless of the flag (without re-clearing the flag, so it won't reappear unprompted next visit).

## Acceptance criteria
- First-ever visit (empty localStorage) shows the checklist; reloading after dismissal does not show it again.
- Clicking a checklist item navigates to the correct tab.
- The "Getting started" header link reliably reopens the checklist on demand at any time.
