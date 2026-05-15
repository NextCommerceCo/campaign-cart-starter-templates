# Commerce Surface Catalog

This catalog is a routing aid for agents and developers assembling Campaign Cart funnels from designed HTML. It should stay dry and predictable: use it to pick known template-family surfaces, not to make expensive visual guesses.

Machine-readable companion: [`commerce-surface-catalog.json`](./commerce-surface-catalog.json). The JSON catalog now includes an `agentContract` block for each first-class checkout family plus `sharedFrontmatterVocabulary` for cross-family fields such as `packages`, `shipping_methods`, `bundles`, `variant_slots`, `order_bump`, `upsell_offer`, `upsell_bundle_tiers`, `receipt_summary`, and payment flags.

## Confidence Policy

Template family selection should be cheap and confidence-gated.

Prefer signals in this order:

1. Explicit user instruction.
2. CampaignSpec template fields.
3. Export folder/file names.
4. Unique commerce structure.
5. Distinct checkout layout structure.
6. Class-name fingerprints.

Do not infer from brand colors, product category, copy tone, or a single shared primitive such as `payment-methods.html`.

High confidence currently means `>= 0.85`, matching the JSON catalog. If the top family match is below high confidence, or if two families look plausible, ask the user before wiring commerce components. A good passback is:

> I can map this design to `olympus` or `olympus-mv-two-step`. The ambiguity is the tier card layout plus variant slot behavior. Which family should I use before wiring SDK components?

## Family Surface Matrix

| Family | Status | Primary Checkout Surface | Summary | Notes |
| --- | --- | --- | --- | --- |
| `olympus` | Include-driven frontmatter API exists | Tiered bundle selector | `cart-summary01-04` | Reference checkout model; `bundles:` frontmatter feeds `bundle-selector.html`, and `shipping_methods` keeps Campaigns App shipping refs explicit. Bundle upsell pages use include-owned offer partials fed by `upsell_offer` / `upsell_bundle_tiers`. |
| `limos` | Partial include/frontmatter API exists | Single offer card with native quantity stepper | `cart-summary02` accordion | Checkout plus upsell/receipt surfaces are include-owned; upsell exposes `upsell_offer` / `upsell_bundle_tiers`, receipt exposes `receipt_summary`. |
| `demeter` | Partial include/frontmatter API exists | Editorial tier cards | `cart-summary03` side cart | Checkout plus upsell/receipt surfaces are include-owned; upsell exposes `upsell_offer` / `upsell_bundle_tiers`, receipt exposes `receipt_summary`. |
| `shop-single-step` | Partial include API exists | Shop checkout with single-step payment | `cart-summary04` checkout summary | Highly used shop flow; checkout, receipt, and upsell SDK surfaces are now include-owned and catalog-wrapped. |
| `shop-three-step` | Include-driven upsell contract exists | Information -> shipping -> billing checkout | `cart-summary04` checkout/review shape | Shipping methods are rendered dynamically from `sdk.getShippingMethods()`; do not add Olympus-style `shipping_methods` frontmatter for checkout shipping. Bundle upsell pages use include-owned offer partials fed by `upsell_offer` / `upsell_bundle_tiers`. |
| `olympus-mv-single-step` | Partial frontmatter API exists | MV configurable selector in checkout | `cart-summary01/03/04` | First-class MV checkout selector promoted to `mv-configurable-selector.html`; MV upsell pages now expose `upsell_offer`, `upsell_mv_tiers`, and standard `upsell_bundle_tiers` through includes. |
| `olympus-mv-two-step` | Partial frontmatter API exists | Select step + checkout review/payment | `cart-summary03/04` | First-class select surface promoted to `mv-selection-step.html` + `mv-slot-stage.html`; MV upsell pages now expose `upsell_offer`, `upsell_mv_tiers`, and standard `upsell_bundle_tiers` through includes. |

## Agent Contract Layer

The contract layer is intentionally lighter than a campaign readiness check. It does not validate a real CampaignSpec against a live Campaigns API; it documents how an agent should translate spec/API truth into starter-template frontmatter and partial choices.

Use it in this order:

1. Pick the family from cheap catalog signals and ask when ambiguous.
2. Read `families[family].agentContract` in the JSON catalog.
3. Replace all `frontmatter.demoOnlyValues` from the target CampaignSpec/API.
4. Use the family fixture under `docs/fixtures/campaign-specs/` as an example of the mapping shape, not as live data.
5. Run `npm run lint:agent-contracts` after catalog or fixture changes.

