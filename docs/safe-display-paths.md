# Safe `data-next-display` paths (SDK-aligned)

Practical allowlist for **`data-next-display`** on marketing/checkout/upsell templates. Behavior matches **campaign-cart** as of the **0.4.x** line (bundle events use `selectorId` in `detail`).

**How routing works:** the first dot segment is the **namespace**. `AttributeScanner` picks the enhancer from that namespace (`cart`, `package`, `selection`, `order`, `shipping`, `bundle`, `selector`, `toggle`, `campaign`, or context-only `package.*`).

**Global tips**

- Prefer **`data-next-format="currency"`** or **`percentage`** when remote **`bundle.{selectorId}.*`** money or % fields look like raw numbers (known `BundleDisplayEnhancer` init quirk until fixed in core).
- **`data-next-show` / `data-next-hide`** do **not** understand **`bundle.*`** paths; use bundle card **`data-next-bundle-display`** visibility fields or other namespaces for conditionals.
- Elements with **`display: none`** skip updates in the display core (performance); keep bound price copy in visible DOM when possible.

---

## 1. `cart.*` / `cart-summary.*` — `CartDisplayEnhancer`

Safe when a cart session exists (checkout / cart drawer).

| Path pattern | Notes |
|--------------|--------|
| `cart.isEmpty`, `cart.hasItems`, `cart.hasDiscounts`, `cart.hasShippingDiscount` | Booleans |
| `cart.quantity`, `cart.itemCount` | Counts |
| `cart.subtotal`, `cart.total`, `cart.shipping`, `cart.shippingOriginal`, `cart.shippingDiscountAmount`, `cart.shippingDiscountPercentage` | Money / % |
| `cart.totalDiscount`, `cart.discounts`, `cart.totalDiscountPercentage` | Discounts |
| `cart.hasCoupons`, `cart.hasCoupon`, `cart.couponCount` | Coupons |
| `cart.discountCode`, `cart.discountCodes`, `cart.coupons[0].code`, `cart.coupons[1].code` | Codes |

Use **`cart-summary`** the same way where your theme expects that alias (scanner treats it like cart).

---

## 2. `package.*` — `ProductDisplayEnhancer`

**Context:** ancestor with **`data-next-package-id`** (or explicit **`package.{ref_id}.{property}`**).

Registry-backed properties (formatting applied) — **safe for general use**:

| Category | Examples |
|----------|----------|
| Identity / meta | `package.name`, `package.image`, `package.ref_id`, `package.qty`, … |
| Base campaign prices | `package.price`, `package.price_total`, `package.unitPrice`, `package.packageTotal`, `package.price_retail`, `package.price_retail_total`, `package.unitRetailPrice`, `package.comparePrice`, `package.compareTotal` |
| Retail savings | `package.savingsAmount`, `package.savingsPercentage`, `package.unitSavings`, `package.hasSavings` |
| Coupon-aware (checkout cart context) | `package.discountedPrice`, `package.finalPrice`, `package.finalPriceTotal`, `package.discountAmount`, `package.hasDiscount`, `package.totalSavingsAmount`, `package.totalSavingsPercentage`, `package.hasTotalSavings` |
| Helpers | `package.isBundle`, `package.isRecurring`, `package.unitsInPackage`, … |
| Raw numbers | `*.raw` suffix where documented (e.g. `package.finalPriceTotal.raw`) |

**Explicit ID:** `package.123.name`, `package.123.price`, … (same property set; `123` = package `ref_id`).

**Caveat — post-purchase upsell pages:** coupon breakdown in **`ProductDisplayEnhancer`** is not driven like checkout; for **voucher-priced upsell lines** use **`bundle.*`** (below) or fixed package list prices.

**`campaign.*`:** same enhancer as package for campaign-level fields; use only when your campaign object exposes the field.

---

## 3. `selection.{selectorId}.*` — `SelectionDisplayEnhancer`

**Requires** a **`PackageSelectorEnhancer`** (or compatible) with matching **`data-next-selector-id`**.

Safe properties (after the selector id):

| Category | Examples |
|----------|----------|
| Selection | `hasSelection`, `packageId`, `quantity`, `name` |
| Pricing | `price`, `total`, `price_total`, `compareTotal`, `unitPrice`, `pricePerUnit` |
| Savings | `savingsAmount`, `savings`, `savingsPercentage`, `hasSavings` |
| Coupon-side | `discountedPrice`, `finalPrice`, `appliedDiscountAmount`, `discountPercentage`, `hasDiscount`, `appliedDiscounts` |
| Bundle helpers | `isBundle`, `totalUnits`, `isMultiPack`, `isSingleUnit`, `monthlyPrice`, `yearlyPrice`, … |

