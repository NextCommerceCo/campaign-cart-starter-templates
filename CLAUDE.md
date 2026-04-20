# Repo Memory — campaign-cart-starter-templates

## Repo Overview
Two top-level folders:
- `campaign-kit-templates/` — **active work area.** 0.4.x templates, growing over time.
- `campaign-kit-templates-v3/` — 0.3.x archive. Reference only — do not add new work here.

---

## campaign-kit-templates/ Purpose
A **complete, working campaign-kit project** that serves two purposes:
1. Full demo — clone it, `npm install` + `npm run dev`, all current templates work
2. Template library — developers copy individual `src/[slug]/` folders into their own kit projects

Templates are being ported from `campaign-kit-templates-v3/` one by one, updated to SDK 0.4.x patterns as they go.

## Developer Workflow (end users of this repo)
1. `npx campaign-init` in their own project → creates empty `_data/campaigns.json` + npm scripts
2. Copy `campaign-kit-templates/src/[slug]/` → their project's `src/[slug]/`
3. Copy the matching entry from `campaign-kit-templates/_data/campaigns.json` into their project's `campaigns.json`, update slug + store URLs
4. `npm run dev` → interactive campaign picker
5. To clone a variant: `npm run clone` → picks existing campaign → new slug → auto-updates `campaigns.json`

Note: `npx campaign-init` does NOT create any src/ folders — it only creates `_data/campaigns.json` and adds npm scripts to `package.json`.

Note: when copying a template, the developer renames the folder to their product/campaign name (e.g. `wintergloves`), NOT the template name (e.g. `olympus`). The folder name becomes the slug and drives the URL: `campaign-domain.com/wintergloves/checkout`.

---

## campaigns.json
- **Project-level, not template-specific** — accumulates all campaigns a developer adds
- `campaign-kit-templates/_data/campaigns.json` is a reference file showing full field structure for all current templates
- Fields: `name`, `slug`, `description`, `sdk_version`, `store_name`, `store_url`, `store_terms`, `store_privacy`, `store_contact`, `store_returns`, `store_shipping`, `store_phone`, `store_phone_tel`; optional layout analytics: `gtm_id`, `fb_pixel_id` (see `docs/campaign-page-kit-template-context.md` / `docs/qa-guide.md`)
- slug drives URL: `campaign-domain.com/[slug]/page`

## npm run build behaviour
- Builds ALL campaigns in `src/` to `_site/`
- `npm run dev` is interactive — lets you pick ONE campaign to preview
- `_site/` is gitignored

## Dev server preview URLs (localhost:3000)

### campaign-kit-templates/ (0.4.x)

| Template | Pages |
|----------|-------|
| limos | /limos/checkout/ · /limos/upsell-bundle-stepper/ · /limos/upsell-bundle-tier-pills/ · /limos/upsell-bundle-tier-cards/ · /limos/receipt/ |
| olympus | /olympus/checkout/ · /olympus/upsell-bundle-stepper/ · /olympus/upsell-bundle-tier-pills/ · /olympus/upsell-bundle-tier-cards/ · /olympus/receipt/ |
| olympus-mv-single-step | /olympus-mv-single-step/checkout/ · /olympus-mv-single-step/upsell-mv/ · /olympus-mv-single-step/receipt/ |

### campaign-kit-templates-v3/ (0.3.x archive)

| Template | Pages |
|----------|-------|
| demeter | /demeter/checkout/ · /demeter/upsell/ · /demeter/receipt/ |
| limos | /limos/checkout/ · /limos/upsell/ · /limos/receipt/ |
| olympus | /olympus/checkout/ · /olympus/upsell/ · /olympus/receipt/ |
| olympus-mv-single-step | /olympus-mv-single-step/checkout/ · /olympus-mv-single-step/upsell-mv/ · /olympus-mv-single-step/receipt/ |
| olympus-mv-two-step | /olympus-mv-two-step/select/ · /olympus-mv-two-step/checkout/ · /olympus-mv-two-step/upsell-mv/ · /olympus-mv-two-step/receipt/ |
| shop-single-step | /shop-single-step/checkout/ · /shop-single-step/upsell/ · /shop-single-step/receipt/ |
| shop-three-step | /shop-three-step/information/ · /shop-three-step/shipping/ · /shop-three-step/billing/ · /shop-three-step/upsell/ · /shop-three-step/receipt/ |

