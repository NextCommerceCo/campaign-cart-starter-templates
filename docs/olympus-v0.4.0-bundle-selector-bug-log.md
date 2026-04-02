# Olympus v0.4.0 Bundle Selector Bug Log

Scope: `campaign-kit-templates/src/olympus-v0.4.0-sdk/` only (single-variant bundle selector + bumps + cart summary on that checkout).

**Out of scope here:** `olympus-mv-*` multivariant checkouts (per-unit bundle slots, external variant UI, clone+bridge, `{item.*}` slot tokens) — track those in a separate doc when you pick that work up.

## Status legend

- `open` - logged, not worked yet
- `in-progress` - currently being worked
- `blocked` - waiting on SDK/platform decision or external fix
- `fixed` - code change made, needs verification
- `verified` - confirmed fixed in QA

## Crosswalk — engineering note vs repo docs

Sam’s forwarded engineering note aligns with **`docs/sdk-0.4.0-migration.md` → Known SDK Issues #1–#9** and the items below. Use this table when sharing with eng: same issues, single numbering in migration doc.

| Topic (eng note) | `sdk-0.4.0-migration.md` | This log |
|------------------|--------------------------|----------|
| (1) `package.*` display vs offer/coupon pricing | **§ Known #1** | **BS-005**, **BS-008** (tradeoff when using `data-next-display` workaround) |
| (2) Coupon cleared on refresh | **§ Known #2** | *(not duplicated — platform issue)* |
| (3) `data-next-shipping-id` — **package swap** selector vs summary totals; **bundle** cards | **§ Known #3** (package); bundle attribute table silent | **BS-011** |
| (4) `data-next-package-price` compare/savings multi-unit SKUs | **§ Known #4** | **BS-002** context (selector → bundle workaround) |
| (5) Bundle selector operator workflow / offer-driven tier pricing | **§ Known #6** (and **#5** where it overlaps card pricing) | **BS-004**, **BS-006** |
| Cart summary v2 line pipeline `{line.priceRetailTotal}` / `{line.total}` (or `{line.originalPackagePrice}` per variable table) | **§ Known #9** + **§ Cart Summary v2 Notes** | **BS-012** |
| Line amounts include **currency symbol** on every row (want numeric-only / single currency column) | *(not in migration §)* | **BS-009** |
| “Today you saved” **$0** while lines show savings | *(not in migration §)* | **BS-010** |
| Cart summary `{line.priceRetailTotal}` should be **line** retail total, not same as unit fields | *(not in migration §)* | **BS-012** |
| Bundle tier clicks **add** lines instead of **replacing** (summary grows: 1× then 1×+2× then …); refresh can also leave **1× + persisted tier** | **§ Known #8** | **BS-013** |
| Toggle bump: compare = sale; **prices refresh only after uncheck/recheck** when sync qty changes | **§ Known #7** | **BS-008** (expanded) |

---

## BS-001 - Auto-rendered cards do not bind `data-next-display="package.*"`

- Status: `blocked`
- Severity: `high`
- Date logged: `2026-03-31`
- Where: `olympus-v0.4.0-sdk/checkout.html` (Step 1 bundle selector)
- Repro steps:
  1. Use Step 4 auto-render (`data-next-bundles` + `data-next-bundle-template-id`).
  2. Put `data-next-display="package.name"` and `data-next-display="package.image"` inside the template card.
  3. Load checkout page.
- Expected:
  - Product name/image render from package `1`.
- Actual:
  - Name/image placeholders remain unchanged.
- Workaround:
  - Keep bundle cards inline in initial HTML (current approach), or use `{bundle.*}` static fields for name/image.
- Next action:
  - Re-test if SDK adds post-render display binding for injected bundle template nodes.

## BS-002 - Package selector card sync fails with same package id on multiple cards

- Status: `fixed`
- Severity: `high`
- Date logged: `2026-03-31`
- Where: prior implementation in checkout package selector (replaced)
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
- Where: bundle card content title/image
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

## BS-004 - Bundle approach changes merchandising workflow

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- Where: Campaigns app offer configuration vs previous package-tier setup
- Repro steps:
  1. Compare old multi-package selector workflow to bundle quantity tiers.
