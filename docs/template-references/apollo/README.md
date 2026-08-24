# Apollo Template Reference provenance

The reference images in this directory capture `/apollo/checkout/` from starter-template source commit `e9a2fc17beefe572b8ddc0c4f9b1b8e2f97f9a59` with Campaign Cart SDK `0.4.37`.

## Reproduce

1. Check out the source commit and run `npm ci && npm run build`.
2. Serve `_site` locally and open `/apollo/checkout/` in headless Chromium.
3. Disable animation and transitions, set `deviceScaleFactor: 1`, and take full-page screenshots at:
   - desktop: `1440x900`
   - mobile: `390x844`
4. Store the captures as `checkout-desktop.png` and `checkout-mobile.png`.
5. Update the rendered dimensions and SHA-256 values in `docs/commerce-surface-catalog.json`.
6. Run `npm run lint:agent-contracts`; the lint verifies the files are PNGs and checks their actual dimensions and hashes against the catalog.

The committed capture used Playwright Chromium with reduced motion and the following injected style before the screenshot:

```css
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
```
