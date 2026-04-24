# Pre-checkout pages — landing and presell

Companion to **[Campaign Cart — AI Rules](./campaign-page-kit-template-context.md)**. Covers the landing section library, presell article flow, Tailwind production builds, and production hardening (SDK wiring, analytics, meta tags).

---

## Landing pages (`landing/`)

The `landing` slug is a **component showcase**, not a drop-in template.

- Its `_includes/` folder contains reusable sections (heroes, benefits, reviews, UGC, etc.)
- Browse the example pages (`supplement-sleep`, `skincare-serum`, `fitness-program`) to find sections you want
- Copy those `_includes/` files into your funnel slug and assemble your page there
- The landing showcase lives in its own slug — CTAs link to a **different** slug's checkout
- Set `cta_url` in frontmatter to the **root-relative** checkout URL (e.g. `/wintergloves/checkout/`)
- Do **not** pipe `cta_url` through `campaign_link` — that filter is slug-scoped and will produce the wrong URL for cross-slug links

---

## Presell pages (`presell/`)

The `presell` slug is a **ready-to-use** advertorial-style article page.

- Keep the presell inside the **same campaign slug** as `checkout.html` — copy `presell/index.html` into your slug as `presell.html`
- It then shares the same `campaigns.json` entry, `assets/config.js`, and `assets/` tree as your checkout pages (no second copy of config)
- Set `cta_url` in frontmatter to the checkout page filename (e.g. `checkout.html`)
- The CTA uses `campaign_link`: `href="{{ cta_url | campaign_link }}"` — no manual URL needed
- The footer reads `campaign.store_terms` and `campaign.store_privacy` from `campaigns.json` — update those fields in your campaign entry

---

## Tailwind CSS

Landing and presell layouts load Tailwind via **CDN** — fine for development and prototyping. For production:

1. Copy `tailwind.config.js` and `tailwind.input.css` from `campaign-kit-templates/` into your project root (skip if already there)
2. Install tailwindcss if not already a devDependency:
   ```bash
   npm install -D tailwindcss
   ```
   _(Skip if your project is based on `campaign-kit-templates/` — it's already in `devDependencies`)_
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
5. Re-run step 3 any time you add new Tailwind utility classes before deploying

---

## Production hardening

The starter layouts (`base-landing.html`, `base-presell.html`) are intentionally minimal — Tailwind, design tokens, and page content only. For a live funnel, uncomment the SDK wiring block already in both layout files to align with the Campaign Cart stack.

**Typical workflow:** Copy these layouts (and pages) into an **existing** funnel slug that already has **`assets/config.js`** from checkout setup. You reuse that file; uncommenting the block is enough. The standalone `landing` / `presell` reference slugs in this repo omit `config.js` on purpose — they are showcases until folded into a real campaign.

**What to uncomment and why:**

- **`config.js`** — must load before the SDK. Contains `apiKey`, `storeName`, and `analytics` providers. Use the same file as your checkout campaign.
- **`next-funnel` / `next-page-type` meta tags** — required by the SDK loader for session and analytics context
- **SDK loader script** — loads the Campaign Cart runtime at the same pinned version as your checkout pages (`campaign.sdk_version` from `campaigns.json`)

**Analytics alignment checklist:**

- [ ] `analytics.providers` in `config.js` matches what checkout uses — avoid enabling the same provider in both `config.js` and layout GTM/Pixel injection
- [ ] `gtm_id` / `fb_pixel_id` in `campaigns.json` set correctly — `""` disables layout injection, any non-empty value enables it on non-`development` builds
- [ ] If both layout injection and `config.js` analytics are enabled for the same provider, events will fire twice — decide on one loader per provider

See [Optional GTM and Meta Pixel](./campaign-page-kit-template-context.md#optional-gtm-and-meta-pixel-gtm_id-fb_pixel_id) and [SDK configuration (config.js)](./campaign-page-kit-template-context.md#sdk-configuration-configjs) in the main AI rules file.

---

## Related

- [Campaign Cart — AI Rules](./campaign-page-kit-template-context.md) — `campaigns.json`, Liquid filters, checkout `data-next-*`, deployment checklists
