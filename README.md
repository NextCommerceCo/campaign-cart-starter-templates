# Campaign Cart Starter Templates

Starter templates for building sales funnel pages — checkout, post-purchase upsells, and order confirmation — using **[next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit)** and the [Campaign Cart SDK](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) by NextCommerce.

---

## What's in this repo

| Folder | What it is |
|--------|------------|
| `campaign-kit-templates/` | 0.4.x templates — [next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit) project. **Start here.** |
| `campaign-kit-templates-v3/` | 0.3.x archive — reference for the older SDK version. |

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
cp -r campaign-cart-starter-templates/campaign-kit-templates/src/olympus your-project/src/your-campaign-name
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

### Preview templates locally

```bash
git clone https://github.com/NextCommerceCo/campaign-cart-starter-templates.git
cd campaign-cart-starter-templates/campaign-kit-templates
npm install
npm run dev
```

To browse the 0.3.x archive instead:

```bash
cd campaign-cart-starter-templates/campaign-kit-templates-v3
npm install
npm run dev
```

---

## Available templates

### Current — SDK 0.4.x (`campaign-kit-templates/`)

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

The `landing` slug is a component showcase — browse the examples to find sections you want, then copy those `_includes/` files into your own funnel slug. See [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) for usage details.

| Template | Description | Preview |
|----------|-------------|---------|
| `landing` · supplement | Sleep supplement example | [preview](https://nextcommerce-campaign-templates.netlify.app/landing/supplement-sleep/) |
| `landing` · skincare | Skincare serum example | [preview](https://nextcommerce-campaign-templates.netlify.app/landing/skincare-serum/) |
| `landing` · fitness | Fitness program example | [preview](https://nextcommerce-campaign-templates.netlify.app/landing/fitness-program/) |

**Presell pages**

Presell pages can be used as a standalone pre-checkout slug (with `cta_url` pointing to your checkout) or copied into your funnel slug alongside `checkout.html`. See [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) for usage details.

| Template | Description | Preview |
|----------|-------------|---------|
| `presell-1` | Advertorial "10 reasons" article format | [preview](https://nextcommerce-campaign-templates.netlify.app/presell-1/index/) |

### Legacy — SDK 0.3.x (`campaign-kit-templates-v3/`)

Preview locally by running `npm run dev` inside `campaign-kit-templates-v3/`.

| Slug | Funnel type |
|------|-------------|
| `demeter` | Single-step checkout |
| `limos` | Single-step checkout |
| `olympus` | Single-step checkout |
| `olympus-mv-single-step` | Single-step with variants |
| `olympus-mv-two-step` | Two-step with variants |
| `shop-single-step` | Shop checkout |
| `shop-three-step` | 3-step shop checkout |

---

## npm scripts

Run these inside `campaign-kit-templates/` (or `campaign-kit-templates-v3/` for the 0.3.x archive):

```bash
npm run dev            # interactive campaign picker + dev server
npm run build          # build all campaigns to _site/
npm run clone          # duplicate a campaign with a new slug
npm run compress       # optimise images
npm run config         # set Campaigns App API keys
npm run css:build      # rebuild Tailwind CSS for landing and presell-1 (run after adding new utility classes)
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

For other AI tools: Cursor loads rules from `.cursor/rules/`, Windsurf from `.windsurfrules`. The file content works for all of them — only the filename/location differs.

---

## SDK documentation

- [Official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)
- [SDK source](https://github.com/NextCommerceCo/campaign-cart)
