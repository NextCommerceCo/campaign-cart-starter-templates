# SDK 0.4.0 Migration Notes

Tracks changes needed across templates when upgrading from SDK 0.3.x to 0.4.0.

**Bundle selector reference template:** `campaign-kit-templates/src/olympus/` — QA [`docs/olympus-v0.4.0-sdk-qa-checklist.md`](olympus-v0.4.0-sdk-qa-checklist.md). **Template bug log (0.4.x, repo-wide):** [`docs/template-bug-log.md`](template-bug-log.md)

**Porting a v3 template to 0.4.x?** Follow the step-by-step process: [`docs/v3-to-v4-migration-checklist.md`](v3-to-v4-migration-checklist.md)

### SDK 0.4.18 — bundle quantity controls; inline bundle `<template>`; add-to-cart + bundle selector

**Loader:** `https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v0.4.18/dist/loader.js` ([v0.4.18](https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.18)).

**Reference in this repo:**

- **`limos/checkout.html`** — checkout demo of **native `bundleQuantity`**: selected `data-next-bundle-card` carries `data-next-quantity` / `data-next-min-quantity` / `data-next-max-quantity`; **`data-next-bundle-qty-for`** + **`data-next-quantity-*`** / **`display`** sit **outside** **`[data-next-bundle-selector]`** (same DOM pattern as **`upsell-bundle-stepper`** — do not nest the stepper inside **`[data-next-bundle-card]`** or you risk duplicate SDK actions). Wrap selector + stepper in **`.checkout-bundle-offer`** and use **`.next-bundle-qty--anchor-br`** for bottom-right placement (**`next-core.css`**). Single-card checkout omits **`role="button"`** on the card (use **`role="button"`** per tier on multi-card UIs, e.g. olympus). **`olympus/checkout.html`** intentionally omits bundle qty on checkout.
- **`olympus/upsell-bundle-stepper.html`** — same native controls on a **post-purchase** bundle upsell (one hidden card).
- **Inline `<template>` inside `[data-next-bundle-selector]`** (no template `id`) — noted in commented auto-render example on **`olympus/checkout.html`**; canonical olympus checkout remains manual inline cards.

**`campaigns.json`:** **`olympus`** and **`limos`** pin **`sdk_version`:** **`0.4.18`**. **`olympus-mv-single-step`** remains **`0.4.17`** until MV checkout/upsell paths are smoke-tested on 0.4.18 (tier + slot layout differs from single-card limos demo).

### SDK 0.4.17 — post-checkout session cleanup (cart + vouchers)

**Loader:** `https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v0.4.17/dist/loader.js` ([v0.4.17](https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.17)).

**Campaigns reference:** **`olympus-mv-single-step`** pins **`sdk_version`:** **`0.4.17`** in [`campaign-kit-templates/_data/campaigns.json`](../campaign-kit-templates/_data/campaigns.json) (see **0.4.18** section above for olympus/limos).

**Fixes (no reference template markup changes required):**

- **After a successful order:** cart and applied coupons are cleared from **`sessionStorage`** immediately **before** the post-checkout redirect — avoids **ghost cart / stale coupon** UI when reloading the receipt or revisiting cart-backed pages. Bug log **BS-019** (`fixed`).

**Upsell display (BS-018):** Reference **smoke on 0.4.17+** treats session checkout coupon vs MV upsell **`bundle.*`** display as **verified** — see [`docs/template-bug-log.md`](template-bug-log.md) **BS-018** and [`docs/campaign-issues-overview.md`](campaign-issues-overview.md) fixed **#14**. Re-open on regression.

### SDK 0.4.16 — exit-popup voucher refresh; bundle voucher ordering

**Loader:** `https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v0.4.16/dist/loader.js` ([v0.4.16](https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.16)).

**Fixes (no reference template markup changes required for these):**

- **Exit-intent / exit-popup voucher:** applying a voucher from the exit popup now recalculates **bundle** and **toggle** card prices on checkout and upsell (previously stale).
- **Voucher ordering in bundles:** bundle/tier vouchers are sent **before** user-applied coupons so stacked discounts match backend intent.

**BS-018 note (0.4.16 era):** At **0.4.16**, session checkout coupons could still skew upsell **`bundle.*`** display; **0.4.17+** reference smoke **verified** resolved — see **BS-018** in [`docs/template-bug-log.md`](template-bug-log.md).

### SDK 0.4.11 — `{line.*}` deprecated, `{item.*}` namespace, line total semantics