- Expected:
  - Equivalent operator control over tier pricing.
- Actual:
  - Pricing behavior now tied to bundle/offer discount model and rounding behavior.
- Workaround:
  - Document operator setup rules for this template.
- Next action:
  - Capture final playbook in docs after pricing QA sign-off.

## BS-005 - Bump pricing behavior still tied to known SDK regression

- Status: `blocked`
- Severity: `medium`
- Date logged: `2026-03-31`
- Where: bump components in checkout (`_includes/bump-*.html`)
- Repro steps:
  1. Switch bump implementation to new 0.4.x toggle pricing flow.
  2. Sync bump to main package quantity.
- Expected:
  - Stable compare/current/savings values.
- Actual:
  - Known 0.4.x inconsistency in toggle pricing flow.
- Workaround:
  - Keep old bump pattern with `data-next-bump` + `data-next-display` totals (current approach).
- Next action:
  - Re-evaluate when SDK issue is resolved upstream.

## BS-006 - `data-next-bundle-price` default slot not rendering total

- Status: `verified`
- Severity: `high`
- Date logged: `2026-03-31`
- Where: `olympus-v0.4.0-sdk/checkout.html` Step 1 bundle cards
- Repro steps:
  1. Use `<span data-next-bundle-price>-</span>` inside `data-next-bundle-card`.
  2. Load page and select tiers.
- Expected:
  - Total bundle price renders in the default slot.
- Actual:
  - Placeholder remains; total not rendered.
- Fix applied:
  - Switched to explicit total slot: `data-next-bundle-price="total"` for all bundle card total nodes.
- Verification notes:
  - **2026-04-01 QA (SDK 0.4.6):** `data-next-bundle-price="total"` (not bare) shows a numeric total on all three tiers on load; bundle display slots OK alongside BS-003.

## BS-007 - Feature request: native bundle quantity display token

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- Where: bundle card title (`.os-card__title`) in `olympus-v0.4.0-sdk/checkout.html`
- Request:
  - Add a documented bundle display token/attribute for per-card quantity (for example `data-next-bundle-display="quantity"`), so templates can render `1x/2x/3x` without custom JS.
- Current workaround:
  - Static title prefixes per card in `checkout.html` (`1x/2x/3x` before package name).
- Why useful:
  - Keeps quantity display fully declarative and consistent with other SDK display attributes.

