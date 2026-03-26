# SDK 0.4.0 Migration Notes

Tracks changes needed across templates when upgrading from SDK 0.3.x to 0.4.0.

---

## Attribute Reference

Full reference: [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md)

### Quick decision matrix

| Goal | Use |
|------|-----|
| Base product price (no adjustments) | `package.price` / `package.unitPrice` |
| Compare-at / retail price | `package.compareTotal` / `package.unitRetailPrice` |
| Base savings (retail vs base) | `package.savingsAmount` / `package.savingsPercentage` |
| **Coupon-adjusted final price** | **`package.finalPriceTotal`** / `package.finalPrice` |
| **Combined savings inc. coupon** | **`package.totalSavingsAmount`** / `package.totalSavingsPercentage` |
| Backend offer/voucher card pricing | `data-next-package-price="..."` |

### When to use `data-next-package-price` vs `data-next-display`

**`data-next-package-price` slots** (on selector cards) — affected by both coupons AND backend campaign offers/vouchers. Required when:
- The selector uses campaign offer tiers (e.g. buy 2 = 10% off, buy 3 = 15% off)
- i.e. single package + `data-next-quantity` approach with offers configured in the campaign backend

**`data-next-display="package.final*"` / `"package.totalSavings*"`** — affected by coupons only (not backend offers). Sufficient when:
- Using the multi-package approach (each bundle is a distinct package ID with prices baked in)
- Coupons need to be reflected but no backend offer tiers are in play

---

## Selector Approaches — Comparison

Three patterns exist for quantity-based selectors. Choose based on pricing architecture:

| Approach | Container | Card | Price slots | Coupon-aware? | Offer-aware? | Auto voucher? |
|----------|-----------|------|-------------|:-------------:|:------------:|:-------------:|
| Multi-package | `data-next-package-selector` | `data-next-selector-card` + `data-next-package-id` (unique per card) | `data-next-display="package.*"` | Totals only (`finalPriceTotal`) | No | No |
| Single package + quantity | `data-next-package-selector` | `data-next-selector-card` + `data-next-package-id` (same) + `data-next-quantity` | `data-next-package-price="..."` | Yes | Yes | No |
| Bundle selector | `data-next-bundle-selector` | `data-next-bundle-card` + `data-next-bundle-items='[...]'` | `data-next-bundle-price="..."` | Yes | Yes | Yes (`data-next-bundle-vouchers`) |

### When to use each

- **Multi-package** — prices are baked into each package in the backend; no offer tiers; simple setup
- **Single package + quantity** — one product, quantity drives tiered offer discounts from backend
- **Bundle selector** — most powerful; supports mixed-package bundles, per-tier automatic coupon codes, and backend-calculated pricing. Use when you need automatic coupon lifecycle management per tier (e.g. buy 3 = `SAVE15` auto-applied)

> **Note:** Bundle selector `data-next-bundle-vouchers` manages the coupon lifecycle automatically — do NOT also manage these codes via `CouponEnhancer`.

---

## Bundle Selector (0.4.0)

Docs: [Bundle Set Sale guide](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale)

### Key attributes

| Attribute | Where | Purpose |
|-----------|-------|---------|
| `data-next-bundle-selector` | Container | Enables bundle selector |
| `data-next-bundle-slot-template-id` | Container | Template ID for per-unit slot rendering |
| `data-next-bundle-card` | Card | Marks a bundle option card |
| `data-next-bundle-id` | Card | Unique ID for this bundle (e.g. `"drone-3x"`) |
| `data-next-bundle-items` | Card | JSON array: `[{"packageId": 2, "quantity": 3}]` |
| `data-next-bundle-vouchers` | Card | Comma-separated coupon codes for this tier |
| `data-next-selected="true"` | Card | Pre-selects on load |
| `data-next-bundle-price` | Display | Total price |
| `data-next-bundle-price="compare"` | Display | Compare/retail total |
| `data-next-bundle-price="savings"` | Display | Savings amount |
| `data-next-bundle-price="savingsPercentage"` | Display | Savings % |
| `data-next-bundle-slots` | Display | Renders slot rows from template |

### Bundle items JSON

```json
[{"packageId": 2, "quantity": 3}]
```

Multi-product bundle:
```json
[{"packageId": 2, "quantity": 3}, {"packageId": 5, "quantity": 1, "noSlot": true}]
```

- `noSlot: true` — adds package silently (e.g. free gift) without rendering a slot row
- `configurable: true` — expands quantity-2+ items into individual selectable variant slots

### Slot template tokens

