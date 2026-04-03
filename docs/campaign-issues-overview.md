# Campaign issues overview

Shareable list of **known issues and limitations** across **whole campaigns** (checkout, summary, bumps, bundles, operators). Written for anyone following a funnel—not only engineers. Technical repro, BS ids, and migration crosswalks stay in the **[template bug log](template-bug-log.md)**.

**Status (short):**


| Label    | Meaning                                                      |
| -------- | ------------------------------------------------------------ |
| Open     | Still a problem or open request; no stable fix yet           |
| Blocked  | Waiting on platform/SDK or a firm product decision           |
| Fixed    | Addressed in templates or process; follow-up QA still useful |
| Verified | Change checked in QA; treat as resolved for that setup       |


---

## Bundle migration note (not a defect)

**Bundle quantity tiers** (`data-next-bundle-selector`, one `packageId` with 1× / 2× / 3× cards) are a **different way to structure a campaign** than the older **multi-package selector** (separate package ids per tier). **Pricing, offers, and rounding** follow the bundle / discount model in the Campaigns app — operators cannot copy the old selector playbook one-for-one.

---

## Templates updated (0.4.x / offers branch)

Reference pages on **`v0.4.0-offers-template-update`** — what to open when you need **bundle selector + offers** patterns. Source paths are under **`campaign-kit-templates/src/`**.

**Netlify preview** (branch deploy; the `deploy-preview-N` segment follows the PR — update the base if you open a different preview):  
`https://deploy-preview-5--nextcommerce-campaign-templates.netlify.app/`

### Olympus — `olympus-v0.4/`