**Loader:** `https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v0.4.11/dist/loader.js` ([v0.4.11](https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.11)).

**Breaking changes:**

- **`data-summary-lines` namespace change:** **`{line.*}`** is **deprecated** — all tokens render **silently blank** (no console warning). Use **`{item.*}`** for all `data-summary-lines` row template tokens.
- **`{item.price}` / `{item.originalPrice}` are now line totals:** In 0.4.11 these became qty × unit price (line totals), **not** per-unit. Use **`{item.unitPrice}`** / **`{item.originalUnitPrice}`** where per-unit values are needed (e.g. `/ea` labels, bundle slot pricing).
- **Bundle slot `<template>` tokens:** Use **`{item.originalUnitPrice}`** / **`{item.unitPrice}`** for per-unit slot display (replaces pre-0.4.11 `{item.originalPrice}` / `{item.price}` which were per-unit before 0.4.11 changed their semantics).

**Key token mapping for `data-summary-lines`:**

| Use | Token |
|-----|-------|
| Amount column (line total, discounted) | `{item.price}` |
| Amount strikethrough (line total, original) | `{item.originalPrice}` |
| Per-unit current price (`/ea`) | `{item.unitPrice}` |
| Per-unit original price (`/ea` strike) | `{item.originalUnitPrice}` |
| Conditional strikethrough class | `{item.hasDiscount}` |

### SDK 0.4.10 — reference campaigns + template alignment (historical)

**Loader:** `https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v0.4.10/dist/loader.js` ([v0.4.10](https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.10)).

**Breaking / prefer for new work (reference templates in this repo):**

- **Prepurchase bumps:** **`data-next-toggle-display`** with **`originalPrice`** / **`price`** / **`unitPrice`** (replaces **`data-next-toggle-price`** and `compare` slot; SDK may keep legacy attrs for compatibility). Reference templates use `bump-check01.html` / `bump-switch01.html` (canonical 0.4.x names — `-v2` suffix retired).
- **`data-next-display="toggle.{packageId}.*"`** — renames such as `isInCart`→`isSelected`, `hasSavings`→`hasDiscount`, `compare`→`originalPrice`, `savings`→`discountAmount`, `savingsPercentage`→`discountPercentage` (see SDK release notes).
- **Bundle slot `<template>` tokens (0.4.10, superseded in 0.4.11):** `{item.originalPrice}` / `{item.price}` were per-unit in 0.4.10 — **in 0.4.11 these became line totals**; use `{item.originalUnitPrice}` / `{item.unitPrice}` for per-unit slot display going forward.
- **Cart summary line `<template>`:** `{line.hasDiscount}` (replaces `{line.hasSavings}`) — **deprecated in 0.4.11**; use `{item.hasDiscount}`.
- **Receipt mobile summary:** **`cart.hasDiscounts`** (plural — `CartDisplayEnhancer`; not **`cart.hasDiscount`**, which is **`package.*` / bundle naming**), **`cart.originalPrice`** (or legacy **`cart.compareTotal`** if your SDK still aliases it) for crossed pricing (replaces **`cart.hasSavings`** / **`cart.compareTotal`** in older markup).

**Still applies from 0.4.9:** bundle card **`data-next-bundle-display`** / remote **`bundle.*`** / **`data-next-bundle-price`** canonical names (`hasDiscount`, `originalPrice`, `price`, `discountAmount`, `discountPercentage`, …).

### SDK 0.4.9 — jsDelivr + bundle display renames

**Loader (historical):** `https://cdn.jsdelivr.net/gh/NextCommerceCo/campaign-cart@v0.4.9/dist/loader.js` ([v0.4.9](https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.9)).

**Breaking** bundle markup introduced in **0.4.9**: **`data-next-bundle-display`** / **`data-next-bundle-price`** — `hasSavings`→`hasDiscount`, `savings`→`discountAmount`, `savingsPercentage`→`discountPercentage`, `compare`→`originalPrice`, `total`→`price` on bundle price slots. Aliases may still work briefly; prefer canonical names for new work.

---

## Template versioning practice

0.3.x templates live in **`campaign-kit-templates-v3/`** (archive). 0.4.x templates live in **`campaign-kit-templates/`** with clean slug names — no version suffix.

When porting a template to 0.4.x:
- Copy `campaign-kit-templates-v3/src/[slug]/` → `campaign-kit-templates/src/[slug]/` (same slug name)
- Add an entry in `campaign-kit-templates/_data/campaigns.json` with the correct `sdk_version`
- The v3 copy remains untouched as the 0.3.x reference

