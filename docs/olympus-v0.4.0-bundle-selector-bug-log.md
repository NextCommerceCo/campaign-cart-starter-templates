# Olympus v0.4.0 Bundle Selector Bug Log

Scope: `campaign-kit-templates/src/olympus-v0.4.0-sdk/`

Use this file as the running issue tracker while implementing and QA'ing the bundle selector approach.

## Status legend

- `open` - logged, not worked yet
- `in-progress` - currently being worked
- `blocked` - waiting on SDK/platform decision or external fix
- `fixed` - code change made, needs verification
- `verified` - confirmed fixed in QA

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
