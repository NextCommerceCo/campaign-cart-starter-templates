# Apollo Template Reference provenance

The reference images in this directory capture `/apollo/checkout/`. They were captured on 2026-09-25 with Campaign Cart SDK `0.4.38` on the composable-upsell-partials branch (based on `main` at `6c96525b6416872ad0e51918fe6ec82a9673808c`) after a visible checkout change: the flat payment-logo sprite under the submit button was replaced by the shared `payment-logos.html` partial, whose logos are revealed from the campaign's `available_payment_methods` (the capture shows the demo campaign's Visa, Mastercard, Amex, Discover, PayPal and Apple Pay).

**Revalidated unchanged on 2026-10-06** from `main` at `4ca7857e3540fffbf0bd3f43b63a77a76752a5f7` (the `source_commit` stamped in the catalog) with SDK `0.4.41`, after the SDK bump (#211) and the SDK-built `data-next-address` address blocks (#215) landed. A fresh capture with the procedure below was pixel-compared against the committed images: desktop differed only in the live countdown digits (a 46×13 px patch), mobile only in the countdown digits, anti-aliasing on the guarantee badge and the order-bump thumbnail, and the lazy-loaded "As seen in" placeholders — document heights identical (desktop 1491px, mobile 2648px), nothing moved. The address blocks and the 0.4.41 card fields live inside the `checkout_reveal` panel, which is off-screen until "Add to Cart", so the pre-reveal page these captures witness is unaffected by either change. The PNGs and their hashes were therefore left as they are and only `source_commit` was re-stamped, per "When to recapture" below.

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
