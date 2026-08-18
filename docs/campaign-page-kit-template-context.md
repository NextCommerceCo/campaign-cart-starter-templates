# Campaign Cart — AI Rules

> Copy this file to your project root as `CLAUDE.md` (or your AI tool's equivalent rules file) to give your AI assistant the context it needs to work correctly with Campaign Cart templates.

---

## AI assistant — do these before writing any code

**If you are reading this file because a user asked you to set up or work on a campaign:**

1. **Copy this file to the project root as `CLAUDE.md`** so it is loaded automatically in future sessions:
   ```bash
   cp docs/campaign-page-kit-template-context.md CLAUDE.md
   ```
   If this file came from a GitHub URL, write it to `CLAUDE.md` in the working directory directly. Alternatively, re-running `campaign-init` with `--ai-context claude` writes this file automatically (pass `--keep-ai-context` to preserve hand edits). For **landing / presell** work, also open [pre-checkout-pages.md](https://github.com/NextCommerceCo/campaign-cart-starter-templates/blob/main/docs/pre-checkout-pages.md) (that guide does not ship inside this single file).

2. **Look up the current `sdk_version`** — do not guess or use a version from your training data. Read `_data/campaigns.json` from the [campaign-cart-starter-templates repo](https://github.com/NextCommerceCo/campaign-cart-starter-templates) and copy the exact `sdk_version` string from there. It changes with every SDK release.

3. **Fetch the commerce surface catalog** before touching any template-family commerce components. It documents the Liquid params for each family's partials (bundle selector, payment methods, bumps, upsells, receipt, etc.) and includes per-family `agentContract` blocks plus fixture specs for mapping CampaignSpec/API truth into starter frontmatter:
   - Human-readable: https://raw.githubusercontent.com/NextCommerceCo/campaign-cart-starter-templates/main/docs/commerce-surface-catalog.md
   - Machine-readable: https://raw.githubusercontent.com/NextCommerceCo/campaign-cart-starter-templates/main/docs/commerce-surface-catalog.json
   - Fixture specs: https://github.com/NextCommerceCo/campaign-cart-starter-templates/tree/main/docs/fixtures/campaign-specs

4. **Include `gtm_id` and `fb_pixel_id` keys on every `campaigns.json` entry** — set them intentionally:
   - **`""` (empty string)** — layout **does not** inject GTM / Meta snippets in these starter templates (`base.html` uses `{% if campaign.gtm_id != "" %}` / `{% if campaign.fb_pixel_id != "" %}`).
   - **Any non-empty value** (including placeholders like `"GTM-XXXXXXX"` or `"123456789012345"`) — in **non-`development`** builds, the **snippets still load** and hit GTM / Facebook with that ID. Placeholders are **not** the same as “off”; they are “on with dummy IDs.” Use real production IDs when you want tracking; use `""` when you want layout-driven tags disabled.
   - **Omitting the keys** — may behave like missing data depending on your CPK/Liquid defaults; **prefer explicit `""`** when disabling so behavior matches these templates.

Do not proceed with code generation until you have completed all four steps above.

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

## Template family and commerce surface routing

When adapting designed HTML into a Campaign Cart funnel, choose the template family from cheap, durable signals:

1. Explicit user instruction.
2. CampaignSpec template fields, when present.
3. Export folder/file names.
4. Unique commerce structure.
5. Distinct checkout layout structure.
6. Class-name fingerprints.

Do **not** infer the whole template family from brand colors, product category, copy tone, or a shared primitive like `payment-methods.html`.

High confidence means `>= 0.85` in the commerce surface JSON catalog. If the family is below that threshold, or if two families plausibly fit, ask the user before wiring SDK components. This is faster and safer than burning tokens on uncertain inference. Example:

> I can map this checkout to `apollo` or `apollo-mv-single-step`. The ambiguity is Apollo layout plus MV variant slot behavior. Which family should I use before wiring SDK components?

Reference catalog: [commerce-surface-catalog.md](https://raw.githubusercontent.com/NextCommerceCo/campaign-cart-starter-templates/main/docs/commerce-surface-catalog.md) and [commerce-surface-catalog.json](https://raw.githubusercontent.com/NextCommerceCo/campaign-cart-starter-templates/main/docs/commerce-surface-catalog.json).

Current first-class families include `apollo`, `apollo-mv-single-step`, `olympus`, `olympus-mv-single-step`, `olympus-mv-two-step`, `demeter`, `shop-single-step`, and `shop-three-step`. **`apollo`** is the flagship single-step family; **`apollo-mv-single-step`** is the flagship MV family.

For each first-class family, read `families[family].agentContract` in the JSON catalog before patching checkout, upsell, or receipt frontmatter. Treat `sharedFrontmatterVocabulary` as the cross-family dictionary:

- `packages.*` values come from CampaignSpec page packages and Campaigns API package `ref_id`s.
- `shipping_methods.*` values come from CampaignSpec/API shipping method `ref_id`s and are checkout/cart behavior only.
- `bundles` and `variant_slots` define selector rows; prefer `quantity` plus `packages.main_package` over hand-written item JSON unless the spec needs custom item sets.
- `order_bump`, `upsell_offer`, and `upsell_bundle_tiers` must be removed or changed when the target campaign does not expose the referenced package/voucher.
- `receipt_summary` preserves SDK order-item template ids; do not rewrite receipt item templates when frontmatter can express the change.

The fixtures in `docs/fixtures/campaign-specs/` are examples, not live Campaigns App exports. Use their `sdk_hints.frontmatter` blocks to understand the mapping, then replace every numeric `ref_id` from the target CampaignSpec/API.

Market-sensitive starter copy is also a contract surface. If the campaign is country-specific or multi-market, or if the CampaignSpec declares additional currencies, non-US shipping countries, or `available_shipping_countries: "all"`, scan visible copy for US-only assumptions such as `USPS`, `ships from the USA`, `US warehouse`, `contiguous US`, `All US orders ship free`, `Made in USA`, `manufactured in the USA`, `State`, and `ZIP Code`. Treat matches as replace-or-confirm campaign copy. Warn and preserve only when the CampaignSpec, source design, or operator confirms the claim; do not remove them automatically.

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

## Pre-checkout pages (landing and presell)

Pre-checkout pages have **no checkout form, cart, or upsell UI**, but a **live** lander or presell should still align with the Campaign Cart stack (`config.js`, SDK loader, `next-*` meta tags, optional layout GTM/Pixel from `campaigns.json`) the same way checkout does — see [SDK configuration (config.js)](#sdk-configuration-configjs), [SDK meta tags](#sdk-meta-tags-set-in-basehtml-via-frontmatter), and [Optional GTM and Meta Pixel](#optional-gtm-and-meta-pixel-gtm_id-fb_pixel_id) below.

- **`landing/`** (starter) — **section showcase**: copy `_includes/` into your slug. **Cross-slug CTAs** use a root-relative checkout URL in `next_url`, not `campaign_link`.
- **`presell/`** — **ready-to-use article** in the **same campaign slug** as `checkout.html`; use **`campaign_link`** for the checkout CTA.
- **Tailwind** — CDN in dev; compile `tailwind.css` for production.

**Full guide:** [docs/pre-checkout-pages.md](./pre-checkout-pages.md) (clone this repo) — canonical copy on GitHub:  
<https://github.com/NextCommerceCo/campaign-cart-starter-templates/blob/main/docs/pre-checkout-pages.md>  
If you only copy this file into your project as `CLAUDE.md`, use the **GitHub** URL so the deep guide stays reachable.

---

## campaigns.json

Registers every campaign. The `campaign` object in Liquid templates comes from here.

```json
{
  "my-campaign": {
    "name": "My Campaign",
    "entry_url": "presell",
    "sdk_version": "0.4.36",
    "store_name": "Acme Store",
    "store_url": "https://acme.com",
    "store_phone": "1-800-555-0100",
    "store_phone_tel": "tel:+18005550100",
    "store_terms": "https://acme.com/terms",
    "store_privacy": "https://acme.com/privacy",
    "store_contact": "https://acme.com/contact",
    "store_returns": "https://acme.com/returns",
    "store_shipping": "https://acme.com/shipping",
    "description": "One-line funnel description — also the default social share description",
    "gtm_id": "",
    "fb_pixel_id": "",
    "og_image": ""
  }
}
```

The top-level key is the campaign slug. Add any additional key to a campaign entry and it becomes available as `{{ campaign.key }}` on every page in that campaign.

**`entry_url`** — optional. The page slug `npm run dev` opens in the browser (e.g. `"presell"`). Omit to use the kit default.

**`sdk_version`** — must be a **pinned semver string** from the starter reference (e.g. `"0.4.36"`), never `"latest"`. A wrong or stale version causes subtle Campaign Cart runtime behaviour with no obvious build error.

**Per-campaign storage scope (SDK 0.4.34+)** — the SDK scopes cart/funnel/voucher storage per campaign automatically. The scope is a hash of the API key plus a **base-path token derived from page depth**: on a page **two or more** path segments deep (`/hu/checkout/`), the token is the first segment (`hu`); on a page **zero or one** segment deep (`/`, `/hu/`, `/checkout/`), the token is empty — the scope hashes the API key alone. The kit's `/<slug>/<page>/` URL shape is consistently two segments deep, so every page of a campaign derives the same scope with no extra config. The layout that breaks the derivation is a funnel that **mixes those depth buckets** — e.g. a landing page at `/hu/` (one segment → empty token) with its checkout at `/hu/checkout` (two segments → token `hu`) — which resolves to two different scopes and silently drops the cart mid-funnel (no build or console error). If you deploy a funnel shaped like that, declare the scope explicitly with `window.nextConfig.storageScope` (in `config.js`, which loads before the SDK) or `<meta name="next-storage-scope" content="...">` — the declared value must be identical on every page of the funnel.

### Build environment (`environment`)

[next-campaign-page-kit](https://github.com/NextCommerceCo/campaign-page-kit) exposes `environment` in Liquid: `development` for `npm run dev`, `production` for `npm run build`. Override with `CPK_ENV` (e.g. `CPK_ENV=staging npm run build`). Use this to keep third-party scripts out of local previews.

### Optional GTM and Meta Pixel (`gtm_id`, `fb_pixel_id`)

These starter templates inject **Google Tag Manager** and **Meta Pixel** from two shared per-template partials — `_includes/analytics-head.html` (head loaders) and `_includes/analytics-body.html` (`<noscript>` fallbacks) — pulled into all three base layouts (`base.html`, `base-presell.html`, `base-landing.html`) via `{% campaign_include %}`, the same DRY pattern as `meta-social.html` (so the layouts never drift; edit the partial once, not every layout). The snippets render when:

- `environment` is not `development`, and  
- `gtm_id` and/or `fb_pixel_id` are **non-empty strings** in `_data/campaigns.json` (checked with `{% if campaign.gtm_id != "" %}` / `{% if campaign.fb_pixel_id != "" %}`).

**Gotchas**

- **`""` disables layout injection** for that tag. **`"GTM-XXXXXXX"`** (or any other non-empty placeholder) **still injects** on staging/production builds — do not assume placeholders mean “no script.”
- **Liquid:** do not replace `!= ""` with a bare `{% if campaign.gtm_id %}` — in Liquid, an **empty string can be truthy**, so you could inject broken or unwanted snippets.

The layout snippet and SDK provider work together: layout injection initialises GTM/Pixel, the SDK provider forwards ecommerce events into it. Enable both — set `gtm_id` / `fb_pixel_id` in `campaigns.json` **and** enable the matching provider in `config.js`.

**Meta Pixel — the layout bootstraps, the SDK tracks.** The GTM + Meta Pixel blocks (in `_includes/analytics-head.html` / `analytics-body.html`) are loaded by every layout that loads `config.js` — `base.html` (checkout/upsell/receipt) and `base-landing.html` / `base-presell.html` (landing/presell). The Meta Pixel block only loads `fbevents.js`, calls `fbq('init', …)`, and keeps the `<noscript>` `PageView` fallback. It does **not** call `fbq('track', 'PageView')` — when `analytics.providers.facebook.enabled` is `true`, the SDK's Facebook adapter sends `PageView` (and `AddToCart`, `Purchase`, etc.) on init via `dl_user_data`. Adding a manual `fbq('track', 'PageView')` to the layout double-fires the PageView, because the adapter does not dedupe it. If a campaign disables the SDK Facebook provider and relies on template-only tracking, add the manual `fbq('track', 'PageView')` back to that layout.

### Direct vendor analytics — Route C (`ga4_id`, `tiktok_pixel_id`, …)

Beyond GTM + Meta Pixel, the same two analytics partials carry **direct, code-controlled ("Route C") integrations** for eight ad/attribution vendors — no GTM container involved. Each block is a per-vendor base pixel bootstrap plus a shared forwarder (`assets/js/next-forwarder-core.js`, loaded once) and one thin adapter per vendor (`assets/js/<vendor>.adapter.js`) that maps the SDK's `dl_*` event stream to that vendor's events.

**Toggle = id presence.** Everything is inert until you set the vendor's id in `campaigns.json`; every gate is the hardened `{% if campaign.<id> and campaign.<id> != "" %}` (absent OR empty = off). Same placeholder warning as GTM: any non-empty value goes live on non-`development` builds.

**These keys are not in your `campaigns.json` by default.** Scaffolded entries stay lean (only `gtm_id`/`fb_pixel_id` are present); enabling a vendor means **adding** its keys from the table below to the campaign's entry — absent = off, so add only the vendors the campaign actually uses.

| Vendor | Set to enable | Optional fields |
|---|---|---|
| RudderStack | `rudderstack_write_key` **and** `rudderstack_dataplane_url` (both required) — loader-only; see note below | — |
| GA4 | `ga4_id` | `ga4_allowed_events`, `ga4_blocked_events` |
| AppLovin Axon | `axon_event_key` | `axon_allowed_events`, `axon_blocked_events` |
| Taboola | `taboola_account_id` — **must be numeric** (it is injected unquoted, matching Taboola's own snippet; a non-numeric value is a JS syntax error that kills the whole block) | `taboola_allowed_events`, `taboola_blocked_events` |
| Triple Whale | `triplewhale_name` | `triplewhale_platform` (`custom-msp` default; `SHOPIFY` for shop-sync stores), `triplewhale_contact_enabled` (PII), `*_allowed/blocked_events` |
| TikTok | `tiktok_pixel_id` | `tiktok_advanced_matching_enabled` (PII), `*_allowed/blocked_events` |
| Northbeam | `northbeam_client_id` | `northbeam_identity_enabled` (PII), `*_allowed/blocked_events` |
| Snapchat | `snap_pixel_id` | `snap_advanced_matching_enabled` (PII), `*_allowed/blocked_events` |
| Pinterest | `pinterest_tag_id` | `pinterest_enhanced_match_enabled` (PII), `*_allowed/blocked_events` |

Rules that matter when configuring a campaign:

- **RudderStack is the odd one out — an SDK-provider vendor, not a Route C adapter.** The partial injects only the official RudderStack JS SDK v3 loader (the Campaign Cart SDK's `rudderstack` provider is a pure event forwarder that stays disabled unless the snippet is on the page). Same two-part pattern as GTM/Meta: set both `campaigns.json` keys **and** `analytics.providers.rudderstack.enabled: true` in `config.js`, or no events flow. The snippet deliberately does not call `rudderanalytics.page()` — the SDK provider sends it (same double-fire rationale as the Meta Pixel note above).
- **One path per vendor.** Route C is instead of (not alongside) tracking the same vendor through a GTM container or an SDK provider — running two paths double-fires conversions.
- **Event toggles**: `<vendor>_allowed_events` / `<vendor>_blocked_events` are comma-separated `dl_*` names (preferred; vendor names are matched too but more coarsely — e.g. blocking TikTok's `Purchase` blocks both the main and upsell purchase). Empty allowed = the default main-funnel set; `"all"` = every mapped event.
- **Identity/PII is opt-in and consent-gated.** The `*_enabled` flags send raw email/phone to the vendor when a prospect cart is created, and only when the `accepts_marketing` checkbox is ticked. Leave them unset unless the campaign has a compliance-reviewed reason.
- **Upsell counting differs per vendor**: GA4/Taboola/Triple Whale get a distinct upsell event (clean purchase count); Axon/TikTok/Northbeam/Snapchat/Pinterest fire upsells as another purchase with a `{orderId}-US{n}` id (revenue accurate, **purchase count inflates** — brief the media buyer).
- **Triple Whale on shop-sync stores** (`triplewhale_platform: "SHOPIFY"`): if Triple Whale is natively connected to the Shopify store it already ingests the synced orders — block the client-side purchases (`triplewhale_blocked_events: "dl_purchase, dl_upsell_purchase"`) or you double-count.
- **Axon attribution on Safari** needs its `_axwrt` cookie re-issued server-side (JS-set cookies expire in ~7 days under ITP) — a static template can't do this alone; see the edge-function pattern in the upstream `analytics-tracking-docs/examples/direct-axon/README.md` (Netlify form shown; any server/edge platform works).
- **Do not edit the generated copies.** The partials and js files in each template carry a `GENERATED` header — the source of truth is `_shared/analytics/` in the starter repo (upstream reference: `analytics-tracking-docs/examples/`).

Debug on a live/staging page: `?nfdebug=true` in the URL, then `window.NextForwarder.getStatus()` in the console.

### Social share meta (`og_image`) and resource hints

Open Graph + Twitter Card tags live in one per-template partial, `_includes/meta-social.html`, included by all three shared layouts (`base.html`, `base-presell.html`, `base-landing.html`) via `{% campaign_include 'meta-social.html' %}` — edit the partial once and every page stays in sync. Unlike the analytics blocks, social tags render in **all** environments (not gated on `environment`).

- **Title** — `og:title` / `twitter:title` use the page `title`.
- **Description** — falls back: page frontmatter `og_description` → `campaign.description`. Omitted if both are empty.
- **Image** — falls back: page frontmatter `og_image` → `campaign.og_image`. **Default `""` omits the image tags** (same empty-string convention as `gtm_id`/`fb_pixel_id`); set a full absolute URL to a ~1200×630 image to enable rich link previews. `twitter:card` is `summary_large_image`.

Per-page override example (frontmatter): `og_description: "Sleep better in 7 nights"` and `og_image: "https://acme.com/share/sleep.jpg"`.

**Resource hints.** The same three layouts carry a uniform hint block: `preconnect` to `cdn.jsdelivr.net` (the SDK loader — and Swiper on landing — load immediately) plus `dns-prefetch` for `campaigns.apps.29next.com` and the country-list worker (the SDK calls these at runtime). These warm the connections the Campaign Cart stack needs on every page type, including landing/presell.

---

## Page frontmatter

Every `.html` page starts with YAML frontmatter:

```yaml
---
title: "Page Title"
page_layout: base.html               # optional — defaults to base.html; set to use a named layout
page_type: checkout          # checkout | upsell | receipt | product
next_url: upsell.html        # checkout pages: where to go after order
next_url: up02.html        # upsell pages: accept destination
decline_url: receipt.html    # upsell pages: decline destination
styles:
  - https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css   # Apollo/MV checkout: often only CDN; UI CSS is in next-core.css
scripts:
  - https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js
  - js/checkout.js
---
```

- `page_layout` is optional — omit to use `base.html`. Set to a named layout file (e.g. `base-landing.html`) when a slug contains pages that need different layout stacks side by side, such as a landing page alongside checkout pages.
- `page_type` is required — it tells the SDK how to behave on this page
- `next_url` is required on checkout pages
- `next_url` / `decline_url` are required on upsell pages
- `styles` / `scripts` are page-specific; `next-core.css` and `config.js` are loaded by `base.html` for every page
- **Apollo / Apollo MV checkout** — promoted checkout component styles (header, bundle cards, promo blocks, checkout reveal, MV selector layout) live in shared `next-core.css` (byte-identical across all eight families). Do not add per-page CSS for those surfaces; typical checkout `styles:` is Swiper CDN only plus any route-specific files (`variant-picker.css`, `exit-intent-popup.css`).

### Apollo and MV checkout knobs

| Frontmatter | Families | Purpose |
|-------------|----------|---------|
| `bundle_card_style` | `apollo` | `product` · `classic` · `tiles` — bundle card visual via `bundle-selector.html` dispatcher |
| `selector_layout` | MV families | Under `checkout_step` or `select_step`: `grid` (default) · `vertical` |
| `selector_order_bump_variant` | `apollo`, `apollo-mv-single-step` | `check03` or `none` — product-card bump below bundle/MV selector |
| `order_bump_variant` | checkout families | Form-section `.order-bumps` slot only — **not** the selector-area bump |
| `checkout_reveal` | `apollo`, `apollo-mv-single-step` | Opt-in progressive disclosure before payment form |
| `order_bump.check03.*` | all (when check03 used) | check03 reads **only** this frontmatter block — never bare include arg names |

Apollo `product` and `classic` bundle cards show an additive coupon badge: `data-next-discounts="voucher"` gated by `data-next-show="cart.hasCoupon()"` rendering `+{discount.percentage}`. The `tiles` style omits that badge — coupon savings appear in struck/current pricing only.

```yaml
---
title: "Page Title"
page_layout: base.html
page_type: checkout
next_url: upsell.html
bundle_card_style: "product"              # apollo only
selector_order_bump_variant: "check03"    # apollo / apollo-mv: bump below selector
order_bump_variant: "check01+switch01"    # later form-section bumps
checkout_reveal: true
checkout_step:
  selector_layout: "grid"                 # MV: grid | vertical
styles:
  - https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css
scripts:
  - js/checkout.js
  - js/checkout-apollo.js                  # or checkout-apollo-mv-full.js
---
```

Placeholder frontmatter example (generic families may still use per-page CSS such as `css/checkout.css`):

```yaml
---
title: "Page Title"
page_layout: base.html
page_type: checkout
next_url: upsell.html
styles:
  - css/checkout.css
scripts:
  - js/checkout.js
---
```

### Build validation and warnings (CPK 0.2.0+)

`campaign-build` succeeds even when a page is misconfigured — it emits **non-fatal warnings** to stderr instead of failing. They never change the exit code (the build only exits non-zero on a render error). Run `campaign-build --json` for a per-page summary that attaches each warning to its source file — useful in CI or when an AI agent is checking its own output. Watch for:

| Code | Meaning |
|------|---------|
| `INVALID_PAGE_TYPE` | `page_type` is not one of `product`, `checkout`, `upsell`, `receipt` |
| `MISSING_FRONTMATTER` | `title` or `page_type` is missing (both required) |
| `LAYOUT_NOT_FOUND` | the `page_layout` name has no file in `src/<slug>/_layouts/` — page rendered with no layout |
| `NESTED_NO_PERMALINK` | a page in a subdirectory has no `permalink`; routing drops the intermediate dirs (uses only slug + filename) |
| `DUPLICATE_OUTPUT` | two source files resolve to the same output file; the last one silently wins |
| `NO_CAMPAIGN` | the page's slug has no `_data/campaigns.json` entry, so it was skipped |

A clean build reports zero warnings — treat any warning as a bug to fix, not noise.

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
<meta name="next-success-url" content="{{ next_url | campaign_link }}">
```

> **In-page anchors are plain hrefs — never `campaign_link`.** For a same-page jump use `href="#features"`, not `{{ '#features' | campaign_link }}`. The filter is anchor-safe (it returns a `#`-prefixed input unchanged), so the wrapped form still *works* — but it's redundant and reads as an inter-page link, which is confusing. When you add an anchor link, confirm the target section carries the matching `id` (`id="features"`): an `href="#x"` with no `id="x"` anywhere on the page silently does nothing — no build error, no runtime error.

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
| `{{ campaign.entry_url }}` | campaigns.json (optional) |
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
| `{{ campaign.og_image }}` | campaigns.json (optional; social share image URL) |
| `{{ environment }}` | kit: `development` / `production` (override with `CPK_ENV`) |
| `{{ title }}` | page frontmatter |
| `{{ page_type }}` | page frontmatter |
| `{{ meta_tags }}` | page frontmatter, usually from CampaignSpec `sdk_hints.meta_tags` |
| `{{ next_url }}` | page frontmatter |
| `{{ decline_url }}` | page frontmatter |
| `{{ content }}` | injected by base.html only |

---

## base.html pattern

`base.html` is the layout shell. It is not a page — it wraps every page's `{{ content }}`.

It always:
- Loads `config.js` before the SDK
- Loads the Campaign Cart SDK from CDN using `{{ campaign.sdk_version }}`
- Loads `next-core.css` directly (not via frontmatter)
- Injects per-page `styles` and `scripts` from frontmatter
- Renders per-page `meta_tags` verbatim when present; otherwise falls back to legacy `page_type`, `next_url`, and `decline_url` frontmatter
- In these starter templates: includes the shared `_includes/analytics-head.html` / `analytics-body.html` partials, which inject GTM / Meta Pixel from `campaign.gtm_id` / `campaign.fb_pixel_id` when not in `development` (see above)
- Includes the shared `_includes/meta-social.html` partial for Open Graph / Twitter Card tags

When CampaignSpec supplies `sdk_hints.meta_tags`, copy that object into page frontmatter as `meta_tags`. These values are runtime-rooted and are not passed through `campaign_link`:

```yaml
meta_tags:
  next-funnel: "Roadside Ready"
  next-page-type: "checkout"
  next-success-url: "/roadside-ready/upsell/"
```

When `meta_tags` is absent, layouts preserve the legacy fallback:

```liquid
{% if next_url %}<meta name="next-success-url" content="{{ next_url | campaign_link }}">{% endif %}
{% if next_url %}<meta name="next-upsell-accept-url" content="{{ next_url | campaign_link }}">{% endif %}
{% if decline_url %}<meta name="next-upsell-decline-url" content="{{ decline_url | campaign_link }}">{% endif %}
```

Do not modify `base.html` to add page-specific logic. Put page-specific content in the page file or a `_includes/` component.

---

## SDK configuration (config.js)

Lives at `assets/config.js`. Sets `window.nextConfig` before the SDK loads. The full structure:

```js
window.nextConfig = {
  // Required
  apiKey: 'your-api-key-here',

  // Optional (SDK 0.4.34+): override the derived per-campaign storage scope.
  // Only needed for funnels that mix path depths (see campaigns.json section);
  // must be identical on every page of the funnel and set before the SDK loads
  // (config.js already is).
  // storageScope: 'my-campaign',

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

## SDK meta tags

| Meta tag | Value | Set by |
|----------|-------|--------|
| `next-funnel` | `meta_tags.next-funnel`, else `{{ campaign.name }}` | `meta_tags` preferred, legacy fallback |
| `next-page-type` | `meta_tags.next-page-type`, else `{{ page_type }}` | `meta_tags` preferred, legacy fallback |
| `next-success-url` | `meta_tags.next-success-url`, else `{{ next_url \| campaign_link }}` | `meta_tags` preferred, legacy fallback |
| `next-upsell-accept-url` | `meta_tags.next-upsell-accept-url`, else `{{ next_url \| campaign_link }}` | `meta_tags` preferred, legacy fallback |
| `next-upsell-decline-url` | `meta_tags.next-upsell-decline-url`, else `{{ decline_url \| campaign_link }}` | `meta_tags` preferred, legacy fallback |

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

### Prospect cart (abandoned cart capture)

`CheckoutFormEnhancer` wires `ProspectCartEnhancer` automatically on the checkout form — there is no separate `data-next-prospect-cart` element. Configure trigger mode with `data-trigger-on` on the **form itself**:

| `data-trigger-on` | Fires when… | fname/lname required | Email required | Phone required |
|---|---|---|---|---|
| `emailEntry` *(default)* | Valid email entered (blur/change) | yes | yes | no |
| `phoneEntry` | Valid phone entered (blur/change) | yes | no | yes |
| `emailAndPhone` | Both valid — fires once both filled | yes | yes | yes |
| `formStart` | Shopper first interacts with the form | yes | yes | no |
| `manual` | Never auto — `window.next.createProspectCart()` only | yes | yes | no |

```html
<!-- default — fires on valid email (no attribute needed) -->
<form data-next-checkout="form">

<!-- phone-first funnel — fires when phone is valid; email optional -->
<form data-next-checkout="form" data-trigger-on="phoneEntry">

<!-- require both before firing -->
<form data-next-checkout="form" data-trigger-on="emailAndPhone">
```

Phone field is discovered via `data-next-checkout-field="phone"` → `input[name="phone"]` → `input[type="tel"]`. Use `data-next-required="true"` (+ native `required`) on the phone input when using `phoneEntry` so the checkout form also blocks submit on empty phone.

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

**SDK 0.4.x:** `data-next-display="cart.discountCode"` is **not** wired in the cart-summary display resolver (Known #10 / BS-014). Use `data-next-discounts="voucher"` + `{discount.description}` to show the code string, `{discount.name}` for the display label. For bundle-line and summary tokens, use the [Campaign Cart SDK docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) and bundle selector reference in the [campaign-cart](https://github.com/NextCommerceCo/campaign-cart) repo as needed.

### Bundle tier display (`data-next-bundle-display`)

Reads from the **active bundle selection**. Use inside `data-next-bundle-card` to show that card’s tier values, or on the `data-next-bundle-selector` container to reflect the selected tier.

```html
<!-- Outside cards — reflects the currently selected tier -->
<span data-next-bundle-display="price"></span>
<span data-next-bundle-display="total"></span>
<span data-next-bundle-display="discountPercentage"></span>
```

`data-next-bundle-display` is separate from `data-next-display` — do not mix them. Allowed keys follow the SDK’s bundle display resolver — confirm against current [Campaign Cart](https://github.com/NextCommerceCo/campaign-cart) bundle/upsell enhancer docs rather than guessing paths.

**⚠️ Do not use `data-next-bundle-display="discountPercentage"` inside bundle cards for the discount badge.** It reflects the **combined** offer + coupon total — when a shopper applies an exit-intent coupon, the headline % jumps (e.g. "SAVE 50%" → "SAVE 55%"), removing the visual distinction between the base offer and the extra coupon saving (see [campaign-cart#22](https://github.com/NextCommerceCo/campaign-cart/issues/22)).

**Correct pattern — separate offer and voucher badges inside each card (SDK 0.4.23+):**

```html
<div data-next-bundle-card data-next-bundle-id="buy2" ...>
  <!-- Offer badge: shows base offer % only, independent of applied coupons -->
  <div data-next-discounts="offer" class="os-card__title-badge pb--bestseller">
    <template><span>SAVE {discount.percentage}</span></template>
  </div>
  <!-- Voucher badge: only appears when a coupon is active, additive -->
  <div data-next-discounts="voucher" class="os-card__title-badge">
    <template><span>+{discount.percentage} extra</span></template>
  </div>
</div>
```

**`{discount.*}` tokens** available inside `data-next-discounts` `<template>` children:

| Token | Value |
|---|---|
| `{discount.percentage}` | Formatted percentage e.g. `"50%"` (SDK 0.4.23+) |
| `{discount.name}` | Display label set in the Campaigns App — renders verbatim, so use customer-facing copy |
| `{discount.description}` | Coupon code string (useful for voucher rows, e.g. `"SP10D"`) |
| `{discount.amount}` | Formatted currency saving e.g. `"−$10.00"` |

These tokens work inside `data-next-bundle-card` (SDK 0.4.23+) and inside bundle slot `<template>` elements (SDK 0.4.24+).

**⚠️ `data-next-show="shipping.isFree"` must not be used inside bundle cards for per-card shipping labels.** It is a cart-level token that only reflects the *currently selected* card’s shipping state — on unselected cards it is always hidden regardless of their configured shipping method. Use static `shipping_label` frontmatter on the specific bundle card instead:

```yaml
bundles:
  - id: "bundle-3x"
    shipping_method: "free"
    shipping_label: "+ Free Shipping"  # rendered unconditionally when set
```

### MV variant-picker (alternative selector)

`apollo-mv-single-step`, `olympus-mv-single-step`, and `olympus-mv-two-step` ship a **variant-picker** reference component — quantity tier cards plus per-unit variant (e.g. colorway) dropdowns with **custom per-variant swatch thumbnails**. Use it when a campaign needs visible swatch images on the selector, or a picker that renders for visual QA without the live API. It is an **additive alternative** to the default `mv-configurable-selector` (which uses SDK-injected native `<select>`s, no swatch images).

- Files per template: `_includes/variant-picker.html`, `assets/js/variant-picker.js`, `assets/js/variant-picker-fixture.js`, `assets/css/variant-picker.css`, and a standalone `variant-picker.html` reference page. To use it on checkout, `{% campaign_include 'variant-picker.html' %}` in place of the default selector and add the css/js to the page frontmatter.
- **One declared variant source.** `variant_picker.variants[]` (`{ value, label, package_id, image }`) is emitted once and feeds BOTH the dropdown swatch `src` AND the JS `value→packageId` / `value→image` maps — no second map to drift. Replace the demo image paths with your CampaignSpec per-variant package images.
- **Image precedence:** live API `getPackageImage(packageId)` > declared template swatch. The swatch is the offline source of truth, not a placeholder.
- **Per-tier shipping** is supported via `variant_picker.tiers[].shipping_method` (resolved through `shipping_methods` into `data-next-shipping-id`), so it is a full drop-in alternative selector, not only a variant-selection demo.
- **Layout hook:** the inline "Label: [dropdown]" row uses `.os-card__variant-group.cc-row` (next-core), which overrides next-core's default `flex-flow: column` so the label does not stack above the control.

### Conditional visibility

```html
<div data-next-show="cart.hasDiscounts">You save: <span data-next-display="cart.totalDiscount"></span></div>
<div data-next-hide="cart.isEmpty"><!-- shown when cart has items --></div>
<div data-next-show="cart.hasCoupon()"><!-- shown when any coupon is applied (SDK 0.4.20+) --></div>
<div data-next-show='cart.hasCoupon("FREESHIP")'><!-- shown when a specific coupon code is applied --></div>
```

`cart.hasCoupon()` (SDK 0.4.20+): truthy when any coupon is applied. `cart.hasCoupon("CODE")` matches a specific code (case-insensitive, quotes stripped). Use to show banners or messaging only when a coupon is active.

**Receipt pages must bind to `order.*`, never `cart.*`.** SDK ≥0.4.17 clears cart and coupon session state before the post-checkout redirect, so on a receipt page `cart.isEmpty` is always true and `cart.hasItems`/`cart.total` are always empty — a cart-gated element hides or blanks a correctly loaded order. Use `data-next-show="order.hasItems"` / `order.hasDiscounts` and `data-next-display="order.subtotal"` / `order.total` instead (the order-item-list enhancer also exposes `order-loading` / `order-has-items` / `order-empty` / `order-error` state classes and `data-empty-template` for finer control).

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
    <!-- {discount.percentage} available SDK 0.4.23+ -->
    <template><div>{discount.name} ({discount.percentage} off): −{discount.amount}</div></template>
  </div>
  <div data-next-discounts="voucher">
    <!-- {discount.percentage} available SDK 0.4.23+ -->
    <template><div>{discount.name} ({discount.percentage} off): −{discount.amount}</div></template>
  </div>
  <span data-next-display="cart.total"></span>
</div>
```

Key token semantics (0.4.11+): `{item.price}` / `{item.originalPrice}` = **line totals** (qty × price); `{item.unitPrice}` / `{item.originalUnitPrice}` = **per-unit**. `{item.hasDiscount}` returns `"show"` or `"hide"` as a CSS class value. Cross-check any additional `{item.*}` / `{line.*}` names against the SDK version you pin in `campaigns.json` — the [official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) track supported summary tokens.

### Line-item properties — personalization (SDK 0.4.26+; attributes renamed in 0.4.27)

Let a customer attach custom text to a product (monogram, name-on-jersey, gift message). The **same product with different text can stay as separate cart/order lines** instead of merging by quantity. Properties flow through the whole order lifecycle automatically (`/calculate`, create-cart, create-order, express checkout); no config needed.

> **SDK 0.4.27 renamed the binding attributes** (breaking): `data-next-property-key` → `data-next-property`, `data-next-default-property-key` → `data-next-default-property`. `data-next-item-properties` and `data-next-property-container` are unchanged. 0.4.27 also sends properties on post-purchase upsells, adds property support to PackageToggle cards, and adds `data-next-exclude-property="<keys>"` (`"team"` / `"team, number"` / `"*"`) to drop specific keys from the API payload without removing the input. Pin `"0.4.27"` (or newer) in `campaigns.json` when using these attribute names.

**The model: shared default + per-slot override** — a global fallback with optional per-line flexibility. **Per engineering, a customized product is expected to use a slot-style picker — that's the intended way to get per-line values.**

- **Default (fallback)** — `data-next-default-property` on any input applies one value to **every** line the active bundle writes or upsell accept sends. Works on **any selector, including a plain non-MV tier-swap** — the simple "one input, propagate everywhere" path (no slot picker needed). On a single non-variant / non-slot upsell, that means the one accepted line gets the value.
- **Per-line customization needs a slot-style picker** — `data-next-bundle-slots-for` + a slot `<template>` with a `data-next-property` input per slot. A plain tier-swap renders **no slots**, so it can only carry the shared default. The slot structure does **not** need a variant product — a standalone product works by listing its packageId N times with `configurable:false`.
  - **Fill every slot explicitly** (the natural slot-picker UX). `[DAD, MOM, DAD]` → 2×DAD + 1×MOM works. Do **not** rely on "set a default, override only some slots, leave the rest empty" for repeats of the same package — the lone override gets dropped (cart keeps the default for all units), because the live sync (`setItemProperties`) is keyed by packageId.

```html
<!-- Default: one input, propagated to every line (gift message on the whole order/bundle). -->
<input data-next-default-property="gift_message" placeholder="Gift message" />

<!-- Override: inside a bundle slot — replaces the default for that line only (per-unit text). -->
<input data-next-property="back_text" placeholder="Back text" />
```

A third path covers single-SKU / select-mode flows with **no bundle selector** — collect fields in a container and point an AddToCart button at it; all keys land on the single line that click adds:

```html
<div id="engraving">
  <input data-next-property="engraving_text" placeholder="Engraving" />
</div>
<button data-next-action="add-to-cart" data-next-package-id="1" data-next-property-container="#engraving">Add</button>
```

Render the captured values back inside the cart-summary line `<template>` — one row per property, no hardcoding:

```html
<div data-next-item-properties>
  <template>
    <div class="cart-item__property"><span>{property.key}</span>: <span>{property.value}</span></div>
  </template>
</div>
```

The container gets `next-summary-empty` when the item has no properties and `next-summary-has-items` otherwise — use those for CSS show/hide. Values capture on `input` and sync to the cart on `blur` (or the relevant add), so totals update live.

**Rules:** opt-in and additive — pages without these attributes behave exactly as before. Property keys become order line-item attribute names — keep them stable and snake_case.

**Possibilities by surface (checkout and upsell mirror each other):**

| Surface type | Per-line distinct text (`data-next-property`) | Same value on all lines (`data-next-default-property`) |
|---|---|---|
| Standard / tier-swap selector, or bundle upsell offer (stepper / tier-pills / tier-cards) | ✗ no slots — not possible | ✓ general `order_personalization` (a single non-slot upsell = the one accepted line) |
| MV / variant slot picker — MV checkout/select **or** MV upsell | ✓ per-slot `slot_personalization` | ✓ general `order_personalization` |
| Standalone product wanting per-line text | ✓ only via an MV-style slot picker (list the packageId ×N) | ✓ general `order_personalization` |

Live examples are wired on the MV templates (`apollo-mv-*` flagship, `olympus-mv-*` classic): per-slot `slot_personalization` on `checkout.html` and the single-step `upsell-mv.html`; general `order_personalization` is present but disabled (keyed distinctly from the per-slot field). Every other family ships the `personalization-field.html` partial (general field) plus the shared offer/selector partials **unwired** — opt in per the rules above. `bump-check03.html` (product-card order bump) ships in all checkout families with a togglable `data-next-property` field, demoed enabled on **`apollo-mv-single-step`** and **`olympus-mv-single-step`**. Same key-collision rule everywhere: a per-slot value overrides the general default on a shared key, so use distinct keys when running both.

**Implementation caveats (0.4.26+):**
- **The per-slot override needs slots to actually render.** A tier-*swap* selector has one active card and no slots, so `data-next-property` is never scanned there — it can only carry the shared default. The override requires the configurable-slot / slot-template selector (the MV pattern).
- **Same-package multi-quantity per-unit slots are variant-gated.** `configurable: true` + qty>1 blocks checkout until each slot's variant is selected, so you can't mark a plain (non-variant) product `configurable` just to get per-unit slots — it bricks the checkout.
- **Configurable + qty 1 with a quantity stepper** → one slot × multiplier, not per-unit.
- **Per-package live-sync (`setItemProperties`) matches packageId only** — unreliable when several lines share a package with different properties.
- **The order-wide default is not auto-applied to order-bump lines** — a bump carries properties only when added/synced via its own AddToCart.
- **Post-purchase upsells carry properties as of SDK 0.4.27.** The upsell accept (`POST /orders/{ref}/upsells/`) now includes a `properties` object per line, matching order creation. On 0.4.26 and earlier it sent only `package_id` + `quantity` and any property on an upsell offer was silently dropped — so personalize on upsells only when pinned to 0.4.27+.
- **MV upsell per-slot fields are wired via `slot_personalization`** — the same frontmatter contract name as the MV checkout selector. `upsell-mv-offer.html` renders the configured `data-next-property` field inside the upsell slot template, so each accepted upsell unit can carry distinct text. It ships enabled on **`apollo-mv-single-step/upsell-mv.html`** and **`olympus-mv-single-step/upsell-mv.html`** (disabled on `olympus-mv-two-step`). **To turn it on for another MV upsell page, just set `slot_personalization.enabled: true` in that page's frontmatter** — the shared `upsell-mv-offer.html` partial renders the field from the same contract, so there's nothing to copy within an MV family. `order_personalization` remains available for the one-value-for-all fallback (rendered as a full-width field above the slot stage), and is the discoverable path for non-slot upsells (which have no slot stage to render per-slot fields); the MV upsell demo keeps it disabled because the reference uses per-slot fields. **If you enable both at once, give them distinct `property_key`s.** The accept merge is `{ ...default, ...slot }`, so a per-slot value overrides the page default on a shared key — the demo keys `order_personalization` `gift_message` to stay clear of the per-slot `upsell_message`.

### Order bump

```html
<!-- data-next-await hides until SDK is ready -->
<div data-next-await="">
  <!-- data-next-bump: the toggle container
       data-next-package-id: package to add/remove when toggled
       data-next-package-sync: main package ID(s) — syncs bump quantity to match.
         0.4.x one-package model: typically a single ID (e.g. "123").
         Legacy multi-package model: comma-separated list per tier (e.g. "123,124,125").
       data-next-product-sync="<product_id>" (SDK 0.4.25+): sync by product_id instead.
         Use for configurable / multi-variant products — one id covers every variant
         (each variant is a distinct package, so package-sync under-counts on variant
         swap). Find it under packages[].product_id in the campaign API response
         (the same value for every variant of a product). -->
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

#### Order-bump pricing args

Starter `bump-check01.html` partials expose three pricing args:
- `show_per_unit_price` defaults to `true` and renders the stable `unitPrice`/ea row.
- `show_line_total_price` defaults to `false` and opts into the line-total `originalPrice + price` row.
- `show_compare_price` defaults to `false`; set it to `true` only when the campaign deliberately wants a struck `originalUnitPrice` visible. The starter demos intentionally do not pass it, so bump previews show a single sale price.

Migration note for existing cloned campaigns: starter bumps now default to a single visible sale price row. Pass `show_compare_price=true` to restore the struck `originalUnitPrice` row for bumps that should visibly compare against a prior price.

Shared checkout templates also include `bump-check03.html`, an unsynced product-card bump for a single add-on offer (opt-in quantity sync via `order_bump.check03.sync_quantity`).

**Two bump slots on Apollo and Apollo MV:** `selector_order_bump_variant` controls the check03 bump immediately below the bundle/MV selector (`"check03"` or `"none"`). `order_bump_variant` controls only the later `.order-bumps` form-section slot — do not use it to mean "all bumps on the page." On other families, select check03 with `order_bump_variant: "check03"` or include the partial directly when a checkout should show more than one bump.

By default check03 omits `data-next-product-sync` / `data-next-package-sync` (one standalone add-on). Apollo demo sets `sync_quantity` on the selector-area check03 so the Travel Case scales with 1x/2x/3x; MV/configurable mains need `data-next-product-sync` instead.

Configure it with `order_bump.check03`:
- `package_id`, `title`, `subtitle`, `image_src`, `image_alt`, `badge_text`, and `savings_text` control the visible card.
- `badge_text` acts as fallback text and also keeps the badge rendered; SDK 0.4.27 fills `discountPercentage` when the package offer is available.
- `savings_text` labels the SDK-owned `discountAmount` money value.
- `exclude_property` maps to `data-next-exclude-property` when the bump should not inherit a checkout-level property.
- `personalization.enabled` toggles the line-item text field; `property_key`, `label`, `placeholder`, `maxlength`, and `optional` configure the field.

CSS required for checkbox state (already in `next-core.css` — only add if using a custom stylesheet):
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

### Deep-linking a bundle tier (`forceBundleId`)

Pass `?forceBundleId=<bundleId>` in the URL to pre-select and immediately apply a specific bundle on page load — useful for ads, emails, or affiliate links that should land on a specific tier.

Three formats:
- `?forceBundleId=buy3` — unscoped, matches any selector on the page
- `?forceBundleId=main:buy3` — scoped to `data-next-selector-id="main"`
- `?forceBundleId=main:buy3,gift:luxury` — multiple selectors at once

Precedence: `forceBundleId` → `data-next-selected="true"` → first card. If the ID doesn't match any card, the selector falls back to standard default-selection rules. Available from SDK 0.4.22+.

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
<div data-next-bundle-card data-next-bundle-id="buy1" data-next-shipping-id="SPEC_STANDARD_SHIPPING_REF" ...>1x — $5 shipping</div>
<div data-next-bundle-card data-next-bundle-id="buy3" data-next-shipping-id="SPEC_FREE_SHIPPING_REF" ...>3x — Free shipping</div>
```

All cards in a selector should have `data-next-shipping-id` if any do — cards without it will not change the active shipping method when selected.

Do not carry starter/demo shipping IDs between campaigns. `campaign-build` renders template frontmatter as-is; it does not validate a CampaignSpec or remap shipping refs. In starter templates that expose selector shipping, use `shipping_methods.standard` / `shipping_methods.free` in checkout frontmatter, replacing the starter refs with target Campaigns App shipping method `ref_id`s. If the target campaign does not have tier-specific shipping, leave those values blank or remove `shipping_method` from the bundle rows.

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

## Cart summary partials

All templates ship three ready-to-use cart summary partials in `_includes/`. Swap by changing the `{% campaign_include %}` reference in `checkout.html`.

| Partial | Style | Notes |
|---------|-------|-------|
| `cart-summary01.html` | Tabular, no accordion | Default for `apollo` and `olympus`. Clean item + totals list. |
| `cart-summary02.html` | Accordion / card | Includes `item.isRecurring` / `item.frequency` row. |
| `cart-summary03.html` | Tabular + feature block | Default for demeter. Cart heading + product image outside `<template>` — no flash on re-render. |

### `[data-next-cart-summary]` pattern

```html
<div data-next-cart-summary>
  <!-- Static chrome (heading, product image) here — not inside <template> -->
  <template>
    <!-- CartSummaryEnhancer tokens: {subtotal}, {shipping}, {total}, {discounts} -->
    <!-- data-summary-lines + inner <template> for cart item rows -->
  </template>
</div>
```

Elements outside `<template>` render immediately and update in-place via `data-next-display`. Elements inside are rebuilt on every cart change — avoid `data-next-show` / `data-next-hide` inside the template where possible; if needed, add `style="display:none"` on the element to prevent flash before SDK evaluation.

**`cart.currency` node:** always leave empty — the SDK fills it. A hardcoded `"USD"` literal flashes before being overwritten.

See the [Campaign Cart SDK documentation](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) for supported display paths, `data-next-format`, and cart-summary behavior (including avoiding flash on currency nodes).

---

## Swiper component (sw1)

`swiper-gallery.html` is a reusable component used across checkout and upsell layouts.

### Contract (do not break)

- JS init targets: `data-component="swiper"` + `data-variant="sw1"` together.
- Do not rename/change `data-variant` unless the same selector is updated everywhere Swiper is initialized.
- Required inner hooks remain: `[swiper="slider-main"]`, `[swiper="slider-thumbs"]`, `[swiper="prev-button"]`, `[swiper="next-button"]`.

### Default behavior

- Main and thumbs are square (`1 / 1`) by default.
- No params needed for legacy square galleries.

### Optional include params (CSS-only; JS unchanged)

- `swiper_aspect`: main stage ratio token (`landscape`, `16/9`, `16-9`, `3/2`, `3-2`, `4/3`, `4-3`)
- `swiper_thumb_aspect`: thumb ratio token (same values; omit to keep square thumbs)
- `swiper_fit`: `contain` (default for non-square) or `cover`

Unknown aspect tokens are normalized and ignored if unsupported (attribute omitted).

```liquid
{% campaign_include 'swiper-gallery.html'
  main_slides=swiper_slides
  thumbs=swiper_thumbs
  variant='sw1'
  swiper_aspect='16-9'
  swiper_fit='cover'
  swiper_thumb_aspect='16-9'
%}
```

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

- **Coupon/voucher-driven** upsell pricing uses **Approach B**: `data-next-bundle-selector` + `data-next-upsell-context`, `data-next-bundle-vouchers`, `data-next-upsell-action-for`. Contrast with simple single-package upsells in the [Upsells](https://developers.nextcommerce.com/docs/campaigns/upsells) documentation (bundle vs selection patterns).
- **References:** `apollo/checkout.html` (flagship tiered selector + Apollo layout); `apollo/upsell-bundle-stepper.html` (same **`.next-bundle-qty*`** stepper on upsell); `upsell-bundle-tier-pills.html` / `upsell-bundle-tier-cards.html` (tiered bundle tiers, same generic qty classes); **`apollo-mv-single-step/upsell-mv.html`** (tier pills + **`data-next-bundle-slots-for`** slot layout; checkout omits native checkout bundle qty). Styles: **`next-core.css`** (not upsell-only).
- **Variant UI in staged bundle slots:** SDK-injected **native `<select>`** works **without** extra JS. **`setupBundleSlotVariantDropdowns()`** (custom **`os-dropdown`** UI) is **opt-in** — see file-header comments in **`checkout-apollo-mv-full.js`** / **`checkout-olympus-mv-full.js`** and **`upsells-mv.js`** on the MV templates.

---

## npm scripts

Run from inside your project directory (where `package.json` is):

```bash
npm run dev              # interactive campaign picker + dev server
npm run build            # build all campaigns to _site/
npm run clone            # duplicate a campaign to a new slug
npm run config           # set API key for a campaign
npm run compress         # compress images in a campaign
npm run compress:preview # preview compression savings without writing files
npm run start            # interactive launcher (dev / compress / clone / config menu)
npm run migrate          # migrate campaigns.json from old array format to current key-based format
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
- [ ] `analytics.providers.gtm.enabled` — set `true` and add `containerId` to match the `gtm_id` in `campaigns.json`; the layout snippet loads GTM, the SDK provider forwards ecommerce events into it
- [ ] `analytics.providers.facebook.enabled` — set `true` and add `pixelId` to match the `fb_pixel_id` in `campaigns.json`; same two-part pattern as GTM
- [ ] Address autocomplete — choose one option: (1) NextCommerce: `addressConfig.enableAutocomplete: true`, leave `googleMaps.apiKey` empty. (2) Google Maps: set `googleMaps.apiKey`; Google Maps takes priority when non-empty. (3) Disabled: remove `enableAutocomplete` from `addressConfig` and leave `googleMaps.apiKey` empty.
- [ ] `storageScope` — leave unset for the kit's standard `/<slug>/<page>/` URL shape; set it (same value on every page of the funnel) only when the deployed funnel mixes path depths (see the campaigns.json section)
- [ ] `discounts` block — uncomment and configure if the campaign uses promo codes, otherwise leave commented out
- [ ] `profiles` block — uncomment and configure if the campaign uses dynamic pricing (e.g. exit intent), otherwise leave commented out

### Setting up a new campaign from a template

- [ ] Entry exists in `_data/campaigns.json` with `slug`, `name`, `sdk_version`, and all `store_*` fields
- [ ] Optional: `gtm_id` / `fb_pixel_id` in campaigns.json — real container and pixel IDs for production; omit keys to disable layout-injected tags
- [ ] Optional: direct vendor analytics (GA4, TikTok, RudderStack, …) — add the vendor's keys to the campaign's entry per [Direct vendor analytics — Route C](#direct-vendor-analytics--route-c-ga4_id-tiktok_pixel_id-); keys are not pre-seeded, absent = off
- [ ] API key is set in `assets/config.js` (run `npm run config` or edit directly)
- [ ] All `data-next-package-id` values updated to real package IDs from the Campaigns App
- [ ] Exactly one selector card per selector group has `data-next-selected="true"`
- [ ] All `data-next-package-sync` values updated to the new main package IDs
- [ ] All pages have correct `page_type` in frontmatter
- [ ] Checkout page has `next_url` pointing to the first upsell (or receipt)
- [ ] Each upsell page has both `next_url` and `decline_url` set
- [ ] The final upsell's accept and decline both point to `receipt.html`
- [ ] All local asset paths use `campaign_asset`, not hardcoded relative paths
- [ ] All inter-page links use `campaign_link`, not hardcoded paths
- [ ] In-page anchor links are plain `href="#id"` (no `campaign_link`), and every `#id` target has a matching element with that `id`

### Adding an order bump

- [ ] Outer wrapper has `data-next-await=""` (hides until SDK ready)
- [ ] Toggle container has `data-next-bump=""` and `data-next-package-id` set to the bump package
- [ ] `data-next-package-sync` on the toggle container lists all main package IDs (if quantity should sync) — or, for a configurable / multi-variant main product, use `data-next-product-sync="<product_id>"` (SDK 0.4.25+) so one id covers every variant
- [ ] For an unsynced product-card bump, use `bump-check03.html` with `order_bump.check03.package_id` set to an offer-backed package
- [ ] On Apollo / Apollo MV: use `selector_order_bump_variant: "check03"` for the selector-area bump; use `order_bump_variant` only for the later form-section bumps
- [ ] Clickable header has `data-next-toggle="toggle"`
- [ ] `os-component="check"` element exists inside the header for the checkmark
- [ ] CSS for `[data-next-bump][class*="next-active"] [os-component="check"]` is present in the stylesheet
- [ ] Bump package ID exists as a real package in the Campaigns App

### Adding a new upsell step

- [ ] New page file created with `page_type: upsell`
- [ ] New page has `next_url` pointing to the next destination
- [ ] New page has `decline_url` — routing is intentional (skip to receipt, or show next upsell)
- [ ] `data-next-upsell="offer"` container has the correct `data-next-package-id`
- [ ] Both `data-next-upsell-action="add"` and `data-next-upsell-action="skip"` buttons are present
- [ ] Previous upsell page's `next_url` updated to point to the new page
- [ ] Previous upsell page's `decline_url` routing updated intentionally
- [ ] Progress bar / step indicator updated on affected pages (this is plain HTML, not SDK-driven)

### External bundle slots + variant dropdown (MV 0.4.x)

- [ ] **`data-next-bundle-slots-for`** and slot markup match the campaign’s bundle structure — see [Upsells](https://developers.nextcommerce.com/docs/campaigns/upsells) and the reference implementation **`apollo-mv-single-step/checkout.html`** in [campaign-cart-starter-templates](https://github.com/NextCommerceCo/campaign-cart-starter-templates)
- [ ] **Barebones path:** if native **`<select>`** styling is enough, do **not** call **`setupBundleSlotVariantDropdowns()`** (no custom dropdown JS required)
- [ ] **Custom dropdown path:** if you call **`setupBundleSlotVariantDropdowns()`** from **`checkout-apollo-mv-full.js`** / **`checkout-olympus-mv-full.js`** / **`upsells-mv.js`**, keep **`initBundleQtyToggle()`** (or equivalent) in sync on upsell when using quantity toggles + Approach B
- [ ] **Per-tier vouchers** on bundle upsell cards exist in Campaigns and match **`data-next-bundle-vouchers`** on each **`data-next-bundle-card`**

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

**Apollo and Apollo MV** use frontmatter-driven partials (`promo-banner.html`, `promo-timer.html`) — not `<promo-banner>` / `<promo-timer>` web components. Configure via `promo_banner`, `promo_timer`, and optional `promo_sale` frontmatter. The timer reuses `checkout.js` `[data-next-element="timer"]` countdown. No `promo-banner.js` / `promo-timer.js` on Apollo checkout.

**Other families (olympus, demeter, olympus-mv)** still ship the web-component path:

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
- [ ] Inspect rendered HTML — verify `<meta name="next-page-type">` and URL meta tags are present with correct values; when `meta_tags` is present, values should match the spec verbatim
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

Or append `?debugger=true` to the page URL.

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
2. **Use `campaign_link` for all inter-page URLs.** Never hardcode `/slug/page/` paths. **In-page anchors are the exception** — use a plain `href="#section"` (the filter passes `#`-anchors through unchanged, so wrapping one is redundant and misleading), and make sure the target element carries the matching `id`.
3. **Only use documented `data-next-*` attributes.** Do not invent attribute names.
4. **Do not write JavaScript that duplicates SDK behaviour.** The SDK handles cart state, field binding, form submission, upsell accept/decline, and dynamic display. Write JS only for UI behaviour the SDK doesn't cover (e.g. Swiper sliders, modals, custom animations).
5. **page_type must match the page's role.** `product` for presell/landing pages, `checkout` for payment collection, `upsell` for post-purchase offers, `receipt` for order confirmation. The SDK behaves differently on each, and `campaign-build` warns (`INVALID_PAGE_TYPE`) on any other value.
6. **Keep each campaign self-contained.** Do not reference assets from another campaign's directory.
7. **`config.js` must load before the SDK.** This is already handled by `base.html` — do not reorder these script tags.
8. **SDK version is set in campaigns.json**, not in `base.html` directly. To upgrade, update `sdk_version` in the campaign's entry.
9. **`next_url`, `next_url`, `decline_url` are filenames** (e.g. `upsell.html`) — `base.html` applies `campaign_link` to them. Do not pre-format these values in frontmatter.
10. **Inside `<template>` elements, use single-brace tokens** (`{item.name}`), not Liquid (`{{ item.name }}`).