```html
<template id="bundle-unit-price-tpl">
  <div class="os-card__price os--compare os-style">{item.originalUnitPrice}</div>
  <div class="os-card__price os--current">{item.unitPrice}/ea</div>
</template>
```

### Full example (3x / 2x / 1x, same package ID)

```html
<template id="bundle-unit-price-tpl">
  <div class="os-card__price os--compare os-style">{item.originalUnitPrice}</div>
  <div class="os-card__price os--current">{item.unitPrice}/ea</div>
</template>

<div
  data-next-bundle-selector
  data-next-selection-mode="swap"
  data-next-bundle-slot-template-id="bundle-unit-price-tpl"
  class="os-option"
>
  <div class="os-cards__vertical os--gap-xl">

    <!-- 3x -->
    <div
      role="button"
      data-next-bundle-card
      data-next-bundle-id="drone-3x"
      data-next-bundle-items='[{"packageId":2,"quantity":3}]'
      data-next-bundle-vouchers="SAVE15"
      data-next-selected="true"
      class="os-card next-selected"
    >
      <div class="os-card__title-wrapper">
        <div class="os-card__title">3x Package</div>
        <div class="os-card__title-badge pb--bestseller">
          SAVE <span data-next-bundle-price="savingsPercentage">-</span>
        </div>
      </div>
      <div class="os-card__subtitle-text">
        Save <span data-next-bundle-price="savings">$0.00</span>
      </div>
      <div class="os-card__price-container">
        <div data-next-bundle-slots></div>
      </div>
      <div class="os-card__total-container">
        <div class="os-card__total-compare" data-next-bundle-price="compare">-</div>
        <div class="os-card__total-current" data-next-bundle-price>-</div>
      </div>
    </div>

    <!-- 2x / 1x follow same pattern with different bundle-id, items, vouchers -->

  </div>
</div>
```

---

## Package Selector (0.4.0) — Multi-package approach

Full example (distinct package IDs per card):

```html
<div
  data-next-selector-id="drone-packages"
  data-next-package-selector
  data-next-selection-mode="swap"
  data-next-include-shipping="true"
  class="os-option"
>
  <div class="os-cards__vertical os--gap-xl">

    <!-- 3x — package-id="4" -->
    <div
      data-next-shipping-id="1"
      role="button"
      data-next-selector-card
      data-next-package-id="4"
      data-next-quantity="1"
      data-next-selected="true"
      data-next-await=""
      class="os-card next-selected"
    >
      <div class="os-card__title-wrapper">
        <div class="os-card__title">3x <span data-next-display="package.name">-</span></div>
        <div data-next-show="package.hasSavings" class="os-card__title-badge pb--bestseller">
          SAVE <span data-next-display="package.savingsPercentage">-</span>
        </div>
      </div>
      <div data-next-show="package.hasSavings" class="os-card__subtitle-text">
        Save <span data-next-display="package.savingsAmount">$0.00</span>
        <span data-next-show="shipping.isFree"> + Free Shipping</span>
      </div>
      <div class="os-card__price-container">
        <div data-next-show="package.hasRetailPrice" class="os-card__price os--compare os-style">
          <span data-next-display="package.unitRetailPrice">-</span>
        </div>
        <div class="os-card__price os--current">
          <span data-next-display="package.unitPrice">-</span>/ea
        </div>
      </div>
      <div class="os-card__total-container">
        <div data-next-show="package.hasRetailPrice" class="os-card__total-compare"
             data-next-display="package.compareTotal">-</div>
        <div data-next-display="package.finalPriceTotal" class="os-card__total-current">-</div>
      </div>
    </div>

    <!-- 2x / 1x follow same pattern with package-id="3" / "2" -->

  </div>
</div>
```

**Known limitation:** `savingsAmount`/`savingsPercentage` are static (retail-vs-base only, not coupon-aware). `data-next-package-price="compare"/"savings"` slots return per-unit retail instead of package total for multi-package setups. Use bundle selector if full coupon reactivity across all price slots is required.

---

## Package Selector Changes (applies to all selector-based checkouts)

### Selector container + card attributes

| What | Before (0.3.x) | After (0.4.0) | Notes |
|------|----------------|---------------|-------|
| Selector container | `data-next-cart-selector=""` | `data-next-package-selector` | Boolean — no value needed |
| Include shipping in price | _(not present)_ | `data-next-include-shipping="true"` | Add to selector container |
| Selector card | `data-next-selector-card=""` | `data-next-selector-card` | Boolean — no value needed |

### Price token renames

