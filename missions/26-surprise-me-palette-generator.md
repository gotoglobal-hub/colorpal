# Mission 26 — "Surprise Me" Random Palette Generator

## Goal
Give painters facing decision paralysis a one-click way to generate a themed starter palette, optionally constrained to colors they already own.

## Why it matters
Starting a new project's color scheme from a blank slate is a common source of hesitation. Mission 19's Color Harmony helper requires picking a starting color first — this mission removes even that step, generating a full N-color palette on demand, which pairs naturally with Mission 18's Projects as a fast way to seed one.

## User stories
- As a painter, I can click "Surprise Me" to generate a random N-color palette (default 4–6 colors).
- I can constrain generation to "owned colors only" or allow the full catalog.
- I can pick a generation mode: fully random, or harmony-based (complementary/analogous/triadic, reusing Mission 19's logic if present) seeded from a random starting color.
- I can regenerate as many times as I like, and "save" a result directly as a new Project (Mission 18) or Palette.

## Data model
- No new persistent storage required — this is a generator, not a stored entity. The generated result is transient state until the user chooses to save it, at which point it's written through the existing Project/Palette storage from Mission 18/06.

## UI changes
- A "Surprise Me" button, likely on the **Palettes** or **Projects** tab (index.html:38-45).
- A small results panel showing the generated swatches with a "Regenerate," "Owned only" toggle, and "Save as Project" action.

## Implementation steps
1. Add a `generatePalette({ count, ownedOnly, mode })` function operating over the color catalog and `getOwned()`.
2. For `mode: 'random'`, sample `count` distinct colors, optionally filtered to owned.
3. For `mode: 'harmony'`, pick a random seed color then reuse Mission 19's complementary/analogous/triadic logic if it exists; otherwise fall back to random with a note that harmony mode requires Mission 19.
4. Render the results panel with swatches and the regenerate/save controls.
5. Wire "Save as Project" to Mission 18's project-creation flow, pre-filled with the generated colors.

## Acceptance criteria
- Generated palettes never contain duplicate colors.
- "Owned only" mode never surfaces a color absent from `getOwned()`.
- Regenerating produces a different result (barring small catalogs where repeats are unavoidable).
- "Save as Project" creates a project containing exactly the generated colors.
