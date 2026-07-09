# Missions

Each file here is a self-contained plan for one new feature: goal, why it matters, user stories, data model, UI changes, implementation steps, and acceptance criteria. Missions are independent — pick any one and implement it without needing the others finished first, except where a mission's "Implementation steps" explicitly says to sequence after another (Mission 05 benefits from Mission 04's ramp-preview component, for example).

| # | Mission | Summary |
|---|---------|---------|
| 01 | [Low-Stock Tracker](01-low-stock-tracker.md) | Flag an owned paint as running low; auto-adds it to the shopping list. |
| 02 | [Substitution Suggestions](02-substitution-suggestions.md) | Show "closest color you already own" on any unowned paint, everywhere. |
| 03 | [Custom Paint Mixes](03-custom-paint-mixes.md) | Save a blended-ratio mix of existing paints as its own owned "color." |
| 04 | [Gradient / OSL Recipe Builder](04-gradient-recipe-builder.md) | Generate a step-by-step blending ramp from a shadow/base/highlight pick. |
| 05 | [Complete-the-Gradient Suggestions](05-complete-the-gradient.md) | Find an owned color that naturally bridges two other owned colors. |
| 06 | [Projects / Armies Grouping](06-projects-armies.md) | Group owned colors by project so you can see what was used where. |
| 07 | [Tags & Notes per Paint](07-tags-and-notes.md) | Attach freeform notes and tags to any paint, filterable. |
| 08 | [Shopping List Price Tracking](08-price-tracking.md) | Estimate total cost of the shopping list from per-paint prices. |
| 09 | [Share Recipe/Palette as Image](09-share-as-image.md) | Export a ramp, project, or shopping list as a shareable PNG. |
| 10 | [Bulk / Multi-Select Actions](10-bulk-actions.md) | Select multiple colors in All Colors and own/cart them in one action. |
| 11 | [Undo Toast for Destructive Actions](11-undo-toast.md) | Replace confirm() dialogs with a toast + Undo for clears/deletes. |
| 12 | [Hex / RGB Color Search](12-hex-search.md) | Search by hex/RGB or a color picker to find the closest real paints. |
| 13 | [Sticky Toolbar & Tab Bar](13-sticky-toolbar.md) | Keep tab nav and toolbar visible while scrolling long grids. |
| 14 | [Paint-Type Glossary](14-paint-type-glossary.md) | Explain Base/Layer/Shade/Contrast/etc. paint ranges for beginners. |
| 15 | [Starter-Kit List](15-starter-kit.md) | A curated "buy these first" list independent of current ownership. |
| 16 | [Technique Glossary](16-technique-glossary.md) | Explain drybrush/wash/wet-blend/etc., linked to a painter's own tags. |
| 17 | [Onboarding Checklist](17-onboarding-checklist.md) | First-visit guided tour across the app's tabs, dismissible. |

Missions 14–16 share a single new **Learn** tab (paint-type glossary, starter kit, and technique glossary each get a section within it) rather than three separate tabs.

## Conventions used across missions
- **Storage**: each mission that needs persistence adds its own `localStorage` key, following the existing pattern (`getOwned`/`saveOwned`, `getCart`/`saveCart` in [app.js](../app.js)) — a `get*`/`save*` pair, JSON-serialized.
- **No new dependencies**: the project is vanilla HTML/CSS/JS with no build step or package manager; missions are written to stay within that constraint.
- **Export/Import**: missions that add new per-color data (notes, prices) should extend the existing Export/Import JSON so data isn't stranded on one device.
- **Card rendering**: `buildCard()` (app.js:441) is the shared card component — most missions extend it rather than building parallel rendering paths.
