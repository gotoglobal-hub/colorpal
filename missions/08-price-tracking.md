# Mission 08 — Shopping List Price Tracking

## Goal
Let a painter attach a rough price to a paint so the Shopping List shows an estimated total cost before they buy.

## Why it matters
"What do I need to buy" is only half the budgeting question — knowing the estimated cost up front helps painters plan a purchase (especially useful around restocking multiple low-stock paints from Mission 01).

## User stories
- As a painter, I can set a price for any color (defaults can be seeded per company/line if known, but manual entry is the baseline).
- The **Shopping List** shows a running total based on the prices of items currently in the cart.
- Prices are editable inline from the Shopping List itself, not just from the color card.
- If a color has no price set, it's excluded from the total with a subtle "price unknown" indicator rather than silently treated as $0.

## Data model
- New `localStorage` key, e.g. `colors-of-mini-prices` — object keyed by color id: `{ "citadel-base-abaddon-black": 5.5 }`.
- Optional: a currency setting (reuse the existing theme-select pattern in index.html:17-23 for a simple dropdown) stored alongside, e.g. `colors-of-mini-currency`.

## UI changes
- A small editable price field on each card in the **Shopping List** view (`renderShoppingList()`, app.js:831).
- A total line in the shopping toolbar (index.html:121-127) near the existing item count label.
- Optional currency selector near the theme selector in the header.

## Implementation steps
1. Add `getPrices()`/`savePrices()` storage helpers and `getPrice(id)`/`setPrice(id, value)`.
2. Add an inline price input to shopping-list cards (extend `buildCard()` or a shopping-specific card variant).
3. Compute and render the running total in `renderShoppingList()`, summing only items with a known price; show a count of "N items with unknown price" alongside.
4. (Optional) Add a currency selector; format the total accordingly.
5. Include prices in Export/Import JSON.

## Acceptance criteria
- Setting a price updates the Shopping List total immediately.
- Items without a price never silently count as $0 — they're visibly excluded, with a count shown.
- Prices persist across reloads and Export/Import.
