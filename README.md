# Campaign Cart Starter Templates

Starter templates for building sales funnel pages — checkout, post-purchase upsells, and order confirmation — using the [Campaign Cart SDK](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) by NextCommerce.

---

## What's in this repo

| Folder | What it is |
|--------|------------|
| `campaign-kit-templates/` | Campaign-kit project with all 7 templates. **Start here.** |
| `static-templates/` | Raw static HTML source files. Reference only — do not modify. |

---

## Getting started

### Using a template in your own project

1. Run `npx campaign-init` in your project to set up `_data/campaigns.json` and npm scripts
2. Copy `campaign-kit-templates/src/[slug]/` into your project's `src/[slug]/`
3. Copy the matching entry from `campaign-kit-templates/_data/campaigns.json` into your `campaigns.json` — update the slug, store URLs, and API key
4. Run `npm run dev` — an interactive picker lets you choose which campaign to preview
5. To clone a variant: `npm run clone` → picks an existing campaign → new slug → auto-updates `campaigns.json`

### Running this repo as a demo

```bash
cd campaign-kit-templates
npm install
npm run dev
```

All 7 templates are included and working out of the box.

---

## Available templates

| Slug | Funnel type | Pages |
|------|-------------|-------|
| `demeter` | Single-step checkout | checkout |
| `limos` | Single-step checkout | checkout |
| `olympus` | Single-step checkout | checkout |
| `olympus-mv-single-step` | Single-step with variants | checkout |
| `olympus-mv-two-step` | Two-step with variants | selection → billing |
| `shop-single-step` | Shop checkout | checkout |
| `shop-three-step` | 3-step shop checkout | information → shipping → billing |

All campaigns share an upsell page (up01 or up01-mv) and a receipt page.

---

## npm scripts

Run these inside `campaign-kit-templates/`:

```bash
npm run dev        # interactive campaign picker + dev server
npm run build      # build all campaigns to _site/
npm run clone      # duplicate a campaign with a new slug
npm run compress   # optimise images
npm run config     # set Campaigns App API keys
```

---

## SDK documentation

- [Official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)
- [SDK source](https://github.com/NextCommerceCo/campaign-cart)