The important boundary is: CampaignSpec/API owns package refs, shipping refs, vouchers, payment support, routing, tracking, footer links, and SEO. Starter templates own the stable SDK DOM shape and family-specific frontmatter vocabulary.

Catalog component names should be generic by default. Use names like `upsell-bundle-stepper-offer`, `upsell-bundle-tier-pills-offer`, and `upsell-bundle-tier-cards-offer` when the SDK attributes and frontmatter contract are shared across families. Reserve family-specific names for surfaces with genuinely different SDK ownership or frontmatter contracts, such as MV configurable upsells.

## Market-Sensitive Copy Review

Starter templates include demo copy for shipping, carrier, warehouse, address, and manufacturing claims. Treat those claims as replace-or-confirm campaign copy when the CampaignSpec declares additional currencies, non-US shipping countries, `available_shipping_countries: "all"`, or the builder records the campaign as country-specific or multi-market.

This is a warning contract, not an automatic removal rule. Some global campaigns really do ship from a US warehouse or manufacture in the USA. Preserve those claims only when the CampaignSpec, source design, or operator explicitly confirms them.

Warn on obvious market-sensitive patterns such as `USPS`, `ships from the USA`, `US warehouse`, `contiguous US`, `All US orders ship free`, `Made in USA`, `manufactured in the USA`, `State`, and `ZIP Code`.

## Fixture Specs

Each first-class checkout family has a small CampaignSpec-shaped fixture:

| Family | Fixture |
| --- | --- |
| `olympus` | `docs/fixtures/campaign-specs/olympus-tiered-standard-free.json` |
| `limos` | `docs/fixtures/campaign-specs/limos-single-offer-quantity.json` |
| `demeter` | `docs/fixtures/campaign-specs/demeter-editorial-tiered.json` |
| `shop-single-step` | `docs/fixtures/campaign-specs/shop-single-step-upsell-receipt.json` |
| `shop-three-step` | `docs/fixtures/campaign-specs/shop-three-step-dynamic-shipping.json` |
| `olympus-mv-single-step` | `docs/fixtures/campaign-specs/olympus-mv-single-step-configurable.json` |
| `olympus-mv-two-step` | `docs/fixtures/campaign-specs/olympus-mv-two-step-configurable.json` |

These fixtures deliberately include `sdk_hints.frontmatter` so agents can see the intended mapping. They are not canonical Campaign Map Builder exports, and every numeric `ref_id` is illustrative.

## Gap Matrix

