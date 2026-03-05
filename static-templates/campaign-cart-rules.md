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