---

## campaign-kit-templates/ File Structure
```
campaign-kit-templates/
├── _data/
│   └── campaigns.json          ← reference: all current 0.4.x templates with full field structure
├── src/
│   ├── olympus/
│   └── olympus-mv-single-step/
└── package.json                ← kit scripts + next-campaign-page-kit dependency
```

## Each src/[slug]/ Structure
```
[slug]/
├── _layouts/
│   └── base.html               ← layout shell with Liquid variables
├── assets/
│   ├── css/
│   │   ├── next-core.css       ← core styles (loaded directly in base.html)
│   │   ├── checkout.css        ← checkout-specific styles
│   │   └── upsells.css         ← upsell-specific styles
│   ├── js/
│   │   └── [only needed JS]    ← trimmed per template (see JS map below)
│   ├── images/
│   └── config.js               ← SDK config with placeholder apiKey
└── [page].html                 ← pages with YAML frontmatter
```

---

## base.html Pattern
- `next-core.css` loaded **directly in base.html** — always needed, not in page frontmatter
- Per-page CSS/JS injected via frontmatter `styles:` / `scripts:` loops using `campaign_asset`
- Optional **GTM / Meta Pixel** in reference templates: injected from `campaign.gtm_id` / `campaign.fb_pixel_id` when Liquid `environment != "development"` (omit keys in `campaigns.json` to disable)
- Liquid conditionals for optional metatags:
  - `{% if next_success_url %}` → checkout pages only
  - `{% if next_upsell_accept %}` / `{% if next_upsell_decline %}` → upsell pages only

## Page Frontmatter Fields
```yaml
---
title: "Page Title"
page_type: checkout | upsell | receipt
next_success_url: up01.html          # checkout pages only
next_upsell_accept: up02.html        # upsell pages only
next_upsell_decline: receipt.html    # upsell pages only
styles:
  - css/checkout.css
  - https://cdn.jsdelivr.net/...     # CDN links OK in styles/scripts lists
scripts:
  - js/checkout.js
---
```

## Liquid Filters Used in Templates
- `{{ 'images/logo.png' | campaign_asset }}` — resolves to campaign-relative asset path
- `{{ 'css/checkout.css' | campaign_asset }}` — same for CSS
- `{{ 'js/checkout.js' | campaign_asset }}` — same for JS
- `{{ next_success_url | campaign_link }}` — clean URL (removes .html, adds trailing slash, prepends slug)
- `{{ campaign.name }}` — from campaigns.json
- `{{ campaign.sdk_version }}` — from campaigns.json
- `{{ campaign.store_phone }}` / `{{ campaign.store_phone_tel }}`
- `{{ campaign.store_terms }}` / `{{ campaign.store_privacy }}` / `{{ campaign.store_contact }}` / `{{ campaign.store_returns }}` / `{{ campaign.store_shipping }}`
- `{{ campaign.gtm_id }}` / `{{ campaign.fb_pixel_id }}` — optional; used by reference `base.html` for layout-injected tags

## campaign_include Tag
- Always resolves relative to the **campaign's own `_includes/` folder** — never a shared/global path
- Syntax: `{% campaign_include 'filename.html' %}` or with args: `{% campaign_include 'filename.html' arg=value %}`
- Args become variables inside the partial (e.g. `show_paypal=true` → `{{ show_paypal }}` / `{% if show_paypal %}`)
- Multiple args: `{% campaign_include 'payment-methods.html' show_paypal=true show_klarna=true %}`
- Use args to make partials configurable with safe defaults (e.g. optional payment methods off by default)

---

## Key SDK Data Attributes

| Attribute | Purpose |
|-----------|---------|
| `data-next-checkout="form"` | Marks the checkout form |
| `data-next-checkout-field="email"` | Binds input to a field |
| `data-next-checkout-step="..."` | Multi-step navigation (value is `campaign_link` URL) |
| `data-next-display="cart.total"` | Renders a dynamic value |
| `data-next-show="cart.hasSavings"` | Conditional visibility |
| `data-next-hide="cart.isEmpty"` | Inverse conditional |
| `data-next-cart-items` | Cart item list container |
| `data-next-bump` | Order bump toggle |
| `data-next-express-checkout="container"` | Express checkout (PayPal/Apple/Google Pay) |
| `data-next-coupon="input"` | Coupon input component |
| `data-next-quantity="increase/decrease"` | Quantity controls |

