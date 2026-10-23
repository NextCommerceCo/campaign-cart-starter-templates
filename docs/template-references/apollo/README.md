# Apollo Template Reference provenance

**Recaptured on 2026-10-23** with Campaign Cart SDK `0.4.43` on the shipping-coupon-tiers branch (based on `main` at `b38343e85a05ec2fe949e13e783057d4c717a8d6`), which landed as `11af184434963340df74bee96a1f8559fcbf9028` (#246, the `source_commit` in the catalog) after a visible checkout change: the 2x bundle card now shows "+ Free Shipping" (tiers use one shipping method plus a free-shipping coupon on 2+), and the promo banner trail reads "Free shipping on 2+". Captured with the procedure below (Playwright 1.61.1 Chromium, full page, animations frozen, SDK initialised and payment logos resolved). Document heights are unchanged (desktop 1491px, mobile 2648px). Prices render in the campaign currency the SDK picks from the visitor's location; these captures, like the 2026-09-25 ones, show CAD. A pixel comparison against the previous captures also shows sub-pixel text-rendering differences across the page (a different Chromium build), with no element moved. `source_commit` was re-stamped to that merge commit afterwards; the PNGs and hashes are the ones captured on the branch. The only render-affecting change after the capture was the review fix to `bundle-selector.html`'s default-tier branch, which the checkout page does not render (it passes `bundles`), so the rendered checkout is unchanged.

The reference images in this directory capture `/apollo/checkout/`. They were captured on 2026-09-25 with Campaign Cart SDK `0.4.38` on the composable-upsell-partials branch (based on `main` at `6c96525b6416872ad0e51918fe6ec82a9673808c`) after a visible checkout change: the flat payment-logo sprite under the submit button was replaced by the shared `payment-logos.html` partial, whose logos are revealed from the campaign's `available_payment_methods` (the capture shows the demo campaign's Visa, Mastercard, Amex, Discover, PayPal and Apple Pay).

**Revalidated unchanged on 2026-10-06** from `main` at `4ca7857e3540fffbf0bd3f43b63a77a76752a5f7` (re-stamped the same day to `1a3bf7218e7f10ef5733ceba84d2856eeca2cfbd`, the `source_commit` in the catalog, after #217 changed only a comment in `src/apollo/assets/config.js`) with SDK `0.4.41`, after the SDK bump (#211) and the SDK-built `data-next-address` address blocks (#215) landed. A fresh capture with the procedure below was pixel-compared against the committed images: desktop differed only in the live countdown digits (a 46×13 px patch), mobile only in the countdown digits, anti-aliasing on the guarantee badge and the order-bump thumbnail, and the lazy-loaded "As seen in" placeholders — document heights identical (desktop 1491px, mobile 2648px), nothing moved. The address blocks and the 0.4.41 card fields live inside the `checkout_reveal` panel, which is off-screen until "Add to Cart", so the pre-reveal page these captures witness is unaffected by either change. The PNGs and their hashes were therefore left as they are and only `source_commit` was re-stamped, per "When to recapture" below.

**Re-stamped on 2026-10-16** to `ac529485f0a728cf9c6ac8dbcde81041bd1c6ba8` (#234 on `main`) without recapturing. Since `1a3bf72` the render-affecting changes were non-visual for this page: #229 only changed the `<head>` prefetch hint in `_layouts/base.html` (apollo checkout has no `next_step`, so it still prefetches `next_url`), and #234 moved the promo banner into the shared build-time `promo-banner.html`. For apollo, that left the banner markup and classes unchanged (`promo-banner--apollo`), moved its existing `section_header` wrapper from `checkout.html` into the partial (dropping `data-next-hide`, adding `data-promo-banner`, the hook `?banner=n` hides), and added an inline pre-paint script for `?banner=n`. The new `next-core.css` rules are scoped to `.promo-banner--classic` and to `html.cc-promo-*` classes that only `?banner=` / `?topbar=` set. The rendered checkout HTML was diffed against `main` before #234, and the page was checked by eye in a local dev browser. No pixel comparison was run, so the PNGs and hashes are unchanged.

**Re-stamped on 2026-10-21** to `03f5982d703e07f8dc6beaedc121d55093373e4d` (#239 on `main`, the SDK 0.4.43 / Shop Pay bump) without recapturing. The render-affecting changes since `ac52948` were non-visual for this page: the new `next-core.css` rules style the SDK-built express buttons (Shop Pay, Link, logo centring, the Apple Pay / Google Pay nudge) and the Link / Shop Pay tiles in the payment-logos row; `config.js` only widened `paymentConfig.expressCheckout.methodOrder`; `_shared/` gained a Shop Pay radio, a Shop Pay logo tile and reworded redirect copy. The express buttons and every payment radio live inside the `checkout_reveal` panel, which is off-screen until "Add to Cart", so the pre-reveal page these captures witness does not include them. The one pre-reveal element touched is the payment-logos row under "Add to Cart": its new height rules apply only to the `link` / `shop_pay` tiles, which stay `hidden` because the demo campaign offers neither. Checked in a local dev browser on the demo campaign (no Shop Pay or Link) and against the rendered HTML; no pixel comparison was run, so the PNGs and hashes are unchanged.

Earlier history: originally captured from `e9a2fc17beefe572b8ddc0c4f9b1b8e2f97f9a59` with SDK `0.4.37`, revalidated unchanged with SDK `0.4.38` through `38f5693a2839cb3a3f8587f0dffee841f13d6114` (#149).

## Reproduce

1. Check out the source commit and run `npm ci && npm run build`.
2. Serve `_site` locally and open `/apollo/checkout/` in headless Chromium.
3. Disable animation and transitions, set `deviceScaleFactor: 1`, and take full-page screenshots with these browser viewports:
   - desktop viewport: `1440x900`
   - mobile viewport: `390x844`
   Because the capture is full-page, the PNG width matches the viewport while its height matches the rendered document. The committed captures are therefore `1440x1491` and `390x2648`, respectively.
4. Store the captures as `checkout-desktop.png` and `checkout-mobile.png`.
5. Update the rendered dimensions and SHA-256 values in `docs/commerce-surface-catalog.json`.
6. Update `source_commit` to the commit the captures were taken from.
7. Run `npm run lint:agent-contracts`; the lint verifies the files are PNGs, checks their actual dimensions and hashes against the catalog, and reports whether render-affecting sources have moved since `source_commit`.

## When to recapture

`npm run lint:agent-contracts` warns when `src/apollo/`, the shared sources under `_shared/`, or the canonical `next-core.css` have changed since `source_commit`. The warning does not fail CI — it only says the reference *may* be stale. Resolve it one of two ways:

- The render changed: redo the capture above, including step 6.
- The render did not change (a non-visual edit): re-stamp `source_commit`, leaving the PNGs and their hashes as they are. Use a commit that survives the merge, such as the `origin/main` tip your branch is based on. The repo squash-merges, so a branch commit disappears once the PR lands and the lint would then report the stamp as not present in the clone.

Either way the warning clears, and the next reader sees a reference whose provenance is honest about what it was checked against.

The committed capture used Playwright Chromium with reduced motion, the SDK initialised (payment logos resolved), the window scrollbar hidden so the layout width equals the viewport, and the following injected style before the screenshot:

```css
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
```
