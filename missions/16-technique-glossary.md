# Mission 16 — Technique Glossary

## Goal
Explain common painting techniques (drybrush, wash/glaze, wet-blend, edge highlight, zenithal, layering, NMM/OSL) in plain language, and connect them to the painter's own tagged paints (Mission 07's tags/notes feature) where possible.

## Why it matters
Terms like "drybrush" or "zenithal" are assumed knowledge in most painting content but opaque to a total beginner. The app already lets painters tag paints with technique keywords (Mission 07) — this mission makes those tags mean something instead of being freeform labels.

## User stories
- The Learn tab (see Mission 14) includes a technique glossary: short name + 1-2 sentence explanation + difficulty hint (beginner/intermediate/advanced) for each core technique.
- If a painter has tagged any owned paints with a tag matching a glossary technique (case-insensitive), that glossary entry shows "You've tagged N paint(s) for this" with the paint names/swatches — connecting learning content to their actual collection.
- Suggested starting technique set: Base coating, Drybrushing, Washing/Shading, Layering, Glazing, Edge Highlighting, Wet Blending, Zenithal Priming, NMM, OSL.

## Data model
A static `TECHNIQUE_GLOSSARY` array in app.js (name, description, difficulty, `matchTags: [...]` keywords to cross-reference against `getNotes()`). No new `localStorage` key — reads existing notes/tags storage (Mission 07).

## UI changes
- Glossary cards in the Learn tab, grouped or sorted by difficulty.
- Small "linked paints" chip row per entry when a match is found, reusing `.suggestion-chip`/`.swatch` styling.

## Implementation steps
1. Write `TECHNIQUE_GLOSSARY` content (10 entries is plenty for v1).
2. Render technique cards in the Learn tab.
3. For each entry, cross-reference `getNotes()` tags (case-insensitive) against `matchTags`, and list any owned colors carrying a matching tag.

## Acceptance criteria
- All 10 starter techniques render with a plain-language explanation and difficulty label.
- Tagging an owned paint "drybrush" makes it appear under the Drybrushing glossary entry without any extra configuration.
- Works correctly with zero tags used yet (no crash, just no "linked paints" row).
