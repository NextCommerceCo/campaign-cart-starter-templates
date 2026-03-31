---
name: new-cpk-campaign
description: Scaffold a new campaign-page-kit campaign from a starter template. Use when creating a new CPK campaign, new campaign-kit project, or new funnel for a brand.
argument-hint: "[campaign-slug] [template]"
---

# New CPK Campaign

Scaffold a new campaign from a [campaign-cart starter template](https://github.com/NextCommerceCo/campaign-cart-starter-templates).

## Gather inputs

If not provided in the args, ask the user for:

1. **Campaign slug** — the product name (e.g. `grounding-mat`, `wintergloves`). Lowercase, hyphens only. This becomes the `src/[slug]/` folder and drives the URL: `your-domain.com/[slug]/checkout`.
2. **Project root** — the directory where `package.json` and `_data/campaigns.json` live (or will be created). Default: current working directory.
3. **Starter template** — which template to base this on:
   - `demeter` — standard single-step checkout
   - `limos` — single-step checkout (alternate layout)
   - `olympus` — single-step checkout (premium layout)
   - `olympus-mv-single-step` — single-step with variant/SKU selection
   - `olympus-mv-two-step` — two-step flow: variant picker → checkout
   - `shop-single-step` — shop-style single-step checkout
   - `shop-three-step` — multi-step checkout (information → shipping → billing)

---

## Steps

### 1 — Safety check

If `[project-root]/src/[campaign-slug]/` already exists → **stop and warn the user**. Do not overwrite.

### 2 — Initialize CPK project (if needed)

Check if `[project-root]/package.json` exists.

If **not**, run these commands sequentially inside the project root:

```bash
npm init -y
npm install next-campaign-page-kit
npx campaign-init
```

`npx campaign-init` creates `_data/campaigns.json` and adds npm scripts to `package.json`. It does **not** create any `src/` folders.

If `package.json` **already exists**, skip.

### 3 — Copy starter template

Run from the project root:

```bash
npx degit NextCommerceCo/campaign-cart-starter-templates/campaign-kit-templates/src/[template-slug] src/[campaign-slug]
```

The destination folder name is the **campaign slug**, not the template name.

### 4 — Fetch the template's campaigns.json entry

Fetch the upstream `campaigns.json` to get the canonical entry for the chosen template:

```
https://raw.githubusercontent.com/NextCommerceCo/campaign-cart-starter-templates/HEAD/campaign-kit-templates/_data/campaigns.json
```

Find the entry matching `[template-slug]`. Use its `sdk_version`, `description`, and field structure as the base. Then customise:

- Key: change from `[template-slug]` to `[campaign-slug]`
- `name`: title-case derived from the campaign slug (hyphens → spaces)
- `store_name`, `store_url`, `store_terms`, `store_privacy`, `store_contact`, `store_returns`, `store_shipping`: set to `""`
- `store_phone`, `store_phone_tel`: set to `""`
- `gtm_id`, `fb_pixel_id`: keep as placeholder values from the template entry (e.g. `"GTM-XXXXXXX"`, `"123456789012345"`)
- `sdk_version`: keep exactly as it appears in the upstream entry — **do not hardcode or guess**

Merge this entry into `[project-root]/_data/campaigns.json` — do not replace the whole file.

### 5 — Copy CLAUDE.md

Download and save the AI context file into the project root as `CLAUDE.md`:

```bash
curl -sL "https://raw.githubusercontent.com/NextCommerceCo/campaign-cart-starter-templates/HEAD/docs/campaign-page-kit-template-context.md" \
  -o [project-root]/CLAUDE.md
```

If `CLAUDE.md` already exists, skip — do not overwrite.

---

## Report back

Summarise what was done:

- CPK project initialized or already present
- Template copied from `[template-slug]` → `src/[campaign-slug]/`
- `campaigns.json` updated (with `sdk_version` from upstream)
- `CLAUDE.md` copied or already present

Then show the user their next steps:

```
Next steps:
1. cd [project-root]
2. npm run config       → set your API key in src/[campaign-slug]/assets/config.js
3. npm run dev         → pick [campaign-slug] from the list and start the dev server
```

Dev server preview URLs for the chosen template:

| Template | Pages |
|----------|-------|
| demeter | /[slug]/checkout/ · /[slug]/upsell/ · /[slug]/receipt/ |
| limos | /[slug]/checkout/ · /[slug]/upsell/ · /[slug]/receipt/ |
| olympus | /[slug]/checkout/ · /[slug]/upsell/ · /[slug]/receipt/ |
| olympus-mv-single-step | /[slug]/checkout/ · /[slug]/upsell-mv/ · /[slug]/receipt/ |
| olympus-mv-two-step | /[slug]/select/ · /[slug]/checkout/ · /[slug]/upsell-mv/ · /[slug]/receipt/ |
| shop-single-step | /[slug]/checkout/ · /[slug]/upsell/ · /[slug]/receipt/ |
| shop-three-step | /[slug]/information/ · /[slug]/shipping/ · /[slug]/billing/ · /[slug]/upsell/ · /[slug]/receipt/ |
