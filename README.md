# Campaign Cart Starter Templates

Starter templates for building headless campaign funnels using **[next-campaign-page-kit](https://github.com/NextCommerceCo/next-campaign-page-kit)** and the [Campaign Cart SDK](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) by NextCommerce.


## Getting started

> [!IMPORTANT]
> **Prerequisite:** You need a [Next Commerce](https://www.nextcommerce.com/) store with a campaign already set up in the Campaigns App. The init flow will prompt for your **Campaigns App API key**, which you'll find in your store's Campaigns App. See the [Campaigns App guide](https://developers.nextcommerce.com/docs/campaigns/#getting-started) for how to create one.

Three commands in a fresh directory:

```bash
mkdir my-campaigns && cd my-campaigns
npm init -y
npm install next-campaign-page-kit
npx campaign-init
```

`campaign-init` walks you through the rest:

1. Shows a picker of available starter templates (fetched from this repo)
2. Asks for your **campaign name** (display) and **slug** (URL path, e.g. `/my-campaign/`)
3. Downloads only the chosen template's `src/<slug>/` files into your project
4. Adds the matching entry to your `_data/campaigns.json` under your slug
5. Optionally writes your [Campaigns App API key](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) to `assets/config.js`

Then start developing:

```bash
npm run dev
```

`npm run dev` opens your campaign's presell page in the browser and hot-reloads as you edit. Pick which campaign to preview from the interactive picker (if you have more than one).

That's it, you've got your first campaign up and running on your local machine ready to customize. 

> [!TIP]
> Skip the API key during init? Run `npm run config` later to set it.

---

## Available templates

### Current — SDK 0.4.x

Each checkout template includes presell + landing pages, all upsell variants, and a receipt — copy the whole folder to get the full funnel.

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

> **MV variant-picker (alternative selector).** `olympus-mv-single-step` and `olympus-mv-two-step` also ship a reference **variant-picker** — quantity tier cards + per-unit variant (colorway) dropdowns with custom per-variant swatch thumbnails and an offline render fixture, an additive alternative to the default `mv-configurable-selector`. Preview: [single-step](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/variant-picker/) · [two-step](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/variant-picker/).

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

**Pre-checkout pages (landing + presell)**

Every checkout template includes `presell.html` and `landing.html` — a full presell → landing → checkout funnel. The `landing` slug is the composable section library — browse `landing/index` to see every section, then copy the `_includes/` files you want into your own slug. See [docs/pre-checkout-pages.md](docs/pre-checkout-pages.md) for usage details.

| Template | Description | Preview |
|----------|-------------|---------|
| `[any slug]` · presell | Advertorial "10 reasons" article | [olympus example](https://nextcommerce-campaign-templates.netlify.app/olympus/presell/) |
| `[any slug]` · landing | Composable landing page | [olympus example](https://nextcommerce-campaign-templates.netlify.app/olympus/landing/) |
| `landing` | Full section showcase (every component) | [preview](https://nextcommerce-campaign-templates.netlify.app/landing/index/) |

## npm scripts

Run these inside the repository root:

```bash
npm run dev              # interactive campaign picker + dev server
npm run build            # build all campaigns to _site/
npm run clone            # duplicate an existing local campaign to a new slug
npm run compress         # optimise images
npm run compress:preview # preview compression savings without writing files
npm run config           # set Campaigns App API keys
npm run start            # interactive launcher (dev / compress / clone / config menu)
npm run migrate          # migrate campaigns.json from old array format to current key-based format
```

---

## Deploy your campaign

See [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) for deployment instructions covering Netlify, Vercel, GitHub Pages, and generic static hosting.

---

## AI development rules

Copy [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) into your project root as `CLAUDE.md` before using an AI assistant to build or modify templates.

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/NextCommerceCo/campaign-cart-starter-templates/main/docs/campaign-page-kit-template-context.md
```

Or pass `--ai-context claude` to `campaign-init` and it will write `CLAUDE.md` automatically during setup. Re-running `campaign-init --ai-context claude` refreshes it from the latest upstream; add `--keep-ai-context` to preserve any hand edits. Other supported targets: `--ai-context cursor` (`.cursor/rules/`), `--ai-context copilot` (`.github/copilot-instructions.md`), `--ai-context codex` (`AGENTS.md`).

This gives your AI assistant the context it needs to work correctly with Campaign Cart templates — project structure, Liquid filters, SDK attributes, config, and task checklists. Without it, the assistant will not know the correct SDK version, required `campaigns.json` fields, or how to use `campaign_asset` / `campaign_link` / `campaign_include`.

Pre-checkout **landing** and **presell** deep dive (Tailwind production build, same-slug presell, CTAs): [docs/pre-checkout-pages.md](docs/pre-checkout-pages.md).

Commerce surface routing for agents and contributors: [docs/commerce-surface-catalog.md](docs/commerce-surface-catalog.md). Use this catalog to map designed HTML to template-family commerce surfaces, and ask for a human checkpoint when family confidence is ambiguous.

For other AI tools: Cursor loads rules from `.cursor/rules/`, Windsurf from `.windsurfrules`. The file content works for all of them — only the filename/location differs.

---

## SDK documentation

- [Official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)
- [SDK source](https://github.com/NextCommerceCo/campaign-cart)

---

## Adding more templates or variants

**Add another starter template** — run `npx campaign-init` again in the same project. It picks up your existing `_data/campaigns.json` and adds a new entry alongside the others.

**Duplicate an existing campaign** — once you have one campaign and want a second derived from it (variant testing, region-specific copy, etc.):

```bash
npm run clone
```

You'll be prompted to pick a source campaign and enter a new slug. The folder is copied, `_data/campaigns.json` gets a new entry, and the new campaign is ready to edit.

---

## Working on these templates (contributors only)

If you want to edit the templates *in this repo* — to fix a bug or contribute a new template — clone the repo directly:

```bash
git clone https://github.com/NextCommerceCo/campaign-cart-starter-templates.git
cd campaign-cart-starter-templates
npm install
npm run dev
```

This is the contributor path. Most users should use `npx campaign-init` (above) instead — it pulls from this repo over the network without needing a local clone.
