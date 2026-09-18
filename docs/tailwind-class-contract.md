# Tailwind class contract (Apollo pilot)

Pilot family: **`apollo`**. Other families still load CDN Tailwind on landing/presell and `next-core.css` on checkout.

Cosmetic layout/type/color may move to Tailwind utilities. **Do not rename or drop classes the SDK or template JS reads or toggles.** Those stay in CSS (`next-core.css` today; a thinner `next-sdk.css` once checkout is converted).

Cursor rule (always on): `.cursor/rules/tailwind-css-parity.mdc`.

`data-next-*` attributes are a separate contract. They are never restyled-away and never renamed in this migration.

---

## Convert a page (standing checklist)

Use this for every surface. The job is **visual and functional parity** with current templates, using **as many Tailwind utilities as possible**. It is not a redesign, a Tailwind-scale rounding, or a revert to leftover CSS.

Receipt (2026-09-18) is the first completed pass. The numbered steps below are the standing procedure; the receipt table after them is evidence, not a second playbook.

### 1. Convert cosmetics. Leave runtime hooks.

Drop leftover layout/type/color classes (`.receipt_*`, `.checkout-content`, `.announcement`, `.upsell-header`, static `.button` / `.link`). Keep `data-next-*`, SDK/JS class names (`next-expanded`, `next-selected`, `next-loading`, `.cart-item*`, `.os-card*`, `.skeleton-*`, `.hide` if JS still uses it). Putting the old class back to “fix” a miss is a revert, not a conversion.

Shared includes used by an unconverted page (today: checkout still reads `footer.html`) must either stay leftover **or** the layout must load compiled `tailwind.css` wherever that include renders.

### 2. Inventory the source class + every media query, then the map.

Canonical CSS: `src/olympus/assets/css/next-core.css`. For each class you will drop, copy **every declaration** plus every 991 / 767 / 479 override. Convert that list — not the screenshot from memory.

Breakpoints stay `max-[991px]` / `max-[767px]` / `max-[479px]`, not `md` / `lg`.

Reusable translations go in **CSS → utility map** below. Look there before re-deriving `.button` / `.link` / `.receipt_order` / `.container`.

### 3. Map every property 1:1 (source value, not nearest Tailwind name).

| Rule | Why |
|---|---|
| Use the source value | `tracking-tight` is `-0.025em`; `.receipt_order` is `-0.01em`. `text-xl` is `1.25rem`; desktop thank-you is `1.35rem`. Tailwind `text-3xl` / `text-4xl` are not next-core `--font-size--3xl` (2rem) / `--font-size--4xl` (2.5rem). |
| Brand / CTA / greys stay live `var()` | `.button` fill is `--brand--color--cta-primary`. Labels `#686868`/`#707070` map to `--brand--color--secondary` (`text-brand-gray`). Never `text-[#686868]`. |
| Restate element defaults you just lost | Unlayered next-core sets `a { color:#000; text-decoration:none; background-color:transparent }` and `h2 { font-size:3rem; font-weight:700 }`. Dropping `.link` / `.button` without beating those defaults reverts the element. |
| Reuse a token when values are the same job | Hairlines `#ddd` / `#dedede` / `#dfdfdf` → `border-brand-border`. Wash fills `#f5f5f5` (drawer + desktop summary) → `bg-neutral-drawer`. Inactive step grey `#6c757d` → `text-brand-gray`. Do not mint a token per hex. Drop leftover Webflow wrappers once the computed style is carried. |
| Nearest existing token is still wrong | If next-core hardcodes a hex with **no** var and it is a different job (`#f5f5f5` drawer vs `neutral-100` / `brand-surface`), add one named token and reuse it. Do not `bg-[#f5f5f5]`. |

### 4. Compile utilities as `important`. Do not `important`-freeze SDK inline styles.

`next-core.css` is **unlayered**. Tailwind v4 `@import "tailwindcss"` puts utilities in `@layer utilities`, which lose to unlayered `a` / `h2` / `h1`.

