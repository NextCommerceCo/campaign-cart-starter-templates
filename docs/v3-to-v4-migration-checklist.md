# v3 → 0.4.x Template Migration Checklist

Step-by-step process for porting a template from `campaign-kit-templates-v3/` to `campaign-kit-templates/`. Follow in order — each step builds on the last.

**Reference template:** `campaign-kit-templates/src/olympus/`
**Attribute + token reference:** [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md)
**Campaign setup rule:** 1 package per product at retail price — all discounts via offers/coupons in the campaign backend.

---

## Step 1 — Scaffold

- [ ] `cp -r campaign-kit-templates-v3/src/[slug] campaign-kit-templates/src/[slug]`
- [ ] Add entry to `campaign-kit-templates/_data/campaigns.json`:
  - Use current `sdk_version` (ref: olympus entry)
  - Keep all store URL fields from the olympus entry as placeholders
- [ ] Add row to `CLAUDE.md` dev URL table (under `campaign-kit-templates/ (0.4.x)`)
- [ ] Update `docs/sdk-0.4.0-migration.md` — Migrated table: add row with `🔄 in progress`; Pending table: mark as promoted

---

## Step 2 — `_layouts/base.html`

LiquidJS treats empty string as truthy — guards must use `!= ""`.

- [ ] `{% if campaign.gtm_id %}` → `{% if campaign.gtm_id != "" %}` (2× in `<head>`)
- [ ] `{% if campaign.fb_pixel_id %}` → `{% if campaign.fb_pixel_id != "" %}` (2× in `<head>`, 2× `<body>` noscript = 4 total)

Verify against `campaign-kit-templates/src/olympus/_layouts/base.html`.

---

## Step 3 — `checkout.html` — bundle selector

**Campaign setup check first:** confirm the package ID(s) used in v3 — these map to `packageId` in `data-next-bundle-items`.

### Container

| Before (v3) | After (0.4.x) |
|-------------|---------------|
| `data-next-cart-selector=""` | `data-next-bundle-selector` (boolean) |
| _(missing)_ | `data-next-include-shipping="true"` |
| `data-next-await` | `data-next-await=""` (explicit value) |
| Keep: `data-next-selector-id`, `data-next-selection-mode="swap"`, CSS class |

### Card(s)

| Before (v3) | After (0.4.x) |
|-------------|---------------|
| `data-next-selector-card=""` | `data-next-bundle-card` (boolean) |
| `data-next-package-id="X"` | `data-next-bundle-items='[{"packageId":X,"quantity":N}]'` |
| `data-next-quantity="N"` | (absorbed into bundle-items) |
| _(missing)_ | `data-next-bundle-id="[slug]-qty-N"` (unique per card) |
| _(missing)_ | `role="button"` |
| Keep: `data-next-shipping-id`, `data-next-selected="true"`, CSS class |

### Inner content wrapper (image / name scope)

- [ ] Add `data-next-package-id="X"` to the inner content `<div>` that contains `data-next-display="package.X.image"` / `package.name` — keeps `package.*` display scoped to the active package while money comes from `data-next-bundle-*`. Use the explicit `package.{ref_id}.image` form to match the bundle card's `packageId`.

### Price tokens inside the card

| Before (v3) | After (0.4.x) | Where |
|-------------|---------------|-------|
| `data-next-display="package.price_retail_total"` | `data-next-bundle-price="originalPrice"` on `<span>`, parent `<div>` gets `data-next-bundle-display="hasDiscount"` | Retail/compare total |
| `data-next-display="package.price_retail"` | `data-next-bundle-display="originalUnitPrice"`, parent gets `hasDiscount` | Per-unit retail |
| `data-next-display="package.finalPriceTotal"` or `package.price_total` | `data-next-bundle-price="price"` on `<span>` | Offer total |
| `data-next-display="package.price"` / `package.unitPrice` | `data-next-bundle-display="unitPrice"` | Per-unit offer price |
| `data-next-display="package.totalSavingsAmount"` / `package.savingsAmount` | `data-next-bundle-display="discountAmount"` | Savings amount |
| `data-next-display="package.savingsPercentage"` | `data-next-bundle-display="discountPercentage"` | Savings % |
| `data-next-show="package.hasSavings"` / `package.hasRetailPrice` | `data-next-bundle-display="hasDiscount"` | Conditional wrapper |

