# `_shared/analytics/` — canonical analytics source (generated into every family)

This is the **single source of truth** for the Route C analytics capability (GTM + Meta Pixel + the
direct GA4 / Axon / Taboola / Triple Whale / TikTok / Northbeam / Snapchat / Pinterest adapters). It
lives outside `src/` so the build never treats it as a campaign slug (kit discovery is
`campaigns.json`-keyed).

```
_shared/analytics/
├── _includes/
│   ├── analytics-head.html   → generated into every src/<family>/_includes/
│   └── analytics-body.html   → generated into every src/<family>/_includes/
└── js/
    ├── next-forwarder-core.js   → generated into every src/<family>/assets/js/
    ├── <vendor>.adapter.js       (8 vendor adapters) → …/assets/js/
    └── meta.adapter.js           (Meta Pixel extras, no events) → …/assets/js/
```

## Edit here, never the copies
The per-family files carry a `GENERATED …` header. **Edit the file in `_shared/analytics/`, then run:**

```sh
npm run sync:shared     # write the generated copies into all 8 families
npm run lint:shared     # verify no drift (CI gate; fails if a family is stale)
```

`sync-shared.mjs` owns the family list (`landing` is excluded — its analytics are commented-out
examples). CI runs `lint:shared` before the build, so a stale family fails the PR (same discipline as
`lint:next-core`). The `js/` files are kept byte-identical to
`analytics-tracking-docs/examples/` so re-syncing from the upstream reference stays a straight copy.

## Off by default — turning a vendor on
The capability is **inert** until a campaign sets the vendor's id in `_data/campaigns.json`. Each gate is
hardened as `{% if campaign.<id> and campaign.<id> != "" %}`, so **absent OR empty = off** (a family or a
copied template with no analytics fields renders nothing). Set the id to turn it on:

**Schema convention:** `_data/campaigns.json` entries stay **lean** — no entry carries the vendor block
by default (only the long-standing `gtm_id`/`fb_pixel_id`). Because absent = off, a campaign adds only
the keys for the vendors it actually uses. This README is the canonical key list: enable a vendor by
copying its row from the table below (or the full block from the snippet underneath) into the campaign's
entry.