Example: `data-next-display="selection.main.finalPrice"`.

---

## 4. `order.*` — `OrderDisplayEnhancer`

Safe on **thank-you / order status / upsell** once `orderStore` has an order.

| Area | Examples |
|------|----------|
| Core | `order.refId`, `order.ref_id`, `order.number`, `order.total`, `order.total_incl_tax`, `order.status`, `order.currency`, `order.createdAt`, `order.statusUrl`, `order.paymentMethod`, `order.shippingMethod` |
| Money | `order.subtotal`, `order.tax`, `order.shipping`, `order.discounts`, `order.savings`, `order.savingsAmount`, `order.savingsPercentage` |
| Flags | `order.hasItems`, `order.isEmpty`, `order.hasShipping`, `order.hasTax`, `order.hasDiscounts`, `order.hasUpsells`, `order.supportsUpsells` |
| Customer | `order.customer.name`, `order.customer.email`, … |
| Addresses | `order.shippingAddress.line1`, `order.shippingAddress.city`, … (same for `billingAddress.*`) |
| Lines (see source for full line API) | `order.lines.count`, `order.lines[0].title`, … |

Nested keys beyond the registry still work in many cases via `PropertyResolver`; prefer mapped keys above for stable formatting.

---

## 5. `shipping.*` — `ShippingDisplayEnhancer`

**Requires** ancestor with **`data-next-shipping-id="{ref_id}"`**.

| Path | Notes |
|------|--------|
| `shipping.name`, `shipping.cost`, `shipping.price`, `shipping.isFree`, `shipping.code`, `shipping.id`, `shipping.refId` | Campaign shipping method |

---

## 6. `bundle.{selectorId}.*` — `BundleDisplayEnhancer` (remote)

**Requires** **`[data-next-bundle-selector]`** with **`data-next-selector-id="{selectorId}"`**.

| Property | Safe with notes |
|----------|-----------------|
| `price`, `originalPrice`, `compare` | Add **`data-next-format="currency"`** on the element until core fixes default format for compound paths. |
| `discountPercentage`, `savingsPercentage` | Prefer **`data-next-format="percentage"`**. |
| `discountAmount`, `savings` | Currency + explicit format recommended. |
| `hasDiscount`, `hasSavings`, `isSelected` | Booleans (ok for logic elsewhere; not for `data-next-show` — see above). |
| `name` | Only if each **`data-next-bundle-card`** sets **`data-next-bundle-name="..."`**. Not auto-filled from package. Use **`package.{ref_id}.name`** if you want the campaign package title without setting card names. |
| `unitPrice`, `originalUnitPrice` | **Not implemented** for remote bundle display — use **`data-next-bundle-display`** on the card. |

Events to rely on: **`bundle:selection-changed`**, **`bundle:price-updated`** (`detail.selectorId` = selector id).

---

## 7. `selector.*` / `toggle.*` — selector card displays

Used for **`PackageSelectorDisplayEnhancer`** / **`PackageToggleDisplayEnhancer`** (card-level mirrors of calculated state). Follow the Package Selector / Package Toggle guides in `src/enhancers/cart/*/guide/` for token names.

---

## 8. Prefer non–`data-next-display` APIs where documented

| Need | Mechanism |
|------|-----------|
| Bundle card interior pricing | **`data-next-bundle-display="price"`** (and siblings) **inside** the card — formats like the bundle renderer. |
| Selector card calculated totals | **`data-next-package-price`** slots on **`data-next-selector-card`**. |
| Cart chrome templates | **`data-next-cart-summary`** / **`data-summary-lines`** tokens (see **`docs/bundle-display-cart-cheatsheet.md`**). |

---

## References

- **`docs/selector-attribute-cheatsheet.md`** — package + selection tables.
- **`docs/bundle-display-cart-cheatsheet.md`** — bundle + cart summary.
- **`src/enhancers/display/DisplayEnhancerTypes.ts`** — `PROPERTY_MAPPINGS` (authoritative registry for `cart`, `package`, `selection`, `shipping`, `order`).
- **`src/enhancers/core/AttributeScanner.ts`** — namespace → enhancer routing.