> **Do not mix** `data-next-bundle-display` and `data-next-display` on the same element.

---

## Step 4 — `checkout.html` — cart summary

The v3 cart summary uses the old `data-next-content` / `data-next-cart-items` pattern. Migrate to `data-next-cart-summary` to unlock per-discount rows, CartSummaryEnhancer tokens, and state-class-driven visibility.

### Markup

- [ ] Wrap the order summary content area in `<div data-next-cart-summary>` + `<template>` — navigation chrome (accordion triggers, step headers, etc.) stays **outside** the template
- [ ] Replace `template#cart-item-template` + `div[data-next-cart-items]` two-element pattern with `div[data-summary-lines]` + inner `<template>`
- [ ] Cart item ID binding: `data-cart-item-id="{item.id}"` → `data-package-id="{item.packageId}"`
- [ ] Remove `pb-cart` legacy attributes from all cart item elements
- [ ] Remove dead hidden quantity-controls markup (permanently hidden in v3 templates)
- [ ] Order totals — replace `data-next-display` calls with CartSummaryEnhancer tokens: `{subtotal}`, `{shipping}`, `{total}`
- [ ] Remove `data-include-discounts=""` from subtotal (legacy attribute)
- [ ] Add `data-next-discounts="offer"` + `data-next-discounts="voucher"` sections with `<template>` rows using `{discount.name}`, `{discount.amount}`
- [ ] Discount/savings row: use `os-cart-summary-row--discount` class (not `data-next-show="cart.hasSavings"`) — visibility driven by CSS state class
- [ ] Discount amount: use `{discounts}` token (not `data-next-display="cart.totalSavingsAmount"`)
- [ ] Discount percentage badge: use `data-next-display="cart.totalDiscountPercentage"` (not `cart.totalSavingsPercentage`)
- [ ] Savings banner (`data-next-show`): use `cart.hasDiscounts` (not `cart.hasSavings`)
- [ ] Coupon tag: `data-next-show="cart.hasCoupon"` + `data-next-discounts="voucher"` with `{discount.description}` for the code string
- [ ] Tax row: keep hidden (`class="hide"`) — `{tax}` token is not wired in CartSummaryEnhancer (BS-017)

### Cart item token names (0.4.11+)

| Before (v3) | After (0.4.x) |
|-------------|---------------|
| `{item.unitComparePrice}` | `{item.originalUnitPrice}` (per-unit, for `/ea` label) |
| `{item.discountedPrice}` | `{item.price}` (line total after discount) |
| _(missing)_ | `{item.originalPrice}` (line total before discount, for strikethrough) |
| _(missing)_ | `{item.hasDiscount}` as CSS class — resolves to `"show"` or `"hide"` |

### `next-core.css`

`next-core.css` must be **identical across all templates**. The simplest approach when porting a new template is to copy the file directly from an existing 0.4.x template rather than patching the v3 version:

```bash
cp campaign-kit-templates/src/olympus/assets/css/next-core.css campaign-kit-templates/src/[slug]/assets/css/next-core.css
```

If the template has unique CSS that must be preserved (e.g. `#bundle-slots-stage` rules in olympus-mv-single-step), append those rules to the copied file so all shared rules stay in sync.

The rules below are already present in the copied file — listed here for reference only:

```css
.order-totals__discount-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.order-totals__discount-list li {
  margin: 0;
  padding-left: 0;
}

[data-next-cart-summary].next-cart-empty .os-cart-summary-totals { display: none !important; }
[data-next-cart-summary] .os-cart-summary-row--discount { display: none; }
[data-next-cart-summary].next-has-discounts .os-cart-summary-row--discount { display: block; }
[data-next-cart-summary] .os-cart-summary-row--tax { display: none; }
[data-next-cart-summary].next-has-tax .os-cart-summary-row--tax { display: flex; }
```

### Partial

- [ ] Extract the cart summary markup into a named partial in `_includes/`:
  - `cart-summary01.html` — tabular style (olympus-style, no accordion)
  - `cart-summary02.html` — accordion/card style (limos-style)
  - Each template ships both styles as starting points — developers swap by changing the `{% campaign_include %}` reference
  - Use `{% campaign_include 'cart-summaryNN.html' %}` in place of the inline markup in `checkout.html` (both mobile and desktop instances if present)
