# Mission 14 — Paint-Type Glossary

## Goal
Explain, in plain language, what the different paint ranges (Base, Layer, Shade, Contrast/Speedpaint, Technical, Metallic, Ink) actually do and when to use each — a common source of confusion for new painters staring at a wall of similarly-labelled pots.

## Why it matters
The catalog already tags every paint with a `brand` field (e.g. Citadel "Base" vs "Layer" vs "Shade") but never explains what that means. A beginner can't tell why "Mephiston Red" (Base) and "Evil Sunz Scarlet" (Layer) are both red but used completely differently.

## User stories
- A new "Learn" tab (or a panel inside an existing tab — see Implementation) lists each paint-type/range with a short, plain-language explanation and a "when to use it" note.
- Where a color's `brand` field matches a known range (Base, Layer, Shade, Contrast, Technical, Metallic, Ink, Model Color, Game Color, etc. — brand ranges vary per company), its card can optionally show a "?" info affordance linking to that glossary entry.
- Content is static (no user data), so it ships as a plain data table + render function — no storage needed.

## Data model
A static `PAINT_TYPE_GLOSSARY` array/object in app.js, e.g.:
```js
{ range: 'Base', description: '...', whenToUse: '...', companies: ['Citadel', ...] }
```
No `localStorage` key required.

## UI changes
- New tab "Learn" (or a sub-section within it — see Mission 16 and 17, which likely share this tab) listing glossary cards grouped by concept.
- Optional: a small "ⓘ" badge next to `badge-brand` in `buildCard()` (app.js) that opens a tooltip/popover with that range's glossary entry, for in-context learning without leaving the grid.

## Implementation steps
1. Write the static glossary content (aim for the ranges actually present in `colors.json`'s `brand` values — check distinct values first).
2. Add a "Learn" tab and render the glossary as simple cards (title, description, when-to-use).
3. (Optional, if time allows) Wire a lightweight popover from `badge-brand` chips elsewhere in the app back to the matching glossary entry.

## Acceptance criteria
- Every distinct `brand` value present in `colors.json` has a corresponding glossary entry (or is clearly out of scope, e.g. one-off ranges).
- A beginner can find, in under 2 clicks from any tab, an explanation of what "Contrast" or "Technical" paint is for.
