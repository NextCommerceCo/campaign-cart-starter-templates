# SDK 0.4.0 Migration Notes

Tracks changes needed across templates when upgrading from SDK 0.3.x to 0.4.0.

**Bundle selector reference template:** `campaign-kit-templates/src/olympus-v0.4/` — QA [`docs/olympus-v0.4.0-sdk-qa-checklist.md`](olympus-v0.4.0-sdk-qa-checklist.md), issue log [`docs/olympus-v0.4.0-bundle-selector-bug-log.md`](olympus-v0.4.0-bundle-selector-bug-log.md).

---

## Template versioning practice

When upgrading a template to a new SDK version, **clone the existing template folder to a new versioned slug** — do not modify the original. The original stays locked to its SDK version as a stable baseline.

Example: upgrading `olympus` (0.3.12) → clone to `olympus-v0.4`, make all changes there. `olympus/` remains untouched.

- New folder name: `[template-name]-v[sdk-major.minor]` (e.g. `olympus-v0.4`)
- Add a matching entry in `campaigns.json` with the correct `sdk_version`
- The original template entry in `campaigns.json` keeps its original `sdk_version`

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
| `data-next-bundle-price="total"` | Display | Card total — **use explicitly** on every tier; bare `data-next-bundle-price` may not bind on all cards (bug log **BS-006**) |
| `data-next-bundle-display="…"` | Display | Reactive slots inside cards (`hasSavings`, `unitPrice`, `originalUnitPrice`, etc.) — see [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md) |
| `data-next-bundle-price="compare"` | Display | Compare/retail total |
| `data-next-bundle-price="savings"` | Display | Savings amount |
| `data-next-bundle-price="savingsPercentage"` | Display | Savings % |
| `data-next-bundle-slots` | Display | Renders slot rows from template |

