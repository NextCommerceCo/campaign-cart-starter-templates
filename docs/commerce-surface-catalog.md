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
| `olympus` | Partial frontmatter API exists | Tiered bundle selector | `cart-summary01-04` | Reference model from Meridian `theduo-v2`; `bundles:` frontmatter feeds `bundle-selector.html`, and `shipping_methods` keeps Campaigns App shipping refs explicit. |
| `limos` | Partial include/frontmatter API exists | Single offer card with native quantity stepper | `cart-summary02` accordion | Roadflare checkout plus upsell/receipt surfaces are include-owned; upsell exposes `upsell_offer` / `upsell_bundle_tiers`, receipt exposes `receipt_summary`. |
| `demeter` | Partial include/frontmatter API exists | Editorial tier cards | `cart-summary03` side cart | Veyra checkout plus upsell/receipt surfaces are include-owned; upsell exposes `upsell_offer` / `upsell_bundle_tiers`, receipt exposes `receipt_summary`. |
| `shop-single-step` | Partial include API exists | Shop checkout with single-step payment | `cart-summary04` checkout summary | Highly used shop flow; checkout, receipt, and upsell SDK surfaces are now include-owned and catalog-wrapped. |
| `shop-three-step` | Partial contract exists | Information -> shipping -> billing checkout | `cart-summary04` checkout/review shape | Shipping methods are rendered dynamically from `sdk.getShippingMethods()`; do not add Olympus-style `shipping_methods` frontmatter for checkout shipping. |
| `olympus-mv-single-step` | Partial frontmatter API exists | MV configurable selector in checkout | `cart-summary01/03/04` | First-class MV checkout selector promoted to `mv-configurable-selector.html`; `packages.main_package` now feeds MV bundle item JSON unless a slot overrides `items_json`. |
| `olympus-mv-two-step` | Partial frontmatter API exists | Select step + checkout review/payment | `cart-summary03/04` | First-class select surface promoted to `mv-selection-step.html` + `mv-slot-stage.html`; `packages.main_package` now feeds MV bundle item JSON unless a slot overrides `items_json`. |

## Agent Contract Layer

The contract layer is intentionally lighter than a campaign readiness check. It does not validate a real CampaignSpec against a live Campaigns API; it documents how an agent should translate spec/API truth into starter-template frontmatter and partial choices.

Use it in this order:

1. Pick the family from cheap catalog signals and ask when ambiguous.
2. Read `families[family].agentContract` in the JSON catalog.
3. Replace all `frontmatter.demoOnlyValues` from the target CampaignSpec/API.
4. Use the family fixture under `docs/fixtures/campaign-specs/` as an example of the mapping shape, not as live data.
5. Run `npm run lint:agent-contracts` after catalog or fixture changes.

