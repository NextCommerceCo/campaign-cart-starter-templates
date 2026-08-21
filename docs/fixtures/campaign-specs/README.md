# CampaignSpec Agent Fixtures

These JSON files are small CampaignSpec-shaped examples for agent reasoning and human review. They follow the real Map Builder export dialect (`schema_version` 4.3) but are not live Campaigns App exports and should not be used as production campaign data.

What they are for:

- Show which CampaignSpec/API values map into each starter template family's frontmatter.
- Give agents concrete examples for package refs, shipping refs, upsell vouchers, and receipt contracts.
- Keep template-family examples separate from readiness validation. These fixtures document the handoff shape; they do not prove a real campaign is launch-ready.

Fixture conventions (real-export dialect):

- Specs are stamped `"schema_version": "4.3"` and pin the SDK via `global_config.sdk_version`.
- Page `packages[]` use `qty` and boolean role flags `is_upsell` / `is_order_bump`. There is no `role` field.
- Offers — page-level and root catalog — are identified by `ref_id`.
- Every page carries `sdk_hints.sdk_page_type` (`product` | `checkout` | `upsell` | `receipt`). Pages with `type: "thankyou"` map to `sdk_page_type: "receipt"`.
- Shipping methods live only in the root `shipping_methods[]` catalog, not on pages.
- `sdk_hints.template_family` and `sdk_hints.frontmatter` are template-handoff extensions, not part of a live export. `template_family` names the intended starter family for the fixture only; `frontmatter` shows the values an agent would write into the template.
- Numeric `ref_id` values are illustrative. Replace them from the target Campaigns API.
- `shipping_methods[].key` mirrors the starter frontmatter vocabulary, such as `standard` and `free`.

These fixtures are synced verbatim into `NextCommerceCo/campaigns-os` (`contracts/fixtures/campaign-specs/`) by its catalog refresh, where they must pass the CampaignSpec v4 schema conformance gate. Keep them in the dialect above or the downstream gate fails.

Run `npm run lint:agent-contracts` after changing these fixtures or `docs/commerce-surface-catalog.json`.