`tailwind.input.css` therefore uses `@import "tailwindcss" important` so converted chrome wins. Do **not** keep `.button` / `.link` / `.receipt_*` as the styling source after the map is applied.

`important` utilities also freeze properties the SDK writes inline. Never put height-0 / expanded-auto utilities on `[data-next-accordion-panel]` (AccordionEnhancer `style.height`). Spreedly reveal transform stays leftover, not `hidden`. Cosmetics on the same node can still be utilities. Those leftovers stay **unlayered and without `!important`**.

Do not treat “the utility class is on the node” as success until computed style matches live.

### 5. Off-screen ≠ `display:none`.

`hidden` / `display:none` skips SDK display binding (and breaks Spreedly on checkout). Desktop-hidden mobile summary stays clipped (`sr-only` + `max-[991px]:not-sr-only`), not `hidden`.

### 6. Bind the surface the SDK still has.

Receipt binds `order.*` (`order.hasItems`, `order.hasDiscounts`, `order.total`), never `cart.*` — the SDK clears cart before the receipt redirect. Upsells keep `data-next-upsell*`, `data-next-bundle-*`, `data-next-display="bundle.*"` / `package.*`. Checkout reveal stays off-screen, not `display:none`.

### 7. Load compiled CSS from the layout, never frontmatter `styles:`.

Netlify validates those paths before compile. `base.html` always loads `next-core.css` + compiled `tailwind.css`. Do not list `tailwind.css` in page `styles:`.

### 8. Done gate = `getComputedStyle` vs live, including motion.

