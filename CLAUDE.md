# Repo Memory — campaign-cart-starter-templates

## Repo Overview
This repo is the **active 0.4.x templates project** at the repository root.
The previous 0.3.x archive is no longer part of this working tree.

---

## Repo Purpose
A **complete, working campaign-kit project** that serves two purposes:
1. Full demo — clone it, `npm install` + `npm run dev`, all current templates work
2. Template library — developers copy individual `src/[slug]/` folders into their own kit projects

Templates follow SDK **0.4.x** patterns (`apollo`, `apollo-mv-single-step`, `olympus`, `olympus-mv-single-step`, `olympus-mv-two-step`, `demeter`, `shop-single-step`, `shop-three-step` today). **`apollo`** is the flagship single-step checkout family; **`apollo-mv-single-step`** is the flagship MV family.

## Developer Workflow (end users of this repo)
As of CPK **0.2.0**, `npx campaign-init` is a full scaffolder. In the developer's own project (which must already have a `package.json` — it warns to run `npm init -y` first), picking a template — via the interactive picker or `--template`/`--slug` flags — it:
1. Adds the kit npm scripts to `package.json`
2. Materializes the chosen template into `src/<slug>/` (renamed to the slug)
3. Seeds `_data/campaigns.json` with a full entry keyed by the slug
4. Writes the API key into `assets/config.js` when `--api-key` is passed
5. Optionally installs the AI-context doc with `--ai-context claude|codex|cursor|copilot` (see the rules-file note below)

It is conflict-safe: re-running for an existing slug errors unless `--overwrite` is passed. It can run fully non-interactively (`--non-interactive` / `--json`) for agents and CI. After scaffolding: `npm run dev` → interactive campaign picker; `npm run clone` → duplicate a campaign to a new slug.

Manual copy (template-library path, when not using the picker/flags): copy `src/[slug]/` into the project and copy the matching `_data/campaigns.json` entry by hand, updating slug + store URLs.

Note: the developer renames the folder to their product/campaign name (e.g. `wintergloves`), NOT the template name (e.g. `apollo`). The folder name becomes the slug and drives the URL: `campaign-domain.com/wintergloves/checkout`.

---

## campaigns.json
- **Project-level, not template-specific** — accumulates all campaigns a developer adds
- `_data/campaigns.json` is a reference file showing full field structure for all current templates
- **Format:** keyed by slug — `{ "my-campaign": { "name": "...", ... } }` (not the old array format `{ "campaigns": [...] }`)
- Fields: `name`, `description`, `entry_url`, `sdk_version`, `store_name`, `store_url`, `store_terms`, `store_privacy`, `store_contact`, `store_returns`, `store_shipping`, `store_phone`, `store_phone_tel`; optional layout analytics: `gtm_id`, `fb_pixel_id`; optional social share: `og_image` (see `docs/campaign-page-kit-template-context.md`)
- `description` doubles as the default Open Graph / Twitter description; `og_image` is the share-card image URL (default `""` → image tags omitted, same empty-string convention as `gtm_id`/`fb_pixel_id`)
- `entry_url` — optional; the page slug `npm run dev` opens (e.g. `"presell"`)
- slug drives URL: `campaign-domain.com/[slug]/page`

## npm scripts
- `npm run dev` — interactive campaign picker + dev server (picks ONE campaign to preview)
- `npm run build` — builds ALL campaigns in `src/` to `_site/`
- `npm run start` — interactive launcher menu (dev / compress / clone / config)
- `npm run clone` — duplicate a campaign to a new slug
- `npm run config` — set API key for a campaign
- `npm run compress` — compress images; `npm run compress:preview` shows savings without writing
- `npm run migrate` — migrate `campaigns.json` from old array format to current key-based format
- `_site/` is gitignored

## Dev server preview URLs (localhost:3000)

### 0.4.x templates

| Template | Pages |
|----------|-------|
| apollo | /apollo/presell/ · /apollo/landing/ · /apollo/checkout/ · /apollo/upsell-bundle-stepper/ · /apollo/upsell-bundle-tier-pills/ · /apollo/upsell-bundle-tier-cards/ · /apollo/receipt/ |
| apollo-mv-single-step | /apollo-mv-single-step/presell/ · /apollo-mv-single-step/landing/ · /apollo-mv-single-step/checkout/ · /apollo-mv-single-step/variant-picker/ · /apollo-mv-single-step/upsell-mv/ · /apollo-mv-single-step/upsell-bundle-stepper/ · /apollo-mv-single-step/upsell-bundle-tier-pills/ · /apollo-mv-single-step/upsell-bundle-tier-cards/ · /apollo-mv-single-step/receipt/ |
| olympus | /olympus/presell/ · /olympus/landing/ · /olympus/checkout/ · /olympus/upsell-bundle-stepper/ · /olympus/upsell-bundle-tier-pills/ · /olympus/upsell-bundle-tier-cards/ · /olympus/receipt/ |
| olympus-mv-single-step | /olympus-mv-single-step/presell/ · /olympus-mv-single-step/landing/ · /olympus-mv-single-step/checkout/ · /olympus-mv-single-step/variant-picker/ · /olympus-mv-single-step/upsell-mv/ · /olympus-mv-single-step/upsell-bundle-stepper/ · /olympus-mv-single-step/upsell-bundle-tier-pills/ · /olympus-mv-single-step/upsell-bundle-tier-cards/ · /olympus-mv-single-step/receipt/ |
| olympus-mv-two-step | /olympus-mv-two-step/presell/ · /olympus-mv-two-step/landing/ · /olympus-mv-two-step/select/ · /olympus-mv-two-step/checkout/ · /olympus-mv-two-step/variant-picker/ · /olympus-mv-two-step/upsell-mv/ · /olympus-mv-two-step/upsell-bundle-stepper/ · /olympus-mv-two-step/upsell-bundle-tier-pills/ · /olympus-mv-two-step/upsell-bundle-tier-cards/ · /olympus-mv-two-step/receipt/ |
| demeter | /demeter/presell/ · /demeter/landing/ · /demeter/checkout/ · /demeter/upsell-bundle-stepper/ · /demeter/upsell-bundle-tier-pills/ · /demeter/upsell-bundle-tier-cards/ · /demeter/receipt/ |
| shop-single-step | /shop-single-step/presell/ · /shop-single-step/landing/ · /shop-single-step/checkout/ · /shop-single-step/upsell-bundle-stepper/ · /shop-single-step/upsell-bundle-tier-pills/ · /shop-single-step/upsell-bundle-tier-cards/ · /shop-single-step/receipt/ |
| shop-three-step | /shop-three-step/presell/ · /shop-three-step/landing/ · /shop-three-step/information/ · /shop-three-step/shipping/ · /shop-three-step/billing/ · /shop-three-step/upsell-bundle-stepper/ · /shop-three-step/upsell-bundle-tier-pills/ · /shop-three-step/upsell-bundle-tier-cards/ · /shop-three-step/receipt/ |
| landing | /landing/index/ |

