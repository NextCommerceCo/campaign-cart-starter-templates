# Bundle display & cart summary line cheat sheet

Reference for **`data-next-bundle-display`**, remote **`data-next-display="bundle.{selectorId}.*"`**, and **`[data-next-cart-summary]`** template tokens. Bundle events use **`selectorId`** (from `data-next-selector-id`) as of **campaign-cart v0.4.8** — not a per-card `bundleId` in event `detail`.

**Related in this repo:** [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) · [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md) (package / `selection.*` / `data-next-package-price`) · [`docs/template-bug-log.md`](template-bug-log.md) (0.4.x template bug log — BS-012, BS-014, etc.).

**Official:** [Cart Summary guide](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary) · [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale).

---

## 1. Bundle card: `data-next-bundle-display` / `data-next-bundle-price`

Use **`data-next-bundle-display="<field>"`** on elements **inside** `[data-next-bundle-card]` (common in newer templates).

**`data-next-bundle-price="<field>"`** accepts the **same** field names — many starter templates still use it; treat the two attributes as **equivalent slots**, not “old vs new.”

| Field value | Alias (same behavior) | What you get |
| ----------- | --------------------- | ------------ |
| `price` | `total` | Final bundle total (currency, after price fetch) |
| `compare` | `originalPrice` | Compare / pre-discount total (`subtotal` from price API) |
| `savings` | `discountAmount` | Total discount amount (currency) |
| `savingsPercentage` | `discountPercentage` | Discount % (formatted) |
| `unitPrice` | — | `total ÷` sum of slot quantities (per-unit after discount) |
| `originalUnitPrice` | — | `subtotal ÷` sum of slot quantities (per-unit compare) |
| `hasDiscount` | `hasSavings` | Toggles **visibility** when discount > 0 |
| `isSelected` | — | Toggles **visibility** when this card is selected |
| `name` | — | Bundle / card display name |

**Naming:** Some docs encourage `originalPrice` / `discountAmount` / `discountPercentage` / `hasDiscount` for new markup; older examples use `compare` / `savings` / `savingsPercentage` / `hasSavings`. **Both sets are valid** where the SDK maps them as aliases.

**BS-006 (`fixed` — markup rule):** Always use **`data-next-bundle-price="total"`** (explicit) for the tier total; bare **`data-next-bundle-price`** is not a supported pattern and may not bind.

---

## 2. Remote bundle display: `data-next-display="bundle.{selectorId}.{property}"`

`{selectorId}` must match **`data-next-selector-id`** on the **`[data-next-bundle-selector]`** root (not the per-card **`data-next-bundle-id`**).

| Property | Meaning |
| -------- | ------- |
| `isSelected` | Whether this bundle’s active selection is reflected |
| `name` | Selected card name |
| `price` | Selected bundle **total** |
| `compare` / `originalPrice` | Selected bundle **subtotal** (pre-discount) |
| `savings` / `discountAmount` | Discount **amount** |
| `savingsPercentage` / `discountPercentage` | Discount **%** |
| `hasSavings` / `hasDiscount` | Any discount on current selection |
| `unitPrice` / `originalUnitPrice` | **Not implemented** for remote bundle display yet — use **`data-next-bundle-display`** on the card for unit prices |

**Events** (`bundle:selected`, `bundle:selection-changed`, `bundle:price-updated`): **`detail.selectorId`** matches **`data-next-selector-id`** (v0.4.8+). Do **not** rely on **`detail.bundleId`** in new code.

---

## 3. Cart summary host: `[data-next-cart-summary]` template tokens

Used in the **root** `<template>` inside `data-next-cart-summary` (not inside `data-summary-lines`).

| Token | Meaning |
| ----- | ------- |
| `{subtotal}` | Subtotal before shipping and discounts |
| `{total}` | Grand total |
| `{shipping}` | Shipping (formatted, or `"Free"` if zero) |
| `{shippingOriginal}` | Shipping before shipping discount (empty if none) |
| `{tax}` | Tax |
| `{discounts}` | Total discount amount (offers + vouchers) |
| `{savings}` | Total savings (retail + applied discounts) |
| `{compareTotal}` | Compare-at style total |
| `{itemCount}` | Number of cart lines |