## BS-008 - Warranty bump: `data-next-toggle-price` vs `compare`, sync + bundle, stable unit labels

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- Where: `olympus-v0.4.0-sdk/_includes/bump-check01-v2.html` vs `bump-check01.html`, `checkout.html` bundle + `data-next-package-sync="1"`
- Observed:
  - `data-next-toggle-price` and `data-next-toggle-price="compare"` can both show the **same** value when the warranty package has no separate discount/list story in the toggle preview; adding a **Campaigns offer** on the warranty can make compare vs sale diverge.
  - With **`data-next-package-sync`** and a **bundle selector** that uses **one main `packageId`** (qty 1/2/3 on that line), [Step 7 quantity sync](https://developers.nextcommerce.com/docs/campaigns/guides/selling-addons#step-7-quantity-sync-warranty-per-unit) is still the right model (`data-next-package-sync="1"` sums cart qty for package `1`).
  - **UI quirk:** after check/uncheck, displayed toggle prices can still **shift** as preview/sync logic runs — especially with sync (see `docs/sdk-0.4.0-migration.md` issue **#7** — toggle-price + sync regression).
  - **Eng note (additional):** when the main selection changes and **synced quantity** updates, toggle-card prices may **not refresh until** the shopper **unchecks and rechecks** the upsell — expected: recompute preview whenever synced cart qty / main package changes.
- Workaround — **stable unit list/sale on the card** (numbers that do not ride toggle preview scaling when the bundle tier changes):
  - Keep **`data-next-package-toggle`** + **`data-next-toggle-card`** + **`data-next-package-sync`** for add/remove and cart quantity mirroring.
  - For **visible** compare/sale lines, use **`data-next-display="package.price_retail"`** and **`data-next-display="package.price"`** scoped to the **bump package id** (pattern in `bump-check01.html`), **not** `data-next-toggle-price` / `compare`.
- Tradeoff:
  - `data-next-display="package.*"` is **not** fully aligned with backend offer/voucher pricing the way toggle-price is intended to be; list/sale usually come from **package definition** unless you accept partial parity.
- Alternative (totals-focused, older pattern):
  - `data-next-bump` + `data-next-toggle="toggle"` + `data-next-display` totals — migration doc calls this more stable when toggle-price misbehaves (issue #7).

## BS-009 - Feature request: cart summary line amounts without currency symbol

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- Where: `olympus-v0.4.0-sdk/checkout.html` — `[data-next-cart-summary]` nested `data-summary-lines` row template (`{line.originalPackagePrice}`, `{line.total}`)
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

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- Where: `[data-next-cart-summary]` totals (`{discounts}`, savings/discount rows) vs `data-summary-lines` (`{line.priceRetailTotal}` / `{line.total}`, `{line.hasSavings}`)
- Observed (eng note):
  - Line-level compare vs final can show obvious savings, while cart-level **“Today you saved” / discount aggregation** can still render **$0.00** or not match line-implied savings.
- Expected:
  - Cart-level savings/discount rows should stay consistent with line-level retail vs final (or documented rules when they differ).
- Cross-ref:
  - Confirms **new line pipeline** behaves for per-line strike; **cart rollup** may still be wrong or timing/CSS-gated — see migration **Cart Summary v2 Notes** (state classes, template `data-next-show` timing).

## BS-011 - `data-next-shipping-id`: bundle cards ineffective; package swap selector still broken vs totals

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- Where: `olympus-v0.4.0-sdk/checkout.html` — `[data-next-bundle-card]`; **`campaign-kit-templates/src/olympus/checkout.html`** — `data-next-package-selector` + `data-next-selection-mode="swap"` + `data-next-selector-card`
- Observed:
  - **Bundle selector:** **`data-next-shipping-id`** is **not** listed on **`data-next-bundle-card`** in **`docs/sdk-0.4.0-migration.md`**. Adding it per tier (1x / 2x / 3x) **does nothing** in practice — undocumented / unsupported for bundle markup.
  - **Standard package swap selector:** the attribute **is** documented on **`data-next-selector-card`**, but it **still does not work end-to-end** for checkout UX: migration **§ Known #3** — cart state can show the expected `shippingMethod` ref_id after card select, while **summary shipping line and grand total** often **do not** follow that method (downstream totals look stuck on default/fixed shipping).
- Expected:
  - Declarative per-card shipping IDs should drive **both** cart state **and** displayed totals; or docs should state limitations clearly for bundle vs package selector.
- Workaround:
  - **`next.setShippingMethod(refId)`** when selection changes may still be needed; **re-test summary/totals** — Known **#3** can apply even after imperative updates. Backend/campaign shipping rules as a fallback where declarative markup is unreliable.
- Cross-ref:
  - Migration **§ Known #3**; **Bundle Selector** attribute table (no `data-next-shipping-id`); **Package Selector** example with `data-next-shipping-id` on `data-next-selector-card`.

## BS-012 - Cart summary: `{line.priceRetailTotal}` matches unit retail / `originalPackagePrice` (not qty-scaled line total)

- Status: `open`
- Severity: `high`
- Date logged: `2026-04-01`
- Where: `olympus-v0.4.0-sdk/checkout.html` — `[data-next-cart-summary]` → `data-summary-lines` row template
- Docs: [Cart Summary — line item variables](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary#line-item-variables) (`{line.priceRetail}` = compare unit; `{line.originalPackagePrice}` = package total before discount; `{line.priceRetailTotal}` **not** in public table — internal/summary API field expected to mean full-line compare total per `olympus/checkout.html` v2 comments)
- Observed:
  - For bundle / multi-qty lines, **`{line.priceRetailTotal}`** resolves to the **same formatted value** as **`{line.priceRetail}`** and **`{line.originalPackagePrice}`** (or otherwise does **not** reflect **line qty × list** / full-line retail).
- Expected:
  - **`{line.priceRetailTotal}`** = **retail compare-at for the entire line** (consistent with `{line.quantity}` and list pricing), distinct from per-unit `{line.priceRetail}`.
- Actual:
  - Template cannot compute `qty ×` without a correct token; strikethrough **Amount** column misstates savings when the three placeholders collapse to one number.
- Workaround:
  - None in pure template — requires **CartSummary / summary API** fix or new documented line token. Optionally **hide** the right-column strike and rely only on `{line.priceRetail}/ea` + `{line.total}` until eng confirms correct field (accepts weaker UX).
- Cross-ref:
  - Migration **§ Known #9**; **BS-010** (rollup vs lines); re-test after SDK bump if release notes mention summary line mapping.

## BS-013 - Bundle selector **adds** cart lines instead of **atomic swap** (continuous accumulation)

- Status: `open`
- Severity: `high`
- Date logged: `2026-04-01` (updated: continuous-add primary symptom)
- Where: `olympus-v0.4.0-sdk/checkout.html` — single active `data-next-bundle-selector` (`data-next-selector-id="drone-packages"` — SDK reads **`data-next-selector-id`**, not `data-next-bundle-selector-id`), `data-next-selection-mode="swap"`, `[data-next-cart-summary]` line list  
  - Verified: only **one** selector root in built HTML (auto-render block is `{% comment %}`-wrapped, not emitted).
- Doc expectation ([Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale)): selecting a card should **replace** the previous bundle — “**atomic swap — no double-add**”. The guide’s basic markup does **not** use `data-next-selection-mode` on the bundle root (that attribute appears in migration examples; confirm with SDK whether it is valid/ignored/misread on bundle selector).
- Repro steps:
  1. Load checkout; default **1×** selected (`data-next-selected="true"` on first `data-next-bundle-card`).
  2. Click **2×**, then **3×**, then **1×** again; after each click inspect summary (or `window.nextDebug?.stores?.cart?.getState()` line items).
  3. **Primary failure:** line count **grows** (e.g. separate lines for 1× and 2×) instead of **one** line whose qty updates to match the selected tier.
  4. **Secondary:** after selecting **2×** or **3×**, **hard refresh** — summary may show **1× + persisted tier** (default init + persistence).
- Expected:
  - Always **exactly one** cart line for package `1` from this selector, qty matching the selected tier; tier clicks **swap**, never stack duplicate package lines.
- Actual:
  - **Additive** behavior: each tier interaction can **append** another line (or refresh leaves default **and** persisted line).
- Template hygiene (2026-04-01):
  - Removed misplaced **`data-next-show="cart.hasCoupon"`** / stray copy inside the **1×** bundle card.
  - Removed erroneous **`data-selected="true"`** on **2× / 3×** radio shells.
  - **Experiment:** Removing **`data-next-selected="true"`** from the default bundle card **did not** stop line accumulation — points away from “double HTML pre-add” and toward **persisted cart + init/swap merge** in the SDK.
- Workaround (high cost):
  - **`<meta name="next-clear-cart" content="true">`** in `<head>` (with other NEXT metatags) **clears the session cart on load** and **masks** duplicate/stacked lines in QA because there is no persisted state to merge. **Tradeoff:** cart is **not persistent** — refresh loses cart, return visitors start empty, upsell/receipt flows that expect session continuity break. **Do not use as a production fix**; use only to confirm diagnosis or isolated demos until **Known #8** is fixed upstream.
- Next action:
  - Eng: fix `BundleSelectorEnhancer` (or cart ops it calls) so tier changes **remove/replace** prior bundle items for the same selector scope; rehydrate must not **add** default tier on top of persisted selection. Optional spike: A/B **without** `data-next-selection-mode="swap"` on bundle root (undocumented there) to see if attribute is mis-handled.
- Cross-ref:
  - Migration **§ Known #8**; distinct from **Known #2** (coupon cleared on refresh); related to **BS-002** (tier sync).

---

## Add new issue template

Copy/paste this block for each new issue:

```md
## BS-XXX - Short title

- Status: `open`
- Severity: `low|medium|high`
- Date logged: `YYYY-MM-DD`
- Where: `path/to/file` + section
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
