# HANDOFF — SDK 0.4.27 templates + personalization demos

Working handoff for Codex/Cursor picking up this branch. Date: 2026-06-24.
Repo: `campaign-cart-starter-templates` at repo root.

## TL;DR
Branch: `feat/sdk-0.4.27-property-rename`

SDK **0.4.27** landed and this branch now includes:
1. SDK version bump + breaking line-item-property attribute rename.
2. MV checkout personalization reference: all-items custom text + per-slot number.
3. Shared unsynced product-card order bump (`bump-check03.html`) available across checkout template families.
4. MV upsell personalization reference: per-slot upsell text, plus documented all-lines/default fallback for non-slot upsells.

Current commits before this handoff update:
```
fcbf9d1 Add shared product-card order bump
41bd2a1 refactor(0.4.27): reframe MV checkout personalization demo (shared text + per-unit number)
3ff6e72 feat(0.4.27): MV reference demos for line-item property features
5ede368 chore(0.4.27): bump SDK + rename line-item property attributes
dbde749 Merge pull request #90 from NextCommerceCo/feat/sdk-0.4.26-line-item-properties
```

Owner rule still applies: **do not push or open a PR without explicit approval.**

## Current uncommitted work to commit
This handoff update is being written alongside the latest MV upsell personalization changes. Expected files in the next commit:
- `HANDOFF.md`
- `CLAUDE.md`
- `docs/campaign-page-kit-template-context.md`
- `docs/commerce-surface-catalog.md`
- `docs/commerce-surface-catalog.json`
- `src/olympus-mv-single-step/_includes/upsell-mv-offer.html`
- `src/olympus-mv-two-step/_includes/upsell-mv-offer.html`
- `src/olympus-mv-single-step/upsell-mv.html`
- `src/olympus-mv-two-step/upsell-mv.html`

## v0.4.27 SDK facts verified from source
Release: https://github.com/NextCommerceCo/campaign-cart/releases/tag/v0.4.27

Source paths read from `NextCommerceCo/campaign-cart` at tag `v0.4.27`:
- `src/enhancers/cart/shared/properties.ts`
- `src/enhancers/cart/PackageToggle/*`
- `src/enhancers/cart/BundleSelector/*`
- `src/enhancers/order/Upsell/*`

Relevant facts:
- Renamed, breaking: `data-next-property-key` -> `data-next-property`; `data-next-default-property-key` -> `data-next-default-property`.
- Unchanged: `data-next-item-properties`, `data-next-property-container`.
- New: `data-next-exclude-property="<keys>"` or `"*"`.
- PackageToggle cards can collect `data-next-property`.
- Post-purchase upsells now send a `properties` object per accepted line.
- Upsell bundle accept path merges `{ ...defaultProperties, ...bundleItem.properties }`.
- Bundle slot renderer attaches listeners to `[data-next-property]` inside each rendered slot and stores values on that slot.
- `getEffectiveItems()` groups by `packageId + properties`, so same package + different per-slot values become distinct lines.

## Shared product-card order bump
Commit `fcbf9d1` added `bump-check03.html` to every checkout template family:
- `src/demeter/_includes/bump-check03.html`
- `src/limos/_includes/bump-check03.html`
- `src/olympus/_includes/bump-check03.html`
- `src/olympus-mv-single-step/_includes/bump-check03.html`
- `src/olympus-mv-two-step/_includes/bump-check03.html`
- `src/shop-single-step/_includes/bump-check03.html`
- `src/shop-three-step/_includes/bump-check03.html`

Important behavior:
- Unsynced product-card bump; intentionally omits `data-next-product-sync` and `data-next-package-sync`.
- Uses PackageToggle with `data-next-is-upsell`.
- Supports `order_bump.check03.personalization` (`data-next-property`) for the bump line.
- Supports `order_bump.check03.exclude_property`, used in the demo to keep the checkout-wide `custom_text` off the add-on line.
- Uses SDK attributes for discount display: `discountPercentage`, `originalPrice`, `price`, `discountAmount`.
- Available by `order_bump_variant: "check03"` in selector-driven checkouts; MV single-step includes it directly beside the existing synced bump.

