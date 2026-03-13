# Campaign Cart Starter Templates

Starter templates for building sales funnel pages — checkout, post-purchase upsells, and order confirmation — using **[next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit)** and the [Campaign Cart SDK](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) by NextCommerce.

---

## What's in this repo

| Folder | What it is |
|--------|------------|
| `campaign-kit-templates/` | A [next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit) project with all 7 templates. **Start here.** |
| `static-templates/` | Raw static HTML source files. Reference only — do not modify. |

---

## Getting started

**Step 1 — Initialise your project** (if you haven't already)

```bash
mkdir my-campaigns && cd my-campaigns
npm init -y
npm install next-campaign-page-kit
npx campaign-init
```

`my-campaigns` is a local directory that houses all your campaigns — rename it to whatever makes sense for your setup. This installs the kit, creates `_data/campaigns.json`, and adds the `dev`, `build`, `clone`, and `config` npm scripts to your `package.json`.

**Step 2 — Copy a template and name it after your product**

Pick a template from the [available templates](#available-templates) table below. Copy its folder into your project and rename it to your product — this becomes the slug used in your URLs.

```bash
cp -r campaign-cart-starter-templates/campaign-kit-templates/src/demeter your-project/src/your-campaign-name
```

Your campaign will be served at `https://your-campaign-domain/your-campaign-name/checkout`.

**Step 3 — Add the campaign entry**

Open `campaign-cart-starter-templates/campaign-kit-templates/_data/campaigns.json`, find the entry matching the template you chose, and paste it into your project's `_data/campaigns.json`. Then update:

- `slug` — must match the folder name you used (e.g. `your-campaign-name`)
- `name` — human-readable campaign name
- `store_url`, `store_name`, and other store fields
- Leave `sdk_version` as-is unless you need a specific version

**Step 4 — Set your API key**

```bash
npm run config
```

This prompts you to enter your [Campaigns App API key](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) and writes it into `src/[slug]/assets/config.js`.

**Step 5 — Start developing**

```bash
npm run dev
```

Pick your campaign from the interactive prompt. The dev server will hot-reload as you edit.

> **To create a variant:** run `npm run clone` — it copies an existing campaign to a new slug and updates `campaigns.json` automatically.

---

### Preview all templates locally

To browse all 7 templates before picking one:

```bash
git clone https://github.com/NextCommerceCo/campaign-cart-starter-templates.git
cd campaign-cart-starter-templates/campaign-kit-templates
npm install
npm run dev
```

---

## Available templates

| Slug | Funnel type | Preview |
|------|-------------|---------|
| `demeter` | Single-step checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/demeter/checkout/) · [upsell](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/demeter/receipt/) |
| `limos` | Single-step checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/limos/checkout/) · [upsell](https://nextcommerce-campaign-templates.netlify.app/limos/upsell/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/limos/receipt/) |
| `olympus` | Single-step checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus/checkout/) · [upsell](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus/receipt/) |
| `olympus-mv-single-step` | Single-step with variants | [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/checkout/) · [upsell](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-mv/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/receipt/) |
| `olympus-mv-two-step` | Two-step with variants | [select](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/select/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/checkout/) · [upsell](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/upsell-mv/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/receipt/) |
| `shop-single-step` | Shop checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/checkout/?forcePackageId=2:1) · [upsell](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell/?forcePackageId=2:1) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/receipt/?forcePackageId=2:1) |
| `shop-three-step` | 3-step shop checkout | [information](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/information/?forcePackageId=2:1) · [shipping](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/shipping/?forcePackageId=2:1) · [billing](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/billing/?forcePackageId=2:1) · [upsell](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell/?forcePackageId=2:1) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/receipt/?forcePackageId=2:1) |

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

## AI development rules

Copy the relevant rules file into your project before using an AI assistant to build or modify templates. Most AI tools load a rules file automatically from your project root — check your tool's documentation for the exact filename and location (e.g. `CLAUDE.md` for Claude Code, `.cursor/rules/` for Cursor).

| Working with | Rules file |
|---|---|
| `campaign-kit-templates/` | [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) |
| `static-templates/` | [docs/static-template-context.md](docs/static-template-context.md) |

---

## SDK documentation

- [Official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)
- [SDK source](https://github.com/NextCommerceCo/campaign-cart)
