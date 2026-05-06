# Commerce Surface Catalog

This catalog is a routing aid for agents and developers assembling Campaign Cart funnels from designed HTML. It should stay dry and predictable: use it to pick known template-family surfaces, not to make expensive visual guesses.

Machine-readable companion: [`commerce-surface-catalog.json`](./commerce-surface-catalog.json).

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

If the top family match is below high confidence, or if two families look plausible, ask the user before wiring commerce components. A good passback is:

> I can map this design to `olympus` or `olympus-mv-two-step`. The ambiguity is the tier card layout plus variant slot behavior. Which family should I use before wiring SDK components?

## Family Surface Matrix

| Family | Status | Primary Checkout Surface | Summary | Notes |
| --- | --- | --- | --- | --- |
| `olympus` | Partial frontmatter API exists | Tiered bundle selector | `cart-summary01-04` | Reference model from Meridian `theduo-v2`; `bundles:` frontmatter feeds `bundle-selector.html`. |
| `limos` | Partial frontmatter API exists | Single offer card with native quantity stepper | `cart-summary02` accordion | Roadflare surface promoted to `single-offer-quantity-selector.html`; checkout wrappers are covered by promoted lint scope. |
| `demeter` | Partial frontmatter API exists | Editorial tier cards | `cart-summary03` side cart | Veyra surface promoted to `editorial-tier-selector.html`; summary and checkout wrappers are covered by promoted lint scope. |
| `shop-single-step` | Partial include API exists | Shop checkout with single-step payment | `cart-summary04` checkout summary | Highly used shop flow; checkout, receipt, and upsell SDK surfaces are now include-owned and catalog-wrapped. |
| `olympus-mv-single-step` | Partial frontmatter API exists | MV configurable selector in checkout | `cart-summary01/03/04` | First-class MV checkout selector promoted to `mv-configurable-selector.html`; slots remain an MV-specific API. |
| `olympus-mv-two-step` | Partial frontmatter API exists | Select step + checkout review/payment | `cart-summary03/04` | First-class select surface promoted to `mv-selection-step.html` + `mv-slot-stage.html`; checkout wrappers covered by promoted lint scope. |

## Gap Matrix

| Family | Surface | Current Implementation | Frontmatter Contract | Lint Coverage | Promotion Needed | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| `olympus` | Tiered bundle selector | Include: `src/olympus/_includes/bundle-selector.html`; used from `src/olympus/checkout.html`. | Yes: `selector_id`, `await`, `include_shipping`, `selection_mode`, `bundles`. Meridian `theduo-v2` passes `bundles:` frontmatter. | Yes for default checkout source/rendered scope. | Finish parity for related variants and wrappers. | P1 |
| `olympus` | Order summary | Includes: `cart-summary01.html` through `cart-summary04.html` have component headers/wrappers. | Partial: no summary frontmatter API yet. | Yes for default checkout source/rendered scope. | Expose `cart_summary_variant`. | P2 |
| `olympus` | Payment shell | Include: `payment-methods.html`; express checkout has a matching component header. | Yes: `show_paypal`, `show_klarna`, `show_apple_pay`, `show_google_pay`. | Yes for default Olympus checkout/rendered wrapper path. | Keep as shared model for other families. | P2 |
| `olympus` | Order bump | `bump-check01.html`, `bump-check02.html`, and `bump-switch01.html` have component headers/wrappers. | Partial: `package_id`, text/image/features, sync flags only on check01. | Yes for rendered wrapper scope when variants are used. | Add parameter parity across bump variants. | P1 |
| `limos` | Main selector and quantity stepper | Include: `src/limos/_includes/single-offer-quantity-selector.html`; used from `src/limos/checkout.html`. | Yes: selector/package/shipping ids, items JSON, quantity min/max, image/label text. | Yes under `npm run lint:sdk:promoted`. | Add richer frontmatter object shape for multi-copy campaigns. | P1 |
| `limos` | Summary, payment, bump, receipt | Includes are present for `cart-summary02.html`, `payment-methods.html`, bumps, and `receipt-skeleton.html`; checkout summary/payment/bump wrappers are now catalog-marked. | Partial: payment flags still work; family-local headers are shallow except the selector. | Yes under promoted checkout rendered scope; receipt is outside checkout/select scope. | Add durable headers to remaining receipt/upsell surfaces. | P2 |
| `demeter` | Editorial tier selector | Include: `src/demeter/_includes/editorial-tier-selector.html`; used from `src/demeter/checkout.html`. | Yes: selector mode, include shipping, and `bundles` array. | Yes under `npm run lint:sdk:promoted`. | Add richer merchant-facing frontmatter defaults. | P1 |
| `demeter` | Side summary | Include: `src/demeter/_includes/cart-summary03.html`, selected by `cart_summary_variant` from checkout side cart. | Yes: `cart_summary_variant`, `cart_summary_heading`, `cart_summary_subtitle`, `cart_summary_feature_package`. | Yes under promoted checkout rendered scope. | Add more summary variants if/when Demeter gains them. | P1 |
| `shop-single-step` | Checkout summary/payment/bump | Includes: `cart-summary04.html`, `express-checkout.html`, `payment-methods.html`, and `bump-check02.html`; used from `src/shop-single-step/checkout.html`. | Partial: payment flags; summary/bump variants are fixed in the page. | Yes under global checkout CI lint and shop-single-step all-page source/rendered lint. | Add frontmatter selection for summary/bump variants if campaign variants need it. | P1 |
| `shop-single-step` | Receipt/order confirmation | Includes: `receipt-skeleton.html`, `receipt-order-summary-mobile.html`, and `receipt-order-summary-desktop.html`; used from `src/shop-single-step/receipt.html`. | No frontmatter API; order item template IDs and display bindings are fixed. | Yes under shop-single-step all-page source/rendered lint. | Consider a shared receipt summary include across shop templates. | P2 |
| `shop-single-step` | Upsell selectors/actions | Includes: `upsell-bundle-stepper-offer.html`, `upsell-bundle-tier-pills-offer.html`, and `upsell-bundle-tier-cards-offer.html`; used from the matching upsell pages. | No frontmatter API; package IDs, bundle tiers, vouchers, and offer copy remain local to includes. | Yes under shop-single-step all-page source/rendered lint. | Promote frontmatter-configurable upsell bundle tiers after shop-three-step parity check. | P1 |
| `olympus-mv-single-step` | MV selector and variant slots | Include: `src/olympus-mv-single-step/_includes/mv-configurable-selector.html`; used from checkout. | Partial: selector/template ids; bundle definitions still local to the include. | Yes under `npm run lint:sdk:promoted`. | Move MV bundle/slot definitions into frontmatter. | P1 |
| `olympus-mv-two-step` | Select step and variant slots | Includes: `mv-selection-step.html` and `mv-slot-stage.html`; used from `src/olympus-mv-two-step/select.html`. | Partial: selector/template ids; bundle definitions still local to the include. | Yes under `npm run lint:sdk:promoted`. | Move MV bundle/slot definitions into frontmatter. | P1 |
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
3. Promote upsell selector/action surfaces after checkout/select coverage.
4. Add durable headers to remaining receipt surfaces.

The goal is not a small fixed set of templates. The goal is a growing library of commerce-ready surfaces that can be assembled into highly custom funnels while preserving SDK behavior.