| File | Preview | Role |
| ---- | ------- | ---- |
| [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) | [Open preview](https://deploy-preview-5--nextcommerce-campaign-templates.netlify.app/olympus-v0.4/checkout/) | Standard **checkout** with the **bundle picker** and **offers**, using the **new bundle selector** (`data-next-bundle-selector`, tier cards, cart summary). |
| [`olympus-v0.4/upsell-bundle.html`](../campaign-kit-templates/src/olympus-v0.4/upsell-bundle.html) | [Open preview](https://deploy-preview-5--nextcommerce-campaign-templates.netlify.app/olympus-v0.4/upsell-bundle/) | Standard **post-purchase upsell** using the **new bundle selector** + **coupons** / vouchers (`data-next-upsell-context`, tier cards, accept wired to the selector). |
| [`olympus-v0.4/upsell-bundle-cards.html`](../campaign-kit-templates/src/olympus-v0.4/upsell-bundle-cards.html) | [Open preview](https://deploy-preview-5--nextcommerce-campaign-templates.netlify.app/olympus-v0.4/upsell-bundle-cards/) | **Upsell example** with the **new bundle selector** and **multiple coupons per tier** (visible tier cards + per-card vouchers). |

### Olympus MV Single Step — `olympus-mv-single-step-v0.4/`

| File | Preview | Role |
| ---- | ------- | ---- |
| [`olympus-mv-single-step-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step-v0.4/checkout.html) | [Open preview](https://deploy-preview-5--nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step-v0.4/checkout/) | **MV single-step checkout** aligned with 0.4.x (bundle selector, slots, cart summary). |

**Note — older MV variants:** [`olympus-mv-single-step-v0.4-bridge/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step-v0.4-bridge/checkout.html) ([preview](https://deploy-preview-5--nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step-v0.4-bridge/checkout/)) and [`olympus-mv-single-step-v0.4-cards/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step-v0.4-cards/checkout.html) ([preview](https://deploy-preview-5--nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step-v0.4-cards/checkout/)) are **previous MV shapes** from **before** the **external slot selector** layout update; use **`olympus-mv-single-step-v0.4`** as the current reference unless you are maintaining a legacy funnel.

---

Within each table, issues are listed **high → medium → low** by severity. `#` is the row id **within that table** only.

## Open and blocked


| #   | Description                                                                                                                                                                                                                                                                                          | Who it affects                                                                                                                         | Severity | Status  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| 1   | **Cart summary (BS-012):** `{line.priceRetailTotal}` should be the **full-line** list/compare total (list × qty). It often repeats the **per-unit** list instead, so the **Amount** strikethrough is wrong on multi-qty or bundle lines while subtotal math can still be correct. [Example below](#bs012-cart-summary-example). | **All** campaigns using `[data-next-cart-summary]` line templates with a compare/strike column (reference `olympus-v0.4`, `olympus-mv-single-step-v0.4`). | High     | Open    |
| 2   | **Bumps + `data-next-package-sync` (BS-005 / BS-008, Known #7):** On the 0.4.x **toggle-price** path, when the bump is **synced** to the main bundle line, turning the bump **on** updates card prices to match the **current** tier. Changing **bundle tier** afterward updates **cart/summary totals** but **not** the bump’s **shown** compare/sale until the shopper **unchecks and checks** the bump again. **Desired:** toggle preview recomputes whenever synced qty / main bundle selection changes. **Template option:** keep sync for add/remove but show **stable unit list + sale** with **`data-next-display="package.price_retail"`** / **`package.price`** on the bump package (older pattern) instead of **`data-next-toggle-price`** — tradeoff vs offer-aware toggle math; see bug log. | **All** checkouts using **`data-next-package-toggle`** + **`data-next-toggle-card`** + **`data-next-toggle-price`** with **`data-next-package-sync`** (e.g. warranty on bundle tier). | Medium | Blocked |
| 3   | **`data-next-shipping-id` (BS-011, Known #3):** Per **`data-next-selector-card`** in **swap** mode, cart state updates on select (`window.nextDebug?.stores?.cart?.getState()?.shippingMethod` shows the expected ref id), but **cart summary** shipping line / **grand total** often **do not** follow that method. On **`data-next-bundle-card`** tiers, declarative **`data-next-shipping-id` does not work at all** (unsupported). **Not a release blocker:** drive shipping with **`next.setShippingMethod(refId)`** (or equivalent) in **JS** on card change and re-verify totals. | **Package swap** selectors with per-card shipping; **bundle** checkouts that need per-tier shipping (must use JS). | Medium | Open |
| 4   | **BS-016 — Checkout phone field:** The **`data-next-checkout-field="phone"`** control (intl / flag UI) shows with **too much horizontal inset** — often inline styles such as **`padding-left: 52px`**, so the typed number sits oddly. **Older Campaign Cart CSS** used to normalize this; that ruleset appears **gone or overridden in newer SDK** releases. **Ask:** restore the previous checkout **phone / `.iti`** fix in core. ([template bug log](template-bug-log.md)) | **All** checkouts using the SDK **phone** field. | Medium | Open |
| 5   | **BS-015 — summary lines & bundle slots:** **`data-next-format="currency"`** is ignored on **`data-summary-lines`** and **`data-next-bundle-slots`** `<template>` output, so money can look **raw** — only **JS** or an **SDK** change fixes it. ([template bug log](template-bug-log.md)) | **`data-summary-lines`**; **`data-next-bundle-slots`**. | Medium | Open |
| 6   | Auto-rendered bundle cards (injected from a template) do not bind product name/image the same way as inline cards; placeholders can stay blank. **Low priority:** reference templates use **inline** bundle cards instead, so this SDK path is optional—note for engineering to fix when convenient. | **All** campaigns that opt into Step 4 auto-render (`data-next-bundles` + template id); not used in default olympus-v0.4.              | Low      | Open    |
| 7   | **Coupon display hooks (BS-014, Known #10):** **`data-next-display="cart.discountCode"`** / **`data-next-show="cart.hasCoupon"`** inside **`[data-next-cart-summary]`** stay empty — the summary **`resolveValue`** path does not implement those keys. Example that **used to render** before the refactor: `<span data-next-display="cart.discountCode" class="display-visible">—</span>`. **Low priority:** use **`data-summary-voucher-discounts`** + **`{discount.name}`** or small **JS** instead. | **All** campaigns using those hooks in cart summary (reference `olympus-v0.4`, `olympus-mv-single-step-v0.4`). | Low | Open |

<a id="bs012-cart-summary-example"></a>

### Example: multi-qty line strikethrough (open issue #1, BS-012)

The cart summary **line row** template uses tokens such as `{line.priceRetail}` / `{line.total}` and often **`{line.priceRetailTotal}`** for the **right-hand “Amount”** strikethrough. For a line like **3×** the same product, **`{line.priceRetailTotal}`** is supposed to equal **full-line retail** (e.g. unit list price **× 3**). In practice it frequently resolves to the **same value as one unit’s** list price, so the strike shows **$208.99** instead of **~$626.97** even when **Subtotal** below correctly shows **3 × list**.

![Order summary: 3× Drone line — Amount strikethrough shows single-unit list, not full-line retail](./assets/cart-summary-line-retail-total-bs012.png)

## Fixed and verified


| #   | Description                                                                                                                                                                                                                               | Who it affects                                                                                                                           | Severity | Status   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| 1   | Old pattern: several selector cards sharing one package id breaks selection and cart sync when shoppers switch tiers.                                                                                                                     | **All** campaigns still on legacy package selector with duplicate package ids. (Reference repo moved bundle flows to unique bundle ids.) | High     | Fixed    |
| 2   | Bundle tier clicks used to **add** separate cart lines instead of replacing one line; refresh could show default tier **plus** a persisted tier. **Fixed** on reference checkout (re-test passed). Re-verify after SDK or markup changes. | **All** campaigns using `data-next-bundle-selector` with tier cards.                                                                     | High     | Fixed    |
| 3   | Bare **`data-next-bundle-price`** (no `="total"`) does not reliably fill the tier total; templates must use **`data-next-bundle-price="total"`**. **Fixed** as a **markup requirement** — not an open product defect once documented. | **All** campaigns with `data-next-bundle-card` tier pricing on the card. | High | Fixed |
| 4   | Older “package.1.name” style display tokens do not resolve on bundle cards; markup must scope by package on the card.                                                                                                                     | **All** campaigns with bundle cards using that pattern.                                                                                  | Medium   | Verified |
| 5   | **Cart summary rollup (BS-010):** Cart-level **“Today you saved”** / discount totals vs per-line savings could disagree on some setups. **Resolved** when using **`data-next-bundle-selector`** with **offers and campaign structure** aligned to bundle tiers (reference `olympus-v0.4`). Legacy multi-package layouts may still need separate QA. | **Bundle-tier** funnels with correct Campaigns configuration. | Medium | Verified |
| 6   | Applied coupon **no longer clears** after a full browser refresh (session / hydration aligned with persisted cart). **Fixed** in current SDK; re-verify after major cart/checkout changes. | **All** campaigns using coupons. | Medium | Fixed |


---

*Last aligned with the template bug log: BS-001–BS-016 and operator/platform notes. Update the open/blocked + fixed tables, the bundle migration note, and the **Templates updated** roll-up when slugs or scope change.*