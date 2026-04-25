# Pre-checkout pages — landing and presell

Companion to **[Campaign Cart — AI Rules](./campaign-page-kit-template-context.md)**. Covers the landing section library, presell article flow, Tailwind production builds, and production hardening (SDK wiring, analytics, meta tags).

---

## Landing pages (`landing/`)

The `landing` slug is a **composable section library**, not a drop-in template.

- Its `_includes/` folder contains reusable sections (heroes, benefits, reviews, UGC, etc.)
- Browse the example pages (`supplement-sleep`, `skincare-serum`, `fitness-program`) to see sections rendered; `index.html` is the full smoke test with every section
- Create a new `.html` file in `src/landing/` — frontmatter holds all content variables, the body lists sections in order:

```html
---
title: "My Landing Page"
page_type: product

headline: "Say Goodbye to Sleepless Nights"
body_text: "Doctor engineered formula designed for results."
cta_text: "Order Now & Save 60%"
cta_url: "/wintergloves/checkout/"

hero_image: "images/hero-1/hero-photo.png"
hero_image_alt: "Product photo"

review_count: "27,517+ 5-Star Reviews"
testimonials_heading: "What Our Customers Are Saying"
---

{% campaign_include 'nav-1.html' %}
{% campaign_include 'hero-1.html' %}
{% campaign_include 'testimonials-1.html' %}
{% campaign_include 'faq-1.html' %}
{% campaign_include 'footer-1.html' %}
```

Sections read variables directly from the page context — no need to pass args to each `campaign_include`.

- Set `cta_url` to the **root-relative** checkout URL (e.g. `/wintergloves/checkout/`)
- Do **not** pipe `cta_url` through `campaign_link` — that filter is slug-scoped and will produce the wrong URL for cross-slug links
- **Variable naming:** most variable names are unique per section type (`headline` is hero-specific, `benefit_1` is benefits-specific). If you use two sections of the same type on one page they share the same variable — use different section slugs (e.g. `hero-1` and `hero-3`) to get independent sets

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

1. Copy `tailwind.input.css` from `campaign-kit-templates/` into your project root (skip if already there)
2. Install Tailwind v4 if not already a devDependency:
   ```bash
   npm install -D tailwindcss @tailwindcss/cli
   ```
   _(Skip if your project is based on `campaign-kit-templates/` — both packages are already in `devDependencies`)_
   > **v4 note:** `tailwindcss` (core) and `@tailwindcss/cli` are **separate packages** in v4 — both are required. v4 config lives entirely in CSS (`@import "tailwindcss"` + `@theme inline` + `@source`) — there is no `tailwind.config.js`.
3. Update the `@source` paths in `tailwind.input.css` to point at your slug:
   ```css
   @source "./src/[slug]/**/*.html";
   ```
4. Build the CSS:
   ```bash
   npx @tailwindcss/cli -i tailwind.input.css -o src/[slug]/assets/css/tailwind.css --minify
   ```
5. In `base-landing.html` / `base-presell.html`, replace the CDN `<script>` block with a hardcoded `<link>` tag **directly in the layout file** — do **not** list the generated file in page frontmatter `styles:`:
   ```html
   <link rel="stylesheet" href="{{ 'css/tailwind.css' | campaign_asset }}">
   ```
   > **Netlify trap:** the build platform runs a smoke-check step before `npm run build`. Any generated file listed in frontmatter `styles:` will fail validation because it doesn't exist yet at smoke-check time. Hardcoding in the layout bypasses this.
6. Re-run step 4 any time you add new Tailwind utility classes before deploying

> **CSS variable references:** `@theme inline` is required in `tailwind.input.css` if you use CSS custom properties as theme values. Without `inline`, Tailwind resolves values at build time and they come out blank.

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

## Section catalog

76 composable partials in `src/landing/_includes/`. Include in any order via `{% campaign_include 'hero-1.html' %}`.

