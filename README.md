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

| Slug | Funnel type | Preview |
|------|-------------|---------|
| `demeter` | Single-step checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/demeter/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/demeter/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/demeter/receipt/) |
| `limos` | Single-step checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/limos/checkout/) (SDK **0.4.18** native **bundleQuantity** on checkout) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/limos/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/limos/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/limos/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/limos/receipt/) |
| `olympus` | Single-step checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus/receipt/) |
| `olympus-mv-single-step` | Single-step with variants | [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/checkout/) · [upsell](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/upsell-mv/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-single-step/receipt/) |
| `olympus-mv-two-step` | Two-step with variants | [select](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/select/) · [checkout](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/checkout/) · [upsell](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/upsell-mv/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/olympus-mv-two-step/receipt/) |
| `shop-single-step` | Shop checkout | [checkout](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/checkout/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-single-step/receipt/) |
| `shop-three-step` | Three-step shop checkout | [information](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/information/) · [shipping](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/shipping/) · [billing](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/billing/) · [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-stepper/) · [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-tier-pills/) · [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/upsell-bundle-tier-cards/) · [receipt](https://nextcommerce-campaign-templates.netlify.app/shop-three-step/receipt/) |

#### Bundle upsell patterns (teaching order)

**Olympus** and **limos** use the same three upsell filenames and flow (`checkout` → stepper → tier pills → tier cards → `receipt`). Walk **olympus** (or **limos**) in this order when onboarding. **Limos** `checkout` also wires **native checkout bundle quantity** (same **`.next-bundle-qty*`** pattern as `upsell-bundle-stepper`: stepper **outside** **`[data-next-bundle-selector]`**, **`.checkout-bundle-offer`** + **`.next-bundle-qty--anchor-br`** for layout); **olympus** `checkout` omits that on purpose. All three upsell pages use the **bundle upsell** path (`data-next-bundle-selector` + `data-next-upsell-context` + `data-next-bundle-vouchers`). They are **not** the SDK’s separate non-bundle “selection upsell” pattern (`data-next-upsell-selector` / `data-next-upsell-option` — see [Upsells](https://developers.nextcommerce.com/docs/campaigns/upsells)). **`upsell-bundle-stepper`** is one bundle **definition** (one hidden card) plus optional native **bundleQuantity** — not the non-bundle “single-package upsell API.”

| Page | What it demonstrates | Mechanism | Where to look (olympus) |
|------|----------------------|-----------|----------------|
| [upsell-bundle-stepper](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-stepper/) | Minimal bundle upsell + optional quantity | One hidden `data-next-bundle-card`; SDK **bundleQuantity** stepper ([BundleSelector `attributes.md` — inline bundle-quantity controls](https://github.com/NextCommerceCo/campaign-cart/blob/main/src/enhancers/cart/BundleSelector/guide/reference/attributes.md)) | [`campaign-kit-templates/src/olympus/upsell-bundle-stepper.html`](campaign-kit-templates/src/olympus/upsell-bundle-stepper.html) |
| [upsell-bundle-tier-pills](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-pills/) | Discrete tiers (pill UX) | Hidden **card per quantity**; pills + `initBundleQtyToggle()` in [`upsells.js`](campaign-kit-templates/src/olympus/assets/js/upsells.js) | [`upsell-bundle-tier-pills.html`](campaign-kit-templates/src/olympus/upsell-bundle-tier-pills.html) |
| [upsell-bundle-tier-cards](https://nextcommerce-campaign-templates.netlify.app/olympus/upsell-bundle-tier-cards/) | Tiered bundle, visible card grid | User selects a **visible** tier card (same bundle rules as tier pills; no `initBundleQtyToggle`) | [`upsell-bundle-tier-cards.html`](campaign-kit-templates/src/olympus/upsell-bundle-tier-cards.html) — aligns with [card selection pattern](https://developers.nextcommerce.com/docs/campaigns/upsells#card-selection-pattern) |

**Suggested demo path:** upsell-bundle-stepper → upsell-bundle-tier-pills → upsell-bundle-tier-cards (simplest markup → pills → visible tiers). Same paths under `src/limos/`.

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
npm run dev        # interactive campaign picker + dev server
npm run build      # build all campaigns to _site/
npm run clone      # duplicate a campaign with a new slug
npm run compress   # optimise images
npm run config     # set Campaigns App API keys
```

---

## Deploy your campaign

See [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) for deployment instructions covering Netlify, Vercel, GitHub Pages, and generic static hosting.

---

## AI development rules

Copy the relevant rules file into your project before using an AI assistant to build or modify templates. Most AI tools load a rules file automatically from your project root — check your tool's documentation for the exact filename and location (e.g. `CLAUDE.md` for Claude Code, `.cursor/rules/` for Cursor).

Copy [docs/campaign-page-kit-template-context.md](docs/campaign-page-kit-template-context.md) into your project root as your AI rules file.

---

## SDK documentation

- [Official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/)
- [SDK source](https://github.com/NextCommerceCo/campaign-cart)
