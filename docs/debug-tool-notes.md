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

**Related issues:** [BS-018](template-bug-log.md#bs-018---mv-upsell-exitcheckout-coupon-bleeds-into-upsell-bundle-display-pricing-when-same-packageid-is-reused) (exit coupon bleed into `calculateBundlePrice` display — that is a *real* display problem, separate from this debug state quirk).

---

*Add further entries here when debug output is confirmed misleading vs a real bug — include: what you saw, why it looks that way, and what actually governs the real behaviour.*
