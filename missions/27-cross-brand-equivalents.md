# Mission 27 — Cross-Brand Equivalents Lookup

## Goal
Given any paint, show its closest official "same color, different brand" equivalents (e.g. Citadel Abaddon Black ↔ Vallejo Black ↔ Army Painter equivalents), even if the user doesn't own any of them.

## Why it matters
Painters often want to know "what's the Vallejo version of this Citadel color" — to buy a cheaper equivalent, replace a discontinued paint, or work with whatever brand is in stock locally. This is different from Mission 02 (Substitution Suggestions), which only looks at colors the user *already owns*; this mission is a catalog-wide lookup useful even for paints nobody owns yet, aimed at purchase decisions.

## User stories
- As a painter, I can view a paint's detail/card and see a list of its nearest equivalents from other brands.
- Equivalents are ranked by color-distance (reusing the existing hex/RGB distance logic used for substitutions and hex search) with a "closest match" confidence indicator, since true 1:1 equivalents don't always exist.
- I can add an equivalent directly to my Shopping List from the lookup, without navigating away.
- I can filter the equivalents list to a specific brand (e.g. "show me only the Vallejo equivalent").

## Data model
- No new storage beyond the existing color catalog (with `hex`, `company`/`brand` fields — app.js:72-73). Equivalents are computed on demand via color distance, not pre-curated data, so there's no manual mapping table to maintain.
- Reuse `hexToRgb`/`hexToHsl` (app.js:160+) and whatever distance function backs Mission 12's hex search / Mission 02's substitutions.

## UI changes
- An "Equivalents" section in the paint detail/card expansion, listing the top match per other brand.
- A brand filter chip row above the equivalents list.
- A small "add to shopping list" icon per equivalent row, reusing `toggleCart(id)`.

## Implementation steps
1. Extract or reuse the existing color-distance function (from Mission 02/12) as a shared `nearestColors(hex, { excludeBrand, limit })` utility if not already generalized.
2. For a given paint, group the catalog by brand and find the single closest match per other brand.
3. Render the equivalents section with brand filter chips and per-row "add to cart" action.
4. Add a simple confidence label (e.g. "very close" / "similar" / "loose match") based on distance thresholds.

## Acceptance criteria
- Equivalents list never includes the source paint's own brand.
- Distance-based ranking matches what Mission 12's hex search would return for the same hex.
- Adding an equivalent to the shopping list updates the cart badge immediately.
- Brand filter correctly narrows the list to one match.
