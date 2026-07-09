# Mission 07 — Tags & Notes per Paint

## Goal
Let a painter attach free-form notes and/or short tags to any color (owned or not) — e.g. "good for NMM gold," "dries fast, thin it," "2 coats for full coverage."

## Why it matters
Painters build up personal knowledge about how a specific paint behaves that's not captured anywhere in the app today. This turns the collection into a personal reference, not just an inventory.

## User stories
- As a painter, I can add a short note (free text) to any color from its card.
- As a painter, I can add one or more short tags to a color (freeform or from a suggested list, e.g. "NMM," "OSL," "wet-blend," "dry-brush," "glaze").
- Notes/tags are visible on the card (note as a small icon with tooltip/expand; tags as small chips) without cluttering the compact grid layout.
- I can filter **All Colors** / **My Colors** by tag.

## Data model
- New `localStorage` key, e.g. `colors-of-mini-notes` — object keyed by color id:
  ```json
  { "citadel-base-abaddon-black": { "note": "string", "tags": ["NMM", "glaze"] } }
  ```

## UI changes
- A small "note" icon on `buildCard()` (app.js:441) that opens an inline textarea + tag input on click (popover or expand-in-place to avoid a heavy modal).
- Tag chips rendered under the color name when present.
- A tag filter row in the **All Colors** / **My Colors** toolbars, similar to the existing company pills (index.html:44-52).

## Implementation steps
1. Add `getNotes()`/`saveNotes()` storage helpers, and `getNote(id)`/`setNote(id, {note, tags})`.
2. Add the note/tag editor UI (inline popover keeps this simple; avoid building a full modal system if not already present).
3. Render tag chips + note indicator in `buildCard()`.
4. Add tag-based filtering, reusing the pill-filter pattern already used for companies (`filteredColors()`, app.js:555).
5. Include notes/tags in Export/Import JSON so a painter doesn't lose them when moving devices.

## Acceptance criteria
- Notes/tags persist per color across reloads.
- Tag filter correctly narrows the grid to colors carrying that tag.
- Notes/tags survive Export → Import round-trip.