> **Historical note:** Earlier in this migration work, 0.4.x variants were developed as versioned slugs (`olympus-v0.4`, `olympus-mv-single-step-v0.4`) inside the same folder as the 0.3.x originals. Those have since been promoted to clean slug names in the new `campaign-kit-templates/` folder.

---

## Attribute Reference

Full reference: [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md) · [`docs/bundle-display-cart-cheatsheet.md`](bundle-display-cart-cheatsheet.md)

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
| `data-next-selector-id` | Container | Stable id (e.g. `drone-packages`) — pairs with `[data-next-bundle-slots-for="…"]`; **`BundleSelectorEnhancer` reads this only**, not `data-next-bundle-selector-id` |
| `data-next-bundle-slot-template-id` | Container | Template ID for per-unit slot rendering |
| `data-next-bundle-card` | Card | Marks a bundle option card |
| `data-next-bundle-id` | Card | Unique ID for this bundle (e.g. `"drone-3x"`) |
| `data-next-bundle-items` | Card | JSON array: `[{"packageId": 2, "quantity": 3}]` |
| `data-next-bundle-vouchers` | Card | Comma-separated coupon codes for this tier |
| `data-next-selected="true"` | Card | Pre-selects on load |
| `data-next-bundle-price="total"` | Display | Card total — **required explicit** `="total"` on every tier; bare `data-next-bundle-price` is unsupported for totals (bug log **BS-006** — **fixed** as markup rule) |
| `data-next-bundle-display="…"` | Display | Reactive slots inside cards — prefer **`hasDiscount`**, **`originalPrice`**, **`price`**, **`unitPrice`** (see 0.4.9 renames; legacy `hasSavings` / `originalUnitPrice` aliases may still exist) — [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md) |
| `data-next-bundle-price="compare"` | Display | Compare/retail total |
| `data-next-bundle-price="savings"` | Display | Savings amount |
| `data-next-bundle-price="savingsPercentage"` | Display | Savings % |
| `data-next-bundle-slots` | Display | Renders slot rows from template |

**`data-next-shipping-id` on bundle cards:** **Fixed in SDK 0.4.12** — `data-next-shipping-id` on `data-next-bundle-card` now works; `calculateTotals` no longer hardcodes method 1. Add `data-next-shipping-id="{ref_id}"` to each tier card to pick a shipping method per tier. Reference templates (`olympus`, `olympus-mv-single-step`) have this wired on all bundle cards. Bug log **BS-011**. **Note:** package swap selector path (`data-next-selector-card` + swap mode) still unreliable declaratively — use **`next.setShippingMethod(refId)`** for that path.

**`data-next-selection-mode="swap"`** on the bundle container appears in examples here and in some templates; the public [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale) guide describes atomic swap without documenting this attribute on the bundle root. **Known #8** was a period where tier changes **stacked** lines instead of swapping — **fixed** on reference `olympus` (bug log **BS-013**); re-verify after SDK bumps if behavior regresses.

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

**0.4.11+ canonical** (per-unit slot pricing):

```html
<template id="bundle-unit-price-tpl">
  <div class="os-card__price os--compare os-style">{item.originalUnitPrice}</div>
  <div class="os-card__price os--current">{item.unitPrice}/ea</div>
</template>
```

> **0.4.11 breaking change:** `{item.originalPrice}` / `{item.price}` became **line totals** in 0.4.11. For per-unit display in slot templates use `{item.originalUnitPrice}` / `{item.unitPrice}`.

### Full example (3x / 2x / 1x, same package ID)

