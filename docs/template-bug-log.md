# Template bug log

Issues for **Campaign Cart SDK 0.4.x** funnels in this repo — bundle selector, `[data-next-cart-summary]`, bumps, and related patterns. Most entries apply to **any** template using the same markup, not one theme only.

**Primary reference implementation:** [`campaign-kit-templates/src/olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) — first place many of these were reproduced; comments in that file point back here by **BS-xxx** id.

**Related docs:** [Campaign issues overview](campaign-issues-overview.md) (shareable, non-technical table) · [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) (Known #1–#10) · [`docs/bundle-display-cart-cheatsheet.md`](bundle-display-cart-cheatsheet.md) · [`docs/debug-tool-notes.md`](debug-tool-notes.md) (known misleading `window.nextDebug` states) · [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale) · [Cart Summary](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary).

**Tracked elsewhere (not duplicated as BS items):** Deep **multivariant**-only concerns (external bundle slot layouts, clone/bridge patterns beyond formatting) — see MV template folders and [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) “External slot layout” notes. **`{item.*}` slot token formatting** → **BS-015** (with **`data-summary-lines`**).

**Variant dropdown (styling note):** Disabled rows use **`os-dropdown-item.os-card__variant-dropdown-item[disabled]`** in reference **`next-core.css`** (`olympus`, `olympus-mv-single-step`). **`.os-card__variant-dropdown-item { cursor: pointer }`** has higher specificity than bare **`os-dropdown-item[disabled]`**, so the combined selector is required for **not-allowed** cursor and muted treatment on disabled options.

---

## Status legend

- `open` - logged, not worked yet
- `in-progress` - currently being worked
- `blocked` - waiting on SDK/platform decision or external fix
- `fixed` - code change made, needs verification
- `verified` - confirmed fixed in QA
- `note` - migration or workflow change; not a product defect (see **BS-004**)

## Crosswalk — engineering note vs repo docs

Sam’s forwarded engineering note aligns with **`docs/sdk-0.4.0-migration.md` → Known SDK Issues #1–#10** and the items below. Use this table when sharing with eng: same issues, single numbering in migration doc.

| Topic (eng note) | `sdk-0.4.0-migration.md` | This log |
|------------------|--------------------------|----------|
| (1) `package.*` display vs offer/coupon pricing | **§ Known #1** | **BS-005**, **BS-008** (tradeoff when using `data-next-display` workaround) |
| (2) Coupon cleared on refresh | **§ Known #2** | *(not duplicated — platform issue)* |
| (3) `data-next-shipping-id` — **package swap** selector vs summary totals; **bundle** cards | **§ Known #3** (package); bundle attribute table silent | **BS-011** |
| (4) `data-next-package-price` compare/savings multi-unit SKUs | **§ Known #4** | **BS-002** context (selector → bundle workaround) |
| (5) Bundle selector operator workflow / offer-driven tier pricing | **§ Known #6** (and **#5** where it overlaps card pricing) | **BS-004** (`note` — migration), **BS-006** (`fixed` — use `data-next-bundle-price="total"`) |
| Cart summary v2 line pipeline `{line.priceRetailTotal}` / `{line.total}` (or `{line.originalPackagePrice}` per variable table) | **§ Known #9** + **§ Cart Summary v2 Notes** | **BS-012** |
| Line amounts include **currency symbol** on every row (want numeric-only / single currency column) | *(not in migration §)* | **BS-009** |
| “Today you saved” / rollup vs line savings | *(not in migration §)* | **BS-010** (`verified` — bundle + campaign structure) |
| Cart summary `{line.priceRetailTotal}` should be **line** retail total, not same as unit fields | *(not in migration §)* | **BS-012** |
| Bundle tier clicks **added** lines instead of **replacing** (historical); **fixed** on reference checkout — re-verify on SDK bumps | **§ Known #8** | **BS-013** (`fixed`) |
| Toggle bump: compare = sale; **prices refresh only after uncheck/recheck** when sync qty changes | **§ Known #7** | **BS-008** (expanded) |
| **`data-next-display="cart.discountCode"`** / **`cart.hasCoupon`** (and related) empty or “Unknown cart display property” — cart display resolver refactor | **§ Known #10** | **BS-014** (`low` — workarounds exist) |
| **`data-next-format="currency"`** ignored / ineffective on **`data-summary-lines`** row `<template>` and **`data-next-bundle-slots`** slot `<template>` | **§ Known #5** + [Cart Summary v2 Notes](sdk-0.4.0-migration.md#cart-summary-v2-notes-data-next-cart-summary) | **BS-015** (`medium`) |
| Checkout **phone** field (`data-next-checkout-field="phone"`) — excessive **`padding-left`** (~52px) / intl-tel layout; older Campaign Cart CSS fix removed in newer SDK | *(migration TBD)* | **BS-016** (`medium`) |
| Cart summary tax row: **`{tax}`** token, **`.next-has-tax`** class, **`cart.tax`** display — none wired in current `CartSummaryEnhancer` | *(migration TBD)* | **BS-017** (`low`) |
| MV upsell: exit/checkout **coupon** vs **`bundle.*`** upsell display (`calculateBundlePrice`) | *(not in migration §)* | **BS-018** (`verified` — **0.4.17+** reference smoke) |
| Post-checkout **ghost cart / coupons** in `sessionStorage` after successful order (receipt reload) | *(release notes)* | **BS-019** (`fixed` — SDK 0.4.17) |

---

## BS-001 - Auto-rendered cards do not bind `data-next-display="package.*"`

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- **Templates / where:** Any checkout using Step 4 auto-render (`data-next-bundles` + `data-next-bundle-template-id`). First hit: [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) (bundle selector; auto-render block commented out in reference).
- Repro steps:
  1. Use auto-render (`data-next-bundles` + `data-next-bundle-template-id`).
  2. Put `data-next-display="package.name"` and `data-next-display="package.image"` inside the template card.
  3. Load checkout page.
- Expected:
  - Product name/image render from package `1`.
- Actual:
  - Name/image placeholders remain unchanged.
- Workaround:
  - Keep bundle cards inline in initial HTML, or use `{bundle.*}` static fields for name/image. Reference `olympus/checkout.html` uses inline cards only (auto-render block is commented out)—no need to ship auto-render until the SDK binds injected nodes.
- Next action:
  - Re-test if SDK adds post-render display binding for injected bundle template nodes (backlog / when convenient).

## BS-002 - Package selector card sync fails with same package id on multiple cards

- Status: `fixed`
- Severity: `high`
- Date logged: `2026-03-31`
- **Templates / where:** Legacy **package** selector pattern (e.g. [`olympus/checkout.html`](../campaign-kit-templates-v3/src/olympus/checkout.html)); mitigated by moving reference bundle flow to unique `data-next-bundle-id` + `data-next-bundle-items`.
- Repro steps:
  1. Use package selector with three cards all pointing to `data-next-package-id="1"` and quantity controls.
  2. Switch cards repeatedly.
- Expected:
  - Card selection and cart state stay synced by tier.
- Actual:
  - Selector/cart sync mismatches because card state resolves by package id only.
- Fix applied:
  - Moved to bundle selector with unique `data-next-bundle-id` and `data-next-bundle-items` quantities.
- Verification notes:
  - Keep validating rapid switching and totals updates in QA.

## BS-003 - Display token scoping regression (`package.1.name` invalid)

- Status: `verified`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** Any **bundle card** body; reference QA on [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html).
- Repro steps:
  1. Use `data-next-display="package.1.name"` (or similar) in card markup.
- Expected:
  - Package title renders.
- Actual:
  - Value does not resolve.
- Fix applied:
  - Use `data-next-package-id="1"` container scope + `data-next-display="package.name"` / `package.image`.
- Verification notes:
  - **2026-04-01 QA (SDK 0.4.6):** Each tier card shows image + `package.name`; per-unit / compare / totals via `data-next-bundle-price` / `data-next-bundle-display` behave as expected on load.

<a id="bs-004-bundle-migration-note"></a>

## BS-004 - Bundle approach changes merchandising workflow *(migration note — not a defect)*

- Status: `note`
- Severity: `medium` *(operator impact; not a broken feature)*
- Date logged: `2026-03-31`
- **Nature:** **Campaign / merchandising migration.** **Bundle quantity tiers** (`data-next-bundle-selector`, same `packageId`, different qty per card) are **not** a drop-in replacement for the legacy **multi-package selector** (different package ids per tier). **Campaigns app** setup, offers, and rounding follow the **bundle + discount** model — operators and templaters must **restructure** funnels and document **per-funnel rules**; this is not something HTML alone “fixes.”
- **Templates / where:** **Campaigns app** configuration — all bundle-tier funnels; see **`docs/sdk-0.4.0-migration.md`** (Known #6, bundle workflow).
- **Action:**
  - Capture operator playbook after pricing QA; align stakeholders that bundle funnels are **intentionally** configured differently from classic multi-package selectors.

## BS-005 - Bump pricing behavior still tied to known SDK regression

- Status: `blocked`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** Any checkout with bumps using new 0.4.x toggle pricing; reference includes [`olympus/_includes/bump-*.html`](../campaign-kit-templates/src/olympus/_includes/).
- **Detail:** See **BS-008** for **`data-next-package-sync`** + **`data-next-toggle-price`** (tier change → stale card until uncheck/recheck; totals still update).
- Repro steps:
  1. Switch bump implementation to new 0.4.x toggle pricing flow.
  2. Sync bump to main package quantity (`data-next-package-sync`).
- Expected:
  - Stable compare/current/savings on the bump card whenever main bundle tier or synced qty changes — not only after uncheck/recheck.
- Actual:
  - Known 0.4.x inconsistency in toggle preview + sync (migration **Known #7**).
- Workaround:
  - **Old pattern:** `data-next-bump` + `data-next-toggle="toggle"` + `data-next-display` totals; or keep toggle wiring but show **unit** list/sale via **`data-next-display="package.price_retail"`** / **`package.price`** on the bump package instead of toggle-price slots (**BS-008**).
- Next action:
  - Re-evaluate when SDK issue is resolved upstream.

## BS-006 - `data-next-bundle-price` default slot not rendering total

- Status: `fixed`
- Severity: `high`
- Date logged: `2026-03-31`
- **Nature:** **Template / docs requirement**, not an ongoing SDK bug — bare **`data-next-bundle-price`** (empty attribute) is an invalid or unsupported pattern for the tier total; use **`data-next-bundle-price="total"`** explicitly on every bundle card total node.
- **Templates / where:** Any `data-next-bundle-card` tier pricing; reference [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) Step 1 bundle cards.
- **If you use** `<span data-next-bundle-price>-</span>` **(bare):** total may not bind; placeholder can remain.
- **Required markup:** `data-next-bundle-price="total"` (and `="compare"` where needed for compare-at line totals).
- **Verification notes:**
  - **2026-04-01 QA (SDK 0.4.6):** Explicit `total` / `compare` slots behave as expected on all tiers on load; aligns with BS-003 bundle display.

## BS-007 - Feature request: native bundle quantity display token

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- **Templates / where:** Any bundle card title (e.g. `1x/2x/3x` prefix); reference [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html).
- Request:
  - Add a documented bundle display token/attribute for per-card quantity (for example `data-next-bundle-display="quantity"`), so templates can render `1x/2x/3x` without custom JS.
- Current workaround:
  - Static title prefixes per card in HTML.
- Why useful:
  - Keeps quantity display fully declarative and consistent with other SDK display attributes.

## BS-008 - Warranty bump: `data-next-toggle-price` vs `compare`, sync + bundle, stable unit labels

- Status: `fixed` (SDK 0.4.14 — stable per-unit pricing via `unitPrice` / `originalUnitPrice`)
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** Bump includes on bundle checkouts — reference [`olympus`](../campaign-kit-templates/src/olympus/) (`bump-check01.html`, `checkout.html` + `data-next-package-sync`).
- **Root cause:** Toggle preview did not recompute when main bundle tier changed while the bump was unchecked. `data-next-toggle-display=”originalPrice”` / `”price”` are **line totals** that scale with synced qty — showing stale or scaled values when tier changed.
- **Fix (SDK 0.4.14):** `data-next-toggle-display=”unitPrice”` and `data-next-toggle-display=”originalUnitPrice”` return stable **per-unit** values that do not multiply with synced qty. Use `unitPrice` + `/ea` for the sale price and `originalUnitPrice` for the compare/strikethrough — both are always correct regardless of tier. Reference `bump-check01.html` shows **Option A** (per-unit stable) alongside **Option B** (line total, scales) for developer choice.
- **Eng ask (still open):** Recompute toggle preview whenever synced cart qty or main bundle selection changes — even when bump is unchecked. `unitPrice`/`originalUnitPrice` is the template-side fix; the underlying SDK refresh gap remains.

## BS-009 - Feature request: cart summary line amounts without currency symbol

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- **Templates / where:** Any `[data-next-cart-summary]` with `data-summary-lines` row template (`{line.originalPackagePrice}`, `{line.total}`, etc.); same pattern on [`olympus`](../campaign-kit-templates/src/olympus/) and [`olympus-mv-single-step`](../campaign-kit-templates/src/olympus-mv-single-step/) checkouts.
- Docs: [Cart Summary — line item variables](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary#line-item-variables)
- Problem:
  - Line placeholders render **fully formatted** money strings (symbol + amount). When the layout already shows **currency once** (e.g. grand total column with `data-next-display="cart.currency"` / ISO code), repeating the symbol on **every line** is redundant and noisy.
- Request:
  - Document and support **numeric-only** (or **symbol-stripped**) variants for line template fields, e.g. `{line.total}` → companion `{line.totalNumeric}` / `{line.totalRaw}`, or a documented `data-*` formatter on placeholders inside the summary line `<template>`.
  - Same for compare/strike row: `{line.originalPackagePrice}` (and any parallel retail fields) if applicable.
- Current state:
  - Public guide lists `{line.total}`, `{line.originalPackagePrice}`, etc., but **does not** document unformatted alternates or per-placeholder format control for the cart summary line template.
- Workaround (none ideal):
  - Live with duplicate symbols, or post-process DOM (fragile / i18n-hostile), or restructure UI so currency is only in footer (still leaves symbols in `{line.*}` unless SDK changes).

## BS-010 - Cart summary: “Today you saved” / discounts row vs line-level savings

- Status: `verified`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** Summary v2 — `[data-next-cart-summary]` totals (`{discounts}`, savings rows) vs `data-summary-lines` (`{line.total}`, `{line.hasSavings}`, etc.); reference [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html).
- **Previously observed:** Line-level savings visible while cart-level **“Today you saved”** / discount rollup showed **$0** or disagreed with lines — often with **legacy multi-package** or **misaligned** offer setup.
- **Resolution:** With **`data-next-bundle-selector`** and **Campaigns structured for bundle-tier offers** (percent/tier discounts wired to the same model as the template), rollup and line-level savings **align** on reference QA. Remaining mismatches on other funnel shapes → re-check **campaign / offer configuration** before treating as SDK.
- **Verification notes:**
  - Re-test on `olympus` with production-like bundle offers; still use **Cart Summary v2 Notes** (state classes, `data-next-show` timing) for flaky UI.
- Cross-ref:
  - Migration **Cart Summary v2 Notes**; **BS-012** if per-line tokens are wrong independent of rollup.

## BS-011 - `data-next-shipping-id`: bundle cards ineffective; package swap selector still broken vs totals

- Status: `fixed` (SDK 0.4.12 — bundle card case; package swap selector partial, see notes)
- Severity: `medium`
- Date logged: `2026-03-31`
- **Fix (0.4.12):** `data-next-shipping-id` on `data-next-bundle-card` now works — SDK sets the shipping method when the tier is selected. `calculateTotals` was previously hardcoded to shipping method 1; now uses the selected method, so summary shipping line and grand total update correctly on tier change. `campaigns.json` bumped to `0.4.12` for both `olympus` and `olympus-mv-single-step`; no HTML changes needed (`data-next-shipping-id` was already present on all three bundle cards in `olympus/checkout.html`).
- **Package swap selector:** Still unreliable declaratively — cart state updates but summary totals may lag. JS mitigation (`next.setShippingMethod(refId)`) remains the production-viable workaround for that path.
- Cross-ref:
  - Migration **§ Known #3**; **Bundle Selector** attribute table; **Package Selector** example with `data-next-shipping-id` on `data-next-selector-card`.

## BS-012 - Cart summary: Amount strikethrough showed per-unit retail instead of full-line total

- Status: `fixed` (SDK 0.4.11 + template update 2026-04-09)
- Severity: `high`
- Date logged: `2026-04-01`
- **Plain language:** The Amount column strikethrough in `data-summary-lines` row templates showed per-unit retail instead of full-line retail (qty × unit list). Fixed by two changes: (1) SDK 0.4.11 made `{item.originalPrice}` the line total before discounts; (2) templates migrated from legacy `{line.*}` names (silently blank) to `{item.*}`.
- **Fix:** `data-summary-lines` template now uses `{item.originalPrice}` for the Amount strikethrough and `{item.originalUnitPrice}/ea` for the per-unit subtitle. Reference templates updated: [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) and [`olympus-mv-single-step/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step/checkout.html).
- **Root cause:** Legacy `{line.*}` token names removed in 0.4.11 — they render blank with no console warning (e.g. `{line.qty}`, `{line.priceRetailTotal}`, `{line.packagePrice}`). Supported `{line.*}` aliases that mirror `{item.*}` still work; prefer `{item.*}` to be safe. Additionally, in 0.4.11 `{item.price}` / `{item.originalPrice}` became line totals (qty × price), not per-unit — use `{item.unitPrice}` / `{item.originalUnitPrice}` for per-unit values.
- Cross-ref:
  - Migration **§ Known #9** (updated); **BS-010** (`verified`); **bundle-display-cart-cheatsheet.md** section 4.