| Category | Available sections |
|----------|--------------------|
| Nav | `nav-1`, `nav-2` |
| Hero | `hero-1`, `hero-3`, `hero-4`, `hero-5`, `hero-6` |
| Benefits | `benefits-1` `benefits-2` `benefits-3` `benefits-4` `benefits-5` `benefits-8` |
| Features | `features-2` `features-3` `features-6` `features-7` `features-8` `features-10` `features-11` |
| Before/After | `beforeafter-1`, `beforeafter-2` |
| Problem/Solution | `problemsolution-1` `problemsolution-2` `problemsolution-4` `problemsolution-5` `problemsolution-6` `problemsolution-7` `problemsolution-8` |
| Testimonials | `testimonials-1`, `testimonials-2`, `testimonials-3`, `testimonials-4` |
| Reviews | `reviews-1`, `reviews-2`, `reviews-3`, `reviews-4`, `reviews-5` |
| UGC | `ugc-1`, `ugc-3`, `ugc-5`, `ugc-6` |
| Ingredients | `ingredients-1` `ingredients-2` `ingredients-3` `ingredients-4` `ingredients-5` `ingredients-6` `ingredients-7` |
| How-To | `how-to-1`, `how-to-2`, `how-to-3` |
| Compare | `compare-1`, `compare-4`, `compare-5` |
| Icons | `icons-1`, `icons-2`, `icons-3`, `icons-4`, `icons-5` |
| Results | `results-1`, `results-3`, `results-4`, `results-5`, `results-7` |
| Science | `science-1` |
| Media | `media-1`, `media-2` |
| FAQ | `faq-1`, `faq-2` |
| Guarantee | `guarantee-1`, `guarantee-2` |
| CTA | `cta-1`, `bottomcta-1`, `bottomcta-2` |
| Footer | `footer-1` |

Browse the example pages (`supplement-sleep`, `skincare-serum`, `fitness-program`) to see sections rendered. `index.html` is the full smoke test with every section.

---

## Authoring rules

- **Image paths are namespaced by section** — use `images/hero-1/hero-photo.png`, not `images/hero-photo.png`
- **Variables are shared across sections on one page** — if you use two sections of the same type, they share the same frontmatter variable. Use different section slugs (e.g. `hero-1` and `hero-3`) to get independent variable sets
- **`landing.js` covers all interactive JS** — no section-specific scripts needed; all behavior is driven by `data-*` attributes
- **`presell` is standalone** — the presell page is not composable; it is a self-contained template

---

## Design tokens

Defined in `assets/css/tokens.css`. Override in a campaign-specific CSS file for branding.

| Token | Default |
|-------|---------|
| `--brand-primary` | `#0f75ff` |
| `--brand-secondary` | `#edf2ff` |
| `--brand-accent` | `#22c55e` |
| `--surface-bg` | `#ffffff` |
| `--surface-card` | `#f8faff` |
| `--surface-alt` | `#f1f5ff` |
| `--text-primary` | `#020b1e` |
| `--text-secondary` | `#4a5568` |
| `--text-inverse` | `#ffffff` |

---

## Interactive behaviors (`landing.js`)

One file covers all interactive sections. All config lives in `data-*` attributes — no section-specific JS.

### Accordion
```
[data-accordion]               wrapper; data-allow-multiple="true|false"
[data-accordion-item]          each row; data-open="true|false"
[data-accordion-toggle]        clickable button
[data-accordion-panel]         collapsible content
[data-accordion-icon]          optional chevron (gets rotate-180 class)
```

### Swiper sliders

Root element uses `[data-swiper-root]` with config as data attributes:
```
data-slides          slidesPerView mobile    (default: 1)
data-slides-md       slidesPerView 768px+    (default: data-slides)
data-slides-lg       slidesPerView 1024px+   (default: data-slides-md)
data-gap             spaceBetween mobile px  (default: 16)
data-gap-md          spaceBetween 768px+
data-gap-lg          spaceBetween 1024px+
data-loop            loop mobile             (default: false)
data-loop-md         loop 768px+             (default: data-loop)
data-loop-lg         loop 1024px+            (default: data-loop-md)
data-centered        centeredSlides mobile   (default: false)
data-watch-overflow  hide controls when locked (default: false)
```

Children: `[data-swiper]` (the .swiper el), `[data-swiper-prev]`, `[data-swiper-next]`, `[data-swiper-controls]` (hides when locked), `.swiper-pagination`

### Countdown timer
```
[data-countdown]               wrapper
  data-duration-minutes        timer length (default: 15)
  data-storage-key             localStorage key (default: "landing-countdown")
[data-countdown-hrs]           hours display
[data-countdown-min]           minutes display
[data-countdown-sec]           seconds display
```

---

## Related

- [Campaign Cart — AI Rules](./campaign-page-kit-template-context.md) — `campaigns.json`, Liquid filters, checkout `data-next-*`, deployment checklists
