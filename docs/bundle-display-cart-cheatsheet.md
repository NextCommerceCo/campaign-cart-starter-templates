# Bundle display & cart summary line cheat sheet

Reference for **`data-next-bundle-display`**, remote **`data-next-display="bundle.{selectorId}.*"`**, and **`[data-next-cart-summary]`** template tokens. Bundle events use **`selectorId`** (from `data-next-selector-id`) as of **campaign-cart v0.4.8** — not a per-card `bundleId` in event `detail`.

**Related in this repo:** [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) · [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md) (package / `selection.*` / `data-next-package-price`) · [`docs/template-bug-log.md`](template-bug-log.md) (0.4.x template bug log — BS-012, BS-014, etc.).

**Official:** [Cart Summary guide](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary) · [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale).

---

## 1. Bundle card: `data-next-bundle-display` / `data-next-bundle-price`

Use **`data-next-bundle-display=”<field>”`** on elements **inside** `[data-next-bundle-card]` — preferred in all new templates.

**`data-next-bundle-price=”<field>”`** accepts the **same** field names and still works, but is **legacy/deprecated** — use **`data-next-bundle-display`** in new markup.

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

**BS-006 (`fixed`):** In earlier SDK builds, bare **`data-next-bundle-price`** (no attribute value) did not reliably bind the tier total. Current renderer falls back to total for both bare **`data-next-bundle-display`** and bare **`data-next-bundle-price`** — explicit values (`="price"` / `="total"`) are still recommended for clarity.

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
| `unitPrice` / `originalUnitPrice` | Per-unit after/before discount — add **`data-next-format="currency"`** on the element (same as other remote money fields; see `safe-display-paths §6`) |

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
| `{tax}` | Tax ⚠️ **not wired** — `CartSummaryEnhancer` does not pass this into the `<template>` vars; renders literally or blank (see **BS-017**) |
| `{discounts}` | Total discount amount (offers + vouchers) |
| `{savings}` | Total savings (retail + applied discounts) |
| `{compareTotal}` | Compare-at style total |
| `{itemCount}` | Number of cart lines |

**State classes** on the host (for CSS): e.g. `next-cart-empty`, `next-cart-has-items`, `next-has-discounts`, `next-no-discounts`, `next-free-shipping`, `next-has-tax`, `next-calculating`, `next-not-calculating`, etc. Prefer these over fragile **`data-next-show`** inside the injected template when timing matters — see migration **Cart Summary v2 Notes**.

---

## 4. Cart summary lines: `data-summary-lines` row `<template>`

One row per cart line. Placeholders use the **`{item.*}` prefix** (SDK 0.4.11+).

> **Legacy `{line.*}` names removed (SDK 0.4.11)** — e.g. `{line.qty}`, `{line.priceRetailTotal}`, `{line.packagePrice}` render blank with no console error. Supported `{line.*}` aliases that mirror `{item.*}` still work, but prefer `{item.*}` for clarity.

| Token | Meaning |
| ----- | ------- |
| `{item.packageId}` | Package `ref_id` |
| `{item.quantity}` | Quantity |
| `{item.name}` | Package display name |
| `{item.image}` | Product image URL |
| `{item.productName}` | Product name |
| `{item.variantName}` | Variant name |
| `{item.sku}` | SKU |
| `{item.unitPrice}` | Unit price after discounts |
| `{item.originalUnitPrice}` | Unit price before discounts — use for `/ea` strikethrough |
| `{item.price}` | **Line total** after discounts (qty × unit price) — use for Amount column |
| `{item.originalPrice}` | **Line total** before discounts — use for Amount strikethrough (fixed BS-012 in 0.4.11) |
| `{item.discountAmount}` | Total discount on this line |
| `{item.discountPercentage}` | Discount as percentage string (e.g. `"25%"`) |
| `{item.hasDiscount}` | `"show"` \| `"hide"` — use as CSS class on strikethrough elements |
| `{item.isRecurring}` | `"true"` \| `"false"` |
| `{item.interval}` | Billing interval (e.g. `"month"`) |
| `{item.intervalCount}` | Number of intervals per cycle |
| `{item.frequency}` | Human-readable frequency (e.g. `"Monthly"`) |
| `{item.recurringPrice}` | Recurring unit price |
| `{item.currency}` | Currency code for this line |

> **0.4.11 breaking change:** `{item.price}` and `{item.originalPrice}` are **line totals** (qty × price), not per-unit. Use `{item.unitPrice}` / `{item.originalUnitPrice}` where you need per-unit values (e.g. `/ea` labels).

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

## 6. `data-next-display=”cart.*”` coupon fields — historical note (Known #10 / BS-014)

**Partial fix (verified 2026-04-07):**
- **`cart.hasCoupon`** / **`cart.hasCoupons`** — ✅ work for **`data-next-show`** / **`data-next-hide`** visibility.
- **`cart.discountCode`** and code-string fields — ❌ still not wired for **`data-next-display`**; node stays empty despite voucher present in cart state.

**Workaround for code display:** use **`[data-summary-voucher-discounts]`** + **`{discount.name}`** (and amounts), or custom JS. See migration **Known #10** and bug log **BS-014**.

Outside **`[data-next-cart-summary]`**, other cart display paths may still differ — test per page.

---

## See also (paths in **campaign-cart** SDK repo)

- `src/enhancers/cart/BundleSelector/guide/reference/attributes.md`  
- `src/enhancers/cart/CartSummary/guide/reference/object-attributes.md`  

In **this** repo: [`docs/selector-attribute-cheatsheet.md`](selector-attribute-cheatsheet.md) for package selector, `selection.*`, and `data-next-package-price`.
