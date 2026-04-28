# Repo Memory — campaign-cart-starter-templates

## Repo Overview
This repo is the **active 0.4.x templates project** at the repository root.
The previous 0.3.x archive is no longer part of this working tree.

---

## Repo Purpose
A **complete, working campaign-kit project** that serves two purposes:
1. Full demo — clone it, `npm install` + `npm run dev`, all current templates work
2. Template library — developers copy individual `src/[slug]/` folders into their own kit projects

Templates follow SDK **0.4.x** patterns (`olympus`, `limos`, `demeter`, `olympus-mv-single-step`, `olympus-mv-two-step`, `shop-single-step`, `shop-three-step` today).

## Developer Workflow (end users of this repo)
1. `npx campaign-init` in their own project → creates empty `_data/campaigns.json` + npm scripts
2. Copy `src/[slug]/` → their project's `src/[slug]/`
3. Copy the matching entry from `_data/campaigns.json` into their project's `campaigns.json`, update slug + store URLs
4. `npm run dev` → interactive campaign picker
5. To clone a variant: `npm run clone` → picks existing campaign → new slug → auto-updates `campaigns.json`

Note: `npx campaign-init` does NOT create any src/ folders — it only creates `_data/campaigns.json` and adds npm scripts to `package.json`.

Note: when copying a template, the developer renames the folder to their product/campaign name (e.g. `wintergloves`), NOT the template name (e.g. `olympus`). The folder name becomes the slug and drives the URL: `campaign-domain.com/wintergloves/checkout`.

---

## campaigns.json
- **Project-level, not template-specific** — accumulates all campaigns a developer adds
- `_data/campaigns.json` is a reference file showing full field structure for all current templates
- Fields: `name`, `slug`, `description`, `sdk_version`, `store_name`, `store_url`, `store_terms`, `store_privacy`, `store_contact`, `store_returns`, `store_shipping`, `store_phone`, `store_phone_tel`; optional layout analytics: `gtm_id`, `fb_pixel_id` (see `docs/campaign-page-kit-template-context.md`)
- slug drives URL: `campaign-domain.com/[slug]/page`

## npm run build behaviour
- Builds ALL campaigns in `src/` to `_site/`
- `npm run dev` is interactive — lets you pick ONE campaign to preview
- `_site/` is gitignored

## Dev server preview URLs (localhost:3000)

### 0.4.x templates

| Template | Pages |
|----------|-------|
| demeter | /demeter/checkout/ · /demeter/upsell-bundle-stepper/ · /demeter/upsell-bundle-tier-pills/ · /demeter/upsell-bundle-tier-cards/ · /demeter/receipt/ |
| limos | /limos/checkout/ · /limos/upsell-bundle-stepper/ · /limos/upsell-bundle-tier-pills/ · /limos/upsell-bundle-tier-cards/ · /limos/receipt/ |
| olympus | /olympus/checkout/ · /olympus/upsell-bundle-stepper/ · /olympus/upsell-bundle-tier-pills/ · /olympus/upsell-bundle-tier-cards/ · /olympus/receipt/ |
| olympus-mv-single-step | /olympus-mv-single-step/checkout/ · /olympus-mv-single-step/upsell-mv/ · /olympus-mv-single-step/receipt/ |
| olympus-mv-two-step | /olympus-mv-two-step/select/ · /olympus-mv-two-step/checkout/ · /olympus-mv-two-step/upsell-mv/ · /olympus-mv-two-step/receipt/ |
| shop-single-step | /shop-single-step/checkout/ · /shop-single-step/upsell-bundle-stepper/ · /shop-single-step/upsell-bundle-tier-pills/ · /shop-single-step/upsell-bundle-tier-cards/ · /shop-single-step/receipt/ |
| shop-three-step | /shop-three-step/information/ · /shop-three-step/shipping/ · /shop-three-step/billing/ · /shop-three-step/upsell-bundle-stepper/ · /shop-three-step/upsell-bundle-tier-pills/ · /shop-three-step/upsell-bundle-tier-cards/ · /shop-three-step/receipt/ |
| landing | /landing/index/ · /landing/supplement-sleep/ · /landing/skincare-serum/ · /landing/fitness-program/ |
| presell | /presell/index/ |

### Live Netlify previews (0.4.x)

Base URL: `https://nextcommerce-campaign-templates.netlify.app` — append the localhost paths above (always trailing slash).

