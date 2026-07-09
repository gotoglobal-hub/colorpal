# Mission 06 — Projects / Armies Grouping

## Goal
Let a painter group owned colors by project ("Blood Angels Army," "Warhammer Underworlds warband," etc.) so they can see what was used where and reuse a scheme on future models.

## Why it matters
A miniature painter's collection isn't one undifferentiated pile — it's organized by army/project in their head already. Right now the app only has a flat **My Colors** view; this mission adds the organizing layer painters actually think in.

## User stories
- As a painter, I can create a named project (e.g. "Blood Angels").
- I can add/remove any owned color to/from a project (many-to-many: a color can belong to multiple projects).
- A new **Projects** tab lists my projects; opening one shows just its colors, using the existing card/grid rendering.
- I can duplicate a project as a starting point for a new one (e.g. "Blood Angels" → "Blood Angels Successor Chapter").
- I can delete a project without affecting ownership of the colors themselves.

## Data model
- New `localStorage` key, e.g. `colors-of-mini-projects` — array of:
  ```json
  { "id": "project-<uuid>", "name": "string", "colorIds": ["string", ...], "createdAt": "ISO date" }
  ```

## UI changes
- New tab in the nav (index.html:27-40): "Projects."
- Project list view (cards with name + color-count + mini swatch strip) → click into a project to get a filtered grid reusing `buildCard()`/`renderMine()`-style rendering.
- "Add to project" action on color cards (a small folder/plus icon, alongside the existing owned/cart toggles in `buildCard()`, app.js:441) — opens a quick picker of projects (with "+ New project" inline).

## Implementation steps
1. Add `getProjects()`/`saveProjects()` storage helpers.
2. Add the **Projects** tab + nav wiring, following the existing tab-switch pattern (app.js ~890-900).
3. Build project list rendering + project detail rendering (filter `allColors` by `project.colorIds`, reuse `buildCard`).
4. Add the "add to project" picker UI on each card, plus create/rename/delete project actions.
5. Add a "duplicate project" action that clones `colorIds` into a new project.

## Acceptance criteria
- Colors can belong to zero, one, or many projects without affecting the global owned/cart/low-stock state.
- Deleting a project never deletes or unowns the underlying colors.
- Project membership persists across reloads and (ideally) is included in Export/Import.