| Before (0.3.x) | After (0.4.0) | Coupon-aware? | Notes |
|----------------|---------------|---------------|-------|
| `package.price` | `package.unitPrice` | No | Renamed |
| `package.price_retail` | `package.unitRetailPrice` | No | Renamed |
| `package.price_total` | `package.packageTotal` | No | Renamed |
| `package.price_retail_total` | `package.compareTotal` | No | Renamed |
| `package.savingsAmount` | `package.savingsAmount` | No | Unchanged — base savings only |
| `package.savingsPercentage` | `package.savingsPercentage` | No | Unchanged — base savings only |
| _(not present)_ | `package.finalPrice` | **Yes** | Coupon-adjusted unit price |
| _(not present)_ | `package.finalPriceTotal` | **Yes** | Coupon-adjusted total |
| _(not present)_ | `package.totalSavingsAmount` | **Yes** | Retail savings + coupon savings |
| _(not present)_ | `package.totalSavingsPercentage` | **Yes** | Combined savings % |

### Recommended price display pattern (multi-package approach)

```html
<!-- Per-unit prices: base only (retail doesn't change with coupons) -->
<div data-next-show="package.hasRetailPrice" class="os-card__price os--compare">
  <span data-next-display="package.unitRetailPrice">-</span>
</div>
<div class="os-card__price os--current">
  <span data-next-display="package.unitPrice">-</span>/ea
</div>

<!-- Total prices: use finalPriceTotal for coupon reactivity -->
<div data-next-show="package.hasRetailPrice" class="os-card__total-compare"
     data-next-display="package.compareTotal">-</div>
<div class="os-card__total-current"
     data-next-display="package.finalPriceTotal">-</div>

<!-- Savings: use totalSavings* for coupon reactivity -->
<div data-next-show="package.hasTotalSavings">
  SAVE <span data-next-display="package.totalSavingsPercentage">-</span>
</div>
<div data-next-show="package.hasTotalSavings">
  Save <span data-next-display="package.totalSavingsAmount">-</span>
</div>
```

### Recommended price display pattern (single package + quantity + offers)

```html
<!-- Per-unit: same as multi-package -->
<span data-next-display="package.unitRetailPrice">-</span>
<span data-next-display="package.unitPrice">-</span>/ea

<!-- Totals + savings: use data-next-package-price (backend offer-aware) -->
<div data-next-show="package.hasRetailPrice" class="os-card__total-compare"
     data-next-package-price="compare">-</div>
<div class="os-card__total-current" data-next-package-price>-</div>

<div>SAVE <span data-next-package-price="savingsPercentage">-</span></div>
<div>Save <span data-next-package-price="savings">-</span></div>
```

---

## Bugs Fixed in olympus/checkout.html

| Bug | Location | Fix |
|-----|----------|-----|
| Cards 2 & 3 unit compare price always visible | `.os-card__price.os--compare` | Added missing `data-next-show="package.hasRetailPrice"` |
| Card 2 subtitle had "+ Free Shipping" hardcoded inside savings span | `.os-card__subtitle-text` | Split into savings span + `data-next-show="shipping.isFree"` conditional |

---

## Template Status

| Template | Selector fix | Token renames | Bug fixes | Notes |
|----------|-------------|---------------|-----------|-------|
| `olympus` | 🔄 in progress | 🔄 in progress | 🔄 in progress | No good solution yet — multi-package selector: `savingsAmount`/`savingsPercentage` are static; `data-next-package-price` compare/savings slots broken for multi-package; `finalPriceTotal` coupon-aware for totals only |
| `olympus-mv-single-step` | ⬜ pending | ⬜ pending | — | |
| `olympus-mv-two-step` | ⬜ pending | ⬜ pending | — | |
| `demeter` | ⬜ pending | ⬜ pending | — | |
| `limos` | ⬜ pending | ⬜ pending | — | |
| `shop-single-step` | — | — | — | No selector |
| `shop-three-step` | — | — | — | No selector |

---

## Known SDK Issues (reported to engineering, v0.4.x)

### 1. `package.*` display attributes not offer/coupon-aware
`data-next-display="package.*"` values render correctly but **do not update** when a Campaigns app offer or coupon is applied. Previously these reflected active pricing. In v0.4.x, `data-next-package-price` slots are the only fields that update with backend offer pricing, but there is no full equivalent for all `package.*` display combinations (e.g. no offer-aware per-unit display).

**Expected:** `package.*` display attributes should reflect active campaign offer/coupon pricing, or equivalent offer-aware fields should exist for full parity.

### 2. Coupon not persisted across page refresh
After applying a coupon, refreshing the page clears it. Previously coupons were session-persistent once applied. Unclear if intentional in v0.4.x or a regression — flagged to engineering.

