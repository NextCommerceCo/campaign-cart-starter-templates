# Campaign Cart Starter Templates

Starter templates for building sales funnel pages — checkout, post-purchase upsells, and order confirmation — using **[next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit)** and the [Campaign Cart SDK](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) by NextCommerce.

---

## What's in this repo

This repository is the active **0.4.x starter templates** project for [next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit).

---

## Getting started

### Start here (recommended)

Clone this repo and run the templates as-is.

```bash
git clone https://github.com/NextCommerceCo/campaign-cart-starter-templates.git
cd campaign-cart-starter-templates
npm install
npm run dev
```

Pick a campaign from the interactive prompt. The dev server will hot-reload as you edit.

When you're ready to build your own variant:

```bash
npm run clone
```

You'll be prompted to:

1. Select a source campaign (for example `olympus`)
2. Enter a new slug (for example `my-campaign`)

`npm run clone` copies the campaign folder and creates a new campaign entry in `_data/campaigns.json`.

Then run:

```bash
npm run config
npm run dev
```

Before shipping, update your new campaign's store fields, package IDs, and any template copy/images.

### Adding a template to an existing project

**Step 1 — Initialize your project** (if needed)

```bash
mkdir my-campaigns && cd my-campaigns
npm init -y
npm install next-campaign-page-kit
npx campaign-init
```

This creates `_data/campaigns.json` and the core npm scripts.

**Step 2 — Copy a starter template**

Use either:
- an existing starter template (for example `olympus`), or
- a campaign variant you created with `npm run clone`.

Then copy it into your project `src/` as your slug:

```bash
# from your project root
cp -r /path/to/campaign-cart-starter-templates/src/olympus src/my-campaign
```

`my-campaign` is your URL slug (example: `/my-campaign/checkout/`).

**Step 3 — Add the campaign entry**

Copy the matching object from `/path/to/campaign-cart-starter-templates/_data/campaigns.json` into your project's `_data/campaigns.json`.

At minimum, make sure this exists and is updated:

```json
{
  "my-campaign": {
    "name": "My Campaign",
    "description": "Campaign description",
    "sdk_version": "0.4.18",
    "store_name": "Your Store",
    "store_url": "https://your-store.com/",
    "store_terms": "https://your-store.com/terms",
    "store_privacy": "https://your-store.com/privacy",
    "store_contact": "https://your-store.com/contact",
    "store_returns": "https://your-store.com/returns",
    "store_shipping": "https://your-store.com/shipping",
    "store_phone": "1 (800) 000-0000",
    "store_phone_tel": "tel:+18000000000",
    "gtm_id": "",
    "fb_pixel_id": ""
  }
}
```

**Step 4 — Set your API key**

```bash
npm run config
```

This writes your [Campaigns App API key](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) into `src/[slug]/assets/config.js`.

**Step 5 — Start developing**

```bash
npm run dev
```

> **To create a variant:** run `npm run clone` — it copies an existing campaign to a new slug and updates `campaigns.json` automatically.

---

## Available templates

### Current — SDK 0.4.x

Each checkout template includes all upsell variants and a receipt — copy the whole folder to get the full flow.

**Checkouts**

| Template | Description | Preview |
|----------|-------------|---------|
| `demeter` | Single-step checkout | [preview](https://nextcommerce-campaign-templates.netlify.app/demeter/checkout/) |
| `limos` | Single-step · native bundle qty on page | [preview](https://nextcommerce-campaign-templates.netlify.app/limos/checkout/) |
| `olympus` | Single-step checkout | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus/checkout/) |
| `olympus-mv-single-step` | Single-step · multi-variant | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/checkout/) |
| `olympus-mv-two-step` | Two-step · variant select then checkout | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/select/) |
| `shop-single-step` | Shop-style single-step | [preview](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/checkout/?forcePackageId=1:1) |
| `shop-three-step` | Shop-style three-step (info → shipping → billing) | [preview](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/information/?forcePackageId=1:1) |

**Upsells**

| Variant | Description | Preview |
|---------|-------------|---------|
| `upsell-bundle-stepper` | Quantity stepper with tier pricing | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-stepper/) |
| `upsell-bundle-tier-pills` | Pill-style tier selector | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-pills/) |
| `upsell-bundle-tier-cards` | Card-style tier selector | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-cards/) |
| `upsell-mv` | Multi-variant upsell | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-mv/) |

**Receipt**

| Variant | Description | Preview |
|---------|-------------|---------|
| `receipt` | Order confirmation page | [preview](https://nextcommerce-campaign-templates.netlify.app/olympus/receipt/) |

**Landing pages**

The `landing` slug is a component showcase — browse the examples to find sections you want, then copy those `_includes/` files into your own funnel slug. See [docs/pre-checkout-pages.md](docs/pre-checkout-pages.md) for usage details.

| Template | Description | Preview |
|----------|-------------|---------|
| `landing` · supplement | Sleep supplement example | [preview](https://nextcommerce-campaign-templates.netlify.app/landing/supplement-sleep/) |
| `landing` · skincare | Skincare serum example | [preview](https://nextcommerce-campaign-templates.netlify.app/landing/skincare-serum/) |
| `landing` · fitness | Fitness program example | [preview](https://nextcommerce-campaign-templates.netlify.app/landing/fitness-program/) |

**Presell pages**

Copy the presell into **the same campaign slug** as `checkout.html` (shared `config.js` and `campaigns.json`). See [docs/pre-checkout-pages.md](docs/pre-checkout-pages.md).

| Template | Description | Preview |
|----------|-------------|---------|
| `presell` | Advertorial "10 reasons" article format | [preview](https://nextcommerce-campaign-templates.netlify.app/presell/index/) |

## npm scripts

Run these inside the repository root:

```bash
npm run dev        # interactive campaign picker + dev server
npm run build      # build all campaigns to _site/
npm run clone      # fastest way to create your own campaign from an existing template
npm run compress   # optimise images
npm run config     # set Campaigns App API keys
```

---

## Deploy your campaign

See [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) for deployment instructions covering Netlify, Vercel, GitHub Pages, and generic static hosting.

---

## AI development rules

Copy [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) into your project root as `CLAUDE.md` before using an AI assistant to build or modify templates.

```bash
cp campaign-cart-starter-templates/docs/campaign-page-kit-template-context.md your-project/CLAUDE.md
```

This gives your AI assistant the context it needs to work correctly with Campaign Cart templates — project structure, Liquid filters, SDK attributes, config, and task checklists. Without it, the assistant will not know the correct SDK version, required `campaigns.json` fields, or how to use `campaign_asset` / `campaign_link` / `campaign_include`.

Pre-checkout **landing** and **presell** deep dive (Tailwind production build, same-slug presell, CTAs): [docs/pre-checkout-pages.md](docs/pre-checkout-pages.md).

For other AI tools: Cursor loads rules from `.cursor/rules/`, Windsurf from `.windsurfrules`. The file content works for all of them — only the filename/location differs.

---

## SDK documentation

- [Official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)
- [SDK source](https://github.com/NextCommerceCo/campaign-cart)
