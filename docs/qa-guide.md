# QA Guide — Campaign Cart Templates

Use this guide alongside the [Sellmore QA dashboard](https://github.com/Sellmore-Co/QA-Sellmore) when QA-ing deployed campaign-kit campaigns. It covers what pages to load, which URL params to test, and template-specific things to check.

---

## Setup

1. Open the QA dashboard
2. Select the **Checkout & Upsells** mode
3. Enter your deployed checkout URL as the funnel URL (e.g. `https://your-campaign-domain.com/[slug]/checkout/`). For **shop-three-step**, use **`…/[slug]/information/`** as the entry (there is no **`/checkout/`** page).
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
Single-step checkout. All three follow the same page structure with a 3-page upsell chain.

| Page | URL |
|------|-----|
| Checkout | `/[slug]/checkout/` |
| Upsell — stepper | `/[slug]/upsell-bundle-stepper/` |
| Upsell — tier pills | `/[slug]/upsell-bundle-tier-pills/` |
| Upsell — tier cards | `/[slug]/upsell-bundle-tier-cards/` |
| Receipt | `/[slug]/receipt/` |

No required params — pages load without `forcePackageId`.

**Reference repo pins:** **`olympus`**, **`limos`**, and **`olympus-mv-single-step`** use **`sdk_version` `0.4.18`** in [`campaign-kit-templates/_data/campaigns.json`](../campaign-kit-templates/_data/campaigns.json).

**`limos` checkout — bundle quantity (0.4.18):** Use the **`.next-bundle-qty`** stepper (anchored on **`.checkout-bundle-offer`**, same “outside selector” pattern as **`upsell-bundle-stepper`**); totals and submitted line quantity should advance **one step per + click**. **`olympus`** checkout intentionally has **no** checkout bundle-qty UI — compare behavior on **limos** only.

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

**`olympus-mv-single-step`:** Pin **`sdk_version`** in `campaigns.json` to match your Campaign Cart build (reference repo **0.4.18**). Upsell at **`upsell-mv.html`** is **Approach B** (bundle selector + **`data-next-upsell-context`**). Confirm **per-tier voucher codes** in Campaigns match **`data-next-bundle-vouchers`** on each tier card; accept adds the selected tier with the right code. External slot variant UI: native **`<select>`** works without extra JS; custom **`os-dropdown`** requires **`setupBundleSlotVariantDropdowns()`** in campaign JS — see **`docs/sdk-0.4.0-migration.md`** and JS file headers. **BS-018** (checkout coupon vs upsell **`bundle.*`** display): **verified** on **0.4.17+** reference smoke — see **`docs/campaign-issues-overview.md`** fixed **#14** / **`docs/template-bug-log.md`** **BS-018**; regression-watch on SDK upgrades.

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
Shop-style checkout. Requires a package ID to render — cart is pre-populated before checkout (no bundle selector on the checkout page).

| Page | URL |
|------|-----|
| Checkout | `/[slug]/checkout/?forcePackageId=1:1` |
| Upsell — stepper | `/[slug]/upsell-bundle-stepper/?forcePackageId=1:1` |
| Upsell — tier pills | `/[slug]/upsell-bundle-tier-pills/?forcePackageId=1:1` |
| Upsell — tier cards | `/[slug]/upsell-bundle-tier-cards/?forcePackageId=1:1` |
| Receipt | `/[slug]/receipt/?forcePackageId=1:1` |

**`forcePackageId` is required** — without it the cart is empty and the page will not render correctly. Always include it when loading pages directly. Upsell chain matches olympus (stepper → tier-pills → tier-cards).

**Things to check:**
- Top **`checkout-header--lg`** bar + **`checkout--shop`** layout: logo once, mobile order summary aligns with main column padding

---

### shop-three-step
Three-step shop checkout. Requires a package ID to render.

| Page | URL |
|------|-----|
| Information | `/[slug]/information/?forcePackageId=1:1` |
| Shipping | `/[slug]/shipping/?forcePackageId=1:1` |
| Billing | `/[slug]/billing/?forcePackageId=1:1` |
| Upsell — stepper | `/[slug]/upsell-bundle-stepper/?forcePackageId=1:1` |
| Upsell — tier pills | `/[slug]/upsell-bundle-tier-pills/?forcePackageId=1:1` |
| Upsell — tier cards | `/[slug]/upsell-bundle-tier-cards/?forcePackageId=1:1` |
| Receipt | `/[slug]/receipt/?forcePackageId=1:1` |

**`forcePackageId` is required** on all pages.

**Things to check:**
- Default: logo in the **left column** (no top **`checkout-header--lg`** bar); **`page-wrapper`** has **`checkout--shop checkout--shop-column-logo`**. If you enable the top bar, remove **`checkout--shop-column-logo`**, uncomment the include, add **`hide`** on the column brand, and confirm a single logo and spacing.
- Full step flow: information → shipping → billing → upsell-bundle-stepper → upsell-bundle-tier-pills → upsell-bundle-tier-cards → receipt
- Step indicator updates correctly on each page (Information active on step 1, Shipping on step 2, Payment on step 3)
- Shipping methods render dynamically on `/shipping/` (populated by `checkout-shop-three-shipping.js`)
- Shipping method selected on `/shipping/` appears in the review section on `/billing/`
- Review fields on `/billing/` show correct email, address, phone, and shipping method name
- Navigating back between steps preserves previously entered data
- Step guard: accessing `/billing/` directly (without completing step 1) should redirect to `/information/`

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