## BS-013 - Bundle selector **adds** cart lines instead of **atomic swap** (continuous accumulation)

- Status: `fixed`
- Severity: `high`
- Date logged: `2026-04-01` (updated: continuous-add primary symptom)
- **Templates / where:** Any checkout with `data-next-bundle-selector` + tier cards; primary repro / verification: [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) (`data-next-selector-id="drone-packages"` — SDK reads **`data-next-selector-id`**, not `data-next-bundle-selector-id`), `data-next-selection-mode="swap"`, `[data-next-cart-summary]` line list.  
  - Only **one** selector root in built HTML (auto-render block commented out, not emitted).
- Doc expectation ([Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale)): selecting a card should **replace** the previous bundle — “**atomic swap — no double-add**”. The guide’s basic markup does **not** use `data-next-selection-mode` on the bundle root (that attribute appears in migration examples; confirm with SDK whether it is valid/ignored/misread on bundle selector).
- **Previously observed (2026-04-01):**
  1. Load checkout; default **1×** selected (`data-next-selected="true"` on first `data-next-bundle-card`).
  2. Click **2×**, then **3×**, then **1×** — line count **grew** (separate lines) instead of **one** line whose qty updates; **hard refresh** after 2×/3× could show **1× + persisted tier**.
- Expected:
  - Always **exactly one** cart line for package `1` from this selector, qty matching the selected tier; tier clicks **swap**, never stack duplicate package lines.
