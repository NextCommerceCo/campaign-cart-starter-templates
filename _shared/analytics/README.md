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

The shared forwarder core loads once when **any** Route C id is set; each adapter loads only when its own
id is set. Identity/PII (raw email/phone) is off unless the vendor's `*_enabled` flag is set, and is then
consent-gated on the `accepts_marketing` checkbox. Adapter behaviour is regression-tested by
`analytics-tracking-docs/examples/_harness/`.

**RudderStack is an SDK-provider vendor, not a Route C adapter** — the partial injects only the official
RudderStack JS SDK v3 loader (no `rudderstack.adapter.js`, no forwarder involvement, and no manual
`rudderanalytics.page()` — the SDK provider sends page/ecommerce events). Same two-part pattern as
GTM/Meta: set both `campaigns.json` keys **and** `analytics.providers.rudderstack.enabled: true` in
`config.js`, or the SDK's RudderStack adapter stays disabled and no events flow.