| Family | Surface | Current Implementation | Frontmatter Contract | Lint Coverage | Promotion Needed | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| `olympus` | Tiered bundle selector | Include: `src/olympus/_includes/bundle-selector.html`; used from `src/olympus/checkout.html`. | Yes: `selector_id`, `await`, `include_shipping`, `selection_mode`, `packages.main_package`, `shipping_methods`, and `bundles` with quantity-driven item JSON. Starter `shipping_methods` demonstrate standard/free tier wiring and must be replaced from the target CampaignSpec/Campaigns App. | Yes under promoted/all-page SDK lint. | No current promotion gap; keep selector refs aligned with CampaignSpec/API when cloning. | Done |
| `olympus` | Order summary | Includes: `cart-summary01.html` through `cart-summary04.html`; checkout selects via `cart_summary_variant` and defaults to `01`. | Yes: `cart_summary_variant` can select `01`, `02`, `03`, or `04`; summary internals remain SDK-owned. | Yes under promoted/all-page SDK lint. | Add copy-level summary params only when a future campaign needs them. | Watch |
| `olympus` | Payment shell | Include: `payment-methods.html`; express checkout has a matching component header. | Yes: `show_paypal`, `show_klarna`, `show_apple_pay`, `show_google_pay`. | Yes under promoted/all-page SDK lint. | Keep as shared model for other families. | Done |
| `olympus` | Order bump | `bump-check01.html`, `bump-check02.html`, and `bump-switch01.html` have component headers/wrappers; checkout selects via `order_bump_variant`. | Yes: `order_bump_variant` supports `check01`, `check02`, `switch01`, `check01+switch01`, and `none`; `order_bump.check01`, `order_bump.check02`, and `order_bump.switch01` control package refs and copy. | Yes under promoted/all-page SDK lint. | No current promotion gap; replace demo bump package refs from CampaignSpec/API or disable bumps. | Done |
| `olympus` | Bundle upsell pages | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `limos` | Main selector and quantity stepper | Include: `src/limos/_includes/single-offer-quantity-selector.html`; used from `src/limos/checkout.html`. | Yes: `single_offer` object covers selector/package/shipping method, quantity min/max, image/label text, and `price_display_variant`; `shipping_methods.standard` holds the starter shipping ref to replace from the target CampaignSpec/Campaigns App. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `limos` | Summary, payment, bump | Includes are present for `cart-summary02.html`, `payment-methods.html`, and bumps; checkout summary/payment/bump wrappers are catalog-marked. | Yes for bumps: `order_bump_variant` chooses check/switch/both/none and `order_bump.check01`, `order_bump.check02`, and `order_bump.switch01` control package IDs and copy. Payment flags remain include params. | Yes under promoted/all-page SDK lint. | Add summary frontmatter only if Limos gains more than the current accordion summary. | Watch |
| `limos` | Receipt/order confirmation | Includes: `receipt-skeleton.html`, `receipt-order-summary-mobile.html`, and `receipt-order-summary-desktop.html`; used from `src/limos/receipt.html`. | Yes: `receipt_summary` controls title, scroll hint, and separate mobile/desktop order item template IDs. | Yes under promoted/all-page SDK lint. | Monitor for campaign-specific receipt copy variants. | Watch |
| `limos` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `demeter` | Editorial tier selector | Include: `src/demeter/_includes/editorial-tier-selector.html`; used from `src/demeter/checkout.html`. | Yes: selector mode, include shipping, `packages.main_package`, `shipping_methods`, `bundles` array with quantity-driven item JSON, and `price_display_variant`. Starter shipping refs demonstrate standard/free tier wiring and must be replaced from the target CampaignSpec/Campaigns App. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `demeter` | Side summary and bump | Include: `src/demeter/_includes/cart-summary03.html`, selected by `cart_summary_variant` from checkout side cart; bump includes are frontmatter-controlled. | Yes: `cart_summary_variant`, `cart_summary_heading`, `cart_summary_subtitle`, `cart_summary_feature_package`, `order_bump_variant`, and `order_bump.*`. | Yes under promoted/all-page SDK lint. | Add more summary variants only if Demeter gains them. | Watch |
| `demeter` | Receipt/order confirmation | Includes: `receipt-skeleton.html`, `receipt-order-summary-mobile.html`, and `receipt-order-summary-desktop.html`; used from `src/demeter/receipt.html`. | Yes: `receipt_summary` controls title, scroll hint, and separate mobile/desktop order item template IDs. | Yes under promoted/all-page SDK lint. | Monitor for campaign-specific receipt copy variants. | Watch |
| `demeter` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `shop-single-step` | Checkout summary/payment/bump | Includes: `cart-summary04.html`, `express-checkout.html`, `payment-methods.html`, and configurable bump variants; used from `src/shop-single-step/checkout.html`. | Partial: `order_bump_variant` and `order_bump.check02` are frontmatter-driven with optional check/switch fallback; checkout summary remains fixed to the shop layout's `cart-summary04`. | Yes under promoted/all-page SDK lint and shop-single-step all-page lint. | Add `cart_summary_variant` only if a future shop layout can switch summaries without nesting accordions or breaking the right-column layout. | Watch |
| `shop-single-step` | Receipt/order confirmation | Includes: `receipt-skeleton.html`, `receipt-order-summary-mobile.html`, and `receipt-order-summary-desktop.html`; used from `src/shop-single-step/receipt.html`. | Yes: `receipt_summary` controls title, scroll hint, and separate mobile/desktop order item template IDs. | Yes under promoted/all-page SDK lint. | Consider a shared receipt summary include across shop templates only if duplication becomes costly. | Watch |
| `shop-single-step` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `shop-three-step` | Dynamic shipping step | `src/shop-three-step/assets/js/checkout-shop-three-shipping.js` renders shipping method radios from `sdk.getShippingMethods()`. | Runtime/API-driven rather than frontmatter-driven; fixture documents this as `runtime_shipping_source`. | Yes under promoted/all-page SDK lint. | Keep dynamic shipping separate from Olympus-style selector shipping. | Done |
| `shop-three-step` | Information-step order bump | `src/shop-three-step/information.html` uses `bump-check02.html` by default and can switch to check/switch/none variants. | Yes: `order_bump_variant` and `order_bump.check02` control the default shop bump package/copy; other bump variants share the same include contract. | Yes under promoted/all-page SDK lint. | Replace demo bump package refs from CampaignSpec/API or set `order_bump_variant: "none"`. | Done |
| `shop-three-step` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `olympus-mv-single-step` | MV selector and variant slots | Include: `src/olympus-mv-single-step/_includes/mv-configurable-selector.html`; used from checkout. | Yes: `checkout_step` controls selector id and headings; `packages.main_package` supplies the package id; `shipping_methods` supplies starter standard/free refs; `variant_slots` controls bundle ids, quantity, optional per-slot `package_id` / `items_json` overrides, shipping method, labels, and selected state. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `olympus-mv-two-step` | Select step and variant slots | Includes: `mv-selection-step.html` and `mv-slot-stage.html`; used from `src/olympus-mv-two-step/select.html`. | Yes: `select_step` and `checkout_step` keep selector ids aligned; `packages.main_package` supplies the package id; `shipping_methods` supplies starter standard/free refs; `variant_slots` controls bundle ids, quantity, optional per-slot `package_id` / `items_json` overrides, shipping method, labels, and selected state. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `olympus-mv-*` | MV and bundle upsell pages | Includes: `upsell-mv-offer.html`, `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching MV upsell pages. | Yes: `upsell_offer` controls package/selector/button copy, `upsell_mv_tiers` controls MV quantity/voucher tiers, and `upsell_bundle_tiers` controls standard bundle upsell item/voucher tiers. | Yes under promoted/all-page SDK lint. | Monitor future campaign-specific markup changes. | Watch |
| `olympus-mv-*` | Checkout payment and summary | Payment, express checkout, and summary includes have catalog wrappers in both MV families. | Partial/no MV-specific summary contract. | Yes under promoted checkout/select rendered scope and global all-page CI lint. | Add summary variant contract and receipt scope. | P2 |
| `olympus-mv-*` | Receipt/order confirmation | Includes: `receipt-skeleton.html` and `receipt-orders.html`; both MV receipt pages call the shared order-items include from mobile and desktop summaries. | Partial: fixtures document `receipt_summary`; receipt order items are include-owned, while full summary text remains page-local. | Yes under `npm run lint:sdk:ci` now that CI runs `--pages=all`. | Add a fuller `receipt_summary` frontmatter contract if receipt copy variants need it. | P2 |
| future shop-family variants | Checkout and upsell surfaces | Current first-class shop families have include-owned bumps, summaries, receipts, and bundle upsells. | Future variants should start from the nearest shop-single-step or shop-three-step contract. | Global all-page CI lint covers SDK wrapper safety; variant promotion still depends on catalog coverage. | Add a new family row only when a new shop variant introduces a distinct checkout or upsell structure. | Watch |

## Surface Types

These are the commerce-ready surfaces the library should enumerate and grow over time:

- Checkout shell
- Main product selector
- Tiered bundle selector
- Single-offer quantity selector
- MV configurable selector
- Variant slot controls
- Product media/gallery
- Price and discount display
- Promo/timer bar
- Express checkout
- Card payment block
- Contact/address fields
- Order bump
- Cart/order summary
- Upsell selector and accept/skip actions
- Receipt/order confirmation
- Trust/guarantee/support blocks

Each reusable surface should document:

- Template family
- Variant name
- Required SDK hooks
- Accepted frontmatter inputs
- Supported page types
- Responsive contract
- Quality checks
- Known failure modes

## Promotion Plan

Promote proven campaign-local work into template-family includes:

1. Shared frontmatter contracts for `price_display_variant` and promo/timer controls.
2. Extend receipt-summary frontmatter where future campaign variants need copy-level control beyond order item templates.
3. Add summary variant contracts only where the page layout can switch summary includes without nesting accordions or breaking responsive placement.
4. Add new family rows only when a future campaign introduces a distinct checkout, upsell, or receipt structure.
5. Keep all-page SDK lint green as new commerce surfaces are promoted.

The goal is not a small fixed set of templates. The goal is a growing library of commerce-ready surfaces that can be assembled into highly custom funnels while preserving SDK behavior.

## Lint Gates

- `npm run lint:sdk` keeps the v0 Olympus checkout default.
- `npm run lint:sdk:promoted` covers promoted checkout/select/upsell surfaces for `olympus`, `limos`, `demeter`, `shop-single-step`, `shop-three-step`, `olympus-mv-single-step`, and `olympus-mv-two-step`.
- `npm run lint:sdk:ci` covers all pages across all template families.
- `npm run lint:sdk:shop-single-step:all` covers checkout, upsell, and receipt pages for `shop-single-step`.
- `npm run lint:agent-contracts` validates the JSON catalog agent contracts and fixture shape.
- `node scripts/lint-sdk.mjs --scope=limos --pages=all` covers checkout, upsell, and receipt pages for `limos`.
- `node scripts/lint-sdk.mjs --scope=demeter --pages=all` covers checkout, upsell, and receipt pages for `demeter`.

Use `npm run lint:sdk:promoted:all` for a promoted-family all-page check during focused catalog work; CI already runs the full all-family all-page SDK lint.