Latest checks before commit:
- All `bump-check03.html` copies were identical.
- `next-core.css` stayed byte-identical across all template families.
- `npm run build` passed with 57 pages.

## MV checkout personalization
`src/olympus-mv-single-step/checkout.html` ships enabled:
- `order_personalization`: all-items/default text, key `custom_text`, label `Custom Text (applied to all items)`.
- `slot_personalization`: per-slot text, key `number`, label `Number`.
- `order_bump.check03.personalization`: bump-only text, key `bump_custom_text`, label `Custom text for upsell bump`.

`src/olympus-mv-single-step/_includes/mv-configurable-selector.html` renders the all-items field above the slot stage and the per-slot field inside the slot template.

`src/olympus-mv-two-step/select.html` still documents `slot_personalization` but leaves it disabled by default.

## MV upsell personalization
Current change set wires MV upsells like checkout:
- `upsell_slot_personalization` is enabled on both MV upsell pages.
- `upsell-mv-offer.html` renders `data-next-property="{{ usp_key }}"` inside `#upsell-slot-template`, so the SDK clones one input per accepted upsell unit.
- Default key: `upsell_message`.
- Label: `Custom text`.

Also documented/discoverable:
- `order_personalization` remains available as the all-lines/default path (`data-next-default-property`) for one shared value across every accepted upsell line.
- This is the right path for single non-variant / non-slot upsells too, because the accepted set is one line.
- On the MV upsell demo, `order_personalization.enabled: false` because the reference intentionally demonstrates per-slot fields.

Mirrored files:
- `src/olympus-mv-single-step/_includes/upsell-mv-offer.html`
- `src/olympus-mv-two-step/_includes/upsell-mv-offer.html`

They must stay byte-identical.

Latest rendered-output check:
- `_site/olympus-mv-single-step/upsell-mv/index.html` contains `data-next-property="upsell_message"`.
- `_site/olympus-mv-two-step/upsell-mv/index.html` contains `data-next-property="upsell_message"`.
- No rendered `data-next-default-property="upsell_message"` appears while `order_personalization.enabled` is false.

## Verification done
Latest verification before this handoff:
```bash
npm run build
```
Result: built 57 pages.

Additional checks run:
```bash
node -e "JSON.parse(require('fs').readFileSync('docs/commerce-surface-catalog.json','utf8'))"
md5 src/olympus-mv-single-step/_includes/upsell-mv-offer.html src/olympus-mv-two-step/_includes/upsell-mv-offer.html
md5 src/olympus-mv-single-step/_includes/bump-check01.html src/olympus-mv-two-step/_includes/bump-check01.html
md5 src/*/assets/css/next-core.css
```

Expected invariants:
- MV `upsell-mv-offer.html` partials match.
- MV `bump-check01.html` partials match.
- `next-core.css` remains byte-identical across all template families.
- Catalog JSON parses.

## Docs updated
- `CLAUDE.md`: canonical repo memory for line-item properties, bump check03, MV upsell slot/default personalization.
- `docs/campaign-page-kit-template-context.md`: line-item property model and MV upsell per-slot/default notes.
- `docs/commerce-surface-catalog.md`: human catalog row for MV upsells and shared bump option.
- `docs/commerce-surface-catalog.json`: machine-readable vocabulary now includes `upsell_slot_personalization`; `order_personalization` explicitly covers non-slot upsells.

## Open / pending
1. Push + PR: still pending explicit owner approval. Do not push automatically.
2. Full live cart/order e2e for properties was not driven headlessly. SDK source confirms behavior, and rendered markup is correct. Optional human browser QA: select upsell quantity >1, type distinct slot values, accept upsell, inspect order lines.
3. Stale external memory note still likely needs update: `project_sdk_0_4_26_line_item_properties.md` reportedly says "PAUSED"; PR #90 shipped and 0.4.27 is now landed. Update its `MEMORY.md` index line if continuing that memory work.

## Commands to resume
```bash
git status --short
npm run build
cd _site && python3 -m http.server 8899
```

Useful pages:
- http://localhost:8899/olympus-mv-single-step/checkout/
- http://localhost:8899/olympus-mv-single-step/upsell-mv/
- http://localhost:8899/olympus-mv-two-step/upsell-mv/
