# Campaign Cart — AI Rules

> Copy this file to your project root as `CLAUDE.md` (or your AI tool's equivalent rules file) to give your AI assistant the context it needs to work correctly with Campaign Cart templates.

---

## What this project is

A campaign funnel built with:
- **[next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit)** — the build tool. Handles Liquid templating, per-campaign asset isolation, dev server, and CLI scripts.
- **[Campaign Cart SDK](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)** — the runtime. Loaded via CDN, drives all cart, checkout, upsell, and receipt behaviour through HTML attributes and meta tags.

---

## SDK 0.4.x campaign model

**One package, one base price — use Campaign Offers for tier pricing.**

- **One `packageId`** with a base price set in the Campaigns App
- **Campaign Offers** define tier discounts (e.g. buy 2 → 30% off, buy 3 → 50% off) — the SDK reads these automatically
- **Bundle selector** (`data-next-bundle-selector` + `data-next-bundle-card`) presents tiers; each card uses `data-next-bundle-items` with the same `packageId` at different quantities
- **Coupons / vouchers** layer on top of offer pricing without any template changes needed

This replaces the 0.3.x pattern of separate packages per tier + `data-next-cart-selector` swap mode. The bundle selector is offer-aware; the old swap selector is not. When you see `data-next-cart-selector` in older templates, treat it as legacy.

---

## Read the SDK docs first

Before making any changes that touch cart, checkout, upsells, or SDK wiring, read:

- **Official docs:** https://developers.nextcommerce.com/docs/campaigns/campaign-cart/
- **SDK source:** https://github.com/NextCommerceCo/campaign-cart

The docs are the source of truth for SDK behaviour. Do not invent `data-next-*` attribute names or values — only use what is documented.

---

## Project structure

```
your-project/
├── _data/
│   └── campaigns.json          # Campaign registry — all campaigns defined here
├── src/
│   └── [campaign-slug]/
│       ├── _layouts/
│       │   └── base.html       # Layout shell — loads SDK, injects assets, renders {{ content }}
│       ├── _includes/          # Reusable components (campaign_include)
│       ├── assets/
│       │   ├── config.js       # SDK configuration (window.nextConfig)
│       │   ├── css/
│       │   ├── js/
│       │   └── images/
│       ├── checkout.html
│       ├── upsell.html         # or up01.html, up02.html etc.
│       └── receipt.html
└── package.json
```

Each campaign is fully isolated. Assets, layouts, and pages from one campaign never bleed into another.

---

## campaigns.json

Registers every campaign. The `campaign` object in Liquid templates comes from here.

```json
{
  "campaigns": [
    {
      "name": "My Campaign",
      "slug": "my-campaign",
      "sdk_version": "0.4.17",
      "store_name": "Acme Store",
      "store_url": "https://acme.com",
      "store_phone": "1-800-555-0100",
      "store_phone_tel": "tel:+18005550100",
      "store_terms": "https://acme.com/terms",
      "store_privacy": "https://acme.com/privacy",
      "store_contact": "https://acme.com/contact",
      "store_returns": "https://acme.com/returns",
      "store_shipping": "https://acme.com/shipping",
      "gtm_id": "GTM-XXXXXXX",
      "fb_pixel_id": "123456789012345"
    }
  ]
}
```

Add any additional key to a campaign entry and it becomes available as `{{ campaign.key }}` on every page in that campaign.

### Build environment (`environment`)

[next-campaign-page-kit](https://github.com/NextCommerceCo/campaign-page-kit) exposes `environment` in Liquid: `development` for `npm run dev`, `production` for `npm run build`. Override with `CPK_ENV` (e.g. `CPK_ENV=staging npm run build`). Use this to keep third-party scripts out of local previews.

### Optional GTM and Meta Pixel (`gtm_id`, `fb_pixel_id`)

These starter templates inject **Google Tag Manager** and **Meta Pixel** from each campaign’s `_layouts/base.html` when:

- `environment` is not `development`, and  
- `gtm_id` and/or `fb_pixel_id` are set on that campaign in `_data/campaigns.json`.

Omit those keys to skip loading entirely. This is **separate** from `analytics.providers.gtm` / `facebook` in `config.js` — the SDK can load GTM/Facebook too. Enabling **both** without a plan often duplicates events (e.g. double `PageView`).

---

## Page frontmatter

Every `.html` page starts with YAML frontmatter:

```yaml
---
title: "Page Title"
page_type: checkout          # checkout | upsell | receipt | product
next_success_url: upsell.html        # checkout pages: where to go after order
next_upsell_accept: up02.html        # upsell pages: accept destination
next_upsell_decline: receipt.html    # upsell pages: decline destination
styles:
  - css/checkout.css
  - https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css
scripts:
  - https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js
  - js/checkout.js
---
```

- `page_type` is required — it tells the SDK how to behave on this page
- `next_success_url` is required on checkout pages
- `next_upsell_accept` / `next_upsell_decline` are required on upsell pages
- `styles` / `scripts` are page-specific; `next-core.css` and `config.js` are loaded by `base.html` for every page

---

## Liquid template filters

Always use these filters — never hardcode asset paths or page URLs.

### `campaign_asset`
Resolves to the campaign-relative path. Use for all local assets.

```liquid
<script src="{{ 'config.js' | campaign_asset }}"></script>
<link href="{{ 'css/checkout.css' | campaign_asset }}" rel="stylesheet">
<img src="{{ 'images/logo.png' | campaign_asset }}" alt="Logo">
```

### `campaign_link`
Generates a clean URL for inter-page navigation. Strips `.html`, adds trailing slash, prepends slug.

```liquid
<a href="{{ 'checkout.html' | campaign_link }}">Go to Checkout</a>
<meta name="next-success-url" content="{{ next_success_url | campaign_link }}">
```

### `campaign_include`
Includes a file from the campaign's `_includes/` directory.

**Do not use standard Liquid `{% include %}` — it looks in `src/` root and will fail with an ENOENT error. Always use `{% campaign_include %}`.**

**Parameter syntax:** Use `=` (equals), not `:` (colon). Params are passed as `key='value'` or `key=variable`.

```liquid
{% campaign_include 'testimonials.html' %}
{% campaign_include 'checkout-header.html' %}
{% campaign_include 'slider.html' images=slider_images %}
```

### Common Liquid variables

| Variable | Source |
|----------|--------|
| `{{ campaign.name }}` | campaigns.json |
| `{{ campaign.sdk_version }}` | campaigns.json |
| `{{ campaign.store_name }}` | campaigns.json |
| `{{ campaign.store_phone }}` | campaigns.json |
| `{{ campaign.store_phone_tel }}` | campaigns.json |
| `{{ campaign.store_terms }}` | campaigns.json |
| `{{ campaign.store_privacy }}` | campaigns.json |
| `{{ campaign.store_contact }}` | campaigns.json |
| `{{ campaign.store_returns }}` | campaigns.json |
| `{{ campaign.store_shipping }}` | campaigns.json |
| `{{ campaign.gtm_id }}` | campaigns.json (optional) |
| `{{ campaign.fb_pixel_id }}` | campaigns.json (optional) |
| `{{ environment }}` | kit: `development` / `production` (override with `CPK_ENV`) |
| `{{ title }}` | page frontmatter |
| `{{ page_type }}` | page frontmatter |
| `{{ next_success_url }}` | page frontmatter |
| `{{ next_upsell_accept }}` | page frontmatter |
| `{{ next_upsell_decline }}` | page frontmatter |
| `{{ content }}` | injected by base.html only |

---

## base.html pattern

`base.html` is the layout shell. It is not a page — it wraps every page's `{{ content }}`.

It always:
- Loads `config.js` before the SDK
- Loads the Campaign Cart SDK from CDN using `{{ campaign.sdk_version }}`
- Loads `next-core.css` directly (not via frontmatter)
- Injects per-page `styles` and `scripts` from frontmatter
- Conditionally renders SDK meta tags only when the relevant frontmatter field is set
- In these starter templates: may inject GTM / Meta Pixel from `campaign.gtm_id` / `campaign.fb_pixel_id` when not in `development` (see above)

```html
{% if next_success_url %}<meta name="next-success-url" content="{{ next_success_url | campaign_link }}">{% endif %}
{% if next_upsell_accept %}<meta name="next-upsell-accept-url" content="{{ next_upsell_accept | campaign_link }}">{% endif %}
{% if next_upsell_decline %}<meta name="next-upsell-decline-url" content="{{ next_upsell_decline | campaign_link }}">{% endif %}
```

Do not modify `base.html` to add page-specific logic. Put page-specific content in the page file or a `_includes/` component.

---

## SDK configuration (config.js)

Lives at `assets/config.js`. Sets `window.nextConfig` before the SDK loads. The full structure:

```js
window.nextConfig = {
  // Required
  apiKey: 'your-api-key-here',

  currencyBehavior: 'auto', // 'auto' | 'manual'

  paymentConfig: {
    expressCheckout: {
      enabled: true,
      requireValidation: true,
      requiredFields: ['email', 'fname', 'lname'],
      methodOrder: ['paypal', 'apple_pay', 'google_pay']
    }
  },

  addressConfig: {
    // defaultCountry: 'US',             // Low-priority fallback when campaign list is empty
    // showCountries: ['US', 'CA', 'GB'], // Deprecated – campaign API provides countries; fallback only
    dontShowStates: ['AS', 'GU', 'PR', 'VI'], // state codes to hide
    // AUTOCOMPLETE PROVIDER:
    //   Option 1 (active): NextCommerce — enableAutocomplete: true, leave googleMaps.apiKey empty
    //   Option 2: Google Maps — fill in googleMaps.apiKey below; takes priority when apiKey is non-empty
    //   Option 3: Disabled — remove enableAutocomplete and leave googleMaps.apiKey empty
    enableAutocomplete: true,
  },

  // Google Maps API key — leave empty to use NextCommerce autocomplete (Option 1 above)
  googleMaps: {
    apiKey: '',
    region: 'US',
  },

  // Required for Facebook purchase deduplication
  storeName: 'your-store-name',

  analytics: {
    enabled: true,
    mode: 'auto', // 'auto' | 'manual' | 'disabled'
    providers: {
      nextCampaign: { enabled: true },
      gtm: { enabled: false, settings: { containerId: 'GTM-XXXXXX' } },
      facebook: { enabled: false, settings: { pixelId: 'YOUR_PIXEL_ID' } },
      rudderstack: { enabled: false, settings: {} },
      custom: { enabled: false, settings: { endpoint: 'https://...', apiKey: '...' } }
    }
  },

  utmTransfer: {
    enabled: true,
    applyToExternalLinks: false,
  },

  // Optional: discount codes
  // discounts: {
  //   SAVE10: { code: 'SAVE10', type: 'percentage', value: 10, scope: 'order' }
  // },

  // Optional: profiles for dynamic package mapping (e.g. exit intent pricing)
  // profiles: {
  //   SAVE_5: { name: 'Exit Save 5', packageMappings: { 1: 9, 2: 10 } }
  // },
};
```

Run `npm run config` to set the API key interactively. The API key comes from the Campaigns App in your store.

---

## SDK meta tags (set in base.html via frontmatter)

| Meta tag | Value | Set by |
|----------|-------|--------|
| `next-funnel` | `{{ campaign.name }}` | base.html always |
| `next-page-type` | `{{ page_type }}` | base.html always |
| `next-success-url` | `{{ next_success_url \| campaign_link }}` | base.html if frontmatter set |
| `next-upsell-accept-url` | `{{ next_upsell_accept \| campaign_link }}` | base.html if frontmatter set |
| `next-upsell-decline-url` | `{{ next_upsell_decline \| campaign_link }}` | base.html if frontmatter set |
| `next-prevent-back-navigation` | `true` | add manually when needed |

---

## SDK data attributes

The SDK is controlled entirely through HTML attributes. Do not write JavaScript to replicate what these attributes already do.

### Checkout form

```html
<form data-next-checkout="form">
  <input data-next-checkout-field="email" type="email">
  <input data-next-checkout-field="firstName" type="text">
  <input data-next-checkout-field="lastName" type="text">
  <input data-next-checkout-field="phone" type="tel">
  <!-- address fields -->
  <input data-next-checkout-field="address1" type="text">
  <input data-next-checkout-field="city" type="text">
  <select data-next-checkout-field="country"></select>
  <select data-next-checkout-field="province"></select>
  <input data-next-checkout-field="zip" type="text">
</form>
```

### Multi-step navigation

```html
<button data-next-checkout-step="{{ 'billing.html' | campaign_link }}">Continue</button>
```

### Dynamic display

```html
<span data-next-display="cart.total"></span>
<span data-next-display="cart.subtotal"></span>
<span data-next-display="cart.quantity"></span>
<span data-next-display="cart.savings"></span>
```

**SDK 0.4.x:** `data-next-display="cart.discountCode"` is **not** wired in the cart-summary display resolver (Known #10 / BS-014). Use `data-next-discounts="voucher"` + `{discount.description}` to show the code string, `{discount.name}` for the display label. Full token table: `docs/bundle-display-cart-cheatsheet.md`.

### Bundle tier display (`data-next-bundle-display`)

Reads from the **active bundle selection**. Use inside `data-next-bundle-card` to show that card's tier values, or on the `data-next-bundle-selector` container to reflect the selected tier.

```html
<!-- On a bundle card — shows this card's tier values -->
<div data-next-bundle-card data-next-bundle-id="buy2" ...>
  Save <span data-next-bundle-display="discountPercentage">XX%</span> OFF
  <span data-next-bundle-display="total"></span>
</div>

<!-- Outside cards — reflects the currently selected tier -->
<span data-next-bundle-display="price"></span>
<span data-next-bundle-display="total"></span>
<span data-next-bundle-display="discountPercentage"></span>
```

`data-next-bundle-display` is separate from `data-next-display` — do not mix them. Full value list: `docs/bundle-display-cart-cheatsheet.md` section 2.

### Conditional visibility

```html
<div data-next-show="cart.hasSavings">You save: <span data-next-display="cart.savings"></span></div>
<div data-next-hide="cart.isEmpty"><!-- shown when cart has items --></div>
```

### Cart item list

```html
<div data-next-cart-items></div>

<template id="cart-item-template">
  <div data-cart-item-id="{item.id}">
    <img src="{item.image}" alt="{item.name}">
    <div>{item.name}</div>
    <div>{item.quantity} x {item.unitPrice}</div>
    <div>{item.total}</div>
  </div>
</template>
```

Note: Inside `<template>` elements, tokens use single braces `{item.field}`, not Liquid `{{ }}`.

### Cart summary v2 (`data-next-cart-summary`)

Live summary panel — updates on tier change, coupon apply, and bump toggle. Use `data-summary-lines` for line rows; tokens use `{item.*}` (SDK 0.4.11+). **Do not use `{line.*}` legacy names — removed in 0.4.11, render silently blank.**

```html
<div data-next-cart-summary>
  <div data-summary-lines>
    <template>
      <div data-package-id="{item.packageId}">
        <span>{item.quantity}x {item.name}</span>
        <span class="{item.hasDiscount}">{item.originalUnitPrice}/ea</span> <!-- strikethrough -->
        <span>{item.unitPrice}/ea</span>
        <span class="{item.hasDiscount}">{item.originalPrice}</span> <!-- line total strikethrough -->
        <span>{item.price}</span> <!-- line total after discount -->
      </div>
    </template>
  </div>
  <div data-next-discounts="offer">
    <template><div>{discount.name}: −{discount.amount}</div></template>
  </div>
  <div data-next-discounts="voucher">
    <template><div>{discount.description}: −{discount.amount}</div></template>
  </div>
  <span data-next-display="cart.total"></span>
</div>
```

Key token semantics (0.4.11+): `{item.price}` / `{item.originalPrice}` = **line totals** (qty × price); `{item.unitPrice}` / `{item.originalUnitPrice}` = **per-unit**. `{item.hasDiscount}` returns `"show"` or `"hide"` as a CSS class value. Full table: `docs/bundle-display-cart-cheatsheet.md` section 4.

### Order bump

```html
<!-- data-next-await hides until SDK is ready -->
<div data-next-await="">
  <!-- data-next-bump: the toggle container
       data-next-package-id: package to add/remove when toggled
       data-next-package-sync: main package ID(s) — syncs bump quantity to match.
         0.4.x one-package model: typically a single ID (e.g. "123").
         Legacy multi-package model: comma-separated list per tier (e.g. "123,124,125"). -->
  <div data-next-bump=""
       data-next-package-id="456"
       data-next-package-sync="123"
       class="next-active">

    <!-- data-next-toggle="toggle": the clickable area that toggles the bump -->
    <div data-next-toggle="toggle" class="bump__header next-active">
      <div class="bump__checkbox">
        <!-- os-component="check" shown/hidden via CSS based on .next-active state on parent -->
        <div os-component="check" class="checkbox__icon">&#10003;</div>
      </div>
      <div class="bump__title">Yes, add the upgrade to my order</div>
    </div>

    <div class="bump__body">
      Only <span data-next-display="package.price" data-next-package-id="456"></span> — added now.
    </div>
  </div>
</div>
```

CSS required for checkbox state (already in `checkout.css` — only add if using a custom stylesheet):
```css
[data-next-bump] [os-component="check"] { display: none; }
[data-next-bump][class*="next-active"] [os-component="check"] { display: flex; }
```

### Express checkout

```html
<div data-next-express-checkout="container"></div>
```

### Coupon

```html
<input data-next-coupon="input" type="text">
<button data-next-coupon="apply">Apply</button>
<div data-next-coupon="message"></div>
```

### Quantity controls

```html
<button data-next-quantity="decrease" data-next-package-id="123">-</button>
<span data-next-display="cart.quantity"></span>
<button data-next-quantity="increase" data-next-package-id="123">+</button>
```

### Bundle selector — primary 0.4.x pattern

One package, multiple quantity tiers. `data-next-bundle-items` is JSON: `packageId` (from Campaigns App) + `quantity`. Campaign Offers drive tier pricing automatically.

```html
<div data-next-bundle-selector data-next-selector-id="main" data-next-selection-mode="swap">
  <div data-next-bundle-card data-next-bundle-id="buy1"
       data-next-bundle-items='[{"packageId":1,"quantity":1}]'
       data-next-selected="true" role="button">
    <span>1x</span>
    <span data-next-bundle-display="total"></span>
  </div>
  <div data-next-bundle-card data-next-bundle-id="buy2"
       data-next-bundle-items='[{"packageId":1,"quantity":2}]'
       role="button">
    <span>2x</span>
    Save <span data-next-bundle-display="discountPercentage"></span>
    <span data-next-bundle-display="total"></span>
  </div>
  <div data-next-bundle-card data-next-bundle-id="buy3"
       data-next-bundle-items='[{"packageId":1,"quantity":3}]'
       role="button">
    <span>3x</span>
    <span data-next-bundle-display="total"></span>
  </div>
</div>
```

### Package swap selector (legacy / 0.3.x pattern)

Still functional but **not offer-aware** — tier pricing must be set per-package in the Campaigns App. Use bundle selector for new campaigns.

```html
<div data-next-cart-selector data-next-selection-mode="swap">
  <div data-next-selector-card data-next-package-id="123" data-next-selected="true">
    1 bottle — <span data-next-display="package.price" data-next-package-id="123"></span>
  </div>
  <div data-next-selector-card data-next-package-id="456">
    3 bottles — <span data-next-display="package.price" data-next-package-id="456"></span>
  </div>
</div>
```

### Per-card shipping (`data-next-shipping-id`)

Sets the shipping method when a card is selected. Works on both `data-next-selector-card` (swap mode) and `data-next-bundle-card` (SDK 0.4.12+). Value is the shipping method `ref_id` from the Campaigns App.

```html
<!-- Bundle cards — functional from SDK 0.4.12 -->
<div data-next-bundle-card data-next-bundle-id="buy1" data-next-shipping-id="2" ...>1x — $5 shipping</div>
<div data-next-bundle-card data-next-bundle-id="buy3" data-next-shipping-id="1" ...>3x — Free shipping</div>
```

All cards in a selector should have `data-next-shipping-id` if any do — cards without it will not change the active shipping method when selected.

### Add to cart button

```html
<button data-next-action="add-to-cart" data-next-package-id="123" data-next-url="{{ 'checkout.html' | campaign_link }}">
  Buy Now
</button>
```

### State CSS classes (managed automatically by SDK)

| Class | Applied to |
|-------|-----------|
| `.next-selected` | selected selector card |
| `.next-in-cart` | item currently in cart |
| `.next-active` | active/enabled button |
| `.next-disabled` | disabled button |
| `.next-loading` | element in loading state |

---

## Upsell pages

Upsell pages use a different set of attributes than checkout pages.

### Accept / decline actions

```html
<button data-next-upsell-action="add">Yes, add this to my order</button>
<button data-next-upsell-action="skip">No thanks</button>
```

### Direct upsell offer (simple / no offer-aware pricing)

For single-package upsells without voucher-driven pricing. If the upsell uses Campaign Offers or per-tier vouchers, use the **Bundle upsell** pattern below instead.

```html
<div data-next-upsell="offer" data-next-package-id="789">
  <span data-next-display="package.name" data-next-package-id="789"></span>
  <span data-next-display="package.price" data-next-package-id="789"></span>
</div>
```

### Upsell quantity controls

```html
<button data-next-upsell-quantity="decrease">-</button>
<span data-next-upsell-quantity="display"></span>
<button data-next-upsell-quantity="increase">+</button>
```

### Display tokens on upsell pages

```html
<span data-next-display="package.name"></span>
<span data-next-display="package.price"></span>
<span data-next-display="package.hasSavings"></span>
<span data-next-display="package.savingsPercentage"></span>
```

### Bundle upsell (SDK 0.4.x) and MV external slots

- **Coupon/voucher-driven** upsell pricing uses **Approach B**: `data-next-bundle-selector` + `data-next-upsell-context`, `data-next-bundle-vouchers`, `data-next-upsell-action-for`. Full comparison table: [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) (Approach A vs B).
- **References:** `olympus/upsell-bundle-stepper.html` (one card + native bundleQuantity), `upsell-bundle-tier-pills.html` / `upsell-bundle-tier-cards.html` (tiered bundle tiers); **`olympus-mv-single-step/upsell-mv.html`** (tier pills + **`data-next-bundle-slots-for`** slot layout).
- **Variant UI in staged bundle slots:** SDK-injected **native `<select>`** works **without** extra JS. **`setupBundleSlotVariantDropdowns()`** (custom **`os-dropdown`** UI) is **opt-in** — see file-header comments in **`checkout-olympus-mv-full.js`** and **`upsells-up01-mv.js`** on the **`olympus-mv-single-step`** template.

---

## npm scripts

Run from inside your project directory (where `package.json` is):

```bash
npm run dev          # interactive campaign picker + dev server
npm run build        # build all campaigns to _site/
npm run clone        # duplicate a campaign to a new slug
npm run config       # set API key for a campaign
npm run compress     # compress images in a campaign
```

---

## Deploying your project

**1. Build**

```bash
npm run build
```

Outputs all campaigns to `_site/`. Before building, make sure `config.js` in each campaign has a real API key — not the placeholder set during development.

**2. Deploy `_site/`**

The build output is plain static HTML, CSS, and JS — no server runtime required. Deploy the `_site/` folder to any static host. Campaigns are served at:

```
https://your-domain.com/[slug]/checkout
https://your-domain.com/[slug]/upsell
https://your-domain.com/[slug]/receipt
```

| Host | How |
|------|-----|
| **Netlify** | Copy `netlify.toml` from [campaign-cart-starter-templates](https://github.com/NextCommerceCo/campaign-cart-starter-templates) into your project root — set `base` to your project folder, `command` to `npm run build`, `publish` to `_site`. Netlify will build and deploy on push. |
| **Vercel** | Set root directory to your project folder, build command to `npm run build`, output directory to `_site`. |
| **Cloudflare Pages** | Connect your repo, set build command to `npm run build`, output directory to `_site`. Deploys automatically on push. |
| **GitHub Pages** | Build locally with `npm run build`, then push the contents of `_site/` to your `gh-pages` branch. |
| **Any other host** | Upload or sync the `_site/` folder — it's plain static files. |

---

## Task checklists

Use these when implementing or verifying a specific task. Work through each item — do not skip.

### Configuring config.js for a new campaign

- [ ] `apiKey` set to the campaign's API key from the Campaigns App (`npm run config` or edit directly)
- [ ] `storeName` set — required for Facebook purchase deduplication
- [ ] `addressConfig.defaultCountry` set to the primary target market
- [ ] `paymentConfig.expressCheckout.enabled` — set `true` to show PayPal/Apple Pay/Google Pay buttons, `false` to hide
- [ ] `analytics.providers.gtm.enabled` — set `true` and add `containerId` if using **SDK-driven** Google Tag Manager (see layout injection note below)
- [ ] `analytics.providers.facebook.enabled` — set `true` and add `pixelId` if using **SDK-driven** Facebook Pixel (see layout injection note below)
- [ ] **Layout vs SDK:** If `base.html` already injects GTM/Meta from `campaigns.json` (`gtm_id` / `fb_pixel_id`), keep these SDK providers **disabled** unless you deliberately want both loaders (risk of duplicate events)
- [ ] Address autocomplete — choose one option: (1) NextCommerce: `addressConfig.enableAutocomplete: true`, leave `googleMaps.apiKey` empty. (2) Google Maps: set `googleMaps.apiKey`; Google Maps takes priority when non-empty. (3) Disabled: remove `enableAutocomplete` from `addressConfig` and leave `googleMaps.apiKey` empty.
- [ ] `discounts` block — uncomment and configure if the campaign uses promo codes, otherwise leave commented out
- [ ] `profiles` block — uncomment and configure if the campaign uses dynamic pricing (e.g. exit intent), otherwise leave commented out

### Setting up a new campaign from a template

- [ ] Entry exists in `_data/campaigns.json` with `slug`, `name`, `sdk_version`, and all `store_*` fields
- [ ] Optional: `gtm_id` / `fb_pixel_id` in campaigns.json — real container and pixel IDs for production; omit keys to disable layout-injected tags
- [ ] API key is set in `assets/config.js` (run `npm run config` or edit directly)
- [ ] All `data-next-package-id` values updated to real package IDs from the Campaigns App
- [ ] Exactly one selector card per selector group has `data-next-selected="true"`
- [ ] All `data-next-package-sync` values updated to the new main package IDs
- [ ] All pages have correct `page_type` in frontmatter
- [ ] Checkout page has `next_success_url` pointing to the first upsell (or receipt)
- [ ] Each upsell page has both `next_upsell_accept` and `next_upsell_decline` set
- [ ] The final upsell's accept and decline both point to `receipt.html`
- [ ] All local asset paths use `campaign_asset`, not hardcoded relative paths
- [ ] All inter-page links use `campaign_link`, not hardcoded paths

### Adding an order bump

- [ ] Outer wrapper has `data-next-await=""` (hides until SDK ready)
- [ ] Toggle container has `data-next-bump=""` and `data-next-package-id` set to the bump package
- [ ] `data-next-package-sync` on the toggle container lists all main package IDs (if quantity should sync)
- [ ] Clickable header has `data-next-toggle="toggle"`
- [ ] `os-component="check"` element exists inside the header for the checkmark
- [ ] CSS for `[data-next-bump][class*="next-active"] [os-component="check"]` is present in the stylesheet
- [ ] Bump package ID exists as a real package in the Campaigns App

### Adding a new upsell step

- [ ] New page file created with `page_type: upsell`
- [ ] New page has `next_upsell_accept` pointing to the next destination
- [ ] New page has `next_upsell_decline` — routing is intentional (skip to receipt, or show next upsell)
- [ ] `data-next-upsell="offer"` container has the correct `data-next-package-id`
- [ ] Both `data-next-upsell-action="add"` and `data-next-upsell-action="skip"` buttons are present
- [ ] Previous upsell page's `next_upsell_accept` updated to point to the new page
- [ ] Previous upsell page's `next_upsell_decline` routing updated intentionally
- [ ] Progress bar / step indicator updated on affected pages (this is plain HTML, not SDK-driven)

### External bundle slots + variant dropdown (MV 0.4.x)

- [ ] **`data-next-bundle-slots-for`** and slot markup match the campaign’s bundle structure — see [`docs/sdk-0.4.0-migration.md`](sdk-0.4.0-migration.md) and **`olympus-mv-single-step/checkout.html`**
- [ ] **Barebones path:** if native **`<select>`** styling is enough, do **not** call **`setupBundleSlotVariantDropdowns()`** (no custom dropdown JS required)
- [ ] **Custom dropdown path:** if you call **`setupBundleSlotVariantDropdowns()`** from **`checkout-olympus-mv-full.js`** / **`upsells-up01-mv.js`**, keep **`initBundleQtyToggle()`** (or equivalent) in sync on upsell when using quantity toggles + Approach B
- [ ] **Per-tier vouchers** on bundle upsell cards exist in Campaigns and match **`data-next-bundle-vouchers`** on each **`data-next-bundle-card`**

### Configuring FOMO popups

- [ ] `initFomo()` is called inside the `next:initialized` event handler in the checkout JS file
- [ ] `items` array — if the default (campaign products) isn't right, supply a custom array with `{ text, image }` entries specific to this campaign's products/bundles
- [ ] `customers` object — if the default name list isn't right, supply region-keyed arrays (e.g. `US: ['Sarah from Dallas']`) matched to the campaign's target market
- [ ] Timing values reviewed: `initialDelay`, `displayDuration`, `delayBetween` — adjust if the defaults don't suit the page length or flow
- [ ] `maxMobileShows` reviewed — default is 5; lower it if mobile experience feels intrusive

### Configuring the exit intent popup

- [ ] Decide on approach: **image-only** (`initExitIntentImage`) or **template** (`initExitIntentTemplate`) — choose one and remove the other
- [ ] The chosen `initExitIntent*` call is inside the `next:initialized` event handler in the checkout JS file
- [ ] **If using image-only:** replace `placehold.co` URL with the real campaign-specific image URL
- [ ] **If using image-only:** confirm the `action` callback is correct — typically `await next.applyCoupon('CODE')`
- [ ] **If using template:** `exit-intent-popup.html` partial exists in `_includes/` and is included in the checkout page via `{% campaign_include 'exit-intent-popup.html' %}`
- [ ] **If using template:** `css/exit-intent-popup.css` is listed in `styles:` in the checkout page frontmatter
- [ ] **If using template:** `popup_image` arg is set to the real campaign image URL — not the placeholder
- [ ] **If using template:** `coupon_code` arg matches the discount code configured in `config.js` `discounts` block (or the store backend)
- [ ] **If using template:** copy/offer text (`headline`, `subheadline`, `offer_title`, `offer_label`, `offer_detail`, `cta_label`) reviewed and updated to match campaign messaging
- [ ] **If using profiles for dynamic pricing:** `profiles` block in `config.js` is uncommented and the profile name matches what the exit intent logic references

### Configuring the promo banner and timer

- [ ] `promo-banner.js` and `promo-timer.js` added to `scripts:` in page frontmatter
- [ ] `promo_sale: "default"` set in frontmatter (or a specific sale name to force a promotion year-round)
- [ ] `<promo-banner>` placed at the top of the page inside `<div data-next-hide="param.banner=='n'" class="section_header">`
- [ ] `<promo-timer>` placed above `<div class="checkout-form">` in the checkout left column
- [ ] Both components wired with `{% if promo_sale %} force-sale="{{ promo_sale }}"{% endif %}`
- [ ] To hide the banner top bar, add `promo_topbar: "false"` to frontmatter and wire with `{% if promo_topbar %} show-topbar="{{ promo_topbar }}"{% endif %}`
- [ ] To edit sale dates or promo codes, update the `sales` array in both `promo-banner.js` and `promo-timer.js` — keep them in sync

Available sale names: `newyear` · `valentinesday` · `stpatricks` · `easter` · `mothersday` · `memorialday` · `fathersday` · `4thofjuly` · `summersale` · `backtoschool` · `halloween` · `veteransday` · `blackfriday` · `cybermonday` · `xmas` · `yearend`

---

### Debugging — SDK not working

- [ ] Run `window.next.version` in browser console — if undefined, the SDK failed to load
- [ ] Check `sdk_version` in `campaigns.json` is a valid version string (e.g. `"0.4.6"`), not `"latest"`
- [ ] Check browser console for 404 on the SDK CDN script or `config.js`
- [ ] Confirm `config.js` loads before the SDK in rendered `<head>` source
- [ ] Confirm `apiKey` in `config.js` is correct for this campaign
- [ ] Inspect rendered HTML — verify `<meta name="next-page-type">` and URL meta tags are present with correct values
- [ ] Check all `data-next-package-id` values match real package IDs in the Campaigns App — wrong IDs produce no output silently
- [ ] For form submission issues: check DevTools → Network for 4xx API responses
- [ ] For display not updating: confirm the element has a valid `data-next-display` token and the SDK is loaded

---

## Custom analytics events

The SDK fires standard ecommerce events automatically (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`). For custom events beyond these, use the programmatic API.

### Firing a custom event

```js
// Available after SDK initializes
window.next.track('custom_event_name', {
  key: 'value'
});
```

### Analytics mode

Set in `config.js`:

```js
analytics: {
  enabled: true,
  mode: 'auto',     // 'auto' — SDK fires all standard events automatically
                    // 'manual' — SDK fires nothing; you call window.next.track() yourself
                    // 'disabled' — no analytics at all
  providers: { ... }
}
```

Use `'manual'` if you need full control over when and what gets tracked (e.g. custom funnel steps, conditional events).

### Checking analytics status (debug)

```js
window.nextDebug.analytics.getStatus()              // shows enabled providers + recent events
window.nextDebug.analytics.track('test_event', {})  // test fire
```

---

## Programmatic SDK API (`window.next`)

Available after the SDK initializes. Use this for custom JS interactions — not to replicate what data attributes already handle.

```js
// Cart
window.next.cart.getState()            // current cart state
window.next.cart.addPackage(id, qty)   // add a package programmatically
window.next.cart.clear()               // empty the cart

// Analytics
window.next.track('event_name', data)  // fire a custom analytics event

// SDK info
window.next.version                    // SDK version string
window.next.ready(callback)            // run callback once SDK is initialized
```

For anything cart/checkout/upsell related, prefer data attributes over calling the API directly — they are more declarative and easier to maintain.

---

## Debug utilities (`window.nextDebug`)

Enable debug mode via URL parameter or meta tag:

```html
<!-- in base.html or the page -->
<meta name="next-debug" content="true">
```
```
?debugger=true
```

Available utilities in browser console:

```js
// Inspect state
window.nextDebug.stores.cart.getState()       // cart store state
window.nextDebug.stores.campaign.getState()   // campaign data
window.nextDebug.stores.order.getState()      // order state
window.nextDebug.stores.checkout.getState()   // checkout form state

// Analytics
window.nextDebug.analytics.getStatus()        // provider status + event log
window.nextDebug.analytics.track('evt', {})   // test fire an event

// Other
window.nextDebug.overlay()                    // show debug overlay panel
window.nextDebug.reinitialize()               // re-run SDK initialization
```

If `window.nextDebug` is undefined, debug mode is not enabled — add the meta tag or URL parameter.

---

## Rules

1. **Use `campaign_asset` for all local asset paths.** Never write hardcoded relative paths like `../../css/checkout.css`.
2. **Use `campaign_link` for all inter-page URLs.** Never hardcode `/slug/page/` paths.
3. **Only use documented `data-next-*` attributes.** Do not invent attribute names.
4. **Do not write JavaScript that duplicates SDK behaviour.** The SDK handles cart state, field binding, form submission, upsell accept/decline, and dynamic display. Write JS only for UI behaviour the SDK doesn't cover (e.g. Swiper sliders, modals, custom animations).
5. **page_type must match the page's role.** `checkout` for payment collection, `upsell` for post-purchase offers, `receipt` for order confirmation. The SDK behaves differently on each.
6. **Keep each campaign self-contained.** Do not reference assets from another campaign's directory.
7. **`config.js` must load before the SDK.** This is already handled by `base.html` — do not reorder these script tags.
8. **SDK version is set in campaigns.json**, not in `base.html` directly. To upgrade, update `sdk_version` in the campaign's entry.
9. **`next_success_url`, `next_upsell_accept`, `next_upsell_decline` are filenames** (e.g. `upsell.html`) — `base.html` applies `campaign_link` to them. Do not pre-format these values in frontmatter.
10. **Inside `<template>` elements, use single-brace tokens** (`{item.name}`), not Liquid (`{{ item.name }}`).
