# Campaign Cart Starter Templates

This repo contains starter HTML templates for building sales funnel pages — checkout, post-purchase upsells, and order confirmation (receipt) — using the **Campaign Cart SDK** by NextCommerce.

These are standalone HTML files. There is no framework, no build step, and no bundler. Each template is designed to be deployed as a static page.

---

## Working with an AI tool

When using an AI coding assistant to develop or modify these templates, give it the following context:

### 1. Read the SDK docs first

The templates are built on the **Campaign Cart SDK**. Before making changes, the AI should understand how the SDK works.

- **Official docs (primary reference):** [https://developers.nextcommerce.com/docs/campaigns/campaign-cart/](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)
- **SDK source (ultimate source of truth):** [https://github.com/NextCommerceCo/campaign-cart](https://github.com/NextCommerceCo/campaign-cart)

Use the official docs as the first point of reference. When the docs are unclear or don't cover something, defer to the SDK source code itself.

These cover:
- How to load and configure the SDK
- The `data-next-*` attribute system for wiring up dynamic content
- The `window.next` JavaScript API
- Page types (`checkout`, `upsell`, `receipt`) and how they behave differently
- Events, analytics, upsell flows, and utility features

> **Important:** Use the developer docs and SDK source as the reference for SDK behaviour — not this repo. This repo only documents the templates themselves.

### 2. Understand what this repo contains

| Path | What it is |
|------|-----------|
| `config.js` | Shared SDK configuration — edit this per campaign |
| `css/` | Shared stylesheets (utility classes + page-specific styles) |
| `js/` | Shared and template-specific JavaScript utilities |
| `images/` | Shared image assets |
| `templates/checkout/` | Checkout page templates |
| `templates/upsells/` | Post-purchase upsell templates |
| `templates/receipt/` | Order confirmation templates |

### 3. Key things to know

- **`config.js` loads before the SDK.** It sets `window.nextConfig` with the API key, analytics, payment options, and other campaign-level settings.
- **Asset paths are relative.** Templates reference shared assets (`config.js`, `css/`, `js/`, `images/`) using relative paths back to the project root (e.g. `../../config.js` from one level inside `templates/`).
- **Templates are self-contained HTML files.** JavaScript specific to a single template lives in `js/<template-name>.js` and is included at the bottom of that template's `<body>`.
- **Shared JS utilities** (Swiper galleries, FOMO, exit intent, modal) live in `js/checkout.js` and `js/upsells.js` and are included by all checkout and upsell templates respectively.
- **Templates with `-mv` in the name** are multi-variant — they include color/size dropdowns and additional JavaScript for variant selection logic. The `CONFIG` block at the top of the associated JS file contains placeholder package IDs and variant data that must be updated for each campaign.

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

For anything cart/checkout/upsell related, prefer data attributes over calling the API directly.

---

## Debug utilities (`window.nextDebug`)

Enable debug mode via URL parameter or meta tag:

```html
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
