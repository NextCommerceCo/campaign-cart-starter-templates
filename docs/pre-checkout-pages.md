# Pre-checkout landing & presell pages

This guide complements **[Campaign Cart — AI Rules](./campaign-page-kit-template-context.md)** (`docs/campaign-page-kit-template-context.md`). It covers the **landing** section library, **presell** article flow, **Tailwind** production builds, and how pre-checkout pages tie into **`config.js`**, the **SDK loader**, **`next-*` meta tags**, and **layout analytics**. Checkout forms, cart summary, upsells, and `data-next-*` attributes stay in the main rules file.

**If you only copied the AI rules file** into your project as `CLAUDE.md`, use the canonical URL on GitHub (paths below assume both files live in `docs/` next to each other):

`https://github.com/NextCommerceCo/campaign-cart-starter-templates/blob/main/docs/pre-checkout-pages.md`

---

## Stack alignment (live funnels)

Landing and presell pages are **pre-checkout**: they do not render checkout forms, cart UI, or upsell steps. For a **live** funnel they should still tie into the Campaign Cart stack like checkout pages: load **`assets/config.js`** (same `apiKey`, `storeName`, and **`analytics`** providers as the checkout campaign — see [SDK configuration (config.js)](./campaign-page-kit-template-context.md#sdk-configuration-configjs)), load the **Campaign Cart SDK loader** (`dist/loader.js` pinned to `{{ campaign.sdk_version }}` from `campaigns.json`), and set **`next-*` meta tags** (`next-funnel`, `next-page-type`, etc. — see [SDK meta tags (set in base.html via frontmatter)](./campaign-page-kit-template-context.md#sdk-meta-tags-set-in-basehtml-via-frontmatter)). That keeps analytics and session behaviour consistent when the visitor moves from lander → checkout. Use the same **`campaigns.json`** optional fields **`gtm_id`** / **`fb_pixel_id`** if your layout injects GTM / Meta Pixel the way checkout `base.html` does — see [Optional GTM and Meta Pixel (`gtm_id`, `fb_pixel_id`)](./campaign-page-kit-template-context.md#optional-gtm-and-meta-pixel-gtm_id-fb_pixel_id) — and avoid enabling the same provider twice (layout + `config.js`) without a plan.

### Landing pages (`landing/`)

The `landing` slug in the starter repo is a **component showcase**, not a drop-in template. Its `_includes/` folder contains a library of reusable page sections (heroes, benefits, reviews, ingredients, UGC, etc.). Browse the example pages (`supplement-sleep`, `skincare-serum`, `fitness-program`) to find sections that suit your campaign, then copy those `_includes/` files into your own funnel slug and assemble your page there.

The starter `base-landing.html` / `base-presell.html` layouts are intentionally minimal (Tailwind, tokens, CTAs). When you ship for production, **extend the layout** using a checkout campaign’s `base.html` as the reference for script order: `config.js` **before** the loader, then the module script. **Primary CTA (landing showcase):** when the lander lives in a **different** slug than checkout, set `cta_url` in frontmatter to the **root-relative** URL of your checkout page (e.g. `/wintergloves/checkout/`). Do not use `campaign_link` on that value for cross-slug links — `campaign_link` is slug-scoped.

### Tailwind CSS (landing and presell)

Landing and presell templates load Tailwind via CDN — fine for development and prototyping. Before deploying to production, compile a static CSS file:

1. Copy `tailwind.config.js` and `tailwind.input.css` from `campaign-kit-templates/` into your project root (skip if already there)
2. **`tailwindcss` dependency:** If your project **is** this starter’s `campaign-kit-templates/` tree, `tailwindcss` is already listed in `devDependencies` — run `npm install` at the kit root and you are done. If you scaffolded elsewhere or only copied pages into an empty kit, add it: `npm install -D tailwindcss`
3. Build the CSS for your slug:
   ```bash
   npx tailwindcss -c tailwind.config.js -i tailwind.input.css \
     -o src/[slug]/assets/css/tailwind.css \
     --content 'src/[slug]/**/*.html' --minify
   ```
4. In `base-landing.html` / `base-presell.html`, replace the CDN `<script>` block with:
   ```html
   <link rel="stylesheet" href="{{ 'css/tailwind.css' | campaign_asset }}">
   ```
5. Re-run step 3 any time you add new Tailwind utility classes before deploying.

### Presell pages (`presell/`)

Presell templates are **ready-to-use** article-style pages (unlike the landing showcase). **Keep the presell inside the same campaign slug as checkout** — same `campaigns.json` entry, same `src/[slug]/assets/` (including **`config.js`**), and the same layout/analytics story as your `checkout.html`. Copy the starter’s `presell/index.html` into your slug as **`presell.html`** (URL `/[slug]/presell/`) and/or add a **`landing.html`** (or **`index.html`**) entry page in that folder **alongside** `checkout.html`; do not put the live presell on a **separate** campaign slug unless you intentionally duplicate config, API keys, and analytics wiring across two entries.

**CTA to checkout:** The presell lives in the **same** slug as `checkout.html`, so prefer **`campaign_link`** for the CTA `href` — e.g. `href="{{ 'checkout' | campaign_link }}"`, or set `cta_url` to `checkout.html` (or another checkout page filename) and render `href="{{ cta_url | campaign_link }}"`. The starter presell uses a bare `href="{{ cta_url }}"`; switch to **`campaign_link`** when you fold it into a real funnel so URLs follow kit conventions. The footer uses **`campaign.store_terms`** and **`campaign.store_privacy`** from `campaigns.json` — update those fields in your campaign entry.

The starter **`base-presell.html`** layout is intentionally minimal (Tailwind, tokens, article body, CTAs). For **production**, **extend the layout** the same way as for landing: use a checkout campaign’s **`base.html`** for script order — load **`assets/config.js`** before the Campaign Cart **loader** (`dist/loader.js` with `{{ campaign.sdk_version }}`), set **`next-*` meta tags** (`next-funnel`, `next-page-type`, etc.), and align **`analytics`** in `config.js` with your checkout campaign ([SDK configuration (config.js)](./campaign-page-kit-template-context.md#sdk-configuration-configjs)). Optionally inject **GTM / Meta Pixel** from **`gtm_id`** / **`fb_pixel_id`** in `campaigns.json` like checkout `base.html` ([Optional GTM and Meta Pixel](./campaign-page-kit-template-context.md#optional-gtm-and-meta-pixel-gtm_id-fb_pixel_id)), and avoid the same provider twice in layout + `config.js` without a plan.

**Tailwind CSS:** Follow the same **Tailwind CSS** numbered steps as under **Tailwind CSS (landing and presell)** above; use **`base-presell.html`** in step 4 when swapping the CDN block for the compiled `<link>`.

---

## Related

- [Campaign Cart — AI Rules](./campaign-page-kit-template-context.md) — `campaigns.json`, Liquid filters, checkout `data-next-*`, deployment checklists.