### 3. `data-next-shipping-id` selection not reflected in summary totals
When using `data-next-shipping-id` per selector card in swap mode (with valid `shipping_methods[].ref_id` values), cart state updates correctly on card select (`window.nextDebug?.stores?.cart?.getState()?.shippingMethod` shows expected ID), but the summary shipping line and grand total do not consistently reflect the selected shipping method. Totals appear to recalculate using a default/fixed shipping method downstream.

**Expected:** Summary shipping and total should follow the selected `data-next-shipping-id` without custom JS.

### 4. `data-next-package-price="compare/savings/savingsPercentage"` wrong for multi-unit package SKUs
In PackageSelector swap mode, `compare`, `savings`, and `savingsPercentage` slots can display incorrect values for multi-unit packages. The API calculates `compareTotal = price_retail × quantity(1)` — returning per-unit retail instead of the package total retail.

**Example:** 3-pack where retail should be `$119.97` shows compare-at `$39.99`, causing downstream `savings` and `savingsPercentage` to also be wrong.

**Expected:** `compare` slot should calculate using the package quantity, not always quantity 1.

### 5. Bundle selector slot values are unformatted (raw numbers)
`{item.originalUnitPrice}` and `{item.unitPrice}` in bundle slot templates output raw numeric values — not currency-formatted. Extra formatting logic or JS would be needed for production output.

### 6. Bundle selector pricing workflow trade-off
The bundle selector approach (same `packageId`, different quantities per card) works structurally, but changes the merchandising workflow in the Campaigns UI: classic package selectors allow direct tier price control per package, whereas the bundle/offer flow is driven by percent discount + rounding behavior. May still be the better long-term direction, but operators would need to adjust how they configure pricing.

### 7. Prepurchase bump pricing regression (`data-next-toggle-price` vs `data-next-display`)
**Confirmed regression from 0.3.x behavior.**

In 0.3.x, bumps used `data-next-bump=""` + `data-next-toggle="toggle"` and rendered prices with `data-next-display="package.price_total"` / `package.price_retail_total` — stable, package-level totals that worked correctly.

In the new 0.4.x pattern (`data-next-package-toggle` + `data-next-toggle-card` + `data-next-toggle-price`), pricing is computed through toggle preview logic with manual scaling, and produces inconsistent compare/sale/savings values — especially when the bump is synced to main bundle quantity via `data-next-package-sync="2,3,4"`.

**Current workaround:** Templates are staying on the old 0.3.x bump pattern (`data-next-bump=""` + `data-next-toggle="toggle"` + `data-next-display="package.price_total"`) until this is resolved. This pattern still renders correctly in 0.4.x.

**Expected fix:** Align `data-next-toggle-price` outputs to the same package-total basis as `price_total` / `price_retail_total`, or provide a compatibility mode for the old bump behavior.

---

## Template Workaround: External Slot Layout (`olympus-mv-single-step2`)

This template uses a single shared external “Select your color and size” block, but the SDK’s bundle selector wiring expects slot controls to live within each `[data-next-bundle-card]`. Slot/variant handlers and internal lookups are scoped to the card DOM, so rendering `data-next-bundle-slots` outside the card reliably breaks interactivity and dynamic bindings.

To preserve both requirements (design layout + SDK behavior), we use a clone-stage approach:
- Keep the real SDK `data-next-bundle-slots` inside each bundle card (hidden).
- Render the external stage by cloning the selected card’s rendered slot nodes (so the design can be shared).
- Bridge user interactions in the external stage back to the corresponding hidden source controls.
- Explicitly mirror runtime state and dynamic text nodes in the clones (e.g. `data-next-bundle-price="savingsPercentage"` and `data-next-display="..."`) because cloned nodes do not receive live SDK bindings.
- Avoid aggressive full re-renders on variant changes to prevent UI flicker/shift.

This is why the template includes extra JS and why some cloned price/savings text must be manually synced after async updates.

---

## Open Issues (templates)

- `olympus/checkout.html` — multi-package selector active; QA ongoing; bumps holding on old 0.3.x pattern (SDK issue #7)
- Multi-package limitation: `savingsAmount`/`savingsPercentage` are static (retail-vs-base only); coupons reflect only in `finalPriceTotal`. `data-next-package-price="compare"/"savings"` slots return per-unit retail (not package total) for multi-package setups — confirmed SDK issue #4 above.
- **Bundle selector may be the right long-term solution for olympus** — `data-next-bundle-price` slots are fully coupon+offer-aware, and per-tier voucher codes (`data-next-bundle-vouchers`) handle automatic coupon lifecycle. Blocked by SDK issues #5 (unformatted slot values) and #7 (bump regression) for production use. Evaluate once engineering resolves.
