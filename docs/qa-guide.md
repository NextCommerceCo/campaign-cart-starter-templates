# QA Guide — Campaign Cart Templates

Use this guide alongside the [Sellmore QA dashboard](https://github.com/Sellmore-Co/QA-Sellmore) when QA-ing deployed campaign-kit campaigns. It covers what pages to load, which URL params to test, and template-specific things to check.

---

## Setup

1. Open the QA dashboard
2. Select the **Checkout & Upsells** mode
3. Enter your deployed checkout URL as the funnel URL (e.g. `https://your-campaign-domain.com/[slug]/checkout/`)
4. Add upsell and receipt URLs in the additional pages fields
5. Run through the checklist

The [template reference](#template-reference) section below lists the full page structure and relevant URL params for each template.

---

## Analytics (GTM / Meta Pixel)

Reference `campaign-kit-templates` injects **Google Tag Manager** and **Meta Pixel** from each campaign’s `_layouts/base.html`, using `gtm_id` and `fb_pixel_id` in `_data/campaigns.json`. Tags load only when the kit’s Liquid `environment` is **not** `development` (so `npm run dev` should not fire them; `npm run build` / deployed HTML should).

**Checks:**

- **Dev:** Open checkout in `npm run dev` — Network tab should not request `googletagmanager.com` / Facebook pixel endpoints (unless something else on the page loads them).
- **Production build:** Inspect `_site/[slug]/…/index.html` or the deployed page — snippets should be present and network requests should appear when IDs are real.

If you also enable `analytics.providers.gtm` / `facebook` in `assets/config.js`, you may get duplicate page views; pick one approach per campaign unless you know you need both.

---

## URL params

The QA dashboard has a params panel — use these to test how the page behaves with features toggled. Append directly to any page URL.

| Param | Effect |
|-------|--------|
| `forceProfile=` | Switch product profile |
| `forcePackageId=` | Preselect a package/variant (e.g. `2:1`) |
| `timer=n` | Disable countdown timer |
| `banner=n` | Remove promotional banner |
| `exit=n` | Disable exit intent coupon |
| `reviews=n` | Hide reviews and testimonials |
| `loading=n` | Hide fake loading/status bars |
| `seen=n` | Hide "As seen on" section |

---

## Template reference

### demeter / limos / olympus
Single-step checkout. All three follow the same page structure.

| Page | URL |
|------|-----|
| Checkout | `/[slug]/checkout/` |
| Upsell | `/[slug]/upsell/` |
| Receipt | `/[slug]/receipt/` |

No required params — pages load without `forcePackageId`.

---

### olympus-mv-single-step
Single-step checkout with multi-variant selection on the checkout page.

| Page | URL |
|------|-----|
| Checkout | `/[slug]/checkout/` |
| Upsell | `/[slug]/upsell-mv/` |
| Receipt | `/[slug]/receipt/` |

**Things to check:**
- Selecting each variant on the checkout page updates the price and selected package correctly
- `forcePackageId=` pre-selects a variant — verify the right option is highlighted

---

### olympus-mv-two-step
Two-step checkout — variant selection is a separate page before billing.

| Page | URL |
|------|-----|
| Select | `/[slug]/select/` |
| Checkout | `/[slug]/checkout/` |
| Upsell | `/[slug]/upsell-mv/` |
| Receipt | `/[slug]/receipt/` |

**Funnel entry point is `/select/`** — start QA from the select page, not checkout.

**Things to check:**
- Selecting a variant on `/select/` carries through correctly to `/checkout/`
- `forcePackageId=` on `/select/` pre-selects the correct variant
- Navigating back from `/checkout/` returns to `/select/` with the selection preserved

---

### shop-single-step
Shop-style checkout. Requires a package ID to render.

| Page | URL |
|------|-----|
| Checkout | `/[slug]/checkout/?forcePackageId=2:1` |
| Upsell | `/[slug]/upsell/?forcePackageId=2:1` |
| Receipt | `/[slug]/receipt/?forcePackageId=2:1` |

**`forcePackageId` is required** — without it the cart is empty and the page will not render correctly. Always include it when loading pages directly.

---

### shop-three-step
Three-step shop checkout. Requires a package ID to render.

| Page | URL |
|------|-----|
| Information | `/[slug]/information/?forcePackageId=2:1` |
| Shipping | `/[slug]/shipping/?forcePackageId=2:1` |
| Billing | `/[slug]/billing/?forcePackageId=2:1` |
| Upsell | `/[slug]/upsell/?forcePackageId=2:1` |
| Receipt | `/[slug]/receipt/?forcePackageId=2:1` |

**`forcePackageId` is required** on all pages.

**Things to check:**
- Full step flow: information → shipping → billing → upsell → receipt
- Step indicator updates correctly on each page
- Shipping method selected on `/shipping/` appears in the order summary on `/billing/`
- Navigating back between steps preserves previously entered data

---

## Common issues

| Issue | Where to look |
|-------|---------------|
| Page loads blank or cart is empty | Missing `forcePackageId` param (shop templates) |
| Upsell accept/decline doesn't navigate | Check `next_upsell_accept` / `next_upsell_decline` frontmatter values |
| Timer or banner visible when suppressed | Param not being picked up — check the URL, ensure no redirect is stripping params |
| Wrong variant shown after step navigation | Package ID not persisting across steps — check SDK config and session handling |
| Assets 404 on deployed URL | `campaign_asset` paths not resolving — check the slug in campaigns.json matches the deployed folder name |
| Duplicate GTM / Meta events | Layout-injected tags plus SDK `analytics.providers` both enabled — disable one source or adjust container rules |
