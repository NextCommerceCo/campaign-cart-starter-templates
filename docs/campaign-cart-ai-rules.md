# Campaign Cart — AI Rules

> Copy this file to your project root as `CLAUDE.md` (or your AI tool's equivalent rules file) to give your AI assistant the context it needs to work correctly with Campaign Cart templates.

---

## What this project is

A campaign funnel built with:
- **[next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit)** — the build tool. Handles Liquid templating, per-campaign asset isolation, dev server, and CLI scripts.
- **[Campaign Cart SDK](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)** — the runtime. Loaded via CDN, drives all cart, checkout, upsell, and receipt behaviour through HTML attributes and meta tags.

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
      "sdk_version": "0.3.10",
      "store_name": "Acme Store",
      "store_url": "https://acme.com",
      "store_phone": "1-800-555-0100",
      "store_phone_tel": "tel:+18005550100",
      "store_terms": "https://acme.com/terms",
      "store_privacy": "https://acme.com/privacy",
      "store_contact": "https://acme.com/contact",
      "store_returns": "https://acme.com/returns",
      "store_shipping": "https://acme.com/shipping"
    }
  ]
}
```

Add any additional key to a campaign entry and it becomes available as `{{ campaign.key }}` on every page in that campaign.

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

```liquid
{% campaign_include 'testimonials.html' %}
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
      requireValidation: false,
      requiredFields: ['email', 'fname', 'lname'],
      methodOrder: ['paypal', 'apple_pay', 'google_pay']
    }
  },

  addressConfig: {
    defaultCountry: 'US',
    dontShowStates: ['AS', 'GU', 'PR', 'VI'], // state codes to hide
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

  // Optional: Google Maps address autocomplete
  googleMaps: {
    apiKey: 'your-google-maps-api-key',
    region: 'US',
    enableAutocomplete: true
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

### Order bump

```html
<!-- data-next-await hides until SDK is ready -->
<div data-next-await="">
  <!-- data-next-bump: the toggle container
       data-next-package-id: package to add/remove when toggled
       data-next-package-sync: comma-separated main package IDs — syncs bump quantity to match -->
  <div data-next-bump=""
       data-next-package-id="456"
       data-next-package-sync="123,124,125"
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

### Package selectors (product/checkout pages)

```html
<!-- Swap mode: clicking a card immediately replaces cart contents -->
<div data-next-cart-selector data-next-selection-mode="swap">
  <div data-next-selector-card data-next-package-id="123" data-next-selected="true">
    1 bottle — <span data-next-display="package.price" data-next-package-id="123"></span>
  </div>
  <div data-next-selector-card data-next-package-id="456">
    3 bottles — <span data-next-display="package.price" data-next-package-id="456"></span>
  </div>
</div>
```

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

### Direct upsell offer

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

## Task checklists

Use these when implementing or verifying a specific task. Work through each item — do not skip.

### Configuring config.js for a new campaign

- [ ] `apiKey` set to the campaign's API key from the Campaigns App (`npm run config` or edit directly)
- [ ] `storeName` set — required for Facebook purchase deduplication
- [ ] `addressConfig.defaultCountry` set to the primary target market
- [ ] `paymentConfig.expressCheckout.enabled` — set `true` to show PayPal/Apple Pay/Google Pay buttons, `false` to hide
- [ ] `analytics.providers.gtm.enabled` — set `true` and add `containerId` if using Google Tag Manager
- [ ] `analytics.providers.facebook.enabled` — set `true` and add `pixelId` if using Facebook Pixel
- [ ] `googleMaps.apiKey` — set if address autocomplete is needed, otherwise remove the `googleMaps` block
- [ ] `discounts` block — uncomment and configure if the campaign uses promo codes, otherwise leave commented out
- [ ] `profiles` block — uncomment and configure if the campaign uses dynamic pricing (e.g. exit intent), otherwise leave commented out

### Setting up a new campaign from a template

- [ ] Entry exists in `_data/campaigns.json` with `slug`, `name`, `sdk_version`, and all `store_*` fields
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

### Debugging — SDK not working

- [ ] Run `window.next.version` in browser console — if undefined, the SDK failed to load
- [ ] Check `sdk_version` in `campaigns.json` is a valid version string (e.g. `"0.3.10"`), not `"latest"`
- [ ] Check browser console for 404 on the SDK CDN script or `config.js`
- [ ] Confirm `config.js` loads before the SDK in rendered `<head>` source
- [ ] Confirm `apiKey` in `config.js` is correct for this campaign
- [ ] Inspect rendered HTML — verify `<meta name="next-page-type">` and URL meta tags are present with correct values
- [ ] Check all `data-next-package-id` values match real package IDs in the Campaigns App — wrong IDs produce no output silently
- [ ] For form submission issues: check DevTools → Network for 4xx API responses
- [ ] For display not updating: confirm the element has a valid `data-next-display` token and the SDK is loaded

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