**`data-next-shipping-id` on bundle cards:** Not part of this table and **not** documented for **`data-next-bundle-card`**. Do not rely on copying the package-selector pattern (`data-next-shipping-id` on each card) to pick a `shipping_methods[].ref_id` per quantity tier — template QA shows **no effect**. Use **`next.setShippingMethod(refId)`** when the selected bundle changes if you need imperative control, and re-check summary totals (**Known issue #3** can still affect displayed shipping/total on selector flows).

**`data-next-selection-mode="swap"`** on the bundle container appears in examples here and in some templates; the public [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale) guide describes atomic swap without documenting this attribute on the bundle root. If tier changes **stack** cart lines instead of replacing, see **Known #8** (bug log **BS-013**).

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

| Template | Selector fix | Token renames | Bug fixes | Notes |
|----------|-------------|---------------|-----------|-------|
| `olympus-v0.4` | ✅ bundle selector | ✅ 0.4.x → **0.4.8** | 🔄 QA | Reference **bundle** checkout (`data-next-bundle-selector` + Summary v2). Open: **#8** (swap/add lines), **#9** (summary tokens), **#10** (`cart.discountCode` / coupon display), **#3** shipping vs totals, bump **#7** — [bundle bug log](olympus-v0.4.0-bundle-selector-bug-log.md) |
| `olympus-mv-single-step-v0.4` | ✅ native external slots | ✅ 0.4.x → **0.4.8** | 🔄 QA | Native `data-next-bundle-slots-for` + `data-next-variant-selector-template-id`. Replaces bridge JS. Pending: variant toggle initial state, swatch update. |
| `olympus` | 🔄 in progress | 🔄 in progress | 🔄 in progress | Legacy **multi-package** track: `savingsAmount`/`savingsPercentage` static; `data-next-package-price` compare/savings wrong for multi-package; `finalPriceTotal` coupon-aware for totals only |
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

**Bundle selector:** Per-tier shipping is **not** covered by declaring `data-next-shipping-id` on **`data-next-bundle-card`** (see note under **Bundle Selector → Key attributes**).

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

### 8. Bundle selector: tier changes add lines instead of atomic swap
**Observed on reference template (bug log BS-013).** Clicking 1× → 2× → 3× can **append** separate cart lines for the same `packageId` instead of **replacing** quantity (summary line count grows). After a full reload, cart/summary may show **default 1× plus** the persisted tier.

**Expected:** [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale) documents “atomic swap — no double-add”: exactly **one** line for the bundle’s main package, qty matching the selected card.

**Template check:** Ensure only **one** `data-next-bundle-selector` root (and one **`data-next-selector-id`** on that container if you use `data-next-bundle-slots-for` / external wiring) is emitted in HTML — duplicate roots are not the cause when auto-render blocks are comment-disabled. Do **not** use `data-next-bundle-selector-id`; the enhancer reads **`data-next-selector-id`** only.

**Next action:** SDK / cart merge: `BundleSelectorEnhancer` (or downstream cart ops) must remove prior bundle items for the selector scope on tier change and must not re-apply the HTML default tier on top of persisted state after refresh.

**Workaround (not production):** `<meta name="next-clear-cart" content="true">` forces an empty cart each page load and can **hide** the symptom in dev because nothing is left in session to merge with bundle init — at the cost of **no cart persistence** (see bug log **BS-013**).

### 9. Cart summary v2: `{line.priceRetailTotal}` wrong vs line totals
In `[data-next-cart-summary]` template tokens, **`{line.priceRetailTotal}`** may equal per-unit-style fields (`{line.priceRetail}`, `{line.originalPackagePrice}`, etc.) instead of the **full-line** retail total. Strike/compare rows in the order summary then disagree with `{line.total}` / list math.

**Expected:** `priceRetailTotal` (or documented equivalent) should be **quantity × retail** for the line, consistent with how `{line.total}` represents the sale line total.

**Tracking:** Bug log **BS-012**; validate against `window.nextDebug?.stores?.cart?.getState()` line items when triaging.

### 10. Cart display: `cart.discountCode`, `cart.hasCoupon`, etc. not resolved (summary enhancer)
**Regression from cart display moving under cart summary** (`CartSummaryEnhancer.display.ts` → `resolveValue`). Only a fixed set of cart UI properties is implemented (subtotal, total, totalDiscount, shipping fields, itemCount, …). **`discountCode`**, **`hasCoupon`**, **`hasCoupons`**, **`discountCodes`**, **`coupons[0].code`**, and similar are **omitted** → default branch logs **“Unknown cart display property”** and returns **`undefined`**, so **`data-next-display` / `data-next-show`** nodes stay empty.

**Docs drift:** `DisplayEnhancerTypes.ts` may still list **`cart.discountCode` → vouchers**, but that path is **not** connected to the new resolver.

**Data still exists:** Vouchers can be on cart state after totals; **checkout** store holds codes — the **display** layer does not bind them for these keys until engineering extends `resolveValue` / subscriptions.

**Workaround:** Use **[Cart Summary voucher lists](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary#step-5-discount-breakdowns)** (`data-summary-voucher-discounts`, `{discount.name}`), or custom JS. See bug log **BS-014**.

**Eng one-liner:** *Cart display refactor dropped `discountCode` / coupon fields from `resolveValue`; `PROPERTY_MAPPINGS` still lists them but they’re unreachable.*

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

## Cart Summary v2 Notes (`data-next-cart-summary`)

When using the Summary v2 enhancer:
- Structure: `<div data-next-cart-summary><template> ... </template></div>`
- The SDK computes totals asynchronously and applies *state classes* to the `data-next-cart-summary` root (for example, `next-has-savings`, `next-no-savings`, `next-cart-has-items`).
- Inside the `<template>`, prefer **static CSS hook classes** (e.g. `next-has-savings` on the savings row) rather than relying on `data-next-show="cart.hasSavings"` / `data-next-show` conditions inside the injected template. Template-scoped `data-next-show` can evaluate before totals state is ready, leaving sections hidden after render.
- For empty-cart gating, use `data-next-hide="cart.isEmpty"` on the `data-next-cart-summary` root (or hide via CSS hooks).
- **Line-level retail total token:** If `{line.priceRetailTotal}` matches unit retail fields instead of a true line retail total, treat as **Known #9** / **BS-012** — verify against cart state before “fixing” template math in Liquid.
- **Copy-only quirks:** “Today you saved” / per-row currency formatting issues are tracked in the bundle bug log (**BS-009**, **BS-010**) when they affect the olympus v0.4.0 reference checkout.
- **Coupon code badge:** Do not rely on **`data-next-display="cart.discountCode"`** or **`data-next-show="cart.hasCoupon"`** inside the summary template until **Known #10** / **BS-014** is fixed — use **`data-summary-voucher-discounts`** + **`{discount.name}`** (see [Cart Summary — Step 5](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary#step-5-discount-breakdowns)) or custom JS.

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
- **Approach B** — offer price is driven by a voucher code (e.g. `UPSELL20`). Code must exist in the campaign. Use a separate card per quantity tier for per-qty pricing; the qty toggle does not recompute bundle item totals.

Reference implementation: `olympus-v0.4/upsell.html` (both approaches with status comments).

---

## Open Issues (templates)

- **`olympus-v0.4/checkout.html`** — primary **bundle selector** reference; detailed QA/issues in [`docs/olympus-v0.4.0-bundle-selector-bug-log.md`](olympus-v0.4.0-bundle-selector-bug-log.md). Watch **Known #8** (tier swap → cart lines), **#9** (summary `{line.priceRetailTotal}`), **#10** (`cart.discountCode` / coupon display resolver), **#3** (shipping vs summary), **#7** (bumps on old pattern).
- `olympus/checkout.html` — legacy **multi-package** selector; QA ongoing; bumps holding on old 0.3.x pattern (SDK issue #7).
- Multi-package limitation: `savingsAmount`/`savingsPercentage` are static (retail-vs-base only); coupons reflect only in `finalPriceTotal`. `data-next-package-price="compare"/"savings"` slots return per-unit retail (not package total) for multi-package setups — **Known #4**.
- **Bundle selector** (`olympus-v0.4`) is the supported direction for coupon+offer-aware tier cards (`data-next-bundle-price` / `data-next-bundle-vouchers`). Remaining SDK blockers include **#5** (raw slot template numbers), **#7** (bump regression), **#8** (swap semantics), **#9** (summary line tokens), **#10** (cart coupon display keys).