The important boundary is: CampaignSpec/API owns package refs, shipping refs, vouchers, payment support, routing, tracking, footer links, and SEO. Starter templates own the stable SDK DOM shape and family-specific frontmatter vocabulary.

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
| `olympus` | Tiered bundle selector | Include: `src/olympus/_includes/bundle-selector.html`; used from `src/olympus/checkout.html`. | Yes: `selector_id`, `await`, `include_shipping`, `selection_mode`, `packages.main_package`, `shipping_methods`, and `bundles` with quantity-driven item JSON. Starter `shipping_methods` demonstrate standard/free tier wiring and must be replaced from the target CampaignSpec/Campaigns App. | Yes for default checkout source/rendered scope. | Finish parity for related variants and wrappers. | P1 |
| `olympus` | Order summary | Includes: `cart-summary01.html` through `cart-summary04.html` have component headers/wrappers. | Partial: no summary frontmatter API yet. | Yes for default checkout source/rendered scope. | Expose `cart_summary_variant`. | P2 |
| `olympus` | Payment shell | Include: `payment-methods.html`; express checkout has a matching component header. | Yes: `show_paypal`, `show_klarna`, `show_apple_pay`, `show_google_pay`. | Yes for default Olympus checkout/rendered wrapper path. | Keep as shared model for other families. | P2 |
| `olympus` | Order bump | `bump-check01.html`, `bump-check02.html`, and `bump-switch01.html` have component headers/wrappers. | Partial: `package_id`, text/image/features, sync flags only on check01. | Yes for rendered wrapper scope when variants are used. | Add parameter parity across bump variants. | P1 |
| `limos` | Main selector and quantity stepper | Include: `src/limos/_includes/single-offer-quantity-selector.html`; used from `src/limos/checkout.html`. | Yes: `single_offer` object covers selector/package/shipping method, quantity min/max, image/label text, and `price_display_variant`; `shipping_methods.standard` holds the starter shipping ref to replace from the target CampaignSpec/Campaigns App. | Yes under `npm run lint:sdk:promoted`. | Add campaign-specific examples after the next Limos build. | P1 |
| `limos` | Summary, payment, bump | Includes are present for `cart-summary02.html`, `payment-methods.html`, and bumps; checkout summary/payment/bump wrappers are catalog-marked. | Partial: payment flags work; `order_bump_variant` chooses check/switch/both/none and `order_bump.check01` / `order_bump.switch01` control package IDs and copy. | Yes under promoted checkout rendered scope. | Add campaign-specific examples after the next Limos build. | P2 |
| `limos` | Receipt/order confirmation | Includes: `receipt-skeleton.html`, `receipt-order-summary-mobile.html`, and `receipt-order-summary-desktop.html`; used from `src/limos/receipt.html`. | Yes: `receipt_summary` controls title, scroll hint, and separate mobile/desktop order item template IDs. | Yes under targeted all-page lint: `node scripts/lint-sdk.mjs --scope=limos --pages=all`. | Monitor for campaign-specific receipt copy variants. | P1 |
| `limos` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under targeted all-page lint: `node scripts/lint-sdk.mjs --scope=limos --pages=all`. | Add campaign-specific examples if the next Limos build changes markup. | P1 |
| `demeter` | Editorial tier selector | Include: `src/demeter/_includes/editorial-tier-selector.html`; used from `src/demeter/checkout.html`. | Yes: selector mode, include shipping, `packages.main_package`, `shipping_methods`, `bundles` array with quantity-driven item JSON, and `price_display_variant`. Starter shipping refs demonstrate standard/free tier wiring and must be replaced from the target CampaignSpec/Campaigns App. | Yes under `npm run lint:sdk:promoted`. | Add campaign-specific examples after the next Demeter build. | P1 |
| `demeter` | Side summary and bump | Include: `src/demeter/_includes/cart-summary03.html`, selected by `cart_summary_variant` from checkout side cart; bump includes are frontmatter-controlled. | Yes: `cart_summary_variant`, `cart_summary_heading`, `cart_summary_subtitle`, `cart_summary_feature_package`, `order_bump_variant`, and `order_bump.*`. | Yes under promoted checkout rendered scope. | Add more summary variants if/when Demeter gains them. | P1 |
| `demeter` | Receipt/order confirmation | Includes: `receipt-skeleton.html`, `receipt-order-summary-mobile.html`, and `receipt-order-summary-desktop.html`; used from `src/demeter/receipt.html`. | Yes: `receipt_summary` controls title, scroll hint, and separate mobile/desktop order item template IDs. | Yes under targeted all-page lint: `node scripts/lint-sdk.mjs --scope=demeter --pages=all`. | Monitor for campaign-specific receipt copy variants. | P1 |
| `demeter` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under targeted all-page lint: `node scripts/lint-sdk.mjs --scope=demeter --pages=all`. | Add campaign-specific examples if the next Demeter build changes markup. | P1 |
| `shop-single-step` | Checkout summary/payment/bump | Includes: `cart-summary04.html`, `express-checkout.html`, `payment-methods.html`, and `bump-check02.html`; used from `src/shop-single-step/checkout.html`. | Partial: payment flags; summary/bump variants are fixed in the page. | Yes under global checkout CI lint and shop-single-step all-page source/rendered lint. | Add frontmatter selection for summary/bump variants if campaign variants need it. | P1 |
| `shop-single-step` | Receipt/order confirmation | Includes: `receipt-skeleton.html`, `receipt-order-summary-mobile.html`, and `receipt-order-summary-desktop.html`; used from `src/shop-single-step/receipt.html`. | Yes: `receipt_summary` controls title, scroll hint, and separate mobile/desktop order item template IDs. | Yes under `npm run lint:sdk:shop-single-step:all`; global CI still covers checkout/select only. | Consider a shared receipt summary include across shop templates. | P2 |
| `shop-single-step` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | Yes: `upsell_offer` controls package/selector/voucher ids and button copy; `upsell_bundle_tiers` controls tier ids, item JSON, vouchers, labels, and selected state. | Yes under `npm run lint:sdk:shop-single-step:all`; global CI still covers checkout/select only. | Mirror the contract into shop-three-step only after confirming matching markup. | P1 |
| `shop-three-step` | Dynamic shipping step | `src/shop-three-step/assets/js/checkout-shop-three-shipping.js` renders shipping method radios from `sdk.getShippingMethods()`. | Runtime/API-driven rather than frontmatter-driven; fixture documents this as `runtime_shipping_source`. | Yes under global checkout CI lint for checkout/select pages. | Keep dynamic shipping separate from Olympus-style selector shipping. | P1 |
| `shop-three-step` | Upsell and receipt surfaces | Upsell/receipt pages currently keep more inline SDK roots than `shop-single-step`. | Partial: catalog agent contract and fixture exist; family-local include promotion remains future work. | Outside promoted all-page lint today. | Promote to shop-single-step parity includes in a focused follow-up. | P1 |
| `olympus-mv-single-step` | MV selector and variant slots | Include: `src/olympus-mv-single-step/_includes/mv-configurable-selector.html`; used from checkout. | Yes: `checkout_step` controls selector id and headings; `packages.main_package` supplies the package id; `shipping_methods` supplies starter standard/free refs; `variant_slots` controls bundle ids, quantity, optional per-slot `package_id` / `items_json` overrides, shipping method, labels, and selected state. | Yes under `npm run lint:sdk:promoted`. | Add campaign-specific examples after the next MV build. | P1 |
| `olympus-mv-two-step` | Select step and variant slots | Includes: `mv-selection-step.html` and `mv-slot-stage.html`; used from `src/olympus-mv-two-step/select.html`. | Yes: `select_step` and `checkout_step` keep selector ids aligned; `packages.main_package` supplies the package id; `shipping_methods` supplies starter standard/free refs; `variant_slots` controls bundle ids, quantity, optional per-slot `package_id` / `items_json` overrides, shipping method, labels, and selected state. | Yes under `npm run lint:sdk:promoted`. | Add campaign-specific examples after the next MV two-step build. | P1 |
| `olympus-mv-*` | Checkout payment and summary | Payment, express checkout, and summary includes have catalog wrappers in both MV families. | Partial/no MV-specific summary contract. | Yes under promoted checkout/select rendered scope. | Add summary variant contract and receipt/upsell scope. | P2 |
| remaining non-Olympus shop variants | Upsell selectors | Some upsell pages still inline bundle selectors/actions; comments preserve SDK assumptions around `data-next-upsell="offer"` and first in-offer selector. | No reusable frontmatter contract. | Outside default checkout scope and usually outside `pages=checkout`. | Check shop-three-step next; mirror shop-single-step includes if structure matches. | P2 |

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
- QA checks
- Known failure modes

