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

## Open Issues

- `olympus/checkout.html` — multi-package selector active; test single-package selector commented out in file for reference
- Multi-package limitation: `savingsAmount`/`savingsPercentage` are static (retail-vs-base only); coupons reflect only in `finalPriceTotal`. No template-level fix — architectural limitation of multi-package approach.
- `data-next-package-price="compare"` broken for multi-package: API returns per-unit retail price instead of package retail total (quantity is always 1 per package). `savings`/`savingsPercentage` slots are wrong as a result.
- Remaining QA needed on olympus checkout before marking complete
