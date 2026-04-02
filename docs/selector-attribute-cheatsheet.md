# Selector and Package Display Attribute Guide

This guide combines:
- compare tables,
- a quick cheat sheet,
- and copy-paste examples.

All behavior below reflects current SDK behavior (`0.4.x`).

## Quick Cheat Sheet

### 1) Base campaign prices (no coupon/offer adjustment)
Use for static/default pricing display.

- `package.price`, `package.price_total`, `package.unitPrice`, `package.packageTotal`
- `package.price_retail`, `package.price_retail_total`, `package.unitRetailPrice`, `package.comparePrice`, `package.compareTotal`
- `selection.price`, `selection.total`, `selection.price_total`, `selection.unitPrice`, `selection.pricePerUnit`, `selection.compareTotal`

### 2) Coupon-aware values (SDK applied coupons)
Use for "after coupon" display.

- `package.discountedPrice`, `package.discountedPriceTotal`
- `package.discountAmount`, `package.hasDiscount`
- `package.finalPrice`, `package.finalPriceTotal`
- `package.totalSavingsAmount`, `package.totalSavingsPercentage`, `package.hasTotalSavings`
- `selection.discountedPrice`, `selection.finalPrice`
- `selection.appliedDiscountAmount`, `selection.discountPercentage`, `selection.hasDiscount`, `selection.appliedDiscounts`

### 3) Backend offer/voucher-resolved selector card pricing
Use on selector cards when you want backend-calculated offer/voucher pricing.

- `data-next-package-price` (default total)
- `data-next-package-price="subtotal"`
- `data-next-package-price="compare"`
- `data-next-package-price="savings"`
- `data-next-package-price="savingsPercentage"`

### 4) Bundle selector pricing (`data-next-bundle-price`)
Use inside `data-next-bundle-card` elements. Fully coupon + offer aware. Supports automatic per-tier voucher management via `data-next-bundle-vouchers`.

- `data-next-bundle-price` (default total)
- `data-next-bundle-price="compare"`
- `data-next-bundle-price="savings"`
- `data-next-bundle-price="savingsPercentage"`

## Decision Matrix

| Goal | Recommended field |
|------|-------------------|
| Plain base product price | `package.price` or `selection.price` |
| Compare-at and base savings | `package.compareTotal` + `package.savingsAmount` |
| Coupon-adjusted final price | `package.finalPriceTotal` or `selection.finalPrice` |
| Backend offer/voucher tier card pricing | `data-next-package-price="..."` |
| Bundle selector pricing (fully reactive, auto voucher) | `data-next-bundle-price="..."` |

## Compare Tables

### Package Display (`data-next-display="package.*"`)

| Attribute | Uses base campaign prices | Affected by coupons (`appliedCoupons`) | Affected by backend offer/voucher pricing | Notes |
|-----------|:-------------------------:|:--------------------------------------:|:-----------------------------------------:|-------|
| `package.price` | Yes | No | No | Base per-unit |
| `package.price_total` | Yes | No | No | Base total |
| `package.unitPrice` | Yes | No | No | Alias-style per-unit |
| `package.packageTotal` | Yes | No | No | Alias-style total |
| `package.price_retail` | Yes | No | No | Retail/compare |
| `package.price_retail_total` | Yes | No | No | Retail total |
| `package.unitRetailPrice` | Yes | No | No | Retail per-unit |
| `package.comparePrice` | Yes | No | No | Alias for retail total |
| `package.compareTotal` | Yes | No | No | Alias for retail total |
| `package.savingsAmount` | Yes | No | No | Retail-vs-base savings |
| `package.savingsPercentage` | Yes | No | No | Retail-vs-base % |
| `package.unitSavings` | Yes | No | No | Per-unit savings |
| `package.unitSavingsPercentage` | Yes | No | No | Per-unit savings % |
| `package.hasSavings` | Yes | No | No | Boolean |
| `package.discountedPrice` | Yes | Yes | No | Coupon-adjusted unit |
| `package.discountedPriceTotal` | Yes | Yes | No | Coupon-adjusted total |
| `package.discountAmount` | Yes | Yes | No | Coupon amount |
| `package.hasDiscount` | Yes | Yes | No | Boolean |
| `package.finalPrice` | Yes | Yes | No | Final unit (coupon-aware) |
| `package.finalPriceTotal` | Yes | Yes | No | Final total (coupon-aware) |
| `package.totalSavingsAmount` | Yes | Yes | No | Retail + coupon savings |
| `package.totalSavingsPercentage` | Yes | Yes | No | Combined savings % |
| `package.totalSavingsWithDiscounts` | Yes | Yes | No | Alias |
| `package.totalSavingsPercentageWithDiscounts` | Yes | Yes | No | Alias |
| `package.hasTotalSavings` | Yes | Yes | No | Boolean |
| `package.unitsInPackage`, `package.isBundle`, `package.isRecurring`, `package.isOneTime`, `package.hasRetailPrice` | Yes | No | No | Helpers/booleans |
| `*.raw` variants (`unitPrice.raw`, `finalPrice.raw`, etc.) | Same as parent | Same as parent | Same as parent | Numeric/raw output |

### Selector Display (`data-next-display="selection.*"`)