**State classes** on the host (for CSS): e.g. `next-cart-empty`, `next-cart-has-items`, `next-has-discounts`, `next-no-discounts`, `next-free-shipping`, `next-has-tax`, `next-calculating`, `next-not-calculating`, etc. Prefer these over fragile **`data-next-show`** inside the injected template when timing matters — see migration **Cart Summary v2 Notes**.

---

## 4. Cart summary lines: `data-summary-lines` row `<template>`

One row per cart line. Placeholders use the `{line.*}` prefix.

| Token | Meaning |
| ----- | ------- |
| `{line.packageId}` | Package `ref_id` |
| `{line.quantity}` | Quantity (string) |
| `{line.qty}` | Alias for quantity |
| `{line.name}` | Package display name |
| `{line.image}` | Product image URL |
| `{line.productName}` | Product name |
| `{line.variantName}` | Variant name |
| `{line.sku}` | SKU |
| `{line.price}` | Unit price from campaign (formatted) |
| `{line.priceTotal}` | Line total from campaign (formatted) |
| `{line.priceRetail}` | Retail / compare-at **unit** (campaign) |
| `{line.priceRetailTotal}` | Intended: retail / compare-at **line** total — **verify in QA** (may mirror unit fields; **Known #9** / **BS-012**) |
| `{line.priceRecurring}` | Recurring unit price (subscriptions) |
| `{line.priceRecurringTotal}` | Recurring line total |
| `{line.isRecurring}` | `"true"` \| `"false"` |
| `{line.unitPrice}` | Unit after discounts (API) |
| `{line.originalUnitPrice}` | Unit before discounts (API) |
| `{line.packagePrice}` | Package price after discounts (API) |
| `{line.originalPackagePrice}` | Package price before discounts (API) |
| `{line.subtotal}` | Line subtotal (API) |
| `{line.totalDiscount}` | Discount on line (API) |
| `{line.total}` | Final line total (API) |
| `{line.hasDiscount}` | `"show"` \| `"hide"` (class toggles) |
| `{line.hasSavings}` | `"show"` \| `"hide"` (retail or discount savings) |

---

## 5. Nested lists inside cart summary

### Per-line discounts

Container: **`[data-line-discounts]`** with a child **`<template>`** for each discount row.

| Token | Meaning |
| ----- | ------- |
| `{discount.name}` | Discount name |
| `{discount.amount}` | Formatted amount |
| `{discount.description}` | Description |

### Offer / voucher lists

- **`[data-summary-offer-discounts]`** — offer rows  
- **`[data-summary-voucher-discounts]`** — coupon / voucher rows (shows **code** in `{discount.name}` when applicable)

Each needs a child **`<template>`**; same **`{discount.name}`**, **`{discount.amount}`**, **`{discount.description}`** tokens.

---

## 6. `data-next-display="cart.*"` inside the cart summary (Known #10 / BS-014)

The cart-summary display resolver (**`CartSummaryEnhancer.display`**) only implements a **fixed** set of cart UI keys. As of common 0.4.5+ builds, these are **not** wired and log “Unknown cart display property” / stay empty:

- `cart.discountCode`, `cart.hasCoupon`, `cart.hasCoupons`, `cart.discountCodes`, etc.

**Workaround:** use **`[data-summary-voucher-discounts]`** + **`{discount.name}`** (and amounts), or custom JS. See migration **Known #10** and bug log **BS-014**.

Outside **`[data-next-cart-summary]`**, other cart display paths may still differ — test per page.

---

## See also (paths in **campaign-cart** SDK repo)

- `src/enhancers/cart/BundleSelector/guide/reference/attributes.md`  
- `src/enhancers/cart/CartSummary/guide/reference/object-attributes.md`  

In **this** repo: [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md) for package selector, `selection.*`, and `data-next-package-price`.
