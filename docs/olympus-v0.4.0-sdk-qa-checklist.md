# Olympus v0.4.0 SDK — QA checklist

**Scope:** `campaign-kit-templates/src/olympus/`  
**SDK:** Pin `sdk_version` in `_data/campaigns.json` (e.g. `0.4.17` — match [`campaign-kit-templates/_data/campaigns.json`](../campaign-kit-templates/_data/campaigns.json)).  
**Template bug log (0.4.x, repo-wide — `olympus` is primary reference):** [`template-bug-log.md`](./template-bug-log.md)

Use a real campaign (offers, shipping methods, coupons as in production). Update the bug log with `verified` / notes after each pass.

---

## 1. Bundle selector (Step 1)

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Load** | Each card: image + `package.name`; per-unit / compare / totals via `data-next-bundle-display` (preferred; `data-next-bundle-price` is legacy/deprecated). **`data-next-bundle-display="total"`** (or bare `data-next-bundle-display`) shows a number on every tier. | BS-003, BS-006 (`fixed` — explicit total slot) |
| **Switch tiers** | Click 1x → 2x → 3x repeatedly; selection state, cart line **qty**, and card totals stay in sync (no stuck tier). **Line count must stay 1** for the main package — not one line per click (**BS-013**). | BS-002, **BS-013** |
| **Refresh after tier** | Select 2x or 3x, then **full page reload** — summary must show **one** line for the main package, not **1x + previous tier**. | **BS-013** |
| **Savings %** | “SAVE …%” / `data-next-bundle-display="savingsPercentage"` reads as a normal percentage, not a raw decimal. | BS-006 / Known #5 |
| **Savings copy** | Subtitle savings amounts update when tier changes; `hasSavings` (or equivalent) blocks behave. | BS-004, BS-006 |
| **Auto-render (optional)** | Only if Step 4 is enabled (`data-next-bundles` + template): injected cards + `data-next-display` for name/image — re-test BS-001 after SDK updates. | BS-001 |
| **Static 1x/2x/3x** | Title prefixes stay correct and are not overwritten by the SDK (no `data-next-display` on the same node as static qty). | BS-007 |

---

## 2. Shipping (if `data-next-shipping-id` is on bundle cards)

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Per-tier IDs** | After changing tier: cart `shippingMethod` vs summary **shipping** line and **grand total** — all should match intent. `data-next-shipping-id` on bundle cards now works in SDK 0.4.12 (`calculateTotals` no longer hardcoded to method 1). | BS-011 (`fixed` — 0.4.12) |

---

## 3. Bumps (check01 + switch01)

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Warranty + bundle** | Warranty checked: changing bundle tier updates synced warranty qty (`data-next-package-sync="1"`). | BS-008 (`fixed` — 0.4.14) |
| **Toggle prices** | Compare vs sale look sane; `unitPrice` + `/ea` stays stable when synced qty changes; `price` (line total) updates with qty as expected. | BS-008 (`fixed` — 0.4.14) |
| **Per-unit stable** | Select 1× → 2× → 3× with bump checked — `unitPrice` and `originalUnitPrice` (`/ea`) must not change; only `price` / `originalPrice` (synced line totals) should scale. | BS-008 (`fixed` — 0.4.14) |

---

## 4. Cart summary v2 (payment section)

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Lines** | `{item.quantity}`, name, `{item.unitPrice}/ea`, `{item.originalUnitPrice}/ea` strike, Amount column `{item.price}` + `{item.originalPrice}` strike — verify all populate and update on tier/coupon changes. **Use `{item.*}` — `{line.*}` renders silently blank.** | BS-012 (fixed) |
| **Offer / voucher lists** | `data-next-discounts="offer"` / `data-next-discounts="voucher"` populate when the campaign has those discounts (SDK 0.4.13+). | — |
| **Rollup** | “Today you saved” + `{discounts}` vs line-level savings — should **match** on bundle-structured campaigns (**BS-010** `verified`). Watch **`next-calculating`** flicker (SDK 0.4.5+). | BS-010 |
| **Coupon badge** | Applied code visible via **`data-next-discounts="voucher"`** → `{discount.description}` (code string) / `{discount.name}` (label) / `{discount.amount}`. | BS-014 (`fixed` — 0.4.13) |
| **Symbols** | Accept or log: `{item.*}` money fields may repeat the currency symbol (design / BS-009). | BS-009 |

---

## 5. Coupons & refresh

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Apply + refresh** | Coupon survives full page reload or not (Known #2). | Known #2 (migration) |
| **Bundle vouchers** | If tiers use `data-next-bundle-vouchers`, codes apply/remove when switching tiers without double-apply. | BS-004 |
| **Exit-popup voucher → prices** | Apply a code from exit intent on checkout: **bundle tier** and **toggle bump** money updates without stale placeholders (SDK **0.4.16+**). | — |
| **Bundle + cart coupon order** | With bundle tier vouchers + a cart coupon, totals and breakdowns match intent (tier vouchers apply before user coupon in API path; **0.4.16+**). | — |
| **Receipt reload post-order** | Complete checkout with coupon → receipt → **full reload**: no ghost cart lines / stale applied code from the completed order (**SDK 0.4.17+**, **BS-019**). | BS-019 |

---

## 6. Console / quick hooks

- [ ] `window.next?.version` matches expected SDK tag.
- [ ] `window.nextDebug?.stores?.cart?.getState()` after tier change: items, shipping method, totals.
- [ ] No hard errors on bundle price fetch (partial `BundlePriceSummary` null-safety in 0.4.5+).

---

## 7. Out of scope for this checklist

Multivariant (`olympus-mv-*`) external slots, `{item.*}` slot tokens — track separately. **MV upsell BS-018** reference smoke (**#14**): see [`docs/campaign-issues-overview.md`](campaign-issues-overview.md) and [`docs/template-bug-log.md`](template-bug-log.md) **BS-018**.

---

## Suggested order

1. Bundle tier switching  
2. Summary totals + savings  
3. Bumps + tier  
4. Shipping IDs (if present)  
5. Coupon apply + optional refresh  

Then update **`docs/template-bug-log.md`** statuses and one-line verification notes.