| Vendor | `campaigns.json` id (set to enable) | Optional |
|---|---|---|
| GTM | `gtm_id` | — |
| Meta Pixel | `fb_pixel_id` | `meta_advanced_matching_enabled` (`"true"` = on, PII) — see [Meta Pixel extras](#meta-pixel-extras-metaadapterjs) |
| RudderStack | `rudderstack_write_key` **and** `rudderstack_dataplane_url` (both required) | — |
| GA4 | `ga4_id` | `ga4_allowed_events`, `ga4_blocked_events` |
| AppLovin Axon | `axon_event_key` | `axon_item_category_id` (integer), `axon_send_user_data` (`"true"` = on, PII), `axon_allowed_events`, `axon_blocked_events` |
| Taboola | `taboola_account_id` (numeric) | `taboola_allowed_events`, `taboola_blocked_events` |
| Triple Whale | `triplewhale_name` | `triplewhale_platform`, `triplewhale_contact_enabled` (PII), `*_allowed/blocked_events` |
| TikTok | `tiktok_pixel_id` | `tiktok_advanced_matching_enabled` (PII), `*_allowed/blocked_events` |
| Northbeam | `northbeam_client_id` | `northbeam_identity_enabled` (PII), `*_allowed/blocked_events` |
| Snapchat | `snap_pixel_id` | `snap_advanced_matching_enabled` (PII), `*_allowed/blocked_events` |
| Pinterest | `pinterest_tag_id` | `pinterest_enhanced_match_enabled` (PII), `*_allowed/blocked_events` |

**Copy-paste block** — the complete vendor key set, ready to paste into a campaign's `campaigns.json`
entry (keep only the vendors you need; delete the rest — absent = off):

```json
"meta_advanced_matching_enabled": "",
"rudderstack_write_key": "",
"rudderstack_dataplane_url": "",
"ga4_id": "",
"ga4_allowed_events": "",
"ga4_blocked_events": "",
"axon_event_key": "",
"axon_item_category_id": "",
"axon_send_user_data": "",
"axon_allowed_events": "",
"axon_blocked_events": "",
"taboola_account_id": "",
"taboola_allowed_events": "",
"taboola_blocked_events": "",
"triplewhale_name": "",
"triplewhale_platform": "",
"triplewhale_contact_enabled": "",
"triplewhale_allowed_events": "",
"triplewhale_blocked_events": "",
"tiktok_pixel_id": "",
"tiktok_advanced_matching_enabled": "",
"tiktok_allowed_events": "",
"tiktok_blocked_events": "",
"northbeam_client_id": "",
"northbeam_identity_enabled": "",
"northbeam_allowed_events": "",
"northbeam_blocked_events": "",
"snap_pixel_id": "",
"snap_advanced_matching_enabled": "",
"snap_allowed_events": "",
"snap_blocked_events": "",
"pinterest_tag_id": "",
"pinterest_enhanced_match_enabled": "",
"pinterest_allowed_events": "",
"pinterest_blocked_events": ""
```

The shared forwarder core loads once when **any** Route C id or `fb_pixel_id` is set; each adapter loads only when its own
id is set. Identity/PII (raw email/phone) is off unless the vendor's `*_enabled` flag is set. Adapter
behaviour is regression-tested by `analytics-tracking-docs/examples/_harness/`; the Axon adapter also by
`npm run test:axon-adapter` and the Meta extras by `npm run test:meta-adapter` (both in `lint:sdk:ci`).

### Meta Pixel extras (`meta.adapter.js`)

The SDK's facebook provider (`analytics.providers.facebook` in `config.js`) sends every Meta event, and the
base pixel block does a bare `fbq('init', id)`. `meta.adapter.js` loads whenever `fb_pixel_id` is set, after
`next-forwarder-core.js`. It sends **no events of its own** and loads nothing from Meta.

- **Cookie re-sync — always on with the pixel.** The SDK reads `_fbp` / `_fbc` once at boot, before
  `fbevents.js` has set them on a first visit, and keeps the empty value for the session
  ([campaign-cart#132](https://github.com/NextCommerceCo/campaign-cart/issues/132)). The adapter copies the
  cookies into the attribution metadata with `next.addMetadata('fb_fbp' / 'fb_fbc')` when the SDK is ready
  (polling every 500 ms for up to 10 s while one is missing) and again after `cart:updated` and `popstate`.
  It only reads cookies, never writes them. Delete this part once #132 ships.
- **Advanced matching — opt-in, `meta_advanced_matching_enabled: "true"`.** Collect on entry, init at the
  first Meta event with an email or phone. Valid checkout email/phone entry and the prospect cart only
  *collect* `em`, `ph`, `fn`, `ln`. On `dl_begin_checkout`, `dl_add_payment_info`, `dl_purchase` and `dl_upsell_purchase` the
  adapter merges the event's `user_properties` and then the form at that moment (`em`, `ph`, `fn`, `ln`,
  `ct`, `st`, `zp`, `country`) and does one `fbq('init', pixelId, userData)` before the SDK's `fbq('track')`
  for that event. The form wins on checkout: in SDK 0.4.43 checkout-time `user_properties` keep the form's
  starting country and leave name, city, state and zip empty until Purchase. Receipt and upsell pages have
  no form: there the event's `user_properties` stand, and on an upsell purchase only the page's `dl_user_data` fills the gaps (an
  upsell purchase's own `user_properties` come from already-reset checkout state). A phone is used only as a valid E.164.
  Values follow Meta's format before the init: lowercase; names without punctuation; city without
  punctuation or spaces; zip without spaces or dash, US zips cut to 5 digits. `dl_add_shipping_info` is not
  used: the SDK fires it while the address is still being typed, so an init there would lose later fields. The pixel keeps only the first init with data on a page, so details learned later on that page
  are not sent; collecting first means a phone typed after the email still makes it in. Phone is optional —
  the init never waits for one. `ph` is digits including the country code — the input's
  `data-next-phone-e164` at checkout, `customer_phone` at purchase, never a guessed dial code. Known gap: on a
  return visit the SDK refills the phone after `dl_begin_checkout`, so that InitiateCheckout has no `ph`.
  `external_id` is the SDK's anonymous `visitor_id` (`localStorage` `visitor_id__<scope>`), passed raw (the
  pixel hashes it) and also saved as `next.addMetadata('fb_external_id', id)` for a server-side Purchase. The
  scope is per API key + first path segment, so when more than one `visitor_id` key exists the adapter skips
  `external_id` rather than guess (a public SDK getter would remove this). Never a customer id — the Campaigns
  API is public. Not gated on `accepts_marketing`: Meta ties customer data to the pixel's own notice and
  cookie consent, so if the pixel may fire, so may this. Set the flag only when the campaign's consent
  handling covers sending customer data to Meta.
- Debug: `?nfdebug=true` (or localhost) logs `[meta.adapter]` lines; `NextForwarder.getStatus()` lists
  it as `meta` only when advanced matching is on (the cookie re-sync does not register with the forwarder). Never test with `?ignore=true` — it turns analytics off. When checking `ud[...]` by hand,
  capture POST bodies as well as GET query strings: the pixel sends some events as hidden form POSTs.
- `meta.adapter.js` has no counterpart in `analytics-tracking-docs/examples/` yet, so it is not in
  `lint:upstream`'s file map; add it there once upstream gains a copy.

### Axon item fields

- **`item_category_id` must be an integer.** The SDK's `item_category` is the campaign name, and Axon rejects
  the whole event with HTTP 400 when it gets text. The adapter sends the SDK value only when it is a positive
  integer, otherwise the campaign's `axon_item_category_id`, otherwise nothing. The fallback applies to every
  item in the campaign, so pick the main product's category.
- **`image_url`** is sent only when it ends in `.png`, `.jpg` or `.jpeg`, which Axon requires. The SDK's
  package thumbnails are `.webp`, so most items go without one.
- **`payment_type`** is mapped onto Axon's enum (`credit_card`, `redeemable`, `deferred`,
  `payment_on_delivery`, `wallet`, `other`); the SDK sends labels such as "Credit Card".
- **`user_data` on `purchase` is off by default.** Set `axon_send_user_data: "true"` only when the store's
  consent policy covers sharing the shopper's details with AppLovin, the same rule as the `applovin-axon`
  storefront app's "Send Customer Email and Phone on Purchase" setting. It renders
  `window.__axonSendUserData = true`, the one runtime flag; the adapter reads it on every event, so a consent
  script can set it instead. When on, the order and upsell `purchase` carry `user_data` from the SDK's
  `user_properties`: email trimmed and lowercased, phone as E.164 digits without the `+`, and `customer_id`
  as `user_id` when it is at least 6 characters. Axon's pixel hashes email and phone in the browser. Other
  events stay anonymous, and `accepts_marketing` plays no part (many checkouts don't render that box).
- **Upsell purchases take `user_data` from the page's `dl_user_data`.** The SDK resets its checkout state
  before the post-checkout redirect, so `dl_upsell_purchase` arrives with `user_properties` holding only
  `visitor_type`, and Axon flags the upsell `purchase` as missing required `user_data`. The SDK fires
  `dl_user_data` first on every page from its persisted user data, which still has the email, so the adapter
  fills any field the upsell lacks from it. It reads that event from `window.NextDataLayer` at send time, so
  `axon_allowed_events` and `axon_blocked_events` don't affect it.
- **Without `user_data`, Axon flags the purchase but still records it**: revenue and `transaction_id`
  arrive as normal. With `?nfdebug=true` (or on localhost) the adapter logs one console warning per page
  when a purchase goes out without it.
- **On SDK 0.5 `user_data` comes from the order.** 0.5's `user_properties` carry `visitor_type` only, so the
  adapter reads the order's email and phone through the forwarder core's customer bridge. `user_id` is
  0.4.x-only: 0.5's order has no customer id, so a 0.5 purchase sends email and phone.
- `axon.adapter.js` is ahead of `analytics-tracking-docs/examples/`, so `lint:upstream` reports drift for it
  until upstream is synced.

### AddToCart on SDK 0.5: forwarder adapters count shoppers, Meta counts adds

SDK 0.5 pushes `dl_add_to_cart` for every cart change, including a cart filled before the page (default
bundle, `forcePackageId`) and every bundle swap, and marks the first add in the tab `first_in_session: true`.
The forwarder core passes only that first add to the adapters that send AddToCart (GA4, Axon, Taboola,
TikTok, Snapchat, Pinterest, Triple Whale; Northbeam sends purchases only), so their AddToCart counts
shoppers. There is no `campaigns.json` key to change that on the shipped adapters: `allAddToCart: true` is a
registration option for a hand-written adapter that wants every add. `NextForwarder.getStatus()` shows
`allAddToCart` and `customerData` for each adapter. SDK 0.4.x pushes carry no `first_in_session` and all
pass.

The SDK's own Meta and GTM destinations don't go through the forwarder: on 0.5 Meta gets `AddToCart` for every
add, so the same funnel shows more AddToCart in Meta than in GA4 or Axon. That gap is expected; compare
Meta's AddToCart with the forwarder vendors' only on 0.4.x, or count first adds in GTM with a trigger on
`first_in_session`.

### Identity: the `accepts_marketing` gate is per adapter

The `accepts_marketing` checkbox is the **newsletter opt-in**. The SDK only records it on the prospect cart;
`next:prospect-cart-created` fires on a valid email and/or phone (per `data-trigger-on`) + first/last name +
items in cart and never depends on that box. So the core no longer ties every identity hook to it — each
adapter declares `contactRequiresMarketingConsent` and `contactOnFieldEntry` when it registers:

| Adapter | Fires `onContact` on | Gated on `accepts_marketing`? | Why |
|---|---|---|---|
| Northbeam (`northbeam_identity_enabled`) | valid checkout **email entry** + prospect cart | **No** | Attribution: `identify(email)` joins the backend order to the session. Northbeam: "identify on every email input". |
| Triple Whale (`triplewhale_contact_enabled`) | valid checkout **email/phone entry** + prospect cart | **No** | Attribution: `Contact` ties the session to the order (incl. the Shopify-ingested order on shop-sync). |
| Meta (`meta_advanced_matching_enabled`) | valid checkout **email/phone entry** + prospect cart (collect only; init at the next Meta event) | **No** | Meta ties customer data to the pixel's own notice / cookie consent, not the newsletter box. One init per page (see Meta Pixel extras). |
| TikTok / Snapchat / Pinterest (`*_advanced_matching_enabled`, `pinterest_enhanced_match_enabled`) | prospect cart only | **Yes** (default) | Ad-platform advanced matching is marketing use — it feeds the platform's identity graph and audiences. |

Gating attribution identity on the newsletter box caps the attribution match rate at the newsletter opt-in
rate (a checkout with the box unchecked by default would floor a Northbeam setup from day one). The core
still passes `acceptsMarketing` in the contact object, and dedupes per adapter per identifier per page load,
so an email seen on field blur and again on the prospect event fires each adapter once. Enabling any
`*_enabled` flag still means the campaign has handled the region's rules for sending raw email/phone to
that vendor.

**Phone is sent only as E.164** (`+<country><number>`), never with a guessed dial code. The prospect cart
carries the SDK's own E.164. On field entry the core reads, in order: the input's `data-next-phone-e164`
attribute (SDK ≥ 0.4.41 — the SDK writes it only while the parsed number is valid and removes it otherwise,
closing [campaign-cart#108](https://github.com/NextCommerceCo/campaign-cart/issues/108)); an intl-tel-input
instance's `getNumber()` when one is on the field (SDK ≤ 0.4.38); otherwise (SDK 0.4.39 / 0.4.40 — national
mask in the field, no E.164 exposed) only a number the shopper typed with its own `+`. Anything else sends no
phone on field entry and the prospect cart delivers it.

**Northbeam on Shop Sync stores** (checkout on NEXT, orders pushed into Shopify): set
`"northbeam_blocked_events": "dl_purchase, dl_upsell_purchase"` and rely on identity. The Shopify Connector
order is the order of record; the funnel purchase carries the NEXT order id and can never match the Shopify
order's checkout token, so a pixel purchase only creates an unmatched or double-counted order. Same shape as
the Triple Whale shop-sync note (`triplewhale_blocked_events`).

**RudderStack is an SDK-provider vendor, not a Route C adapter** — the partial injects only the official
RudderStack JS SDK v3 loader (no `rudderstack.adapter.js`, no forwarder involvement, and no manual
`rudderanalytics.page()` — the SDK provider sends page/ecommerce events). Same two-part pattern as
GTM/Meta: set both `campaigns.json` keys **and** `analytics.providers.rudderstack.enabled: true` in
`config.js`, or the SDK's RudderStack adapter stays disabled and no events flow.
