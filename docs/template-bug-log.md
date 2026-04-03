# Template bug log

Issues for **Campaign Cart SDK 0.4.x** funnels in this repo — bundle selector, `[data-next-cart-summary]`, bumps, and related patterns. Most entries apply to **any** template using the same markup, not one theme only.

**Primary reference implementation:** [`campaign-kit-templates/src/olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) — first place many of these were reproduced; comments in that file point back here by **BS-xxx** id.

**Related docs:** [Campaign issues overview](campaign-issues-overview.md) (shareable, non-technical table) · [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) (Known #1–#10) · [`docs/bundle-display-cart-cheatsheet.md`](bundle-display-cart-cheatsheet.md) · [Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale) · [Cart Summary](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary).

**Tracked elsewhere (not duplicated as BS items):** Deep **multivariant**-only concerns (external bundle slot layouts, clone/bridge patterns beyond formatting) — see MV template folders and [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) “External slot layout” notes. **`{item.*}` slot token formatting** → **BS-015** (with **`data-summary-lines`**).

**Variant dropdown (styling note):** Disabled rows use **`os-dropdown-item.os-card__variant-dropdown-item[disabled]`** in reference **`next-core.css`** (`olympus-v0.4`, `olympus-mv-single-step-v0.4`). **`.os-card__variant-dropdown-item { cursor: pointer }`** has higher specificity than bare **`os-dropdown-item[disabled]`**, so the combined selector is required for **not-allowed** cursor and muted treatment on disabled options.

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

---

## BS-001 - Auto-rendered cards do not bind `data-next-display="package.*"`

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- **Templates / where:** Any checkout using Step 4 auto-render (`data-next-bundles` + `data-next-bundle-template-id`). First hit: [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) (bundle selector; auto-render block commented out in reference).
- Repro steps:
  1. Use auto-render (`data-next-bundles` + `data-next-bundle-template-id`).
  2. Put `data-next-display="package.name"` and `data-next-display="package.image"` inside the template card.
  3. Load checkout page.
- Expected:
  - Product name/image render from package `1`.
- Actual:
  - Name/image placeholders remain unchanged.
- Workaround:
  - Keep bundle cards inline in initial HTML, or use `{bundle.*}` static fields for name/image. Reference `olympus-v0.4/checkout.html` uses inline cards only (auto-render block is commented out)—no need to ship auto-render until the SDK binds injected nodes.
- Next action:
  - Re-test if SDK adds post-render display binding for injected bundle template nodes (backlog / when convenient).

## BS-002 - Package selector card sync fails with same package id on multiple cards

- Status: `fixed`
- Severity: `high`
- Date logged: `2026-03-31`
- **Templates / where:** Legacy **package** selector pattern (e.g. [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html)); mitigated by moving reference bundle flow to unique `data-next-bundle-id` + `data-next-bundle-items`.
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
- **Templates / where:** Any **bundle card** body; reference QA on [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html).
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
- **Templates / where:** Any checkout with bumps using new 0.4.x toggle pricing; reference includes [`olympus-v0.4/_includes/bump-*.html`](../campaign-kit-templates/src/olympus-v0.4/_includes/).
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
- **Templates / where:** Any `data-next-bundle-card` tier pricing; reference [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) Step 1 bundle cards.
- **If you use** `<span data-next-bundle-price>-</span>` **(bare):** total may not bind; placeholder can remain.
- **Required markup:** `data-next-bundle-price="total"` (and `="compare"` where needed for compare-at line totals).
- **Verification notes:**
  - **2026-04-01 QA (SDK 0.4.6):** Explicit `total` / `compare` slots behave as expected on all tiers on load; aligns with BS-003 bundle display.

## BS-007 - Feature request: native bundle quantity display token

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- **Templates / where:** Any bundle card title (e.g. `1x/2x/3x` prefix); reference [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html).
- Request:
  - Add a documented bundle display token/attribute for per-card quantity (for example `data-next-bundle-display="quantity"`), so templates can render `1x/2x/3x` without custom JS.
- Current workaround:
  - Static title prefixes per card in HTML.
- Why useful:
  - Keeps quantity display fully declarative and consistent with other SDK display attributes.

## BS-008 - Warranty bump: `data-next-toggle-price` vs `compare`, sync + bundle, stable unit labels

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** Bump includes on bundle checkouts — reference [`olympus-v0.4`](../campaign-kit-templates/src/olympus-v0.4/) (`bump-check01-v2.html` vs `bump-check01.html`, `checkout.html` + `data-next-package-sync`).
- **Layering:** Behavior below is tied to **`data-next-package-sync`** (bump qty / pricing follows main line) together with **`data-next-toggle-price`** / toggle-card preview — not “sync alone” or “toggle alone” in isolation.
- **Observed flow (toggle-price + sync):**
  1. Shopper **turns bump on** → card **compare/sale** update to match the **currently selected bundle tier** (expected on first check).
  2. Shopper **changes bundle tier** (1× / 2× / 3×) → **cart and summary totals** update; **visible bump compare/sale on the card often do not** until the shopper **unchecks and checks** the bump again (stale toggle preview).
  3. Separately: `data-next-toggle-price` and `data-next-toggle-price="compare"` can both show the **same** value when the add-on package has no separate discount/list story in the preview; a **Campaigns offer** on the add-on can make compare vs sale diverge.
  4. With **`data-next-package-sync`** and a **bundle selector** on **one main `packageId`**, [Step 7 quantity sync](https://developers.nextcommerce.com/docs/campaigns/guides/selling-addons#step-7-quantity-sync-warranty-per-unit) remains the right model (e.g. `data-next-package-sync="1"`).
  5. After check/uncheck, numbers can still **shift** as preview/sync runs (see migration **Known #7**).
- **Eng ask:** Recompute toggle preview whenever **synced cart qty** or **main bundle selection** changes, not only on bump check/uncheck.
- **Template / product preference:** Teams often want the **option** to show **unit list + unit sale** like the **older pattern** — stable on-card copy that does not depend on toggle preview rescaling:
  - Keep **`data-next-package-toggle`** + **`data-next-toggle-card`** + **`data-next-package-sync`** for add/remove and qty mirroring.
  - For **visible** list/sale lines, use **`data-next-display="package.price_retail"`** and **`data-next-display="package.price"`** scoped to the **bump package id**, **not** `data-next-toggle-price` / `compare`.
- Tradeoff:
  - `data-next-display="package.*"` is **not** fully aligned with backend offer/voucher pricing the way toggle-price is intended to be; list/sale usually come from **package definition** unless you accept partial parity.
- Alternative (totals-focused, older pattern):
  - `data-next-bump` + `data-next-toggle="toggle"` + `data-next-display` totals — migration doc calls this more stable when toggle-price misbehaves (issue #7).

## BS-009 - Feature request: cart summary line amounts without currency symbol

- Status: `open`
- Severity: `low`
- Date logged: `2026-03-31`
- **Templates / where:** Any `[data-next-cart-summary]` with `data-summary-lines` row template (`{line.originalPackagePrice}`, `{line.total}`, etc.); same pattern on [`olympus-v0.4`](../campaign-kit-templates/src/olympus-v0.4/) and [`olympus-mv-single-step-v0.4`](../campaign-kit-templates/src/olympus-mv-single-step-v0.4/) checkouts.
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
- **Templates / where:** Summary v2 — `[data-next-cart-summary]` totals (`{discounts}`, savings rows) vs `data-summary-lines` (`{line.total}`, `{line.hasSavings}`, etc.); reference [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html).
- **Previously observed:** Line-level savings visible while cart-level **“Today you saved”** / discount rollup showed **$0** or disagreed with lines — often with **legacy multi-package** or **misaligned** offer setup.
- **Resolution:** With **`data-next-bundle-selector`** and **Campaigns structured for bundle-tier offers** (percent/tier discounts wired to the same model as the template), rollup and line-level savings **align** on reference QA. Remaining mismatches on other funnel shapes → re-check **campaign / offer configuration** before treating as SDK.
- **Verification notes:**
  - Re-test on `olympus-v0.4` with production-like bundle offers; still use **Cart Summary v2 Notes** (state classes, `data-next-show` timing) for flaky UI.
- Cross-ref:
  - Migration **Cart Summary v2 Notes**; **BS-012** if per-line tokens are wrong independent of rollup.

## BS-011 - `data-next-shipping-id`: bundle cards ineffective; package swap selector still broken vs totals

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Release impact:** **Not a blocker** — shipping can be driven **imperatively** with JS (`next.setShippingMethod(refId)` on card select). The gap is **declarative** markup vs **summary UI** consistency.
- **Templates / where:** **Bundle:** [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) — `[data-next-bundle-card]`. **Package swap:** [`olympus/checkout.html`](../campaign-kit-templates/src/olympus/checkout.html) — `data-next-package-selector` + `data-next-selection-mode="swap"` + `data-next-selector-card`.
- **Observed — package selector + swap:** **`data-next-shipping-id`** on **`data-next-selector-card`** is documented. On card select, **cart state** is correct: `window.nextDebug?.stores?.cart?.getState()?.shippingMethod` shows the **expected** ref id. **Summary** shipping line and **grand total** still **often** do not reflect that method (totals look tied to default/fixed shipping downstream).
- **Observed — bundle selector:** Declarative **`data-next-shipping-id`** on **`data-next-bundle-card`** **does not work at all** in practice (not supported for bundle markup; see migration bundle attribute table). Do **not** rely on it for per-tier bundle shipping.
- Expected:
  - Declarative per-card shipping IDs should drive **both** cart state **and** displayed totals; docs should state bundle limitation clearly until SDK supports it.
- Workaround (production-viable):
  - On selector/bundle card change, call **`next.setShippingMethod(refId)`** (or platform equivalent) in **custom JS**, then **re-test** summary lines and grand total. Known **#3** can still apply until upstream fixes declarative path — JS is the supported mitigation today.
- Cross-ref:
  - Migration **§ Known #3**; **Bundle Selector** attribute table (no `data-next-shipping-id`); **Package Selector** example with `data-next-shipping-id` on `data-next-selector-card`.

## BS-012 - Cart summary: `{line.priceRetailTotal}` should be full-line list total, not per-unit (multi-qty / bundle lines)

- Status: `open`
- Severity: `high`
- Date logged: `2026-04-01`
- **Plain language:** On **`[data-next-cart-summary]`** line rows, the token **`{line.priceRetailTotal}`** is the usual hook for the **right-column strikethrough** (“list” / compare-at for the **whole line**). For **quantity > 1** (or bundle lines), it should equal **unit list × `{line.quantity}`**. It often comes back as the **same number as a single unit’s** list price, so the strike shows **one unit** while **Subtotal** elsewhere can still correctly show **qty × list**.
- **Screenshot (shareable):** [Campaign issues overview — example](campaign-issues-overview.md#bs012-cart-summary-example) · [`cart-summary-line-retail-total-bs012.png`](assets/cart-summary-line-retail-total-bs012.png)
- **Templates / where:** Any `[data-next-cart-summary]` → `data-summary-lines` row template; comments in [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) and [`olympus-mv-single-step-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step-v0.4/checkout.html).
- Docs: [Cart Summary — line item variables](https://developers.nextcommerce.com/docs/campaigns/guides/cart-summary#line-item-variables) (`{line.priceRetail}` = compare **per unit**; `{line.originalPackagePrice}` = package total before discount; **`{line.priceRetailTotal}`** not in public table — treated internally as **full-line** compare total per `olympus/checkout.html` v2 comments)
- Observed:
  - For bundle / multi-qty lines, **`{line.priceRetailTotal}`** resolves to the **same formatted value** as **`{line.priceRetail}`** / **`{line.originalPackagePrice}`** (or otherwise does **not** scale with **line qty × list**).
- Expected:
  - **`{line.priceRetailTotal}`** = **retail compare-at for the entire line** (consistent with `{line.quantity}`), **not** the same as per-unit `{line.priceRetail}`.
- Actual:
  - Strikethrough **Amount** column understates “was” price; savings on that row look inflated vs reality. **Subtotal** line can still match **qty × list** — the bug is the **line template token**, not all totals.
- Workaround:
  - None in pure template — requires **CartSummary / summary API** fix or new documented line token. Optionally **hide** the right-column strike and rely only on `{line.priceRetail}/ea` + `{line.total}` until eng confirms correct field (accepts weaker UX).
- Cross-ref:
  - Migration **§ Known #9**; **BS-010** (rollup vs lines — `verified` for bundle + aligned Campaigns); re-test after SDK bump if release notes mention summary line mapping.

## BS-013 - Bundle selector **adds** cart lines instead of **atomic swap** (continuous accumulation)

- Status: `fixed`
- Severity: `high`
- Date logged: `2026-04-01` (updated: continuous-add primary symptom)
- **Templates / where:** Any checkout with `data-next-bundle-selector` + tier cards; primary repro / verification: [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) (`data-next-selector-id="drone-packages"` — SDK reads **`data-next-selector-id`**, not `data-next-bundle-selector-id`), `data-next-selection-mode="swap"`, `[data-next-cart-summary]` line list.  
  - Only **one** selector root in built HTML (auto-render block commented out, not emitted).
- Doc expectation ([Bundle Set Sale](https://developers.nextcommerce.com/docs/campaigns/guides/bundle-set-sale)): selecting a card should **replace** the previous bundle — “**atomic swap — no double-add**”. The guide’s basic markup does **not** use `data-next-selection-mode` on the bundle root (that attribute appears in migration examples; confirm with SDK whether it is valid/ignored/misread on bundle selector).
- **Previously observed (2026-04-01):**
  1. Load checkout; default **1×** selected (`data-next-selected="true"` on first `data-next-bundle-card`).
  2. Click **2×**, then **3×**, then **1×** — line count **grew** (separate lines) instead of **one** line whose qty updates; **hard refresh** after 2×/3× could show **1× + persisted tier**.
- Expected:
  - Always **exactly one** cart line for package `1` from this selector, qty matching the selected tier; tier clicks **swap**, never stack duplicate package lines.
- **Fix verified:**
  - **Recent re-test** on reference `olympus-v0.4` checkout — tier switches keep **one** cart line (qty follows tier); full reload does **not** show stacked default + persisted tier. **Regression-watch:** re-run QA on SDK upgrades and any second `data-next-bundle-selector` root / auto-render enablement.
- Template hygiene (2026-04-01) on reference checkout (still recommended):
  - Removed misplaced **`data-next-show="cart.hasCoupon"`** / stray copy inside the **1×** bundle card.
  - Removed erroneous **`data-selected="true"`** on **2× / 3×** radio shells.
- **Diagnostic only (not production):** **`<meta name="next-clear-cart" content="true">`** clears the session cart each load — useful only to isolate persistence; do not ship (see `base.html` comment).
- Cross-ref:
  - Migration **§ Known #8**; distinct from **Known #2** (coupon cleared on refresh); related to **BS-002** (tier sync).

## BS-014 - `data-next-display="cart.discountCode"` / `cart.hasCoupon` not resolved (cart display refactor)

- Status: `open`
- Severity: `low`
- Date logged: `2026-04-01`
- **Priority:** **Low** — voucher lines and **JS** give acceptable UX; this tracks **declarative** parity / older markup that used to work.
- **Templates / where:** Any page with `[data-next-cart-summary]` template using `cart.hasCoupon` + `cart.discountCode`; reference comments in [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) and [`olympus-mv-single-step-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step-v0.4/checkout.html).
- **Regression example:** Markup such as `<span data-next-display="cart.discountCode" class="display-visible">—</span>` **used to populate** the applied code; after cart display moved under **`CartSummaryEnhancer.display` → `resolveValue`**, these keys are **unhandled** and the node stays empty (console: “Unknown cart display property”).
- Root cause (engineering):
  - Cart display now lives under **cart summary** (`CartSummaryEnhancer.display.ts` / `resolveValue`) with an **explicit property switch**. It handles totals-style fields (`subtotal`, `total`, `totalDiscount`, shipping, `itemCount`, etc.) only.
  - It does **not** handle **`discountCode`**, **`hasCoupon`**, **`hasCoupons`**, **`discountCodes`**, **`coupons[0].code`**, etc. Unknown keys hit the **default** branch → console **“Unknown cart display property”** → **`undefined`** → node stays empty.
  - **`DisplayEnhancerTypes.ts`** may still document **`cart.discountCode` → `vouchers.0`**, but that mapping is **not wired** on this `resolveValue` path.
- Data (still present):
  - Coupon strings live in **checkout** store; after **`calculateTotals`**, cart slice can include **`vouchers: [...]`** — the **display layer** simply does not read them for these attributes.
- **Eng one-liner:** *Cart display refactor dropped `discountCode` / coupon visibility fields from `resolveValue`; `PROPERTY_MAPPINGS` still lists them but they’re unreachable.*
- Expected fix (SDK):
  - Extend **`CartSummaryEnhancer.display.ts`** `resolveValue` (and likely **`setupStoreSubscriptions`**) for at least: **`discountCode`** → `state.vouchers[0] ?? ''`; **`hasCoupon` / `hasCoupons`** → `state.vouchers.length > 0`; optionally joined codes; optionally subscribe to **`useCheckoutStore`** for instant UI when a code is applied (before next calculate).
- Workaround (templates):
  - **No attribute-only** replacement through the same enhancer. Use **`data-summary-voucher-discounts`** + **`{discount.name}`** (and amount) in the summary template. Or small **custom JS** listening to cart/checkout updates to set badge text. Or **patch SDK** as above.
- Cross-ref:
  - Migration **§ Known #10**.

## BS-015 - `data-next-format="currency"` does not apply to `data-summary-lines` or bundle slot `<template>` output

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** `[data-next-cart-summary]` → **`data-summary-lines`** row `<template>` (`{line.total}`, `{line.price}`, `{line.originalPackagePrice}`, …) — [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html), [`olympus-mv-single-step-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-mv-single-step-v0.4/checkout.html). **`data-next-bundle-slots`** slot `<template>` (`{item.unitPrice}`, `{item.originalUnitPrice}`, …) on MV / bundle card UIs.
- **Problem:** Adding **`data-next-format="currency"`** (or similar) on wrappers around **`{line.*}`** or **`{item.*}`** inside those **cloned** `<template>` fragments **does not** produce formatted currency in practice — unlike **`data-next-display="bundle.*"`** on regular DOM (see **safe-display-paths §6** / `upsell-quantity.html`), which **can** use `data-next-format`.
- **Expected:** Same formatter pipeline as other money displays, or documented unsupported + alternative.
- **Workaround:** **Custom JS** (listen to cart / bundle events, format numbers with campaign currency) until SDK wires formatters into the summary line + slot clone pipelines.
- **Eng one-liner:** *Cart summary line template + bundle slot template clones do not honor `data-next-format` on `{line.*}` / `{item.*}` nodes.*
- Cross-ref:
  - [Campaign issues overview](campaign-issues-overview.md) open **#5**; migration **Known #5** (slot tokens raw) + **Cart Summary v2 Notes**.

## BS-016 - Checkout phone field: excessive `padding-left` / intl-tel layout (regression vs older Campaign Cart CSS)

- Status: `open`
- Severity: `medium`
- Date logged: `2026-03-31`
- **Templates / where:** Any checkout with **`data-next-checkout-field="phone"`** and the SDK’s intl-tel / flag widget — reference [`olympus-v0.4/checkout.html`](../campaign-kit-templates/src/olympus-v0.4/checkout.html) (`#phone`). Theme **`next-core.css`** still carries some **`.iti--allow-dropdown`** rules (e.g. `padding-right` / `padding-left` for dial-code mode); **observed in browser** can still show a **large `padding-left: 52px`** (or similar) on the `<input>`, making the field look misaligned vs other inputs.
- **Regression note:** Prior **Campaign Cart** / kit CSS reportedly **corrected** this; with **newer SDK** bundles that override or omit those rules, the problem **shows again**.
- **Expected:** Phone input **visually consistent** with email/name fields (or documented, stable intl-tel spacing).
- **Ask (engineering):** **Reinstate** the previous core checkout **phone / `.iti`** normalization.
- **Workaround (themes):** Local CSS on **`input[data-next-checkout-field="phone"]`** / **`.iti`…** to reset padding to match your form grid (test with flag dropdown + separate dial code modes).
- Cross-ref:
  - [Campaign issues overview](campaign-issues-overview.md) open **#4**.

---

## Add new issue template

Copy/paste this block for each new issue:

```md
## BS-XXX - Short title

- Status: `open`
- Severity: `low|medium|high`
- Date logged: `YYYY-MM-DD`
- **Templates / where:** (e.g. all bundle checkouts | primary: `olympus-v0.4/checkout.html` | path + section)
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
