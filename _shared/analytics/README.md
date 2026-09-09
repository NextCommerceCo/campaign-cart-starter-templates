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
| AppLovin Axon | `axon_event_key` | `axon_allowed_events`, `axon_blocked_events` |
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
id is set. Identity/PII (raw email/phone) is off unless the vendor's `*_enabled` flag is set. Adapter
behaviour is regression-tested by `analytics-tracking-docs/examples/_harness/`.

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

**Northbeam on Shop Sync stores** (checkout on NEXT, orders pushed into Shopify): set
`"northbeam_blocked_events": "dl_purchase,dl_upsell_purchase"` and rely on identity. The Shopify Connector
order is the order of record; the funnel purchase carries the NEXT order id and can never match the Shopify
order's checkout token, so a pixel purchase only creates an unmatched or double-counted order. Same shape as
the Triple Whale shop-sync note (`triplewhale_blocked_events`).

**RudderStack is an SDK-provider vendor, not a Route C adapter** — the partial injects only the official
RudderStack JS SDK v3 loader (no `rudderstack.adapter.js`, no forwarder involvement, and no manual
`rudderanalytics.page()` — the SDK provider sends page/ecommerce events). Same two-part pattern as
GTM/Meta: set both `campaigns.json` keys **and** `analytics.providers.rudderstack.enabled: true` in
`config.js`, or the SDK's RudderStack adapter stays disabled and no events flow.
