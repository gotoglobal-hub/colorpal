# Colors of Mini

A single-page web app for hobby miniature painters to track which paints they own, what to buy next, and what color palettes/gradients to use — no build step, no backend, everything runs client-side and persists to `localStorage`.

## What it does today

- **All Colors** — browse the full paint catalog ([colors.json](colors.json)), filter by company/brand, search by name/tag, sort by default order or color family. Unowned paints show a "closest color you already own" suggestion when one's close enough.
- **My Colors** — the subset you own, plus any custom paint mixes you've blended; mark paints "low stock" (auto-queues them on the shopping list); sort by company or color family; export/import your collection as JSON; clear it in one action.
- **Palettes** — curated palettes (by color theory, genre, character role, and Army Painter showcases) with gap analysis: which palettes you can already do with owned paints, and nearest-owned-color suggestions for the paints you're missing.
- **Gradient Builder** — pick a shadow/base/highlight color and get a step-by-step blending ramp snapped to real paints, plus a "complete the gradient" tool that finds an owned paint bridging two others without buying anything.
- **Projects** — group owned colors by project/army so you can see what was used where, without affecting global ownership.
- **Shopping List** — a cart of paints to buy, addable from any color card, with per-item price tracking, a running total, print support, and "share as image" export.
- **Notes & tags** — click any paint's swatch to attach a freeform note and tags (e.g. "NMM", "dries fast"), filterable from All Colors.
- **Learn** — a paint-type glossary (Base/Layer/Shade/Contrast/etc.), a company-filterable starter-kit list you can add to the shopping list in one click, and a technique glossary (drybrush, wet-blend, NMM, OSL...) that links to your own tagged paints.
- **Bulk select** — multi-select colors in All Colors and add them all to your collection or shopping list at once.
- **Hex/RGB search** — type or pick a color to sort All Colors by closest real-paint match.
- **Undo** — Clear All/Clear List/delete-mix/delete-project act immediately with a toast "Undo" instead of a confirm() popup.
- **Onboarding checklist** — a dismissible first-visit guide across the app's tabs, reopenable anytime from the header.
- **Theming** — dark/light theme, persisted per device.

## Project structure

```
index.html    Markup for all tabs/views
app.js        All app logic: storage, rendering, filtering, color math
style.css     Styling and theme variables
colors.json   The paint catalog (id, company, brand, name, hex)
missions/     Feature plans for future work (see below)
```

## How data persists

Everything lives in the browser's `localStorage`, keyed per feature (owned colors, low-stock flags, shopping cart, mixes, gradients, projects, notes/tags, prices, theme). There is no server and no account system — a painter's data lives on the device/browser they used, with Export/Import as the way to move it elsewhere.

## Roadmap: Missions

Planned features live in [missions/](missions/) as individual plan documents — each one is scoped to be picked up and implemented independently. See [missions/README.md](missions/README.md) for the full index.

All 17 missions currently on file (01–17: low-stock tracking, substitution suggestions, custom mixes, gradient builder, complete-the-gradient, projects, tags/notes, price tracking, share-as-image, bulk actions, undo toast, hex/RGB search, sticky toolbar, paint-type glossary, starter kit, technique glossary, onboarding checklist) are **implemented** — see "What it does today" above. New mission docs get added here as new ideas come up.

## Development

No build step. Open [index.html](index.html) in a browser, or serve the folder with any static file server. All logic is in [app.js](app.js); color math helpers (`hexToHsl`, `hslToHex`, `hexToRgb`, `colorDistance`, `findNearestColor`, `interpolateHexRange`) live there too and are reused across several missions above.
