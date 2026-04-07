# Olympus v0.4.0 SDK — QA checklist

**Scope:** `campaign-kit-templates/src/olympus/`  
**SDK:** Pin `sdk_version` in `_data/campaigns.json` (e.g. `0.4.10`).  
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
| **Per-tier IDs** | After changing tier: cart `shippingMethod` vs summary **shipping** line and **grand total** — all should match intent. If cart ID updates but total does not → BS-011 / Known #3. | BS-011 |

---

## 3. Bumps (warranty v2 + switch v2)

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Warranty + bundle** | Warranty checked: changing bundle tier updates synced warranty qty (`data-next-package-sync="1"`). | BS-008 |
| **Toggle prices** | Compare vs sale on v2 card look sane; after tier change, prices update **without** needing uncheck/recheck (Known #7 quirk). | BS-008 |
| **Old vs new pattern** | `bump-check01.html` / old pattern vs `*-v2.html` — note where regressions appear. | BS-005, BS-008 |

---

## 4. Cart summary v2 (payment section)

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Lines** | `{line.quantity}`, name, `{line.unitPrice}/ea`, strike + `{line.total}` when tier/coupon changes. | Crosswalk |
| **Offer / voucher lists** | `data-summary-offer-discounts` / `data-summary-voucher-discounts` populate when the campaign has those discounts. | — |
| **Rollup** | “Today you saved” + `{discounts}` vs line-level savings — should **match** on bundle-structured campaigns (**BS-010** `verified`). Watch **`next-calculating`** flicker (SDK 0.4.5+). | BS-010 |
| **Coupon badge** | Applied code visible via **`data-summary-voucher-discounts`** → `{discount.name}` (and amounts). **`cart.discountCode` / `cart.hasCoupon`** are broken until SDK **Known #10** — see **BS-014**. | **BS-014** |
| **Symbols** | Accept or log: `{line.*}` money fields may repeat the currency symbol (design / BS-009). | BS-009 |
| **`priceRetailTotal`** | Should be **line-level** list total, not the same as `{line.priceRetail}` / `{line.originalPackagePrice}`. If all match → BS-012. | BS-012 |

---

## 5. Coupons & refresh

| Check | What to verify | Bug log |
|--------|----------------|---------|
| **Apply + refresh** | Coupon survives full page reload or not (Known #2). | Known #2 (migration) |
| **Bundle vouchers** | If tiers use `data-next-bundle-vouchers`, codes apply/remove when switching tiers without double-apply. | BS-004 |

---

## 6. Console / quick hooks

- [ ] `window.next?.version` matches expected SDK tag.
- [ ] `window.nextDebug?.stores?.cart?.getState()` after tier change: items, shipping method, totals.
- [ ] No hard errors on bundle price fetch (partial `BundlePriceSummary` null-safety in 0.4.5+).

---

## 7. Out of scope for this checklist

Multivariant (`olympus-mv-*`) external slots, `{item.*}` slot tokens — track separately.

---

## Suggested order

1. Bundle tier switching  
2. Summary totals + savings  
3. Bumps + tier  
4. Shipping IDs (if present)  
5. Coupon apply + optional refresh  

Then update **`docs/template-bug-log.md`** statuses and one-line verification notes.