## Promotion Plan

Promote proven campaign-local work into template-family includes:

1. Shared frontmatter contracts for `price_display_variant`, `promo_timer`, and `order_bump_variant`.
2. Move MV bundle/slot definitions from include defaults into page frontmatter.
3. Mirror Shop single-step upsell/receipt contracts into Limos and Demeter, keeping family-local wrappers and frontmatter contracts.
4. Mirror Shop single-step upsell/receipt contracts into matching shop-three-step surfaces if parity holds.
5. Add durable headers to remaining Olympus and MV receipt/upsell surfaces.

The goal is not a small fixed set of templates. The goal is a growing library of commerce-ready surfaces that can be assembled into highly custom funnels while preserving SDK behavior.

## Lint Gates

- `npm run lint:sdk` keeps the v0 Olympus checkout default.
- `npm run lint:sdk:promoted` covers promoted checkout/select surfaces for `olympus`, `limos`, `demeter`, `olympus-mv-single-step`, and `olympus-mv-two-step`.
- `npm run lint:sdk:ci` covers checkout/select pages across all template families.
- `npm run lint:sdk:shop-single-step:all` covers checkout, upsell, and receipt pages for `shop-single-step`.
- `npm run lint:agent-contracts` validates the JSON catalog agent contracts and fixture shape.
- `node scripts/lint-sdk.mjs --scope=limos --pages=all` covers checkout, upsell, and receipt pages for `limos`.
- `node scripts/lint-sdk.mjs --scope=demeter --pages=all` covers checkout, upsell, and receipt pages for `demeter`.

Do not turn promoted all-page lint into CI yet. Olympus and Olympus-MV still have inline upsell/receipt SDK roots that should be promoted in smaller family-by-family PRs.