| Template | Links |
|----------|-------|
| demeter | [checkout](https://nextcommerce-campaign-templates.netlify.app/demeter/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/demeter/receipt/) |
| limos | [checkout](https://nextcommerce-campaign-templates.netlify.app/limos/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/limos/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/limos/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/limos/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/limos/receipt/) |
| olympus | [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus/receipt/) |
| olympus-mv-single-step | [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/checkout/) · [upsell-mv](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-mv/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/receipt/) |
| olympus-mv-two-step | [select](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/select/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/checkout/) · [upsell-mv](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/upsell-mv/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/receipt/) |
| shop-single-step | [checkout](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/checkout/?forcePackageId=1:1) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-stepper/?forcePackageId=1:1) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-tier-pills/?forcePackageId=1:1) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-tier-cards/?forcePackageId=1:1) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/receipt/?forcePackageId=1:1) |
| shop-three-step | [information](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/information/?forcePackageId=1:1) · [shipping](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/shipping/?forcePackageId=1:1) · [billing](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/billing/?forcePackageId=1:1) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-stepper/?forcePackageId=1:1) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-tier-pills/?forcePackageId=1:1) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-tier-cards/?forcePackageId=1:1) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/receipt/?forcePackageId=1:1) |
| landing | [index](https://nextcommerce-campaign-templates.netlify.app/landing/index/) · [supplement-sleep](https://nextcommerce-campaign-templates.netlify.app/landing/supplement-sleep/) · [skincare-serum](https://nextcommerce-campaign-templates.netlify.app/landing/skincare-serum/) · [fitness-program](https://nextcommerce-campaign-templates.netlify.app/landing/fitness-program/) |
| presell | [index](https://nextcommerce-campaign-templates.netlify.app/presell/index/) |

## File Structure
```
repo-root/
├── _data/
│   └── campaigns.json          ← reference: all current 0.4.x templates with full field structure
├── src/
│   ├── demeter/
│   ├── limos/
│   ├── olympus/
│   ├── olympus-mv-single-step/
│   ├── olympus-mv-two-step/
│   ├── shop-single-step/
│   ├── shop-three-step/
│   ├── landing/               ← pre-checkout landing pages (no SDK)
│   └── presell/             ← advertorial presell page (no SDK)
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
- Optional **GTM / Meta Pixel** in reference templates: injected from `campaign.gtm_id` / `campaign.fb_pixel_id` when Liquid `environment != "development"` **and** the value is **non-empty** (`{% if campaign.gtm_id != "" %}` / `{% if campaign.fb_pixel_id != "" %}`). Use **`""`** in `campaigns.json` to disable layout injection; **placeholders like `GTM-XXXXXXX` still load snippets** on non-dev builds (not “off”). Do **not** use bare `{% if campaign.gtm_id %}` — Liquid can treat `""` as truthy.
- Liquid conditionals for optional metatags:
  - `{% if next_success_url %}` → checkout pages only
  - `{% if next_upsell_accept %}` / `{% if next_upsell_decline %}` → upsell pages only
- **Shop checkout top bar (`checkout-header--lg`):** `{% campaign_include 'checkout-header.html' %}` (section **`checkout-header checkout-header--lg`**) inside **`main-wrapper`**. **`shop-single-step`:** enabled on **`checkout.html`** with **`checkout--shop`** on **`page-wrapper`** and **`hide`** on the duplicate **`.checkout-header__brand`** in the main column. **`shop-three-step`:** default **`page-wrapper`** is **`checkout--shop checkout--shop-column-logo`** (include **commented out**; **`checkout--shop-column-logo`** restores full main-column **`padding: 1.25rem`** where **`checkout--shop`** alone uses zero top padding for the top bar). For top bar like single-step: uncomment include, remove **`checkout--shop-column-logo`**, add **`hide`** on the column brand. **`next-core.css`** in each template defines **`.checkout--shop`** / **`.checkout--shop-column-logo`** and **`.checkout-header--lg`** border tweaks.

## Page Frontmatter Fields
```yaml
---
title: "Page Title"
page_layout: base.html               # optional — defaults to base.html; use named layouts (e.g. base-landing.html) when multiple layout stacks coexist in one slug
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
| `data-next-show="cart.hasDiscounts"` | Conditional visibility (0.4.x cart / receipt; prefer over legacy `cart.hasSavings`) |
| `data-next-display="cart.originalPrice"` | **Unsupported** on `cart.*` in current `CartDisplayEnhancer` (unresolved path / no DOM update). For crossed pricing with `cart.total`, use `data-next-display="cart.subtotal"` with `data-next-show="cart.hasDiscounts"`. |
| `data-next-hide="cart.isEmpty"` | Inverse conditional |
| `data-next-cart-summary` + `data-summary-lines` | Cart summary v2 (0.4.x); replaces legacy `data-next-cart-items` |
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

### 0.4.x

| Template | JS Files |
|----------|----------|
| demeter | checkout.js, checkout-demeter.js, upsells.js, promo-banner.js, promo-timer.js |
| limos | checkout.js, checkout-limos.js, upsells.js, promo-banner.js, promo-timer.js |
| olympus | checkout.js, checkout-olympus.js, upsells.js, promo-banner.js, promo-timer.js |
| olympus-mv-single-step | checkout.js, checkout-olympus-mv-full.js, upsells-up01-mv.js, promo-banner.js, promo-timer.js |
| olympus-mv-two-step | checkout.js, checkout-olympus-mv-full.js, checkout-olympus-mv-selection.js, upsells-up01-mv.js, promo-banner.js, promo-timer.js |
| shop-single-step | checkout.js, upsells.js, promo-banner.js, promo-timer.js |
| shop-three-step | checkout.js, checkout-shop-three.js, checkout-shop-three-billing.js, checkout-shop-three-shipping.js, upsells.js, promo-banner.js, promo-timer.js |

The 0.3.x archive is out of scope for this repository.

---

## .gitignore
- Removed blanket `package.json` / `package-lock.json` ignores (needed for both folder package.json files to be tracked)
- Added `_site/` (build output)
- `node_modules/` remains ignored globally
- Experimental scratch folders excluded via `.git/info/exclude` (local-only, not committed)

---

## Docs in this repo
- `CLAUDE.md` (this file) — AI context for working **on** this starter repo (structure, conventions, preview URLs).
- `README.md` — public onboarding: clone workflow, template inventory with live preview links, npm scripts, SDK links.
- `docs/campaign-page-kit-template-context.md` — the **copyable** AI rules file for developers working **in** their own campaign-kit projects (copy into project root or `.cursor/rules/` per tool).
- `docs/pre-checkout-pages.md` — implementation guidance for landing/presell pages (Tailwind build flow, same-slug presell setup, CTA/linking conventions).

## SDK customization rules file (`docs/campaign-page-kit-template-context.md`)
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

README has an "AI development rules" section pointing developers to copy `docs/campaign-page-kit-template-context.md` into their project.