| Attribute | Uses base campaign prices | Affected by coupons | Affected by backend offer/voucher pricing | Notes |
|-----------|:-------------------------:|:-------------------:|:-----------------------------------------:|-------|
| `selection.price` | Yes | No | No | Base selected package price |
| `selection.total`, `selection.price_total` | Yes | No | No | Base total |
| `selection.compareTotal`, `selection.price_retail_total` | Yes | No | No | Base compare total |
| `selection.unitPrice`, `selection.pricePerUnit` | Yes | No | No | Base unit |
| `selection.savingsAmount`, `selection.savings` | Yes | No | No | Retail-vs-base |
| `selection.savingsPercentage` | Yes | No | No | Retail-vs-base % |
| `selection.hasSavings` | Yes | No | No | Boolean |
| `selection.discountedPrice`, `selection.finalPrice` | Yes | Yes | No | Coupon-adjusted unit |
| `selection.appliedDiscountAmount` | Yes | Yes | No | Coupon amount |
| `selection.hasDiscount` | Yes | Yes | No | Boolean |
| `selection.discountPercentage` | Yes | Yes | No | Coupon % |
| `selection.appliedDiscounts` | Yes | Yes | No | Coupon breakdown |
| `selection.discountAmount` | Yes | No* | No | In selection context behaves like savings-style value |
| `selection.hasSelection`, `selection.packageId`, `selection.quantity`, `selection.name`, `selection.totalUnits`, `selection.isBundle`, `selection.isMultiPack`, `selection.isSingleUnit`, `selection.monthlyPrice`, `selection.yearlyPrice`, `selection.pricePerDay`, `selection.savingsPerUnit` | Yes | Mostly No | No | Derived/helper values |

\* `selection.discountAmount` naming differs from coupon-focused fields like `appliedDiscountAmount`.

### Bundle Selector Card Slots (`data-next-bundle-price`)

Full **`data-next-bundle-display`** field list, **`bundle.{selectorId}.*`** remote keys, and cart summary **`{line.*}`** tokens: [`docs/bundle-display-cart-cheatsheet.md`](bundle-display-cart-cheatsheet.md).

| Attribute | Affected by coupons/vouchers | Affected by backend offers | Notes |
|-----------|:----------------------------:|:--------------------------:|-------|
| `data-next-bundle-price` | Yes | Yes | Default total |
| `data-next-bundle-price="compare"` | Yes | Yes | Compare/retail total |
| `data-next-bundle-price="savings"` | Yes | Yes | Savings amount |
| `data-next-bundle-price="savingsPercentage"` | Yes | Yes | Savings % |

### Selector Card Backend Slots (`data-next-package-price`)

| Attribute | Affected by coupons/vouchers | Affected by backend campaign offers | Notes |
|-----------|:----------------------------:|:-----------------------------------:|-------|
| `data-next-package-price` | Yes | Yes | Default total |
| `data-next-package-price="subtotal"` | Yes | Yes | Subtotal slot |
| `data-next-package-price="compare"` | Yes | Yes | Compare/retail slot |
| `data-next-package-price="savings"` | Yes | Yes | Savings amount |
| `data-next-package-price="savingsPercentage"` | Yes | Yes | Savings percentage |

## Examples

### A) Package display: base + coupon-aware outputs

```html
<div data-next-package-id="123">
  <h3 data-next-display="package.name">Product Name</h3>

  <!-- Base -->
  <p>Base unit: <span data-next-display="package.unitPrice">$0.00</span></p>
  <p>Base total: <span data-next-display="package.packageTotal">$0.00</span></p>

  <!-- Coupon-aware -->
  <p>Final unit: <span data-next-display="package.finalPrice">$0.00</span></p>
  <p>Final total: <span data-next-display="package.finalPriceTotal">$0.00</span></p>
  <p data-next-show="package.hasDiscount">
    Coupon saved: <span data-next-display="package.discountAmount">$0.00</span>
  </p>
</div>
```

### B) Selector display (`selection.*`)

```html
<div data-next-display="selection.main.price"></div>
<div data-next-display="selection.main.total"></div>
<div data-next-display="selection.main.finalPrice"></div>
<div data-next-display="selection.main.discountPercentage"></div>
```

### C) Selector card backend pricing (offer/voucher-aware)

```html
<div data-next-package-selector data-next-selector-id="main">
  <div data-next-selector-card data-next-package-id="123" data-next-selected="true">
    <div>Total: <span data-next-package-price></span></div>
    <div>Compare: <span data-next-package-price="compare"></span></div>
    <div>Savings: <span data-next-package-price="savings"></span></div>
    <div>Save %: <span data-next-package-price="savingsPercentage"></span></div>
  </div>
</div>
```

### D) Bundle selector pricing (fully reactive — coupons + offers + auto vouchers)

```html
<div data-next-bundle-selector data-next-bundle-slot-template-id="unit-price-tpl">

  <template id="unit-price-tpl">
    <div class="os-card__price os--compare">{item.originalUnitPrice}</div>
    <div class="os-card__price os--current">{item.unitPrice}/ea</div>
  </template>

  <div data-next-bundle-card data-next-bundle-id="buy3"
       data-next-bundle-items='[{"packageId":2,"quantity":3}]'
       data-next-bundle-vouchers="SAVE15"
       data-next-selected="true">
    <div>SAVE <span data-next-bundle-price="savingsPercentage">-</span></div>
    <div>Save <span data-next-bundle-price="savings">$0.00</span></div>
    <div data-next-bundle-slots></div>
    <div>Compare: <span data-next-bundle-price="compare">-</span></div>
    <div>Total: <span data-next-bundle-price>-</span></div>
  </div>

</div>
```
