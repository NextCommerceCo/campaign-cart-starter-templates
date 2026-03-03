# Campaign Cart Starter Templates

This repo contains starter HTML templates for building sales funnel pages — checkout, post-purchase upsells, and order confirmation (receipt) — using the **Campaign Cart SDK** by NextCommerce.

These are standalone HTML files. There is no framework, no build step, and no bundler. Each template is designed to be deployed as a static page.

For SDK documentation see the [official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) and the [SDK source](https://github.com/NextCommerceCo/campaign-cart).

---

## Features

- **Attribute-driven architecture** - Build cart functionality with HTML attributes
- **Cart management** - Add to cart, selectors, quantity controls
- **Profile-based pricing** - Dynamic package mapping for different pricing tiers
- **Post-purchase upsells** - Maximize order value with upsell flows
- **Dynamic content** - Display prices, totals, and product data


## Asset paths (CSS, JS, images)

Templates live at different folder depths (e.g. `templates/checkout/demeter.html` vs `templates/checkout/shop-three/information.html`). Assets (`config.js`, `css/`, `js/`, `images/`) are at the **project root**.

- **Use relative paths** from each template to the project root:
  - One level under `templates/` (e.g. `templates/checkout/demeter.html`) → `../../` (e.g. `../../config.js`, `../../css/...`, `../../images/...`).
  - Two levels under `templates/` (e.g. `templates/checkout/shop-three/information.html`) → `../../../`.
- This works for local preview and any deployment; avoid root-absolute paths (`/css/...`) unless the site is always served from the domain root.
