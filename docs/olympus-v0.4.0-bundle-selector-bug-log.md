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

Sam’s forwarded engineering note aligns with **`docs/sdk-0.4.0-migration.md` → Known SDK Issues #1–#7** and the items below. Use this table when sharing with eng: same issues, single numbering in migration doc.

| Topic (eng note) | `sdk-0.4.0-migration.md` | This log |
|------------------|--------------------------|----------|
| (1) `package.*` display vs offer/coupon pricing | **§ Known #1** | **BS-005**, **BS-008** (tradeoff when using `data-next-display` workaround) |
| (2) Coupon cleared on refresh | **§ Known #2** | *(not duplicated — platform issue)* |
| (3) `data-next-shipping-id` — **package swap** selector vs summary totals; **bundle** cards | **§ Known #3** (package); bundle attribute table silent | **BS-011** |
| (4) `data-next-package-price` compare/savings multi-unit SKUs | **§ Known #4** | **BS-002** context (selector → bundle workaround) |
| (5) Bundle selector operator workflow / offer-driven tier pricing | **§ Known #6** (and **#5** where it overlaps card pricing) | **BS-004**, **BS-006** |
| Cart summary v2 line pipeline `{line.priceRetailTotal}` / `{line.total}` (or `{line.originalPackagePrice}` per variable table) | **§ Cart Summary v2 Notes** | Confirmed for this template vs legacy cart line list patterns in migration open issues |
| Line amounts include **currency symbol** on every row (want numeric-only / single currency column) | *(not in migration §)* | **BS-009** |
| “Today you saved” **$0** while lines show savings | *(not in migration §)* | **BS-010** |
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

- Status: `fixed`
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
  - Confirm title and image populate for all three cards on load.

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

- Status: `fixed`
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
  - Confirm tier 1/2/3 totals all render and update on selection.

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