Inside `<template>` elements the SDK uses single-brace tokens (not Liquid):
```html
<template id="cart-item-template">
  <div data-cart-item-id="{item.id}">
    <img src="{item.image}">
    <div>{item.name}</div>
    <div>{item.quantity} × {item.unitPrice}</div>
  </div>
</template>
```

---

## JS Files Per Template

### campaign-kit-templates/ (0.4.x)

| Template | JS Files |
|----------|----------|
| olympus | checkout.js, checkout-olympus.js, upsells.js, promo-banner.js, promo-timer.js |
| olympus-mv-single-step | checkout.js, checkout-olympus-mv-full.js, upsells-up01-mv.js, promo-banner.js, promo-timer.js |

### campaign-kit-templates-v3/ (0.3.x archive)

| Template | JS Files |
|----------|----------|
| demeter | checkout.js, upsells.js |
| limos | checkout.js, checkout-limos.js, upsells.js |
| olympus | checkout.js, upsells.js |
| olympus-mv-single-step | checkout.js, checkout-olympus-mv-full.js, upsells-up01-mv.js |
| olympus-mv-two-step | checkout.js, checkout-olympus-mv-selection.js, upsells-up01-mv.js |
| shop-single-step | upsells.js |
| shop-three-step | checkout-shop-three-billing.js, checkout-shop-three-shipping.js, upsells.js |

---

## .gitignore
- Removed blanket `package.json` / `package-lock.json` ignores (needed for both folder package.json files to be tracked)
- Added `_site/` (build output)
- `node_modules/` remains ignored globally
- Experimental scratch folders excluded via `.git/info/exclude` (local-only, not committed)

---

## Docs Structure (decisions made)
- `CLAUDE.md` (this file) — AI context for working ON this repo. Not for SDK usage guidance.
- `README.md` — public-facing: two-folder structure, developer workflow, template inventory, npm scripts, SDK links, AI rules pointer
- `docs/campaign-page-kit-template-context.md` — AI context for developers working with campaign-kit-templates (see below)
- `docs/safe-display-paths.md` — allowlist of safe `data-next-display` paths by namespace (cart, package, selection, order, shipping, bundle); includes `data-next-format` caveats and bundle display limitations
- `docs/selector-attribute-cheatsheet.md` — package selector and selection.* display reference
- `docs/bundle-display-cart-cheatsheet.md` — bundle display + cart summary tokens
- `docs/sdk-0.4.0-migration.md` — 0.4.x migration notes, template crosswalk, upsell approaches A/B
- `campaign-kit-template-CONTEXT.md` — **deleted** (wrong project layout, content migrated here and to README)

## SDK Customization Rules File — DONE
`docs/campaign-page-kit-template-context.md` is the copyable AI context file for developers working in their own campaign-kit projects. Covers:
- Project structure, campaigns.json schema, page frontmatter
- Liquid filters (`campaign_asset`, `campaign_link`, `campaign_include`) and common variables
- `base.html` pattern and SDK meta tag wiring
- Full `config.js` structure (matches real template file)
- All SDK data attributes with real examples (checkout form, selectors, bump, upsell, display, etc.)
- Task checklists: configuring config.js, setting up a new campaign, adding a bump, adding a upsell step, debugging
- 10 hard rules

Design decisions:
- **Checklists over how-to recipes** — checklists are AI-useful; prose how-tos are not worth the file bloat
- **`docs/recipes/` was created then deleted** — content absorbed into checklists in the main rules file
- **Analytics docs not included** — main SDK docs URL is sufficient; AI fetches specific pages when needed
- **Long-term goal**: wire into `npx campaign-init` so it's auto-delivered to developer projects

README has an "AI development rules" section pointing to both rules files (kit vs static).

## Commit preferences
- No `Co-Authored-By: Claude` lines in commit messages
