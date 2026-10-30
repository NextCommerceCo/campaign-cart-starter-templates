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
    └── <vendor>.adapter.js       (8 adapters)   → …/assets/js/
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
| Meta Pixel | `fb_pixel_id` | — |
| RudderStack | `rudderstack_write_key` **and** `rudderstack_dataplane_url` (both required) | — |
| GA4 | `ga4_id` | `ga4_allowed_events`, `ga4_blocked_events` |
| AppLovin Axon | `axon_event_key` | `axon_item_category_id` (integer), `axon_send_user_data` (`"false"` = off), `axon_allowed_events`, `axon_blocked_events` |
| Taboola | `taboola_account_id` (numeric) | `taboola_allowed_events`, `taboola_blocked_events` |
| Triple Whale | `triplewhale_name` | `triplewhale_platform`, `triplewhale_contact_enabled` (PII), `*_allowed/blocked_events` |
| TikTok | `tiktok_pixel_id` | `tiktok_advanced_matching_enabled` (PII), `*_allowed/blocked_events` |
| Northbeam | `northbeam_client_id` | `northbeam_identity_enabled` (PII), `*_allowed/blocked_events` |
| Snapchat | `snap_pixel_id` | `snap_advanced_matching_enabled` (PII), `*_allowed/blocked_events` |
| Pinterest | `pinterest_tag_id` | `pinterest_enhanced_match_enabled` (PII), `*_allowed/blocked_events` |

**Copy-paste block** — the complete vendor key set, ready to paste into a campaign's `campaigns.json`
entry (keep only the vendors you need; delete the rest — absent = off):

```json
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

The shared forwarder core loads once when **any** Route C id is set; each adapter loads only when its own
id is set. Identity/PII (raw email/phone) is off unless the vendor's `*_enabled` flag is set, with one
exception: Axon (below). Adapter behaviour is regression-tested by `analytics-tracking-docs/examples/_harness/`;
the Axon adapter also by `npm run test:axon-adapter` (in `lint:sdk:ci`).

### Axon: `item_category_id` and `user_data`

- **`item_category_id` must be an integer** from Google's product taxonomy. The SDK's `item_category` is the
  campaign *name*, and Axon rejects the whole event with HTTP 400 when it gets text (seen live on
  `view_item`, `begin_checkout` and `purchase`). The adapter sends `item_category_id` only when the SDK's
  value is a positive integer, otherwise the campaign's `axon_item_category_id`
  (`window.__axonItemCategoryId`), otherwise not at all. Set `axon_item_category_id` per campaign (e.g.
  `469` Health & Beauty) or Axon's Pixel Helper warns once per item. The fallback applies to **every
  item** in the campaign, so on a campaign that sells products from different taxonomy branches pick the
  main product's id (or leave it empty and accept the per-item warning).
- **Enhanced matching (`user_data`) is sent by default** on `purchase`, `begin_checkout` and
  `add_payment_info`: Axon flags a `purchase` without `user_data.email` as an error. Source is the SDK's
  `user_properties` (`customer_email`, `customer_phone`, `customer_id`). Axon's `pixel.js` hashes email
  and phone in the browser, so the adapter passes them normalised but unhashed: email trimmed and
  lowercased, phone as E.164 digits without the `+` (the SDK only sets an E.164 `customer_phone`), and
  `user_id` only when it is at least 6 characters. Any one of the three is enough to send `user_data`;
  a `user_id` alone gives Axon a partial match, but it still flags a `purchase` without an email.
  Browse events and `page_view` stay anonymous. Unlike the opt-in `onContact` vendors, this is **not**
  gated on `accepts_marketing`. Opt out per campaign with `axon_send_user_data: "false"` (`"no"`,
  `"off"` and `"0"` work too). That renders `window.__axonUserDataOptOut = true`, which nothing on the
  page can undo. Without it, a consent script can turn `user_data` off and on at any time with
  `window.__axonSendUserData = false` / `true`; the adapter reads that flag on every event.
- A purchase without a valid `customer_email` still goes out, but Axon flags it. The adapter logs
  `[axon.adapter] purchase sent without user_data.email` to the console once per page for each reason
  (no `customer_email`, or one that is not a valid address). Upsell purchases don't warn.
- **`payment_type`** is mapped to Axon's enum (`credit_card`, `redeemable`, `deferred`,
  `payment_on_delivery`, `wallet`, `other`); the SDK sends labels such as "Credit Card".
- **`image_url`** is sent only when it ends in `.png`/`.jpg`/`.jpeg` (Axon's rule). The SDK's package
  thumbnails are `.webp`, so most items go without one.
- **Ahead of upstream.** These fixes are not yet in `analytics-tracking-docs/examples/direct-axon/axon.adapter.js`,
  so `lint:upstream` reports drift for `axon.adapter.js` and `next-forwarder-core.js` until they land there.
  Do not copy the upstream files over `_shared/` before then: `npm run test:axon-adapter` (in CI) fails on a revert.

### Identity: the `accepts_marketing` gate is per adapter

The `accepts_marketing` checkbox is the **newsletter opt-in**. The SDK only records it on the prospect cart;
`next:prospect-cart-created` fires on a valid email and/or phone (per `data-trigger-on`) + first/last name +
items in cart and never depends on that box. So the core no longer ties every identity hook to it — each
adapter declares `contactRequiresMarketingConsent` and `contactOnFieldEntry` when it registers:

| Adapter | Fires `onContact` on | Gated on `accepts_marketing`? | Why |
|---|---|---|---|
| Northbeam (`northbeam_identity_enabled`) | valid checkout **email entry** + prospect cart | **No** | Attribution: `identify(email)` joins the backend order to the session. Northbeam: "identify on every email input". |
| Triple Whale (`triplewhale_contact_enabled`) | valid checkout **email/phone entry** + prospect cart | **No** | Attribution: `Contact` ties the session to the order (incl. the Shopify-ingested order on shop-sync). |
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