### Live Netlify previews (0.4.x)

Base URL: `https://nextcommerce-campaign-templates.netlify.app` — append the localhost paths above (always trailing slash).

| Template | Links |
|----------|-------|
| apollo | [presell](https://nextcommerce-campaign-templates.netlify.app/apollo/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/apollo/landing/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/apollo/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/apollo/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/apollo/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/apollo/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/apollo/receipt/) |
| apollo-mv-single-step | [presell](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/landing/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/checkout/) · [variant-picker](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/variant-picker/) · [upsell-mv](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/upsell-mv/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/apollo-mv-single-step/receipt/) |
| olympus | [presell](https://nextcommerce-campaign-templates.netlify.app/olympus/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/olympus/landing/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus/receipt/) |
| olympus-mv-single-step | [presell](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/landing/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/checkout/) · [variant-picker](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/variant-picker/) · [upsell-mv](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-mv/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/receipt/) |
| olympus-mv-two-step | [presell](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/landing/) · [select](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/select/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/checkout/) · [variant-picker](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/variant-picker/) · [upsell-mv](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/upsell-mv/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/receipt/) |
| demeter | [presell](https://nextcommerce-campaign-templates.netlify.app/demeter/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/demeter/landing/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/demeter/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/demeter/receipt/) |
| shop-single-step | [presell](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/landing/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/checkout/?forcePackageId=1:1) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-stepper/?forcePackageId=1:1) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-tier-pills/?forcePackageId=1:1) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-tier-cards/?forcePackageId=1:1) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/receipt/?forcePackageId=1:1) |
| shop-three-step | [presell](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/presell/) · [landing](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/landing/) · [information](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/information/?forcePackageId=1:1) · [shipping](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/shipping/?forcePackageId=1:1) · [billing](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/billing/?forcePackageId=1:1) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-stepper/?forcePackageId=1:1) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-tier-pills/?forcePackageId=1:1) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-tier-cards/?forcePackageId=1:1) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/receipt/?forcePackageId=1:1) |
| landing | [index](https://nextcommerce-campaign-templates.netlify.app/landing/index/) |

## File Structure
```
repo-root/
├── _data/
│   └── campaigns.json          ← reference: all current 0.4.x templates with full field structure
├── src/
│   ├── apollo/
│   ├── apollo-mv-single-step/
│   ├── demeter/
│   ├── olympus/
│   ├── olympus-mv-single-step/
│   ├── olympus-mv-two-step/
│   ├── shop-single-step/
│   ├── shop-three-step/
│   └── landing/               ← composable section library (`apollo/presell.html` + `apollo/landing.html` are the full-funnel examples)
├── templates.json              ← CPK template picker registry. Fetched remotely by next-campaign-page-kit to populate the template picker UI. Must stay in sync with src/ — add/remove/deprecate entries here whenever a template family is added, removed, or retired.
└── package.json                ← kit scripts + next-campaign-page-kit dependency
```

## Adding a new template family
When adding a new `src/<slug>/` family, update these together or the **`lint-sdk` CI gate** fails. (That CI job — `.github/workflows/lint-sdk.yml` — runs three linters as steps: `lint:next-core` → `scripts/lint-next-core-sync.mjs`, `lint:shared` → `scripts/sync-shared.mjs --check`, and `lint:sdk:ci` → `scripts/lint-sdk.mjs`.)
1. `templates.json` — add the picker-registry entry (see File Structure note above).
2. `scripts/lint-next-core-sync.mjs` — add the slug to the `FAMILIES` list. The `lint:next-core` linter asserts every family ships a **byte-identical** `next-core.css`; an unlisted family that ships one fails with `unknown family … not in the canonical FAMILIES list`, and the new file must match the canonical copy at `src/olympus/assets/css/next-core.css` (lint anchor path — not an Olympus-only stylesheet).
3. `scripts/sync-shared.mjs` — add the slug to the `FAMILIES` list, then run `npm run sync:shared` so the new family gets the shared analytics files (`_includes/analytics-head.html` + `analytics-body.html` + `assets/js/next-forwarder-core.js` + the 8 `*.adapter.js`). The `lint:shared` gate asserts every family matches the canonical `_shared/analytics/` source. (`src/landing/` is intentionally excluded — its analytics are commented-out examples.)
4. Preview-URL / inventory tables in this file and `README.md`, if you want it listed.

### `next-core.css` — shared across all eight families

Every template family ships a **byte-identical** copy of `src/olympus/assets/css/next-core.css`. The `lint:next-core` CI gate enforces this. To change core for all families: edit that canonical file (lint anchor at `src/olympus/assets/css/next-core.css`), then copy it to every family's `assets/css/next-core.css` (all eight slugs in `scripts/lint-next-core-sync.mjs`).

**Promoted checkout component styles** — Apollo, Apollo MV, and Olympus MV checkout UI (promo banner/timer, checkout header, product heading, as-seen-in, reviews slider, guarantee, checkout reveal, Apollo bundle cards, MV selector layout) lives in the appended block at the end of `next-core.css`. Do **not** add per-page CSS links for these on Apollo/Apollo MV checkout — only CDN deps like Swiper and route-specific files (`variant-picker.css`, `exit-intent-popup.css`, landing/presell `tokens.css`) stay outside core.

### `_shared/analytics/` — canonical analytics source (generated into every family)

The Route C analytics capability (GTM + Meta Pixel + the direct **GA4 / Axon / Taboola / Triple Whale / TikTok / Northbeam / Snapchat / Pinterest** adapters) is maintained in **one** place — `_shared/analytics/` at the repo root (outside `src/`, so the build never treats it as a slug) — and **generated into every family** by `scripts/sync-shared.mjs`:
- `_shared/analytics/_includes/{analytics-head,analytics-body}.html` → each `src/<family>/_includes/`
- `_shared/analytics/js/{next-forwarder-core,<vendor>.adapter}.js` → each `src/<family>/assets/js/`

Edit the file in `_shared/analytics/`, then `npm run sync:shared` (writes the per-family copies with a `GENERATED …` header) and `npm run lint:shared` (CI drift gate — same discipline as `lint:next-core`). The `js/` files are kept **byte-identical to `analytics-tracking-docs/examples/`** so re-syncing from the upstream reference is a straight copy — enforced by `npm run lint:upstream` (`scripts/lint-upstream-analytics.mjs`; advisory/local-only — it needs the sibling `analytics-tracking-docs` checkout, so it SKIPs when absent, e.g. in CI. Fix upstream first, copy here, then `sync:shared`). `_shared/analytics/README.md` has the vendor→id table.

**Off by default; toggle = id presence.** The capability is inert until a campaign sets the vendor's id in `campaigns.json` (`ga4_id`, `axon_event_key`, `taboola_account_id` — **numeric**, injected unquoted per Taboola's own snippet so a non-numeric value is a JS syntax error, `triplewhale_name` + optional `triplewhale_platform` (default `custom-msp`; `SHOPIFY` for shop-sync stores — then block `dl_purchase, dl_upsell_purchase` via `triplewhale_blocked_events` or TW double-counts against its native Shopify feed), `tiktok_pixel_id`, `northbeam_client_id`, `snap_pixel_id`, `pinterest_tag_id`; plus `gtm_id`/`fb_pixel_id`). The shared `next-forwarder-core.js` loads once when **any** id is set; each adapter loads only when its own id is set. Per-campaign `*_allowed_events`/`*_blocked_events` tune which `dl_*` events forward; PII/identity (`*_enabled` flags) is off unless set and then consent-gated on `accepts_marketing`. Authoring intent is *intended* to live upstream in the campaigns-os `AnalyticsContract` and compile to these `campaigns.json` ids — **that compiler is not built yet** (audit 2026-07-08: the contract is validation-only and doesn't model these vendors as first-class providers; design + rationale in `analytics-tracking-docs/campaigns-os-analytics-contract-mapping.md`). The template only ever reads the id (one source of truth, no second runtime flag). Adapter mapping is regression-tested by `analytics-tracking-docs/examples/_harness/`.

**Gate idiom — guard against absent AND empty.** Analytics blocks are gated `{% if campaign.<id> and campaign.<id> != "" %}` (not bare `!= ""`): LiquidJS treats a **missing** field as `undefined`, and `undefined != ""` is **truthy**, so a family/clone without the field would otherwise render a broken empty-id pixel. The existence guard makes absent OR empty = off. The multi-vendor loader uses a `{%- capture -%}` of all ids + a single `!= ""` check because LiquidJS has no parentheses and evaluates `and`/`or` right-to-left (a chained `or` of guarded terms is unreliable).

### Apollo template family (`apollo`, `apollo-mv-single-step`) — flagship

**`apollo`** — **recommended default** single-step checkout: Apollo direct-response layout (trust-bar header, product heading, promo banner/timer partials, as-seen-in, reviews slider, guarantee, optional checkout reveal) plus an include-driven tiered bundle selector with interchangeable card styles.

**`apollo-mv-single-step`** — **recommended default** for variant products: MV commerce surfaces (configurable selector, variant slots, MV upsell, variant-picker reference) with the Apollo checkout shell and `checkout-apollo-mv-full.js` runtime.

**`olympus`** / **`olympus-mv-*`** — still supported; classic os-card tier layout and native MV dropdown selector respectively. Use when a design explicitly matches that older shape.

Key frontmatter knobs:

| Knob | Families | Values / notes |
|------|----------|----------------|
| `bundle_card_style` | `apollo` | `product` (default) · `classic` · `tiles` — dispatches via `bundle-selector.html` → `bundle-card.html` |
| `selector_layout` | MV families | Under `checkout_step` or `select_step`: `grid` (default) · `vertical` — adds `mv-cards--vertical` |
| `selector_order_bump_variant` | `apollo`, `apollo-mv-single-step` | `check03` or `none` — product-card bump below selector; config in `order_bump.check03.*` only |
| `order_bump_variant` | all checkout families | Form-section `.order-bumps` slot only — not the selector-area bump |
| `checkout_reveal` | `apollo`, `apollo-mv-single-step` | `true` hides payment form until Add to Cart; panel is off-screen (not `display:none`) for Spreedly |
| Coupon badge on bundle cards | `apollo` `product`/`classic` | `data-next-discounts="voucher"` + `cart.hasCoupon()` shows `+{discount.percentage}`; `tiles` omits badge (pricing only) |

Apollo checkout `styles:` is typically Swiper CDN only. `checkout-apollo.js` handles reveal + reviews slider; `checkout-apollo-mv-full.js` adds MV slot dropdown behavior + bump personalization guard + reveal.

## Each src/[slug]/ Structure
```
[slug]/
├── _layouts/
│   └── base.html               ← layout shell with Liquid variables
├── _includes/                  ← shared head/meta partials pulled into all 3 base layouts:
│   ├── meta-social.html        ←   OG / Twitter Card tags
│   ├── analytics-head.html     ←   GTM + Meta Pixel loaders (head)
│   └── analytics-body.html     ←   GTM + Meta Pixel <noscript> fallbacks (top of body)
├── assets/
│   ├── css/
│   │   └── next-core.css       ← core styles (loaded directly in base.html)
│   ├── js/
│   │   └── [only needed JS]    ← trimmed per template (see JS map below)
│   ├── images/
│   └── config.js               ← SDK config with placeholder apiKey
└── [page].html                 ← pages with YAML frontmatter
```

---

## base.html Pattern
- `next-core.css` loaded **directly in base.html** — always needed, not in page frontmatter
- Per-page CSS/JS injected via frontmatter `styles:` / `scripts:` loops using `campaign_asset`
- Optional **GTM / Meta Pixel** in reference templates: injected from `campaign.gtm_id` / `campaign.fb_pixel_id` when Liquid `environment != "development"` **and** the value is **non-empty** (`{% if campaign.gtm_id != "" %}` / `{% if campaign.fb_pixel_id != "" %}`). Use **`""`** in `campaigns.json` to disable layout injection; **placeholders like `GTM-XXXXXXX` still load snippets** on non-dev builds (not “off”). Do **not** use bare `{% if campaign.gtm_id %}` — Liquid can treat `""` as truthy. The snippets themselves live in shared partials (see next bullet), not inline in each layout.
- **Analytics partials — shared across all three layouts (DRY) + generated across families:** the GTM + Meta Pixel + Route C vendor snippets live in two per-template partials, `_includes/analytics-head.html` (head loaders) and `_includes/analytics-body.html` (`<noscript>` fallbacks), pulled into `base.html`, `base-presell.html`, and `base-landing.html` via `{% campaign_include %}` — same pattern as `meta-social.html`, so the three layouts never drift. The partials (and the forwarder core + adapters) are **generated from the canonical `_shared/analytics/` source** by `scripts/sync-shared.mjs` (see the `_shared/analytics/` section above), so all families stay identical without hand-copying. Both partials keep the `{% unless environment == "development" %}` gate and the hardened `{% if campaign.<id> and campaign.<id> != "" %}` per-vendor guards (absent OR empty id = off); `src/landing/` is excluded. When adding a channel, edit `_shared/analytics/` and run `npm run sync:shared` — not the per-family copies.
- **Social share meta + resource hints — shared across all three layouts:** social Open Graph / Twitter Card tags live in a single per-template partial, `_includes/meta-social.html`, pulled into `base.html`, `base-presell.html`, and `base-landing.html` via `{% campaign_include 'meta-social.html' %}` so the three never drift. `og:title`/`twitter:title` use the page `title`; description falls back frontmatter `og_description` → `campaign.description`; image falls back frontmatter `og_image` → `campaign.og_image` (default `""` → image tags omitted, same `!= ""` guard pattern as analytics — render **always**, not gated on `environment`). Landing/presell are the pages actually shared, so they get the tags too — previously only `base.html` had a bare `og:title`/`twitter:title`. The same three layouts also carry a uniform **resource-hints** block: `preconnect` to `cdn.jsdelivr.net` (SDK loader + Swiper, loaded immediately) plus `dns-prefetch` for `campaigns.apps.29next.com` and the countries worker (hit by the SDK at runtime). (`src/landing/` is excluded from both — its SDK/config are commented-out examples, so it loads none of these hosts.)
- **Meta Pixel — layout bootstraps, SDK tracks (issue #79):** the GTM + Meta Pixel blocks (in the partials above) are loaded by every layout that loads `config.js` — `base.html` (checkout/upsell/receipt) **and** `base-landing.html` / `base-presell.html` (landing/presell), since all three load `config.js` with the SDK adapters. The Meta Pixel block loads `fbevents.js`, calls `fbq('init', …)`, and keeps the `<noscript>` PageView fallback only. It does **not** call `fbq('track', 'PageView')` — the SDK's Facebook adapter sends PageView (and ecommerce events) on init via `dl_user_data` when `analytics.providers.facebook.enabled` is `true`, and does not dedupe PageView, so a manual layout call double-fires. Add the manual `fbq('track', 'PageView')` back only for a campaign that disables the SDK Facebook provider. GTM is unaffected — keep its layout snippet as-is. (The `src/landing/` section-library layout is the exception: its config/SDK/analytics are commented-out "production hardening" examples, not live.)
- Liquid conditionals for optional metatags:
  - `{% if next_url %}` → checkout pages only
  - `{% if next_url %}` / `{% if decline_url %}` → upsell pages only
- **Shop checkout top bar (`checkout-header--lg`):** `{% campaign_include 'checkout-header.html' %}` (section **`checkout-header checkout-header--lg`**) inside **`main-wrapper`**. **`shop-single-step`:** enabled on **`checkout.html`** with **`checkout--shop`** on **`page-wrapper`** and **`hide`** on the duplicate **`.checkout-header__brand`** in the main column. **`shop-three-step`:** default **`page-wrapper`** is **`checkout--shop checkout--shop-column-logo`** (include **commented out**; **`checkout--shop-column-logo`** restores full main-column **`padding: 1.25rem`** where **`checkout--shop`** alone uses zero top padding for the top bar). For top bar like single-step: uncomment include, remove **`checkout--shop-column-logo`**, add **`hide`** on the column brand. **`next-core.css`** in each template defines **`.checkout--shop`** / **`.checkout--shop-column-logo`** and **`.checkout-header--lg`** border tweaks.

## Page Frontmatter Fields
```yaml
---
title: "Page Title"
page_layout: base.html               # optional — defaults to base.html; use named layouts (e.g. base-landing.html) when multiple layout stacks coexist in one slug
page_type: product | checkout | upsell | receipt
next_url: up01.html          # checkout pages only
next_url: up02.html        # upsell pages only
decline_url: receipt.html    # upsell pages only
styles:
  - https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css   # Apollo/MV: often only CDN; checkout UI CSS is in next-core.css
  - css/exit-intent-popup.css                                     # optional route-specific CSS example
scripts:
  - js/checkout.js
---
```

## Liquid Filters Used in Templates
- `{{ 'images/logo.png' | campaign_asset }}` — resolves to campaign-relative asset path
- `{{ 'css/checkout.css' | campaign_asset }}` — same for CSS
- `{{ 'js/checkout.js' | campaign_asset }}` — same for JS
- `{{ next_url | campaign_link }}` — clean URL (removes .html, adds trailing slash, prepends slug)
- `{{ campaign.name }}` — from campaigns.json
- `{{ campaign.sdk_version }}` — from campaigns.json
- `{{ campaign.store_phone }}` / `{{ campaign.store_phone_tel }}`
- `{{ campaign.store_terms }}` / `{{ campaign.store_privacy }}` / `{{ campaign.store_contact }}` / `{{ campaign.store_returns }}` / `{{ campaign.store_shipping }}`
- `{{ campaign.gtm_id }}` / `{{ campaign.fb_pixel_id }}` — optional; used by reference `base.html` for layout-injected tags

## campaign_include Tag
- Always resolves relative to the **campaign's own `_includes/` folder** — never a shared/global path
- Syntax: `{% campaign_include 'filename.html' %}` or with args: `{% campaign_include 'filename.html' arg=value %}`
- Args become variables inside the partial (e.g. `show_paypal=true` → `{{ show_paypal }}` / `{% if show_paypal %}`)
- Multiple args: `{% campaign_include 'payment-methods.html' show_paypal=true show_klarna=true %}`
- Use args to make partials configurable with safe defaults (e.g. optional payment methods off by default)

---

## Key SDK Data Attributes

| Attribute | Purpose |
|-----------|---------|
| `data-next-checkout="form"` | Marks the checkout form |
| `data-next-checkout-field="email"` | Binds input to a field |
| `data-next-checkout-step="..."` | Multi-step navigation (value is `campaign_link` URL) |
| `data-next-display="cart.total"` | Renders a dynamic value |
| `data-next-show="cart.hasDiscounts"` | Conditional visibility (0.4.x cart / receipt; prefer over legacy `cart.hasSavings`) |
| `data-next-display="cart.originalPrice"` | **Unsupported** on `cart.*` in current `CartDisplayEnhancer` (unresolved path / no DOM update). For crossed pricing with `cart.total`, use `data-next-display="cart.subtotal"` with `data-next-show="cart.hasDiscounts"`. |
| `data-next-hide="cart.isEmpty"` | Inverse conditional |
| `data-next-cart-summary` + `data-summary-lines` | Cart summary v2 (0.4.x); replaces legacy `data-next-cart-items` |
| `data-next-bump` | Order bump toggle |
| `data-next-express-checkout="container"` | Express checkout (PayPal/Apple/Google Pay) |
| `data-next-coupon="input"` | Coupon input component |
| `data-next-quantity="increase/decrease"` | Quantity controls |
| `data-next-package-sync` | Order-bump quantity sync, matched by **packageId** (sums across a comma-separated id list). Correct for single-package products. |
| `data-next-product-sync="<product_id>"` | Order-bump quantity sync, matched by **`product_id`** (SDK 0.4.25+). Covers every variant of a configurable/MV product with one id — the correct attribute for MV bumps. |
| `data-next-property="<key>"` | **Line-item properties.** On an `<input>`/`<textarea>`/`<select>` **inside a bundle slot** (or on/inside a PackageToggle card — SDK 0.4.27+) — binds the field as a named property on that slot/toggle's cart line (e.g. `back_text`). Captured on `input`, cart syncs on `blur`. **Renamed in SDK 0.4.27** from `data-next-property-key` (introduced 0.4.26). |
| `data-next-default-property="<key>"` | **Line-item properties.** On an input **outside** the bundle — applies one value to **every** line item (e.g. `gift_message`). A per-slot `data-next-property` value overrides the default for that slot. **Renamed in SDK 0.4.27** from `data-next-default-property-key`. |
| `data-next-exclude-property="<keys>"` | **Property exclusion (SDK 0.4.27+).** Stops named properties being sent to the API for that line item without removing the input. `"team"` (one key), `"team, number"` (multiple), or `"*"` (all). Set on a PackageToggle card / state container, or in a BundleSelector item's `data-next-packages` JSON. |
| `data-next-property-container="#sel"` (on an `AddToCart` button) | **Line-item properties.** Collects `data-next-property` inputs inside the referenced CSS container into the properties of the **single** line that click adds (one packageId/click). Page-wide `data-next-default-property` also applies (container keys override). Live-syncs that line via `setItemProperties(packageId)`. Undocumented in the AddToCart guide; lives in `AddToCartEnhancer`. |
| `data-next-item-properties` + `<template>` | **Cart-summary property rows (SDK 0.4.26+).** Container with a `<template>` child inside a summary line; renders a row per property via `{property.key}` / `{property.value}` tokens. Gets `next-summary-empty` / `next-summary-has-items` classes for CSS show/hide. **Not renamed in 0.4.27.** |

### Line-item properties — personalization (SDK 0.4.26+, issue #47 / PR #56)
SDK 0.4.26 ("Unique Line Items by Properties") lets a customer attach custom text to a product (monogram, jersey name, gift message). The **same `package_id` with different properties stays as separate cart/order lines** instead of merging by quantity. Properties forward through the full order lifecycle — `/calculate`, create-cart (ProspectCartEnhancer), create-order, express checkout, test orders — with no extra config.

**SDK 0.4.27 changes (templates now pin 0.4.28):** the binding attributes were **renamed** — `data-next-property-key` → `data-next-property`, `data-next-default-property-key` → `data-next-default-property` (breaking; `data-next-item-properties` and `data-next-property-container` are unchanged). 0.4.27 also (a) **sends properties on post-purchase upsells** — the upsell-accept caveat below no longer applies; (b) adds **PackageToggle property support** so toggle cards collect properties exactly like bundle slots (incl. on upsell pages); and (c) adds **`data-next-exclude-property`** (`"team"` / `"team, number"` / `"*"`) to suppress specific keys from the API payload without removing the input.

**Shipped reference examples (`apollo-mv-single-step` and `olympus-mv-single-step`, enabled by default on each):**
- **Bump line-item property (PackageToggle)** — shared `bump-check03.html` renders an unsynced product-card bump with an optional `data-next-property` input inside the toggle card (`order_bump.check03.personalization` → `bump_custom_text` on the demo checkout). The partial is available in every checkout template family; **`apollo-mv-single-step`** and **`olympus-mv-single-step`** wire it by default. Source-verified: `PackageToggleEnhancer` calls `attachPropertyListeners(el, card.properties)` and `addToCart`/`updateCartItemProperties` apply `applyPropertyExclusion(mergeWithDefaults(card.properties), …)`.
- **Bump excludes the order-wide default** — `checkout.html` renders the shared checkout field (`order_personalization` → `custom_text`, applies to every line) and sets `order_bump.check03.exclude_property: "custom_text"`, so the shared custom text lands on product lines but **not** the add-on bump line (`excludeProperties` read from the card el / state container at `PackageToggleEnhancer.ts`).
- **Upsell line-item property** — `upsell-mv-offer.html` renders a per-slot `data-next-property` field inside the MV upsell slot template via the shared `slot_personalization` contract (same frontmatter name as the MV checkout selector); `UpsellEnhancer` merges those `bundleItem.properties` onto each accepted upsell line (`{ ...defaultProperties, ...bundleItem.properties }`). The one-value-for-all `order_personalization` default remains supported and is the right fit for single non-slot upsells or one shared message across every accepted upsell line; it is disabled on the MV upsell demo because the demo uses per-slot fields. The offer partial renders the `order_personalization` field (a full-width `grid-full` wrapper) **above** the variant slot stage, mirroring the MV checkout layout. **Key-collision caveat (browser-verified 2026-06-24):** because the accept merge is `{ ...default, ...slot }`, a per-item `data-next-property` value **overrides** a page `data-next-default-property` value on the **same key**. So when both fields run together they MUST use **distinct** `property_key`s — the demo keys the (disabled) `order_personalization` example `gift_message` to stay clear of the per-slot `upsell_message`; using one key for both drops the shared value from every line that has a per-slot value. (An empty per-slot input does not write the key, so it won't clobber the default.)
- Because the whole bump card is the PackageToggle click target, `checkout-apollo-mv-full.js` / `checkout-olympus-mv-full.js` add `guardBumpPersonalization()` — it stops click/keydown inside `.bump__personalization` from toggling the bump (browser-verified: a field click does not reach the card; a title click does). The `bump-check03` partial is **unsynced by default** (one standalone add-on product) but supports **opt-in quantity-sync** via a `package_sync` include arg / `order_bump.check03.sync_quantity` frontmatter (renders `data-next-package-sync`, packageId match). **`apollo`** checkout sets `sync_quantity: 1` on the selector-area check03 so the add-on scales with 1x/2x/3x; MV demos leave selector check03 unsynced. For an MV/configurable main product use `data-next-product-sync` (product_id match) instead — see the MV order-bump-sync note above.
- All four hooks are **opt-in** (frontmatter/include args, off unless set) and shipped enabled on **`apollo-mv-single-step`** and **`olympus-mv-single-step`**; `bump-check03.html` itself is shared across checkout template families for reuse.

**Model: shared default + per-slot override** — a global fallback with optional per-line flexibility. **Confirmed by engineering (2026-06-24): a customized product is expected to use a slot-style picker — that is the intended (and only) way to get per-line values.** Browser-verified behavior:
- **Default (fallback)** → `data-next-default-property` collects one value and applies it to **every** line the active bundle writes. **Works on any selector, including a plain non-MV tier-swap** (verified: a tier-swap 2x → one line carrying the default). The simple "one input, propagate everywhere" path — no slot picker needed. The `personalization-field.html` partial ships in every template but is **not wired into any page** (see point 2): it's reliable only for "same message on all units," and pairing it with slots invites the unreliable mixed pattern below.
- **Per-line customization → requires a slot-style picker** (`data-next-bundle-slots-for` + slot `<template>` with a `data-next-property` input per slot). A plain tier-swap renders **no slots**, so it can only carry the shared default. The slot structure does **not** require a variant product: a standalone product works by listing its packageId N times with `configurable:false` (verified: standalone pkg 76 ×3 → 3 personalizable lines, no variant gate).
  - **Fill every slot explicitly.** The natural slot-picker UX (each slot has its own input) is the reliable path: `[DAD, MOM, DAD]` → 2×DAD + 1×MOM (verified). Do **not** rely on "set a page default, override only some slots, leave the rest empty" for repeats of the same package — the lone override gets dropped and the cart keeps the default for all units (`setItemProperties` is packageId-keyed; it can't carve one unit out of a merged same-package line).

**Possibilities by surface (checkout ↔ upsell mirror each other):**

| Surface type | Per-line distinct (`data-next-property`) | Same value on all lines (`data-next-default-property`) |
|---|---|---|
| Standard / tier-swap selector, or bundle upsell offer (stepper / tier-pills / tier-cards) | ✗ no slots — not possible | ✓ general `order_personalization` (single non-slot upsell = the one accepted line) |
| MV / variant slot picker — MV checkout/select **or** MV upsell | ✓ per-slot `slot_personalization` | ✓ general `order_personalization` |
| Standalone product wanting per-line | ✓ only via an MV-style slot picker (list packageId ×N, `configurable:false`) | ✓ general `order_personalization` |

Wired examples live on the MV templates (`apollo-mv-*` flagship, `olympus-mv-*` classic): per-slot `slot_personalization` on `checkout.html` + single-step `upsell-mv.html`; general `order_personalization` present but disabled (keyed distinctly). Every other family ships `personalization-field.html` (general field) and the shared offer/selector partials **unwired** — opt in per the rules below. `bump-check03.html` (product-card order bump) ships in all checkout families with a togglable `data-next-property` field, demoed enabled on **`apollo-mv-single-step`** and **`olympus-mv-single-step`**. Same key-collision rule everywhere: a per-slot value overrides the general default on a shared key, so use distinct keys when running both.

**The three attributes, by scope:**
1. **Per-slot — `data-next-property` (inside bundle slots).** One property set per slot; same package + different per-slot values → separate lines. Read **only inside slot elements** (`attachPropertyListeners` queries `slotEl`). Toggle: the single `slot_personalization` frontmatter contract drives both MV checkout/select (→ `mv-configurable-selector.html` / `mv-slot-stage.html`) and MV upsell (→ `upsell-mv-offer.html`). Shipped enabled on **`apollo-mv-single-step/checkout.html`** and **`apollo-mv-single-step/upsell-mv.html`** (flagship); also on `olympus-mv-single-step` with the same contract; disabled on `olympus-mv-two-step/upsell-mv.html` and `olympus-mv-two-step/select.html` (one live reference each). To apply elsewhere, set the `slot_personalization` frontmatter object with `enabled: true` on any MV page — the shared `upsell-mv-offer.html` / `mv-configurable-selector.html` partials render the field from that same contract, so no markup copy is needed within an MV family. Non-MV / non-slot upsell offers can't render per-slot fields (no slot stage); use the all-lines `order_personalization` path there instead.
2. **All-lines default — `data-next-default-property` (any input, outside slots).** Applies one value to every line (`mergeWithDefaults` on cart swap / upsell accept). The `personalization-field.html` partial (`order_personalization` frontmatter contract) **ships in every template's `_includes/` for consistency, but is NOT wired into generic pages** — opt in with a `{% campaign_include 'personalization-field.html' order_personalization=order_personalization %}`, or render the same attribute inside an upsell offer partial. This is useful when a campaign genuinely wants one shared value across all units, and also for single non-variant / non-slot upsells where the "all lines" set is just the one accepted line. Pairing defaults with per-slot overrides is still discouraged for repeated same-package units; fill every slot explicitly when using slots.
3. **Per-button / per-package — `AddToCart` + `data-next-property-container`.** `data-next-property` inputs inside a CSS container; the AddToCart button sets `data-next-property-container="#sel"`. Keys → one properties object on the single line that click adds (page-wide defaults also apply; container wins). Live-syncs via `setItemProperties(packageId)` — keyed by package, not line. Undocumented in the AddToCart guide; lives in `AddToCartEnhancer`. For single-SKU / select-mode / bump-with-own-fields. (No template example yet.)

**Render to customer:** `[data-next-item-properties]` + `<template>` inside the cart-summary line template (`{property.key}` / `{property.value}`). Wired (inert when empty) on **all 28** cart-summary variants.

**Implementation caveats (source-verified — scope the eng "story" with these):**
- **The per-slot override needs slots to actually render.** A tier-*swap* selector (e.g. `apollo` or `olympus`) renders no slots, so `data-next-property` is never scanned there — it can only carry the shared default. Per-slot override requires the configurable-slot / slot-template selector.
- **Same-package multi-quantity explosion is variant-gated.** A configurable slot (`configurable:true` + qty>1) blocks checkout until its variant resolves (`needsVariant = slots.some(s => s.configurable && !s.variantSelected)` → `_getSelectedBundleItems` returns null; flips only on `product_variant_attribute_values` or a picked variant). So you cannot mark a plain product `configurable` just to harvest per-unit slots — it bricks checkout.
- **Configurable + qty 1 + a `bundleQuantity` stepper** → one slot, one property set × multiplier (not per-unit).
- **`setItemProperties` matches packageId only** — unreliable if multiple lines share a package with different properties.
- **Order-wide default is not auto-applied to order-bump lines** — a bump carries properties only when added/synced via its own AddToCart enhancer.
- **Post-purchase upsells now carry properties (SDK 0.4.27).** The upsell accept (`POST /orders/{ref}/upsells/` via `addUpsell`) now includes a `properties` object per line, matching the order-creation flow. (Pre-0.4.27 it sent only `package_id` + `quantity` and any property on an upsell offer was silently dropped.) The MV upsell reference wires this per slot via the shared `slot_personalization` contract.

Opt-in and additive — templates without these attributes are unaffected; `data-next-package-sync` / `data-next-product-sync` behavior unchanged.

### MV / configurable order-bump sync — use `data-next-product-sync` (SDK 0.4.25+)
A quantity-synced order bump matched by **packageId** (`data-next-package-sync`) under-counts on MV / configurable selectors: each variant (color/size) is a distinct package, and swapping a unit's variant rebuilds its cart line under the new variant's packageId (`originalPackageId: undefined`).
- **Current fix (SDK 0.4.25+, applied on `apollo-mv-single-step`, `olympus-mv-single-step`, and `olympus-mv-two-step` `bump-check01.html`):** use **`data-next-product-sync="<product_id>"`** — matched on the product's `product_id`, which every variant of the same product shares, so the SDK sums quantity across all variants with one id. Find the value in the campaign API response under `packages[].product_id` (identical for every variant of a product — verified for the demo's "T Shirt": ref_ids 1–9 and 66–74 all return `product_id` 400). Update the id when cloning to another product.
- `data-next-package-sync` still works unchanged for single-package products. Both attributes may be set on the same card — items already counted by `data-next-package-sync` are excluded from the `data-next-product-sync` pass, so there is no double-counting.
- **Prior workaround (pre-0.4.25, now retired):** hand-listing every variant ref_id in `data-next-package-sync`. Brittle — the list had to be updated whenever variants changed and broke silently if an id was missed.

### MV variant-picker reference component (`apollo-mv-single-step`, `olympus-mv-single-step`, `olympus-mv-two-step`)

These families ship a reference **variant-picker** — quantity tier cards + per-unit variant (colorway) dropdowns rendered by JS into the SDK `data-next-bundle-slots-for` stage. It is the cleaned port of the Shield build's hand-rolled picker (the highest-cost area of that build), with the three B1 fixes baked in. It's an **additive alternative** to `mv-configurable-selector.html` (SDK-injected native `<select>`s) — use it when a campaign needs custom per-variant swatch thumbnails or an offline-renderable picker. Files per template: `_includes/variant-picker.html`, `assets/js/variant-picker.js`, `assets/js/variant-picker-fixture.js`, `assets/css/variant-picker.css`, and the standalone `variant-picker.html` page.
- **One declared variant source.** `variant_picker.variants[]` frontmatter (`{ value, label, package_id, image }`) is emitted once into `#vp-config` and feeds BOTH the template dropdown swatch `src` AND the JS `value→packageId` / `value→image` maps. There is no second hand-maintained JS map to drift — this is what killed the Shield "wrong variant thumbnails" bug (swatches left as placeholder hero/compare images). Replace the demo image paths with the CampaignSpec per-variant package images.
- **Image precedence: live API `getPackageImage(packageId)` > declared template swatch.** `variant-picker.js` prefers the SDK cart-line/package image when present and falls back to the declared `variants[].image` otherwise. The declared swatch is the offline source of truth, not a throwaway placeholder.
- **Offline render path.** Slots paint on `DOMContentLoaded` from the declared images/prices — rendering does NOT wait for `next:initialized`, so the picker is never blank with no network. `variant-picker-fixture.js` stubs a mock `window.next` for fuller offline QA; it installs ONLY when (`window.NEXT_VP_FIXTURE === true` or `?vp-fixture=1`) AND the real SDK is absent, so it never shadows live (precedence: live API > fixture > template swatch). The standalone `variant-picker.html` page sets the flag so it renders fully offline for visual QA.
- **Variant-group layout hook: `.os-card__variant-group.cc-row`** (added to each MV template's `next-core.css`). next-core defaults `.os-card__variant-group` to `flex-flow: column` (label stacked above the control); `.cc-row` overrides to `row nowrap` for an inline "Label: [dropdown]" row. This is the documented fix for the Shield "Lens:" label-stacking bug — a reusable hook, not a per-campaign rediscovery.

### Declarative pricing modes — Demeter (campaigns-os template-brand-contract.demeter.v0)
Demeter pricing surfaces render price rows from a `pricing_mode` partial argument — campaigns must never hide `.price-wrapper` / `.prices-text-wrapper` / `.price-display` rows with CSS (Campaigns OS browser QA blocks upsells with zero visible price rows; a `display:none` on the only row caused the recovery-relief-stack-v1 dogfood blocker).
- Modes: `full_price | discounted | compare_at | unit_total | unit_only`.
- Surfaces + partial defaults (per contract): upsell offers (`upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, `upsell-bundle-tier-cards-offer.html`) default **full_price** — exactly one visible price row adjacent to the accept control; `bump-check01.html` defaults **full_price** (one `unitPrice`/ea row); `editorial-tier-selector.html` defaults **discounted** (current compare-unit-total render), with per-card override via `bundles[].pricing_mode`.
- Pass the mode as an include arg (`pricing_mode='discounted'`) or via `upsell_offer.pricing_mode` / `order_bump.check01.pricing_mode` frontmatter; include arg wins. Visible-row counts on upsells: full_price/unit_only = 1, discounted/compare_at/unit_total = 2.
- Demo pages opt into `discounted` explicitly to keep the showcase visuals; legacy `show_per_unit_price`/`show_line_total_price` (bump) and `price_display_variant` (tier selector) still work when passed explicitly without `pricing_mode`.
- `bump-check01.html` also accepts legacy `show_compare_price=false` by default. Leave demo pages unset so bump previews show one sale price; pass `show_compare_price=true` only when the campaign intentionally wants the struck `originalUnitPrice`.

Inside `<template>` elements the SDK uses single-brace tokens (not Liquid):
```html
<template id="cart-item-template">
  <div data-cart-item-id="{item.id}">
    <img src="{item.image}">
    <div>{item.name}</div>
    <div>{item.quantity} × {item.unitPrice}</div>
  </div>
</template>
```

---

## JS Files Per Template

### 0.4.x

| Template | JS Files |
|----------|----------|
| demeter | checkout.js, checkout-demeter.js, upsells.js, promo-banner.js, promo-timer.js |
| olympus | checkout.js, checkout-olympus.js, upsells.js, promo-banner.js, promo-timer.js |
| apollo | checkout.js, checkout-apollo.js, upsells.js |
| apollo-mv-single-step | checkout.js, checkout-apollo-mv-full.js, upsells-mv.js, upsells.js, variant-picker.js, variant-picker-fixture.js |
| olympus-mv-single-step | checkout.js, checkout-olympus-mv-full.js, upsells-mv.js, upsells.js, promo-banner.js, promo-timer.js, variant-picker.js, variant-picker-fixture.js |
| olympus-mv-two-step | checkout.js, checkout-olympus-mv-full.js, checkout-olympus-mv-selection.js, upsells-mv.js, upsells.js, promo-banner.js, promo-timer.js, variant-picker.js, variant-picker-fixture.js |
| shop-single-step | checkout.js, upsells.js, promo-banner.js, promo-timer.js |
| shop-three-step | checkout.js, checkout-shop-three.js, checkout-shop-three-billing.js, checkout-shop-three-shipping.js, upsells.js, promo-banner.js, promo-timer.js |

The 0.3.x archive is out of scope for this repository.

---

## .gitignore
- Removed blanket `package.json` / `package-lock.json` ignores (needed for both folder package.json files to be tracked)
- Added `_site/` (build output)
- `node_modules/` remains ignored globally
- Experimental scratch folders excluded via `.git/info/exclude` (local-only, not committed)

---

## Docs in this repo
- `CLAUDE.md` (this file) — AI context for working **on** this starter repo (structure, conventions, preview URLs).
- `README.md` — public onboarding: clone workflow, template inventory with live preview links, npm scripts, SDK links.
- `docs/campaign-page-kit-template-context.md` — the **copyable** AI rules file for developers working **in** their own campaign-kit projects (copy into project root or `.cursor/rules/` per tool).
- `docs/commerce-surface-catalog.md` / `.json` — routing catalog for mapping designed HTML to template-family commerce surfaces. Keep matching cheap and confidence-gated; ask the user when family selection is ambiguous.
- `docs/pre-checkout-pages.md` — implementation guidance for landing/presell pages (Tailwind build flow, same-slug presell setup, CTA/linking conventions).

## SDK customization rules file (`docs/campaign-page-kit-template-context.md`)
`docs/campaign-page-kit-template-context.md` is the copyable AI context file for developers working in their own campaign-kit projects. Covers:
- Project structure, campaigns.json schema, page frontmatter
- Liquid filters (`campaign_asset`, `campaign_link`, `campaign_include`) and common variables
- `base.html` pattern and SDK meta tag wiring
- Full `config.js` structure (matches real template file)
- All SDK data attributes with real examples (checkout form, selectors, bump, upsell, display, etc.)
- Task checklists: configuring config.js, setting up a new campaign, adding a bump, adding a upsell step, debugging
- 10 hard rules

Design decisions:
- **Checklists over how-to recipes** — checklists are AI-useful; prose how-tos are not worth the file bloat
- **`docs/recipes/` was created then deleted** — content absorbed into checklists in the main rules file
- **Analytics docs not included** — main SDK docs URL is sufficient; AI fetches specific pages when needed
- **Auto-delivery shipped in CPK 0.2.0**: `campaign-init --ai-context claude|codex|cursor|copilot` now installs this doc verbatim into developer projects (with a sentinel header, overwritten on re-run unless `--keep-ai-context`). This file is the upstream source — keeping it correct now directly shapes downstream AI context.

README has an "AI development rules" section pointing developers to copy `docs/campaign-page-kit-template-context.md` into their project.
