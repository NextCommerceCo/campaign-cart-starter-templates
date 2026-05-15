# Pre-checkout pages — landing and presell

Companion to **[Campaign Cart — AI Rules](./campaign-page-kit-template-context.md)**. Covers the landing section library, presell article flow, Tailwind production builds, and production hardening (SDK wiring, analytics, meta tags).

---

## Landing pages (`landing/`)

The `landing` slug is a **composable section library**, not a drop-in template.

- Its `_includes/` folder contains reusable sections (heroes, benefits, reviews, UGC, etc.)
- `index.html` is the full component showcase showing every section; `src/olympus/landing.html` is a ready-to-customise starting point already wired into a real funnel slug
- Create a new `.html` file in your funnel slug — frontmatter holds all content variables, the body lists sections in order:

```html
---
title: "My Landing Page"
page_type: product

headline: "Say Goodbye to Sleepless Nights"
body_text: "Doctor engineered formula designed for results."
cta_text: "Order Now & Save 60%"
next_url: "checkout.html"

hero_image: "images/landing/hero-1/hero-photo.png"
hero_image_alt: "Product photo"

review_count: "27,517+ 5-Star Reviews"
testimonials_heading: "What Our Customers Are Saying"
---

{% campaign_include 'landing/nav-1.html' %}
{% campaign_include 'landing/hero-1.html' %}
{% campaign_include 'landing/testimonials-1.html' %}
{% campaign_include 'landing/faq-1.html' %}
{% campaign_include 'landing/footer-1.html' %}
```

Sections read variables directly from the page context — no need to pass args to each `campaign_include`.

- Set `next_url` to the target page filename (e.g. `"checkout.html"`) — the `landing/` includes apply `{{ next_url | campaign_link }}` internally, which resolves to the correct slug-prefixed URL
- **Variable naming:** most variable names are unique per section type (`headline` is hero-specific, `benefit_1` is benefits-specific). If you use two sections of the same type on one page they share the same variable — use different section slugs (e.g. `hero-1` and `hero-3`) to get independent sets

---

## Presell pages

The presell is a **ready-to-use** advertorial-style article page, now included directly in the `olympus` template as `presell.html`.

- `src/olympus/presell.html` is the reference implementation — it lives in the same slug as `checkout.html`, sharing `campaigns.json`, `assets/config.js`, and the `assets/` tree
- To add a presell to a different slug, copy `src/olympus/presell.html` into that slug and adjust `next_url` in frontmatter (e.g. `landing.html` or `checkout.html`)
- The CTA uses `campaign_link`: `href="{{ next_url | campaign_link }}"` — no manual URL needed
- The footer reads `campaign.store_terms` and `campaign.store_privacy` from `campaigns.json` — update those fields in your campaign entry

---

## Tailwind CSS

Landing and presell layouts load Tailwind via **CDN** — fine for development and prototyping. For production:

1. Copy `tailwind.input.css` from this repo root into your project root (skip if already there)
2. Install Tailwind v4 if not already a devDependency:
   ```bash
   npm install -D tailwindcss @tailwindcss/cli
   ```
   _(Skip if your project is based on this starter repo — both packages are already in `devDependencies`)_
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
   > **Netlify trap:** the build platform validates referenced files before `npm run build`. Any generated file listed in frontmatter `styles:` will fail validation because it doesn't exist yet at validation time. Hardcoding in the layout bypasses this.
6. Re-run step 4 any time you add new Tailwind utility classes before deploying

> **CSS variable references:** `@theme inline` is required in `tailwind.input.css` if you use CSS custom properties as theme values. Without `inline`, Tailwind resolves values at build time and they come out blank.

---

## Production hardening

The `olympus` layouts (`base-landing.html`, `base-presell.html`) are fully wired for production out of the box — no extra steps needed when you copy the `olympus` slug.

Presell and landing pages **must** load the SDK wiring to participate in session tracking and analytics. All three are active in the `olympus` layouts by default:

- **`config.js`** — must load before the SDK. Contains `apiKey`, `storeName`, and `analytics` providers. Shared with checkout — no duplication needed.
- **SDK meta tags** — required by the SDK loader for session and analytics context. Layouts render page-level `meta_tags` when present, otherwise they fall back to `next-funnel` / `next-page-type`.
- **SDK loader script** — loads the Campaign Cart runtime at the same pinned version as your checkout pages (`campaign.sdk_version` from `campaigns.json`)

**Analytics alignment checklist:**

- [ ] `gtm_id` / `fb_pixel_id` in `campaigns.json` set correctly — `""` disables layout injection, any non-empty value enables it on non-`development` builds. Layout injection loads the snippet/pixel on the page.
- [ ] `analytics.providers` in `config.js` enables the SDK to fire events through an already-loaded provider — these are separate concerns. Layout injection loads the snippet; `config.js` providers send SDK events through it. Both are typically needed together.

See [Optional GTM and Meta Pixel](./campaign-page-kit-template-context.md#optional-gtm-and-meta-pixel-gtm_id-fb_pixel_id) and [SDK configuration (config.js)](./campaign-page-kit-template-context.md#sdk-configuration-configjs) in the main AI rules file.

---

## Section catalog

76 composable partials in `src/landing/_includes/`. When used inside the standalone `landing/` slug: `{% campaign_include 'hero-1.html' %}`. When copied into a campaign slug (like `olympus`), partials live in `_includes/landing/` and are included as `{% campaign_include 'landing/hero-1.html' %}`.

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

`index.html` is the full component showcase with every section. `src/olympus/landing.html` shows a real-funnel example (supplement sleep niche).

---

## Authoring rules

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