Compare the converted control to [the live Apollo surface](https://nextcommerce-campaign-templates.netlify.app/) (or the same page built from `main`) at **1440 / 768 / 390**. Required properties: `color`, `backgroundColor`, `border`, `fontSize`, `fontWeight`, `letterSpacing`, `textDecorationLine`, `minHeight`, `width`. For drawers/accordions also sample height over ~300ms and `[os-summary-icon]` transform (SDK CSS rotates it — do not re-implement `rotate-180` on checkout/receipt).

`[data-next-skeleton]` until `next-display-ready`, and empty `order.*` / fixture `$0.00`, are not conversion failures.

A surface is not converted until this gate passes. Append the new 1:1 strings to the **CSS → utility map**.

### Receipt postmortem (2026-09-18)

What failed vs live `/apollo/receipt/` on the first pass — these are why steps 3–4 exist:

| Control | Live | First conversion | Cause |
|---|---|---|---|
| Continue shopping | `.button.cc-auto` → navy fill, white text, 72px min-height | `bg-brand-dark text-brand-text-inverse` → transparent + black, 44px | Unlayered `a { background:transparent; color:#000 }` beat utilities; `.button` min-height was not fully carried |
| Contact / footer | `.link` → navy underline | `text-brand-dark underline` → black, no underline | Same `a` defaults |
| Thank you `h2` | `.receipt_order` → 21.6px / `-0.01em` | `text-[1.35rem] tracking-tight` → 48px (`h2` 5xl) | Unlayered `h2`; `tracking-tight` was also the wrong letter-spacing |
| Mobile / desktop summary fill | `#f5f5f5` | `bg-neutral-100` / `bg-brand-surface` | Nearest token, not the hardcoded wash |

Fix path: `@import "tailwindcss" important` plus the 1:1 utility map (`.button` → `bg-brand-cta` / `min-h-[4.5rem]`, `.receipt_order` → `text-[1.35rem] tracking-[-0.01em]`, shared `bg-neutral-drawer`). Do not "fix" by putting the next-core class back.

`data-next-*` attributes are a separate contract. They are never restyled-away and never renamed in this migration.

Inventoried against `src/apollo/` HTML + JS (2026-09-18): **1168** unique `class` tokens in markup.

---

## Keep — SDK runtime classes

The SDK adds or removes these. Style them in leftover CSS. Do not replace the class with a utility on the same hook.

| Class | Role |
|---|---|
| `next-selected` | Selected selector / bundle / payment / qty control |
| `next-in-cart` | Item or bump currently in cart |
| `next-active` | Active bump / enabled control |
| `next-disabled` | Disabled button (incl. coupon) |
| `next-loading` | Add-to-cart spinner (`[next-slot]`) |
| `next-hidden` | SDK-hidden payment radios / form grids |
| `next-hidden-form` | Billing-same-as-shipping collapsed block |
| `next-focused` | Focused `.input-flds` |
| `next-error-field` | Invalid field |
| `next-error-label` | Field error text |
| `next-display-ready` | On `<html>` when display enhancers are ready (unhides `[data-next-await]`) |
| `next-cart-empty` | Empty cart summary |
| `next-has-discounts` | Show discount row |
| `next-has-tax` | Show tax row |
| `next-summary-empty` / `next-summary-has-items` | Line-item property list visibility |
| `next-expanded` | Accordion open (`data-toggle-class` on order summary) |
| `next-oos` | Out-of-stock variant option |
| `next-slot` / `next-slot__*` | Configurable slot markup the SDK fills |

Also keep attribute hooks the CSS keys off: `[data-next-await]`, `[next-slot="content"|"spinner"]`, `[data-next-cart-summary]`.

Documented in `docs/campaign-page-kit-template-context.md` (State CSS classes).

---

## Keep — Apollo template JS

| Class | File | Role |
|---|---|---|
| `checkout-form--reveal` | `checkout-apollo.js` | Modifier that opts the form into reveal |
| `is-revealed` | `checkout-apollo.js` | Toggled on reveal click. Panel must stay **off-screen, not `display:none`** (Spreedly) |
| `bump__personalization` | `checkout-apollo.js` | Click-stop so typing does not toggle the bump |
| `next-page-modal` / `--open` / `__trigger` / `__close` | `checkout.js` | Size/info modal |
| `next-page-modal-open` | `checkout.js` | On `body` while modal is open |
| `next-selected` | `upsells.js` | Qty-button selected state (template JS, same name as SDK) |
| `swiper-slide` / `swiper-scrollbar` / `swiper-pagination` | `checkout.js`, `checkout-apollo.js`, `landing.js` | Swiper internals |
| `rotate-180` | `landing.js` | Accordion chevron |
| `hidden` | `landing.js` | Hides swiper controls when locked |

JS init that is **attribute-based** (safe): `[data-component="swiper"]`, `[data-variant="sw1"]`, `[swiper="…"]`, `[data-component="reviews-swiper"]`, `[data-accordion]`, `[data-checkout-reveal-panel]`, `[data-checkout-reveal-trigger]`, `[data-bundle-qty-btn]`, `[data-next-element="timer"]`.

---

## Keep — semantic commerce hooks

These are not always toggled by JS, but selected-state CSS and Campaigns OS brand theming hang off them. Convert **inner cosmetics** to utilities if needed; leave the hook class on the element.

- `.os-card` and `.os-card__*` (incl. `.os-card.next-selected`, radio, pills)
- `.bundle-card` / `.bundle-tile` and descendants
- `.bump-card` / `.bump__*` (PackageToggle / order bump)
- `.payment-method` and descendants
- `.checkout-reveal__panel` / `.checkout-reveal__cta`
- `.next-bundle-qty*`
- `.form-grid`, `.input-flds`, `.button` (when used with `.next-loading` / `.is-inactive`)
- `.hide` / `.hide-tablet*` / `.show-tablet` until those breakpoints are utilities **and** no JS uses `.hide`

Checkout reveal CSS must keep the payment panel in the layout (translated/off-screen). `hidden` / `display:none` on that panel breaks Spreedly.

---

## CSS → utility map

Append here when a class is fully translated and the computed-style gate passed. Reuse these strings; do not re-guess.

Source of values: `src/olympus/assets/css/next-core.css`.

| next-core class | Utilities (1:1) | Notes |
|---|---|---|
| `.button` | `flex w-full min-h-[4.5rem] items-center justify-center rounded-button border-2 border-brand-cta bg-brand-cta px-8 py-4 text-center font-semibold text-brand-text-inverse no-underline` | Spinner / `.next-loading` / `.is-inactive` still need leftover CSS **and** the `.button` class on those nodes. Static CTAs (receipt Continue shopping) use utilities only. |
| `.button.cc-auto` | add `w-auto` | |
| `.link` | `whitespace-nowrap font-medium leading-6 text-brand-dark underline` | |
| `.receipt_order` | `text-[1.35rem] font-bold tracking-[-0.01em] max-[767px]:text-xl` | Desktop is **1.35rem**, not `text-xl`. 767px media is `--font-size--xl`. |
| `.receipt-check` | `flex size-[4.5rem] max-[767px]:size-14 flex-col items-center justify-center text-brand-dark` | Mobile 3.5rem. |
| `.receipt_head` | `flex items-center gap-2` | |
| `.receipt-heading` | `flex flex-col gap-2 max-[767px]:gap-1` | |
| `.receipt_section` | `flex flex-col gap-4 rounded border border-brand-border p-6` | Token: `--brand--color--border` (was `#ddd`) |
| `.receipt_section-head` | `flex flex-col gap-2` | |
| `.display-xs` | `m-0 text-balance text-[1.25rem] font-semibold leading-[1.1] max-[991px]:text-[1.1125rem]` | |
| `.receipt_section-head--desc` | `text-sm text-brand-gray` | Token: `--brand--color--secondary` (was `#686868`) |
| `.sec_title` | `text-brand-gray` | Token: `--brand--color--secondary` (was `#707070`) |
| `.sec_value` | `text-brand-black` | Token: `--brand--color--black` |
| `.order_receipt-grid` | `grid grid-cols-2 gap-4 max-[767px]:flex max-[767px]:flex-col` | |
| `.order_receipt-col` | `flex flex-col gap-3` | |
| `.order_receipt-sec` | `flex flex-col gap-1 text-sm` | |
| `.receipt_info` | `flex justify-between max-[767px]:flex-col max-[767px]:items-stretch max-[767px]:gap-4` | |
| `.receipt-flex` | `flex items-center gap-2 max-[767px]:order-1 max-[767px]:justify-center` | |
| `.checkout-footer-links` | `mt-4 flex gap-4 border-t border-brand-border pt-4 text-sm` | Reuse `brand-border` (`#dfdfdf`); source `#dedede` is the same hairline. |
| `.brand-logo` | `h-auto w-[150px] max-[479px]:w-[120px]` | 479 override is on `.brand-logo` in next-core. Receipt header omitted it (already converted). |
| `.order-summary__trigger` | `flex cursor-pointer items-center justify-between text-lg font-normal max-[991px]:border-y max-[991px]:border-brand-border max-[991px]:bg-neutral-drawer max-[991px]:p-4 max-[991px]:text-base max-[479px]:py-[0.8rem] max-[479px]:text-sm` | Same wash as `.checkout__column--right`. 479px: `py-[0.8rem]` + `text-sm`. |
| `.accordion__panel` (cosmetics) | `max-[991px]:overflow-hidden max-[991px]:bg-neutral-drawer max-[991px]:px-4` | **Height is leftover** in `tailwind.input.css` (`[data-next-accordion-panel]`). Never height-0 / expanded-auto utilities. |
| `.checkout__column--right` | `sticky top-0 w-full bg-neutral-drawer [grid-area:order-summary] max-[991px]:hidden` | Same `bg-neutral-drawer` as the mobile drawer. |
| `.page-wrapper` | `overflow-clip` | Drop empty `.main-wrapper` (no next-core rules). |
| `.container` | `relative z-[1] mx-auto block w-full max-w-7xl px-10 max-[991px]:px-5` | 991+767 both set `padding-inline: 1.25rem`. `max-w-7xl` is 80rem. |
| `.announcement` / `__block` | `flex items-center justify-center gap-3 bg-brand py-2.5 max-[479px]:flex-col max-[479px]:gap-0` | Fill is `--brand--color--primary`. |
| `.announcement__text` | `block text-center text-lg font-black uppercase leading-8 tracking-normal text-brand-text-inverse max-[991px]:text-base max-[479px]:text-sm max-[479px]:leading-[1.1rem]` | 991 → `--font-size--base`; 479 → `--font-size--sm` + `1.1rem` line-height. |
| `.upsell-header` | `relative overflow-clip bg-brand pb-20 pt-4 text-brand-text-inverse max-[991px]:pb-24` | Winning padding (not `.section` 4rem). 991 `pb` is `--spacing--6` (6rem). |
| `.upsell-header__inner` | `flex flex-col items-center gap-2 p-6 text-center max-[767px]:p-0` | |
| `.upsell-header__title` | `m-0 text-balance text-[2.5rem] font-bold leading-[1.2] max-[767px]:text-[1.5rem]` | next-core `--font-size--4xl` is **2.5rem**, not Tailwind `text-4xl`. |
| `.upsell-header__offer` | `m-0 text-balance text-[2rem] font-bold leading-[1.3] max-[767px]:text-lg` | `--font-size--3xl` is **2rem**, not Tailwind `text-3xl`. |
| `.upsell-header__suboffer` | `m-0 text-[1.5rem] max-[767px]:text-base` | |
| `.upsell-header-bar` | `flex flex-col items-stretch border-b border-brand-border` | Source hairline `#dedede`. |
| `.upsell-header-bar__wrapper` | `flex items-center justify-between py-4 max-[991px]:min-h-16 max-[991px]:py-0 max-[767px]:flex-col max-[767px]:gap-2 max-[767px]:pb-[0.7rem] max-[767px]:pt-3` | 767 keeps the 991 `min-height: 4rem`. |
| `.upsell-header-bar__step` | `relative z-10 flex flex-col items-center text-center text-brand-gray` | Source `#6c757d` → reuse `brand-gray`. |
| `.upsell-header-bar__step--active` | add `font-bold text-brand-black` (drop `text-brand-gray`) | |
| `.upsell-header-bar__step-label` | `text-base uppercase max-[767px]:text-[0.75rem]` | Do not use `text-xs` — that also sets 16px line-height; source only changes font-size so body `1.5` stays. |
| `.footer_section` | `bg-brand-light py-4 text-brand-dark` | Shared include — `base.html` always loads Tailwind. |
| `.footer_layout` | `mx-auto flex w-full flex-col items-stretch justify-center gap-4 text-center` | |
| `.footer_copy-info` | `flex w-full flex-row justify-between gap-2 max-[479px]:flex-col` | Column is **479**, not 767. |
| `.footer_link-wrapper` | `flex justify-center gap-4 text-sm max-[479px]:flex-wrap max-[479px]:gap-x-4 max-[479px]:gap-y-2` | |
| `.footer_legal-link` | `text-brand-dark underline` | Beats unlayered `a`. |

---

## Safe to convert (cosmetics)

- Landing/presell Tailwind utilities already in markup (`flex`, `gap-*`, `md:*`, `text-[var(--text-primary)]`, …)
- Static Webflow leftovers on checkout once the surface is converted (`w-layout-*`, spacing/type helpers that are not JS hooks)
- Promoted Apollo chrome that is not a JS hook: promo banner copy color, as-seen-in row, review card type, header trust-bar layout
- `tokens.css` type helpers (`.text-display`, `.text-heading-1`, …) after they exist as Tailwind theme sizes

Do **not** hardcode hex in utilities for brand colors. Use theme tokens so Campaigns OS can still override CSS variables.

---

## Token names

Two palettes exist today. Alias them; do not pick one and leave the other blank.

| Landing / presell (`tokens.css`) | Checkout (`next-core.css` `:root`) |
|---|---|
| `--brand-primary` | `--brand--color--primary` |
| `--brand-secondary` | `--brand--color--primary-light` (nearest) |
| `--brand-accent` | `--system-colors--success-medium` (nearest) |
| `--surface-bg` | `--brand--color--background` |
| `--surface-card` | `--brand--color--surface` |
| `--text-primary` | `--brand--color--text-primary` |
| `--text-inverse` | `--brand--color--text-inverse` |

Campaigns OS brand-theme overrides **next-core** names. Landing tokens now also define the next-core names as aliases of the lander vars so both work on pre-checkout pages. Checkout conversion should set the lander names as aliases of next-core vars (next-core remains the OS override target).

Tailwind v4 maps both sets in `tailwind.input.css` via `@theme inline` so `bg-brand-primary` stays a live `var()` and does not bake a hex at compile time.

---

## Build

```bash
npm run build:css          # compile src/apollo/assets/css/tailwind.css
npm run build:css:watch    # same, watch
```

`npm run build` and `npm run dev` run `build:css` first.

- `@source` in `tailwind.input.css` must include every Apollo HTML file (pages + `_includes`, including `<template>` clones the SDK paints).
- Load compiled CSS with a hardcoded `<link>` in the layout. Do **not** list `tailwind.css` in page frontmatter `styles:` (Netlify validates those paths before compile).
- `base.html` always loads **both**: next-core for leftover SDK/hooks, compiled `tailwind.css` (`important`) for converted chrome (receipt + upsell chrome + shared footer). Do not wait for a `page_type` gate.

---

## `lint:next-core` during the pilot

All eight families still ship byte-identical `next-core.css`. This infra step does **not** change that file.

When Apollo's leftover CSS is split out, add Apollo to a diverge/skip list in `scripts/lint-next-core-sync.mjs` (or replace the gate with `lint:next-sdk` for the leftover file). Do not silently weaken the gate for the other seven families.

---

## Receipt pass (Apollo)

Receipt **chrome + checkout shell + order-summary cosmetics** are Tailwind utilities (tokens, not hex). `receipt-orders.html` line items keep `.cart-item*` (SDK clones those nodes). Accordion keeps `data-next-accordion*` and `next-expanded` (JS toggle).

`base.html` always loads compiled `tailwind.css`. Compile uses `@import "tailwindcss" important`.

**Shared wash:** desktop `.checkout__column--right` and the mobile drawer are the same `#f5f5f5` — both use `bg-neutral-drawer`. Do not keep a second fill (`bg-neutral-100`) for the sidebar.

**Accordion height** stays unlayered leftover on `[data-next-accordion-panel]` (SDK `style.height`). Never `h-0` / expanded-auto utilities.

**Reuse:** `receipt-order-totals.html` is included in the drawer and the desktop column. Flatten Webflow leftover wrappers (`summary-wrap`, nested `overflow-clip`, `pt-[5px]`). |

**Left on `next-core.css` / SDK classes:**

- `data-next-*` and `data-toggle-class="next-expanded"` (JS)
- `receipt-orders.html` `.cart-item*` template (SDK clones this; `data-next-order-items`, `order.hasItems`)
- `.skeleton-*` (SDK `data-next-skeleton` / `next-display-ready`)
- `.hide` on quantity controls inside the order-item template
- Accordion panel **height** (SDK `style.height`; see leftover block in `tailwind.input.css`)

---

## Upsell pass (Apollo)

Page chrome on `upsell-bundle-stepper.html`, `upsell-bundle-tier-pills.html`, `upsell-bundle-tier-cards.html` plus `upsell-header-bar.html` and shared `footer.html` is Tailwind utilities. Offer partials stay leftover (SDK/JS): `data-next-upsell*`, `data-next-bundle-*`, `.os-card` / `.next-selected`, `.next-bundle-qty*`, Swiper, accept `.button.next-loading`. `upsell-protection.html` is not in this worktree.

**Left on `next-core.css` / page CSS:**

- Offer includes (`upsell-bundle-*-offer.html`) — `.upsell-box`, `.os-card*`, quantity, accept/decline
- Tier-cards page `<style>` for `.cc-upsell-bundle-tier-*` + `.os-card.next-selected`
- `upsells.js` / Swiper init

---

## Out of scope for the Apollo pilot

- Renaming `data-next-*`
- Changing checkout JS behavior
- Compiling Tailwind inside `next-campaign-page-kit`
- Visual redesign
- Deleting `exit-intent-popup.css` until that page is converted
- Converting `src/landing/` (section library) off CDN in this pass