- **Fix verified:**
  - **Recent re-test** on reference `olympus` checkout — tier switches keep **one** cart line (qty follows tier); full reload does **not** show stacked default + persisted tier. **Regression-watch:** re-run QA on SDK upgrades and any second `data-next-bundle-selector` root / auto-render enablement.
- Template hygiene (2026-04-01) on reference checkout (still recommended):
  - Removed misplaced **`data-next-show="cart.hasCoupon"`** / stray copy inside the **1×** bundle card.
  - Removed erroneous **`data-selected="true"`** on **2× / 3×** radio shells.
- **Diagnostic only (not production):** **`<meta name="next-clear-cart" content="true">`** clears the session cart each load — useful only to isolate persistence; do not ship (see `base.html` comment).
- Cross-ref:
  - Migration **§ Known #8**; distinct from **Known #2** (coupon cleared on refresh); related to **BS-002** (tier sync).

## BS-014 - `data-next-display=”cart.discountCode”` not resolved (cart display refactor — partial fix)

- Status: `open`
- Severity: `low`
- Date logged: `2026-04-01`
- **Priority:** **Low** — voucher lines and **JS** give acceptable UX; this tracks **declarative** parity / older markup that used to work.
- **Templates / where:** Any page with `[data-next-cart-summary]` template using `cart.discountCode`; reference comments in [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) and [`olympus-mv-single-step/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step/checkout.html).
- **Partial fix (verified 2026-04-07):**
  - **`cart.hasCoupon`** — ✅ works for **`data-next-show`** / **`data-next-hide`** visibility. `vouchers: [“EXIT10YO”]` confirmed in cart state.
  - **`cart.discountCode`** — ❌ still not wired for **`data-next-display`**; node stays empty despite voucher present in cart state.
- **Remaining issue:** `<span data-next-display=”cart.discountCode”>—</span>` does not populate the applied code. `resolveValue` does not map `discountCode` → the voucher string.
- **Eng one-liner:** *`hasCoupon` visibility landed but `discountCode` text display still unreachable in `CartSummaryEnhancer.display.ts` `resolveValue`.*
- Expected fix (SDK):
  - Wire **`discountCode`** → `state.vouchers[0] ?? ‘’` (and optionally `discountCodes` → joined codes) in `resolveValue`.
- Workaround (templates):
  - Use **`data-next-discounts=”voucher”`** + **`{discount.description}`** (code string) and **`{discount.amount}`** in a `<template>`, or small **custom JS**. **`data-next-show=”cart.hasCoupon”`** is safe to use for conditional visibility. Note: `{discount.name}` = display label (e.g. “Exit Pop 10%”), `{discount.description}` = code string (e.g. “EXIT10YO”).
- Cross-ref:
  - Migration **§ Known #10**.

## BS-015 - `data-next-format="currency"` does not apply to `data-summary-lines` or bundle slot `<template>` output

- Status: `verified` (SDK 0.4.11 — 2026-04-09)
- Severity: `medium`
- Date logged: `2026-03-31`
- **Fix:** SDK 0.4.11 improved `buildVars` to produce currency-aware formatting for `{item.*}` tokens in cloned `<template>` fragments. The `data-next-format="currency"` attribute is still ignored, but it is no longer needed — `{item.unitPrice}`, `{item.originalUnitPrice}`, `{item.price}`, `{item.originalPrice}` all render with currency symbol and correct decimal formatting without it.
- **Verified on:** `data-summary-lines` row template (`olympus/checkout.html`) and `data-next-bundle-slots-for` slot template (`olympus-mv-single-step/checkout.html`) — both confirmed rendering `$` symbol.
- Cross-ref:
  - [Campaign issues overview](campaign-issues-overview.md) fixed **#5**; migration **Known #5** + **Cart Summary v2 Notes**.

## BS-016 - Checkout phone field: excessive `padding-left` / intl-tel layout (regression vs older Campaign Cart CSS)

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** Any checkout with **`data-next-checkout-field="phone"`** and the SDK’s intl-tel / flag widget — reference [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) (`#phone`). Theme **`next-core.css`** still carries some **`.iti--allow-dropdown`** rules (e.g. `padding-right` / `padding-left` for dial-code mode); **observed in browser** can still show a **large `padding-left: 52px`** (or similar) on the `<input>`, making the field look misaligned vs other inputs.
- **Regression note:** Prior **Campaign Cart** / kit CSS reportedly **corrected** this; with **newer SDK** bundles that override or omit those rules, the problem **shows again**.
- **Expected:** Phone input **visually consistent** with email/name fields (or documented, stable intl-tel spacing).
- **Ask (engineering):** **Reinstate** the previous core checkout **phone / `.iti`** normalization.
- **Workaround (themes):** Local CSS on **`input[data-next-checkout-field="phone"]`** / **`.iti`…** to reset padding to match your form grid (test with flag dropdown + separate dial code modes).
- Cross-ref:
  - [Campaign issues overview](campaign-issues-overview.md) open **#4**.

## BS-017 - Cart summary tax row: `{tax}` token, `.next-has-tax`, and `cart.tax` display all unimplemented

- Status: `open`
- Severity: `low`
- Date logged: `2026-04-03`
- **Templates / where:** All bundle checkouts using `[data-next-cart-summary]` — primary: `olympus/checkout.html`, `olympus-mv-single-step/checkout.html`
- **Root cause (three separate gaps):**
  1. `{tax}` — not included in the vars `CartSummaryEnhancer` passes into the custom `<template>`, so the literal `{tax}` renders or the row appears blank
  2. `.next-has-tax` — never added to `[data-next-cart-summary]`; only discount/shipping/calculating-style state flags are toggled in `updateStateClasses`. CSS keyed off `.next-has-tax` therefore never fires.
  3. `data-next-display="cart.tax"` — not implemented on `cart.*`; `cart.*` display resolves subtotal/total/shipping only, not tax.
- **Expected:** Tax row shows live tax amount from `calculateBundlePrice` response; `.next-has-tax` toggles conditional visibility; `{tax}` / `cart.tax` resolve as formatted currency.
- **Actual:** `{tax}` renders literally or blank; tax CSS hook never applies; no first-class SDK path for checkout cart summary tax exists today.
- **Workaround (today):**
  - Custom script: `window.next.on('cart:updated', (state) => { /* read tax field from state.summary, format, inject manually, toggle next-has-tax on summary root */ })` — field name must match what the API actually returns.
  - Note: `order.tax` works on the receipt page where order context exists; that is not the same as live cart tax.
- **Next action:** Confirm field name on `state.summary` from network response. Raise with SDK team to wire tax from `calculate` response into `buildVars`, toggle `next-has-tax`/`next-no-tax`, and extend display types. Or correct the public cart summary guide to reflect current scope.

## BS-018 - MV upsell: exit/checkout coupon vs upsell `bundle.*` display (`calculateBundlePrice`)

- Status: `verified`
- Severity: `medium`
- Date logged: `2026-04-06`; **status update:** `2026-04-17` (reference smoke, Campaign Cart **0.4.17+**)
- **Templates / where:** MV upsell using `data-next-bundle-selector` with a `packageId` shared with the checkout bundle selector — primary: [`olympus-mv-single-step/upsell-mv.html`](../campaign-kit-templates/src/olympus-mv-single-step/upsell-mv.html).
- **Verification (reference smoke, 0.4.17+):** Checkout session coupon (e.g. exit pop) **no longer** skews upsell **`bundle.*.price`** / **`discountPercentage`** away from the upsell-offer headline (historical **82%** vs **80%** repro **not** observed). **Regression-watch:** re-run when upgrading Campaign Cart or changing upsell voucher / `packageId` wiring.
- **Historical repro (pre-verification):** packageId 1, base $39.98. Checkout offer 50% → $19.99. `EXIT10` applied → $17.99. Upsell `UP80TSHIRT` (80% off) — display could show **$7.20 / 82%** vs intended **$8.00 / 80%** (`EXIT10` stacked in `calculateBundlePrice` display). Charge path was often correct; see archived narrative below.
- **Historical — mechanism 1 (session coupon in upsell display):** Previously, applied checkout coupons could participate in **`calculateBundlePrice`** output on the upsell page so **`bundle.*`** tokens reflected **stacked** effective discount.
- **Historical — mechanism 2 (variant resolver):** `BundleSelectorEnhancer` resolves by `product_id` + `.find()` first match; overlapping checkout vs upsell **package families** could mis-resolve variants and break voucher scope — **charge** risk when combined with display skew. Ops workaround (split `packageId` / `product_id` families) was documented while **#7** was open; **[campaign issues overview](campaign-issues-overview.md)** fixed **#15** marks that **mitigation no longer required for coupon-bleed alone** after **#14 / BS-018** verified on **0.4.17+**. Unusual catalog duplicates may still warrant data-model review.
- **SDK 0.4.16 note:** exit-popup **refresh** + bundle **voucher ordering** shipped in **0.4.16**; they did **not** alone clear the historical **#7** display repro — reference verification is pinned to **0.4.17+**.
- **Post-order session:** **BS-019** (SDK **0.4.17**) — `sessionStorage` cleanup after checkout; separate from mid-funnel upsell display.

---

## BS-019 - Post-checkout ghost cart / coupons in `sessionStorage` (cleared on redirect)

- Status: `fixed`
- Severity: `medium`
- Date logged: `2026-04-17`
- **Templates / where:** Any funnel with checkout → receipt (or other cart-backed views after submit). Reference: `olympus/receipt.html`, `olympus-mv-single-step/receipt.html` — behavior is **SDK session** hygiene, not page-specific markup.
- **Repro (pre-0.4.17):** Complete checkout with a cart coupon → land on receipt → **full page reload** — cart UI or coupon badge could still reflect the **completed** order’s session.
- **Fix (SDK 0.4.17):** Cart and applied coupons are removed from **`sessionStorage`** immediately **before** the post-checkout redirect ([release](https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.17)).
- **Verification:** Repeat repro on **0.4.17+**; after reload, no ghost cart lines / stale applied code from the finished order.
- **Not the same as:** **BS-018** (mid-funnel upsell **`bundle.*`** vs session coupon — **`verified`** on **0.4.17+** reference smoke).

---

## Add new issue template

Copy/paste this block for each new issue:

```md
## BS-020 - Short title

- Status: `open`
- Severity: `low|medium|high`
- Date logged: `YYYY-MM-DD`
- **Templates / where:** (e.g. all bundle checkouts | primary: `olympus/checkout.html` | path + section)
- Repro steps:
  1.
  2.
- Expected:
  -
- Actual:
  -
- Workaround:
  -
- Next action:
  -
```
