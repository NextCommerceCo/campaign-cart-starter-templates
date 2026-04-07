# Debug tool notes — known misleading states

Known cases where **`window.nextDebug`** output does **not** reflect what the page displays or what the order charges. Useful when triaging: if you see something unexpected here, check whether it is a real problem or a known debug state mismatch.

**Tool reference:** `window.nextDebug.stores.cart.getState()` / `window.nextDebug.overlay()`

---

## 1. Cart state on MV upsell — offers show checkout offers + upsell voucher stacked

**Scope:** MV upsell pages after a checkout session (especially when a coupon was applied at checkout).

**What you see in the debug cart:**
- Both cart items show the **checkout-page offer** (e.g. "Buy 2 Save 60%") — not the upsell offer
- The upsell voucher (e.g. 80% off) appears **on top of** that offer

**Why:** `window.nextDebug.stores.cart.getState()` reflects the **persisted session cart from checkout** — the items, quantities, and offers that were active when the order was submitted or the session was last written. On the upsell page, the SDK has not re-written the cart store with upsell-specific offer data; it calculates upsell pricing separately via `calculateBundlePrice` using `data-next-bundle-vouchers`.

**What is actually correct:**
- **Page display** — `bundle.*` display tokens are driven by `calculateBundlePrice`, not by cart store offers. The price and discount % the shopper sees on screen is computed independently.
- **Accepted order** — `AddUpsellLine` submission uses the `data-next-bundle-vouchers` value directly, not the stacked state shown in the debug cart.

**In short:** the debug cart's `offers` array on a upsell page is stale checkout data. It will almost always look wrong. Trust what is rendered on screen and what the receipt/Campaigns backend confirm.

**Related issues:** [BS-018](template-bug-log.md#bs-018---mv-upsell-exitcheckout-coupon-bleeds-into-upsell-bundle-display-pricing-when-same-packageid-is-reused) (exit coupon bleed + variant resolver jumping package families — those are real problems, separate from this debug state quirk).

---

## 2. `data-next-bundle-items` DOM does not update after variant change — `slot.activePackageId` is the truth

**Scope:** MV upsell pages using `configurable:true` bundle items after a variant is changed.

**What you see:** The `data-next-bundle-items` attribute in the DOM still shows the original `packageId` (e.g. 66) even after the shopper picks a different variant.

**Why:** The SDK resolves variant changes internally and updates `slot.activePackageId` on the enhancer — it does not rewrite the DOM attribute. The DOM is write-once at initialisation.

**What to inspect instead:**

```js
// After a variant change, read the resolved id from the enhancer state
const root = document.querySelector('[data-next-bundle-selector][data-next-selector-id="upsell-bundle"]');
console.log('resolved activePackageId:', root?._activePackageId ?? root?._state?.activePackageId);
// Or check getSelectedBundleItems if exposed
```

**Why this matters:** If the resolved id is from the checkout package family (e.g. 2) rather than the upsell family (e.g. 67), the upsell voucher may be ineligible and the wrong price is both displayed and charged. See [issue #8 in campaign-issues-overview](campaign-issues-overview.md) for the full root cause.

---

*Add further entries here when debug output is confirmed misleading vs a real bug — include: what you saw, why it looks that way, and what actually governs the real behaviour.*