```html
<template id="bundle-unit-price-tpl">
  <div class="os-card__price os--compare os-style">{item.originalUnitPrice}</div>
  <div class="os-card__price os--current">{item.unitPrice}/ea</div>
</template>

<div
  data-next-bundle-selector
  data-next-selector-id="drone-packages"
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
        <div class="os-card__total-current"><span data-next-bundle-price="total">-</span></div>
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

### Migrated — `campaign-kit-templates/` (SDK 0.4.x)

**Loader pin:** bump **`sdk_version`** in [`campaign-kit-templates/_data/campaigns.json`](../campaign-kit-templates/_data/campaigns.json) when adopting newer Campaign Cart releases (reference repo: **olympus/limos `0.4.18`**, **olympus-mv-single-step `0.4.17`** until re-verified).

| Template | Selector fix | Token renames | Bug fixes | Notes |
|----------|-------------|---------------|-----------|-------|
| `limos` | ✅ bundle selector | ✅ **0.4.x** | 🔄 QA | Single-step checkout. **`checkout.html`:** SDK **0.4.18** native **bundleQuantity** stepper under bundle selector (`limos-card`). Cart summary: `cart-summary02.html`. Upsell chain matches olympus file names. |
| `olympus` | ✅ bundle selector | ✅ **0.4.x** | ✅ QA | Reference **bundle** checkout (`data-next-bundle-selector` + Summary v2); **no** checkout bundle-qty stepper (see **limos**). **sdk_version `0.4.18`**. Upsell: `upsell-bundle-stepper` (native qty) + tier pills/cards. — [template bug log](template-bug-log.md) |
| `olympus-mv-single-step` | ✅ native external slots | ✅ **0.4.x** | 🔄 QA | **`sdk_version` `0.4.17`**. Checkout: tier cards + **`data-next-bundle-slots-for`**. **Native `bundleQuantity` on checkout not wired here** (tier UX + MV slots — use **limos** checkout for the 0.4.18 qty demo). **`upsell-mv.html`:** tier pills + `initBundleQtyToggle`, not `upsell-bundle-stepper`. Variant UI: see [`checkout-olympus-mv-full.js`](../campaign-kit-templates/src/olympus-mv-single-step/assets/js/checkout-olympus-mv-full.js) and [`upsells-up01-mv.js`](../campaign-kit-templates/src/olympus-mv-single-step/assets/js/upsells-up01-mv.js). |

### Pending migration — `campaign-kit-templates-v3/` (SDK 0.3.x)

| Template | Selector fix | Token renames | Notes |
|----------|-------------|---------------|-------|
| `olympus` | 🔄 in progress | 🔄 in progress | Legacy **multi-package** track: `savingsAmount`/`savingsPercentage` static; `data-next-package-price` compare/savings wrong for multi-package; `finalPriceTotal` coupon-aware for totals only |
| `olympus-mv-single-step` | ⬜ pending | ⬜ pending | |
| `olympus-mv-two-step` | ⬜ pending | ⬜ pending | |
| `demeter` | ⬜ pending | ⬜ pending | |
| `limos` | ✅ | ✅ | Promoted to `campaign-kit-templates/src/limos/` |
| `shop-single-step` | — | — | No selector |
| `shop-three-step` | — | — | No selector |

### Local-only (not tracked in repo)

| Template | Status | Notes |
|----------|--------|-------|
| `olympus-mv-single-step-v0.4-bridge` | 🔒 frozen (`0.4.6`) | Pre–native-slots clone/bridge workaround — superseded by `olympus-mv-single-step`. Local only via `.git/info/exclude`. |
| `olympus-mv-single-step-v0.4-cards` | 🔒 frozen (`0.4.6`) | Alternate card UX workaround — same status as bridge. Local only. |

### Olympus MV single-step — `bridge` and `cards` (frozen)

**`olympus-mv-single-step-v0.4-bridge`** and **`olympus-mv-single-step-v0.4-cards`** are **local-only** — removed from the repo (untracked via `.git/info/exclude`) but kept on disk for reference. They were **workarounds** for **external bundle slot layout** and alternate card UX **before** native **`data-next-bundle-slots-for`** and the current **`olympus-mv-single-step`** template resolved that gap (see **Template Workaround: External Slot Layout** below — the clone/bridge pattern).

- **No ongoing updates:** do not expect SDK bumps, 0.4.10-style token renames, or bug-fix parity on these folders.
- **New campaigns / clones:** base work on **`olympus-mv-single-step`** in `campaign-kit-templates/` only.

---

## Known SDK Issues (reported to engineering, v0.4.x)

### 1. `package.*` display attributes not offer/coupon-aware
`data-next-display="package.*"` values render correctly but **do not update** when a Campaigns app offer or coupon is applied. Previously these reflected active pricing. In v0.4.x, `data-next-package-price` slots are the only fields that update with backend offer pricing, but there is no full equivalent for all `package.*` display combinations (e.g. no offer-aware per-unit display).

**Expected:** `package.*` display attributes should reflect active campaign offer/coupon pricing, or equivalent offer-aware fields should exist for full parity.

### 2. Coupon not persisted across page refresh *(fixed — current SDK)*
**Fixed.** Coupons now survive a full page refresh — session/hydration aligned with persisted cart state. Re-verify after major cart/checkout changes.

### 3. `data-next-shipping-id` selection not reflected in summary totals

**Bundle selector — fixed in SDK 0.4.12:** Declarative **`data-next-shipping-id`** on **`data-next-bundle-card`** now works. `calculateTotals` was previously hardcoded to shipping method 1; it now uses the selected method. Reference templates `olympus` and `olympus-mv-single-step` both have `data-next-shipping-id` wired on all tier cards. Bug log **BS-011 (`fixed`)**.

**Package swap selector — still open:** When using **`data-next-shipping-id`** per **`data-next-selector-card`** in swap mode, cart state updates correctly but summary shipping line and grand total may not consistently reflect the selected method. **Workaround:** Call **`next.setShippingMethod(refId)`** from JS when the shopper selects a card.

### 4. `data-next-package-price="compare/savings/savingsPercentage"` wrong for multi-unit package SKUs
In PackageSelector swap mode, `compare`, `savings`, and `savingsPercentage` slots can display incorrect values for multi-unit packages. The API calculates `compareTotal = price_retail × quantity(1)` — returning per-unit retail instead of the package total retail.

**Example:** 3-pack where retail should be `$119.97` shows compare-at `$39.99`, causing downstream `savings` and `savingsPercentage` to also be wrong.

**Expected:** `compare` slot should calculate using the package quantity, not always quantity 1.

### 5. Bundle selector slot values are unformatted (raw numbers) *(fixed — SDK 0.4.11)*
**Fixed (SDK 0.4.11):** `{item.*}` tokens in `data-summary-lines` and `data-next-bundle-slots` `<template>` output now produce currency-aware formatting automatically — **`data-next-format="currency"`** is not needed and still does not work on these template outputs (BS-015). Use `{item.unitPrice}` / `{item.originalUnitPrice}` for per-unit slot display (these are the per-unit fields post-0.4.11; `{item.price}` / `{item.originalPrice}` are line totals).

**Still applies — remote `bundle.*` display:** **`data-next-display="bundle.{selectorId}.*"`** on nodes **outside** **`[data-next-bundle-card]`** (e.g. bundle upsell offer columns) goes through **`BundleDisplayEnhancer`**, not the slot template pipeline. **`price`** / **`originalPrice`** there can still render unformatted — add **`data-next-format="currency"`** on those elements. See [safe-display-paths §6](safe-display-paths.md#6-bundleselectorid--bundledisplayenhancer-remote) and [`olympus/upsell-bundle-tier-pills.html`](../campaign-kit-templates/src/olympus/upsell-bundle-tier-pills.html).

### 6. Bundle selector pricing workflow trade-off
The bundle selector approach (same `packageId`, different quantities per card) works structurally, but changes the merchandising workflow in the Campaigns UI: classic package selectors allow direct tier price control per package, whereas the bundle/offer flow is driven by percent discount + rounding behavior. May still be the better long-term direction, but operators would need to adjust how they configure pricing.

### 7. Prepurchase bump pricing regression (`data-next-toggle-price` vs `data-next-display`) *(fixed — SDK 0.4.14)*

**Fixed (SDK 0.4.14):** Use **`data-next-toggle-display="unitPrice"`** and **`data-next-toggle-display="originalUnitPrice"`** for stable per-unit prices that do not multiply with synced qty — pair with `/ea` copy. These values are always correct regardless of which bundle tier is selected. Show the synced line total via **`data-next-toggle-display="price"`** / **`data-next-toggle-display="originalPrice"`** if needed. See `bump-check01.html` in reference templates for Option A (per-unit stable) and Option B (line total, scales) side by side. Bug log **BS-008 (`fixed`)**.

**Eng ask (still open):** Refresh toggle preview when main bundle tier or synced line qty changes — not only on bump check/uncheck. The `unitPrice`/`originalUnitPrice` approach is the template-side fix; the underlying SDK refresh gap remains.

### 8. Bundle selector: tier changes add lines instead of atomic swap *(historical — fixed on reference template)*
**Previously observed (bug log BS-013):** Clicking 1× → 2× → 3× could **append** separate cart lines for the same `packageId` instead of **replacing** quantity; after a full reload, cart/summary could show **default 1× plus** the persisted tier.

**Status:** **Fixed** on [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) (re-test passed): tier changes keep **one** line with correct qty; reload does not show stacked tiers. **Regression-watch:** re-run QA when upgrading SDK or enabling a second bundle selector / auto-render.

**Expected:** [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale) documents “atomic swap — no double-add”: exactly **one** line for the bundle’s main package, qty matching the selected card.

**Template check:** Ensure only **one** `data-next-bundle-selector` root (and one **`data-next-selector-id`** on that container if you use `data-next-bundle-slots-for` / external wiring) is emitted in HTML — duplicate roots are not the cause when auto-render blocks are comment-disabled. Do **not** use `data-next-bundle-selector-id`; the enhancer reads **`data-next-selector-id`** only.

**Diagnostic (not production):** `<meta name="next-clear-cart" content="true">` forces an empty cart each page load — only for isolating persistence issues (see bug log **BS-013**).

### 9. Cart summary v2: Amount strikethrough — fixed in SDK 0.4.11

**Fixed (2026-04-09):** The `{line.*}` namespace is deprecated in 0.4.11 — tokens render silently blank. Templates updated to `{item.*}`. The correct token for the Amount column strikethrough (full-line original) is **`{item.originalPrice}`** (line total before discounts in 0.4.11+). Use **`{item.originalUnitPrice}/ea`** for the per-unit subtitle.

**Tracking:** Bug log **BS-012** (`fixed`).

### 10. Cart display: `cart.discountCode` not resolved in summary *(fixed via workaround — SDK 0.4.13)*

**`data-next-display=”cart.discountCode”`** inside `[data-next-cart-summary]` still stays empty — `resolveValue` does not implement that key. **Fixed via workaround (SDK 0.4.13+):** use **`data-next-discounts=”voucher”`** with a `<template>` child; `{discount.description}` gives the code string (e.g. “EXIT10YO”), `{discount.name}` gives the display label, `{discount.amount}` the formatted savings. **`data-next-show=”cart.hasCoupon”`** / **`cart.hasCoupons`** work for conditional visibility. See bug log **BS-014** and reference `olympus/checkout.html` + `olympus-mv-single-step/checkout.html`.

---

## Template Workaround: External Slot Layout (`olympus-mv-single-step2`)

**Current direction:** Use **`olympus-mv-single-step`** with **`data-next-bundle-slots-for`** — no clone/bridge JS required. The **`olympus-mv-single-step-v0.4-bridge`** / **`-cards`** folders embodied older versions of this workaround and are **frozen** (see *Olympus MV single-step — bridge and cards (frozen)* above).

This template uses a single shared external “Select your color and size” block, but the SDK’s bundle selector wiring expects slot controls to live within each `[data-next-bundle-card]`. Slot/variant handlers and internal lookups are scoped to the card DOM, so rendering `data-next-bundle-slots` outside the card reliably breaks interactivity and dynamic bindings.

To preserve both requirements (design layout + SDK behavior), we use a clone-stage approach:
- Keep the real SDK `data-next-bundle-slots` inside each bundle card (hidden).
- Render the external stage by cloning the selected card’s rendered slot nodes (so the design can be shared).
- Bridge user interactions in the external stage back to the corresponding hidden source controls.
- Explicitly mirror runtime state and dynamic text nodes in the clones (e.g. `data-next-bundle-price="savingsPercentage"` and `data-next-display="..."`) because cloned nodes do not receive live SDK bindings.
- Avoid aggressive full re-renders on variant changes to prevent UI flicker/shift.

This is why the template includes extra JS and why some cloned price/savings text must be manually synced after async updates.

---

## Cart Summary v2 Notes (`data-next-cart-summary`)

When using the Summary v2 enhancer:
- Structure: `<div data-next-cart-summary><template> ... </template></div>`
- The SDK computes totals asynchronously and applies *state classes* to the `data-next-cart-summary` root (for example, `next-has-savings`, `next-no-savings`, `next-cart-has-items`).
- Inside the `<template>`, prefer **static CSS hook classes** (e.g. `next-has-discounts` / `next-has-savings` on the savings row) rather than relying on `data-next-show="cart.hasDiscounts"` / `cart.hasSavings` / other `data-next-show` conditions inside the injected template. Template-scoped `data-next-show` can evaluate before totals state is ready, leaving sections hidden after render.
- For empty-cart gating, use `data-next-hide="cart.isEmpty"` on the `data-next-cart-summary` root (or hide via CSS hooks).
- **`{line.*}` is deprecated — use `{item.*}`:** All `{line.*}` tokens inside `data-summary-lines` `<template>` render **silently blank** in SDK 0.4.11+. See **bundle-display-cart-cheatsheet.md** section 4 for the full `{item.*}` token reference.
- **`{item.price}` / `{item.originalPrice}` are line totals (0.4.11+):** Use `{item.unitPrice}` / `{item.originalUnitPrice}` for per-unit display.
- **`data-next-format` on line rows:** **`data-next-format=”currency”`** on elements inside the **`data-summary-lines`** `<template>` **does not** fix raw `{item.*}` output — **BS-015** (`medium`). Use **JS** or an SDK fix; do not assume the attribute works there.
- **Copy-only quirks:** Per-row **currency symbol** repetition — [template bug log](template-bug-log.md) **BS-009**. **“Today you saved” vs line savings** — **BS-010** **`verified`** for **bundle-tier** funnels with aligned Campaigns structure (`olympus` reference); legacy layouts may still need QA.
- **Coupon code badge:** Do not use **`data-next-display="cart.discountCode"`** — it stays empty (see **Known #10** / **BS-014**). Use **`data-next-discounts="voucher"`** (SDK 0.4.13+) with a `<template>` child: **`{discount.description}`** for the code string, **`{discount.name}`** for the display label (see [Cart Summary — Step 5](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary#step-5-discount-breakdowns)). **`data-next-show="cart.hasCoupon"`** is safe for conditional visibility.

---

## Upsell Approaches (0.4.x)

Two patterns exist. Choose based on whether you need voucher-aware pricing and coupon submission.

| | Approach A — Package upsell | Approach B — Bundle upsell |
|---|---|---|
| Container | `data-next-upsell="offer"` + `data-next-package-id` | `data-next-bundle-selector` + `data-next-upsell-context` |
| Pricing display | `data-next-display="package.*"` + `data-next-multiply-quantity` | `data-next-bundle-display="price/originalPrice/discountPercentage"` |
| Quantity | `data-next-upsell-quantity-toggle` — scales displayed prices | `data-next-upsell-quantity-toggle` — scales displayed prices only; does **NOT** update `data-next-bundle-items` quantity |
| Voucher on accept | ❌ Not sent — `UpsellEnhancer` only attaches vouchers on bundle path (`ctx.bundleItems?.length`) | ✅ Sent — selected card's `data-next-bundle-vouchers` included in `AddUpsellLine` payload |
| Voucher-aware UI pricing | ❌ `calculatePackageDiscountAmount()` is a no-op; `package.*` values are catalog math only | ✅ Vouchers merged into `calculateBundlePrice` at init — bundle display reflects codes |
| Checkout coupon re-fetch | ❌ Not triggered in upsell context | ❌ Not triggered either — bundle price only re-fetched at init in upsell context |
| Requires SDK | Any | **≥ 0.4.7** |
| Accept button | `data-next-upsell-action="add"` | `data-next-upsell-action="add"` + `data-next-upsell-action-for="[selectorId]"` |
| Skip button | `data-next-upsell-action="skip"` | `data-next-upsell-action="skip"` (on outer wrapper, not inside bundle selector) |

**When to use each:**
- **Approach A** — simple add-on where the offer price is baked into the campaign package. No coupons needed. Works today.
- **Approach B** — offer price is driven by a voucher code (e.g. `UPSELL20`). Code must exist in the campaign. Use a separate card per quantity tier for per-qty pricing; the qty toggle does not recompute bundle item totals; pair with small glue — **`initBundleQtyToggle`** lives in **`olympus/assets/js/upsells.js`** (standard bundle upsell pages) and **`olympus-mv-single-step/assets/js/upsells-up01-mv.js`** (MV upsell) when you need the toggle to drive which tier card is selected.

**Reference templates (`olympus/`):**
- **`upsell-bundle-stepper.html`** — One hidden `data-next-bundle-card` + `data-next-upsell-context` + optional SDK **bundleQuantity** stepper (`data-next-bundle-qty-for`, 0.4.18+). Still the **bundle** upsell path, not the non-bundle selection upsell API.
- **`upsell-bundle-tier-pills.html`** — Hidden tier row + `initBundleQtyToggle`: `data-next-bundle-selector` + `data-next-upsell-context`, `data-next-bundle-vouchers` (per-tier voucher example).
- **`upsell-bundle-tier-cards.html`** — Same bundle + voucher wiring as `upsell-bundle-tier-pills.html`, but tier `data-next-bundle-card` elements are visible in a grid and clicked directly (UX like the public [Upsells — card selection pattern](https://developers.nextcommerce.com/docs/campaigns/upsells#card-selection-pattern); markup is still bundle cards, not `data-next-upsell-selector`).

**Reference — MV + external slots (`olympus-mv-single-step/`):**
- **`upsell-mv.html`** — Approach B bundle upsell with **`data-next-bundle-slots-for`** / slot markup; **`upsells-up01-mv.js`** is limited to **`setupBundleSlotVariantDropdowns()`** (optional custom variant dropdowns) + **`initBundleQtyToggle()`** — not the older monolithic upsell controller.

### Why coupon / voucher upsell pricing needs the bundle pattern

Public [Campaign Cart](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) upsell examples describe **direct** and **selection** upsells using `data-next-upsell` + `data-next-package-id` and `data-next-display="package.*"` for pricing. That assumes **campaign package JSON** (retail vs list, static package math) is enough for the offer. It is **not** sufficient when the business needs **backend coupon / voucher codes** to drive **both** the **shown** price and the **accepted** order line.

**Submit path:** `UpsellEnhancer` → `addUpsellToOrder` attaches vouchers to the payload on the **bundle** branch (`ctx.bundleItems` + bundle vouchers). The **single-package** upsell body is **lines + currency only** — there is no declarative hook to send coupon codes on the standard direct upsell path.

**Preview path:** `data-next-display="package.*"` on an upsell page does **not** run the same voucher-merge + calculate flow as `BundleSelectorEnhancer` with `data-next-bundle-vouchers`. The UI will not reliably stay in sync with “price after `UP50`” (or similar) versus what you intend to POST, unless you bake artificial prices into the package record or build custom calculate + DOM updates.

**Quantity:** `data-next-upsell-quantity-toggle` updates quantity for the **single-package** path but does **not** update `data-next-bundle-items` quantities used for voucher-aware `calculateBundlePrice`. Tiered quantity **plus** coupon needs **one bundle card per quantity tier** (or an equivalent), not the doc quantity-only pattern alone.

**Conclusion:** For **coupon-controlled upsell pricing**, teams should not expect to “only follow” the classic direct upsell examples and get correct preview + accept. Use **Approach B** (bundle upsell): `data-next-bundle-selector` + `data-next-upsell-context`, `data-next-bundle-vouchers`, `data-next-upsell-action-for`, and tier cards as needed.

**Engineering ask (optional):** Document this path in the public Upsells guide and/or extend `UpsellEnhancer` / `window.next.addUpsell` so **AddUpsellLine-style vouchers** are supported on the **single-package** path for teams that want coupons **without** full bundle markup.

---

## Open Issues (templates)

- **`olympus/checkout.html`** — primary **bundle selector** reference; full BS-xxx log in [`docs/template-bug-log.md`](template-bug-log.md). Previously-open items now resolved: **#8** swap/add lines (`fixed`), **#9** summary tokens (`fixed 0.4.11`), **#10** coupon display (`fixed via workaround 0.4.13`), **#3** bundle card shipping (`fixed 0.4.12`), **#7** bump regression (`fixed 0.4.14`), **#5** slot formatting (`fixed 0.4.11`). **BS-019** (ghost cart/coupon on receipt **reload** after submit): **fixed SDK 0.4.17**. **Still open: #4** — `data-next-package-price="compare/savings"` slots return per-unit retail (not package total) for multi-package setups; `savingsAmount`/`savingsPercentage` are static (retail-vs-base only). Affects multi-package selector path only; bundle selector is the recommended direction. **Checkout bundle multiplier:** demo on **`limos/checkout.html`** (SDK **0.4.18**); olympus checkout omits native **`bundleQuantity`** on purpose.
- **`olympus-mv-single-step/upsell-mv.html`** — **Approach B** MV upsell (tiers + vouchers); QA per-tier codes in Campaigns match `data-next-bundle-vouchers` on each card. Variant dropdown glue and qty toggle: **`assets/js/upsells-up01-mv.js`**. **BS-018** (session coupon vs upsell **`bundle.*`** display): **`verified`** on **Campaign Cart 0.4.17+** reference smoke — see [`docs/campaign-issues-overview.md`](campaign-issues-overview.md) fixed **#14** / [`docs/template-bug-log.md`](template-bug-log.md) **BS-018**. Historical **#8** variant-family **workaround retired** (**#15**). **SDK 0.4.17** also clears post-checkout **`sessionStorage`** (**BS-019**). **Regression-watch** on SDK bumps.
