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
