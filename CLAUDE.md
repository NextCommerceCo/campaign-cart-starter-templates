# Repo Memory — campaign-cart-starter-templates

## Repo Overview
Two top-level folders:
- `static-templates/` — raw static HTML templates. **READ-ONLY. Never modify. Unless specifically prompted**
- `campaign-kit-templates/` — campaign-kit enabled versions. **This is the active work area.**

---

## campaign-kit-templates/ Purpose
A **complete, working campaign-kit project** that serves two purposes:
1. Full demo — clone it, `npm install` + `npm run dev`, all 7 templates work
2. Template library — developers copy individual `src/[slug]/` folders into their own kit projects

## Developer Workflow (end users of this repo)
1. `npx campaign-init` in their own project → creates empty `_data/campaigns.json` + npm scripts
2. Copy `campaign-kit-templates/src/[slug]/` → their project's `src/[slug]/`
3. Copy the matching entry from `campaign-kit-templates/_data/campaigns.json` into their project's `campaigns.json`, update slug + store URLs
4. `npm run dev` → interactive campaign picker
5. To clone a variant: `npm run clone` → picks existing campaign → new slug → auto-updates `campaigns.json`

Note: `npx campaign-init` does NOT create any src/ folders — it only creates `_data/campaigns.json` and adds npm scripts to `package.json`.

---

## campaigns.json
- **Project-level, not template-specific** — accumulates all campaigns a developer adds
- `campaign-kit-templates/_data/campaigns.json` is a reference file showing full field structure for all 7 templates
- Fields: `name`, `slug`, `description`, `sdk_version`, `store_name`, `store_url`, `store_terms`, `store_privacy`, `store_contact`, `store_returns`, `store_shipping`, `store_phone`, `store_phone_tel`
- slug drives URL: `campaign-domain.com/[slug]/page`

## npm run build behaviour
- Builds ALL campaigns in `src/` to `_site/`
- `npm run dev` is interactive — lets you pick ONE campaign to preview
- `_site/` is gitignored

---

## campaign-kit-templates/ File Structure
```
campaign-kit-templates/
├── _data/
│   └── campaigns.json          ← reference: all 7 templates with full field structure
├── src/
│   ├── demeter/
│   ├── limos/
│   ├── olympus/
│   ├── olympus-mv-single-step/
│   ├── olympus-mv-two-step/
│   ├── shop-single-step/
│   └── shop-three-step/
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
| Template | JS Files |
|----------|----------|
| demeter | checkout.js, upsells.js |
| limos | checkout.js, checkout-limos.js, upsells.js |
| olympus | checkout.js, upsells.js |
| olympus-mv-single-step | checkout.js, checkout-olympus-mv-full.js, upsells-up01-mv.js |
| olympus-mv-two-step | checkout.js, checkout-olympus-mv-selection.js, upsells-up01-mv.js |
| shop-single-step | upsells.js |
| shop-three-step | checkout-shop-three-billing.js, checkout-shop-three-shipping.js, upsells.js |

## Template → Source File Mapping (static-templates → campaign-kit)
| Campaign slug | Source files in static-templates |
|--------------|----------------------------------|
| demeter | checkout/demeter.html |
| limos | checkout/limos.html |
| olympus | checkout/olympus.html |
| olympus-mv-single-step | checkout/olympus-mv-full.html |
| olympus-mv-two-step | checkout/olympus-mv-selection.html + olympus-mv-billing.html |
| shop-single-step | checkout/shop.html |
| shop-three-step | checkout/shop-three/information.html + shipping.html + billing.html |

Upsell/receipt pages in static-templates: up01, up02, up03, up04, up01-mv, receipt01.

---

## .gitignore
- Removed blanket `package.json` / `package-lock.json` ignores (needed for campaign-kit-templates/package.json to be tracked)
- Added `_site/` (build output)
- `node_modules/` remains ignored globally
