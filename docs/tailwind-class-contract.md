# Tailwind class contract (Apollo pilot)

Pilot family: **`apollo`**. Other families still load CDN Tailwind on landing/presell and `next-core.css` on checkout.

Cosmetic layout/type/color may move to Tailwind utilities. **Do not rename or drop classes the SDK or template JS reads or toggles.** Those stay in CSS (`src/apollo/assets/css/next-sdk.css` on Apollo checkout; other families still load `next-core.css`).

Cursor rule (always on): `.cursor/rules/tailwind-css-parity.mdc`.

`data-next-*` attributes are a separate contract. They are never restyled-away and never renamed in this migration.

---

## Convert a page (standing checklist)

Use this for every surface. The job is **visual and functional parity** with current templates, using **as many Tailwind utilities as possible**. It is not a redesign, a Tailwind-scale rounding, or a revert to leftover CSS.

Receipt (2026-09-18) is the first completed pass. The numbered steps below are the standing procedure; the receipt table after them is evidence, not a second playbook.

### 1. Convert cosmetics. Leave runtime hooks.

Drop leftover layout/type/color classes (`.receipt_*`, `.checkout-content`, `.announcement`, `.upsell-header`, static `.button` / `.link`). Keep `data-next-*`, SDK/JS class names (`next-expanded`, `next-selected`, `next-loading`, `.cart-item*`, `.os-card*`, `.skeleton-*`, `.hide` if JS still uses it). Putting the old class back to “fix” a miss is a revert, not a conversion.

Shared includes used by an unconverted page must either stay leftover **or** the layout must load compiled `tailwind.css` wherever that include renders. `base.html` always loads compiled Tailwind (receipt, upsell, checkout chrome, footer).

### 2. Inventory the source class + every media query, then the map.

Canonical CSS: `src/olympus/assets/css/next-core.css`. For each class you will drop, copy **every declaration** plus every 991 / 767 / 479 override. Convert that list — not the screenshot from memory. A desktop `max-width: 528px` that leftover sets to `100%` at ≤991 is a conversion miss if you only copy the base rule.

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

### 4. Compile utilities as `important`. Do not `important`-freeze SDK inline styles — or leftover next-core modifiers.

`next-core.css` is **unlayered**. Tailwind v4 `@import "tailwindcss"` puts utilities in `@layer utilities`, which lose to unlayered `a` / `h2` / `h1`.

`tailwind.input.css` therefore uses `@import "tailwindcss" important` so converted chrome wins. Do **not** keep `.button` / `.link` / `.receipt_*` as the styling source after the map is applied.

`important` utilities also freeze properties the SDK writes inline **and** leftover next-core classes that share a Tailwind name. Never put height-0 / expanded-auto utilities on `[data-next-accordion-panel]` (AccordionEnhancer `style.height`). Spreedly reveal transform stays leftover, not `hidden`. Cosmetics on the same node can still be utilities. Those leftovers stay **unlayered and without `!important`**.

Never put a Tailwind **display** utility (`flex`, `inline-flex`, `hidden`, `block`) on a node the SDK or leftover CSS hides with inline `display:none` / `.next-hidden`. `important` `inline-flex` beats both and paints an empty box — voucher pills (`data-next-discounts="voucher"` + `data-next-show="cart.hasCoupon()"`) showed as red dots until the exit-popup coupon; the same miss hits any `data-next-show` / `data-next-hide` / `.checkout-reveal__cta`. Shown-state `display: inline-flex` lives in unlayered leftover (no `!important`) so inline `display:none` still wins.

Never put important **width / height** utilities on `.swiper-slide`. `slidesPerView: N` needs Swiper’s inline size (`max-[479px]:w-auto` made thumbs 302px vs live 37px). `slidesPerView: 'auto'` needs unlayered leftover `width: auto; height: auto` on the slide (more specific than Swiper’s `width: 100%`) so the inner card can define the slide — important `w-auto` is also wrong here.

Compiler traps (not leftover CSS):

| Trap | What happens | Do this |
|---|---|---|
| `[&_.os-card__radio]` | Tailwind treats `__` as a space, so the child selector never matches | Put the utility on the radio, or use a hyphenated child (`[&_.radio-inner]`) |
| v4 `scale-0` / `scale-100` | Those set the `scale` **property**, not `transform` | Use `[transform:scale(0)]` / `[transform:scale(1)]` when leftover animated `transform` |
| `max-[767px]` (and 991 / 479) | v4 compiles to `@media not all and (min-width:767px)` (`width < 767`). Leftover is `max-width: 767px` | Compare **766 and 768**, not only 767. At exactly 767 leftover applies and utilities do not |
| Drop `.form-group` / `.form-input` | SDK inits floating labels with `querySelectorAll(".form-group")` and errors on `.form-group`; `closest(".form-input")` for icons | Keep the class names. Cosmetics can still be utilities. |
| `p-*` / `py-*` on `.input-flds` | important padding beats SDK inline `paddingTop: 14px` when `.has-value` | Layout only (`h-12`, `px-3`). Unlayered leftover owns has-value `padding-top`. |
| Neutralize leftover form layout globally | payment-methods + SDK billing inject have no utilities; they go unstyled | Scope the unset to `[data-next-catalog-component="customer-info-form\|shipping-address-form\|personalization-field"]` and `.bump__personalization` |
| Extractor skip of hide-only leftover | `.next-toast-handler` / `.tip1_bar` have no brand token, so `extract-apollo-next-sdk.py` omitted them and the dummy “Error message” bars painted | Add the class names to `TOKENS` (same as `.next-hidden`). Hide stays unlayered `display:none` with no `!important`. |

Known name collisions while both sheets load (shield in `tailwind.input.css`):

| Leftover class | Tailwind `important` does | Live next-core |
|---|---|---|
| `.flex-col` + `.flex-horizontal-lg-up` | stays column | row from 992px |
| `.container` | max-width 64rem, Tailwind padding | max-width 80rem, 2.5rem / 1.25rem pad |
| `.trust-badge.invert` | `filter: invert(1)` (white lock + label) | layout-only modifier; filter none; `#000` label |

Do not treat “the utility class is on the node” as success until computed style matches live. A chrome-only computed-style pass is not a page visual-parity pass — leftover offer/checkout still has to look like live.

### 5. Off-screen ≠ `display:none`. SDK hide ≠ a display utility.

`hidden` / `display:none` skips SDK display binding (and breaks Spreedly on checkout). Desktop-hidden mobile summary stays clipped (`sr-only` + `max-[991px]:not-sr-only`), not `hidden`. Do not replace leftover `style="display:none"` + `data-next-show` / `data-next-hide` with `inline-flex` / `flex` / `hidden` — that is step 4’s display-utility freeze, and it shows empty gated chrome (coupon badges, reveal CTAs) before the SDK unhides them.

### 6. Bind the surface the SDK still has.

Receipt binds `order.*` (`order.hasItems`, `order.hasDiscounts`, `order.total`), never `cart.*` — the SDK clears cart before the receipt redirect. Upsells keep `data-next-upsell*`, `data-next-bundle-*`, `data-next-display="bundle.*"` / `package.*`. Checkout reveal stays off-screen, not `display:none`.

### 7. Load compiled CSS from the layout, never frontmatter `styles:`.

Netlify validates those paths before compile. `base.html` always loads `next-core.css` + compiled `tailwind.css`. Do not list `tailwind.css` in page `styles:`.

### 8. Done gate = `getComputedStyle` vs live, including motion.

Compare the converted control to [the live Apollo surface](https://nextcommerce-campaign-templates.netlify.app/) (or the same page built from `main`) at **1440 / 992 / 991 / 768 / 390**. 992 vs 991 is the stack breakpoint — a two-column desktop `max-width` that leftover drops at ≤991 (`max-width: 100%`) will pass 1440 and 390 and still look broken in DevTools responsive (~988). Large thumbs at tablet width are live when the gallery is full-bleed ÷ `slidesPerView` (six), not a conversion bug.

Required properties: `color`, `backgroundColor`, `border`, `fontSize`, `fontWeight`, `letterSpacing`, `textDecorationLine`, `minHeight`, `width`. For drawers/accordions also sample height over ~300ms and `[os-summary-icon]` transform (SDK CSS rotates it — do not re-implement `rotate-180` on checkout/receipt).

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
| `next-toast-handler` | Hides payment / express error placeholders until the SDK has a real error |
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
- `.bump__switch` / `.bump__switch-slider` / `.bump__personalization` / `[os-component="check"]` (PackageToggle; cosmetics on the card are utilities)
- `.payment-method` and descendants
- `.checkout-reveal__panel` / `.checkout-reveal__cta`
- `.form-grid` / `.input-flds` / `.label-checkout` (SDK validation; cosmetics on the grid/row, not display/border on the field)
- `.button` (when used with `.next-loading` / `.is-inactive`)
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
| `.section.upsell-box` | `relative -mt-24 overflow-clip pb-16 pt-8` | Winning padding is the upsell-box override (`--spacing--2` / `--spacing--4`), not generic `.section`. |
| `.section.upsell-box .container` | `relative z-[1] mx-auto block w-full max-w-7xl px-10 max-[991px]:px-0` | 991 override is **0**, not the usual `px-5`. |
| `.upsell-wrapper` | `flex flex-col gap-4` | Keep `data-next-upsell="offer"`. |
| `.upsell-container` | `overflow-hidden rounded-cards bg-brand-light shadow-[0_0_8px_0_rgba(0,0,0,0.4)] max-[991px]:rounded-none` | `--radius--cards`. |
| `.grid-full` + `.flex-col` + `.flex-horizontal-lg-up` | `mx-auto flex w-full flex-col min-[992px]:flex-row min-[992px]:items-stretch min-[992px]:justify-center` | Convert the trio — do not leave leftover `flex-col` on this node. |
| `.upsell-content__column` | `w-full max-w-[565px] overflow-hidden bg-white max-[991px]:max-w-none` | |
| `.upsell-offer__card` | `flex flex-col items-start bg-white px-6 py-[30px] max-[767px]:w-full max-[767px]:px-[18px]` | 767 pad is 18px, not `px-4`. |
| `.display-lg` | `m-0 text-balance text-[2.5rem] font-bold leading-[1.2] max-[991px]:text-[2rem]` | 991 and 767 both `--font-size--3xl` (2rem). |
| `.star_wrapper` / `.star_img` | `inline-flex items-center gap-[1.2px]` / `flex size-4 shrink-0 items-center justify-center` | Do **not** `flex justify-center` on a full-width block — leftover `.star_wrapper` shrink-wraps so header + review-card stars stay left of the copy. SVG is 15px in a 16px box. |
| `.divider_line._25` | `mb-[25px] mt-[25px] min-h-px w-full bg-neutral-divider max-[991px]:my-5 max-[767px]:mb-[18px] max-[767px]:mt-4` | Token `#e5e5e5`. |
| `.divider_line.margin-32` | `mb-8 mt-8 min-h-px w-full bg-neutral-divider max-[991px]:my-[25px] max-[767px]:mb-[18px] max-[767px]:mt-4` | |
| `.upsell-offer__price` | `text-[2.5rem] font-bold leading-none max-[767px]:text-[2rem]` | `--font-size--4xl` / `--font-size--3xl`. |
| `.upsell-offer__price.diagonal-strike` | add `relative inline-block text-brand-gray after:absolute after:inset-x-0 after:top-1/2 after:origin-center after:-rotate-[10deg] after:border-t after:border-price-strike after:content-['']` | Strike `#F20404` → `price-strike`. Color `#6c757d` → `brand-gray`. |
| `.upsell-offer__divider` | `h-[110px] min-w-[2px] rounded-[5px] bg-neutral-price-rule max-[767px]:h-20` | Token `#dbdbdb`. |
| `.upsell-ships-info` | `mt-2.5 flex items-center rounded border-2 border-brand px-5 py-2.5 min-[992px]:mt-5` | |
| `.upsell-offer__image-column` | `relative block w-full self-center overflow-hidden p-6 max-[991px]:order-first max-[991px]:max-w-none max-[991px]:px-8 max-[767px]:px-6` | |
| `.upsell-link.cc-decline` | `mx-auto flex items-center gap-1 text-brand-foreground underline max-[479px]:mx-0 max-[479px]:items-start max-[479px]:justify-start max-[479px]:text-left max-[479px]:text-base` | `#1a1a1a` → `brand-foreground`. |
| `.hide-tablet-up` / `.hide-tablet-down` | `min-[992px]:hidden` / `max-[991px]:hidden` | Payment-logo chrome only. Do not use on SDK-bound nodes. |
| `.trust-badge` (no `.invert`) | `mt-4 flex items-center justify-center gap-1.5` | Never add Tailwind `invert` — next-core `.invert` is layout-only. |
| `.next-bundle-qty` | `mb-6 flex w-full items-center justify-center gap-1.5 max-[991px]:mb-5 max-[767px]:mb-4` | Cosmetic only. JS/SDK read `data-next-bundle-qty-for` / `data-bundle-qty-*`, not this class. |
| `.next-bundle-qty__label` | `flex min-w-0 items-center gap-2 font-semibold max-[767px]:mr-4 max-[767px]:gap-0 max-[767px]:leading-[1.2]` | |
| `.next-bundle-qty__row` | `flex flex-nowrap items-center justify-center gap-3 rounded-lg border border-brand-light bg-white p-2` | Keep `data-next-bundle-qty-for` or `data-bundle-qty-for`. |
| `.next-bundle-qty__btn` | `flex size-10 cursor-pointer items-center justify-center rounded border border-brand-light bg-brand-light text-brand next-disabled:cursor-not-allowed next-disabled:opacity-50 max-[767px]:size-8` | Drop the leftover class. Keep `.next-disabled` (SDK). Pills add `next-selected:border-brand next-selected:bg-brand next-selected:text-brand-text-inverse` and keep `.next-selected`. |
| `.slider_component` | `relative flex w-full flex-col` | Cosmetic only. Keep `data-component="swiper"` / `data-variant="sw1"` / `[swiper="…"]`. |
| `.slider_component-wrapper` | `flex flex-col gap-2` | |
| `.swiper` (next-core extras) | add `w-full` | Keep the `swiper` class — Swiper JS/CSS hook. |
| `.swiper-slide_inner` | `relative` | |
| `.swiper-slide_inner` (thumb) | `relative` | Do **not** apply `.swiper-slide_inner.is-thumb` (70px circle) — that leftover never matched this markup (`is-thumb` is on the slide). |
| `.swiper-slide_image-wrap` + `.is-square` | `relative flex w-full justify-center overflow-hidden` + Liquid aspect (`aspect-square` default; `aspect-video` / `aspect-[3/2]` / `aspect-[4/3]` from `swiper_aspect`) | Do not keep `.cover` / `.swiper-slide_image-wrap` — leftover aspect CSS keys off those names. |
| `img.cover` | `size-full max-h-full object-cover` (or `object-contain` when a non-square aspect is set and `swiper_fit` is not `cover`) | |
| `.swiper-thumbs-arrow` | `relative flex items-center justify-between gap-2` | |
| `.swiper-thumbs-arrow .swiper__button-static` | `relative z-[1] flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white bg-white text-brand-black transition-[box-shadow,color,border-color,transform] duration-200 active:shadow-swiper-nav-press max-[479px]:size-8` | Winning thumbs-arrow override (2.5rem / 479 → 2rem), not the generic 3rem black button. Shadow token `#2a255236`. |
| `.swiper__button-icon` | `flex size-[1.25em] items-center justify-center max-[767px]:size-[0.8rem]` | |
| `.slider_component__thumbs-wrap` | `z-[1] flex w-full max-w-full flex-1 flex-col items-center overflow-hidden rounded-[0.4rem_0_0.4rem_0.4rem]` | |
| `.swiper-slide.is-thumb` | `min-w-0 cursor-pointer overflow-hidden border border-transparent grayscale transition-[filter] duration-[400ms] [&.swiper-slide-thumb-active]:border-brand-black [&.swiper-slide-thumb-active]:grayscale-0 focus-visible:border-2 focus-visible:border-brand-black` | Keep `swiper-slide` and `swiper-slide-thumb-active` (Swiper). Drop leftover `is-thumb`. Do **not** put important `w-auto`/`h-auto` on thumbs — that beats Swiper's inline size (390: 302px vs live 73px). |
| thumbs `[swiper="slider-thumbs"]` init | add `opacity-0 pointer-events-none [&.swiper-initialized]:pointer-events-auto [&.swiper-initialized]:opacity-100 [&.swiper-initialized]:transition-opacity [&.swiper-initialized]:duration-200` | `.swiper-initialized` is Swiper-toggled. |
| `[pb-animate="pulse-upsell"]` | `animate-pulse-upsell` | Theme keyframes match leftover `scale(0.9) ↔ 1` / 1.5s ease infinite. Keep `.button` for `.next-loading`. |
| `.promo-banner--apollo` | `rounded-none bg-brand-black px-4 py-2 text-center` | Text: `m-0 text-base font-normal uppercase leading-normal tracking-[-0.32px] text-brand-white`. Highlight: `font-extrabold text-system-success-medium`. |
| `.checkout-header--apollo` | `border-b border-brand-border bg-brand-background py-4 max-[767px]:py-3` | Winning `--apollo` styles, not generic `.checkout-header--lg`. Inner: `flex flex-row flex-nowrap items-center justify-center gap-4 max-[767px]:flex-col max-[767px]:gap-2`. |
| `.checkout-header--apollo .checkout-header__logo` | `block h-auto w-[150px] object-contain max-[767px]:w-[120px]` | 767 shrink is **120px**, not the receipt 479 rule. |
| `.checkout-header--apollo .checkout-header__divider` | `h-[46px] w-px shrink-0 bg-brand-border max-[767px]:hidden` | |
| `.checkout-header--apollo .checkout-header__reviews` | `whitespace-nowrap text-lg font-medium uppercase leading-[1.2] text-brand-dark max-[767px]:text-base` | Badges: `text-[0.625rem]`; icons `size-[15px] max-[767px]:size-[14px]`. |
| `.product-heading` title | `m-0 text-left text-[2rem] font-bold leading-[1.2] tracking-[-0.2px] text-brand-dark max-[991px]:text-center max-[991px]:text-[1.75rem] max-[991px]:tracking-[-0.16px] max-[767px]:text-[1.5rem] max-[767px]:tracking-[-0.14px]` | Features: column → 991 2-col grid → 767 column. Checks: `fill-system-success-medium`. |
| `.hide-tablet` | `max-[991px]:hidden` (desktop instance) / `hidden max-[991px]:block` (tablet instance) | No standalone next-core rule; live computed hide is ≤991. One heading must stay hidden at each viewport or `h1Count` doubles. |
| `.hide-tablet-down` | `max-[991px]:hidden` | Left-column as-seen-in / reviews / guarantee. |
| `.hide-tablet-up` / `.show-tablet` | `min-[992px]:hidden` | Bottom mobile chrome (guarantee / scroll as-seen-in / reviews). |
| `.section.checkout-page` | `bg-neutral-checkout pb-16 pt-8 max-[479px]:pt-6` | Token `#fcfcfc`. `.checkout-page-layout` 991: `flex flex-col gap-4`; 479: `gap-0`. Form column: `relative flex w-full max-w-[528px] flex-col gap-8 max-[991px]:max-w-none max-[991px]:gap-6` (leftover `.checkout__form-container` drops the 528 cap and uses 1.5rem gap at ≤991). |
| `.promo-timer` | `bg-brand-black p-2` | Keep `data-next-element="timer"`. Pill: `min-w-[71px] rounded-sm bg-promo-timer-pill`. |
| `.as-seen-in` | `flex w-full flex-col gap-6` | Heading `text-base font-bold uppercase text-brand-foreground`. Drop leftover `as-seen-in--scroll`; Liquid `scroll` arg still chooses markup. Scroll track: `animate-as-seen-in-scroll hover:[animation-play-state:paused] motion-reduce:animate-none`. |
| `.guarantee-section--apollo` | `flex items-center justify-start gap-4 rounded-sm bg-brand-light px-5 py-4` | Badge `w-20`. |
| `.reviews-slider` wrapper | `w-full` | Keep `swiper` / `data-component="reviews-swiper"` / `swiper-slide`. Slide `width/height: auto` lives in unlayered leftover (`[data-component="reviews-swiper"] .swiper-slide`) so `slidesPerView: 'auto'` sizes to the 340px card (important `w-auto` is also wrong here). Scrollbar: `swiper-scrollbar static … bg-neutral-300 [&_.swiper-scrollbar-drag]:bg-brand-dark`. |
| `.checkout-review--slide` | `flex h-full w-[340px] max-w-[85vw] flex-col text-left rounded border border-brand-border bg-white p-4 max-[767px]:gap-4 max-[767px]:p-8` | Drop leftover card classes. Title `text-sm font-bold`; body `text-sm`; meta `mt-3 flex … gap-[7px] text-xs leading-[1.2]`. |
| `.form-content` | `flex w-full max-w-full flex-col items-stretch justify-center` | |
| `.form-sections` | `relative flex min-h-0 w-full flex-col gap-8 overflow-visible max-[479px]:gap-4` | Keep `data-next-component="shipping-form"` on the shipping wrapper. |
| `.form-section` | `relative flex flex-col gap-4 max-[479px]:w-full` | Step 1 uses `gap-8` (was `.grid-row-gap2`). Leave `.form-grid` / `.input-flds`. |
| `.form-section__title` | `m-0 text-lg font-bold leading-[1.2] tracking-[-0.01em]` | Size is leftover title (1.125rem). Weight 700 + line-height 1.2 come from leftover `h2` (the later heading block, not the 36px normalize rule). next-sdk dropped element headings. |
| `.form-grid` | keep class; `mt-0 flex flex-col justify-around gap-4` | Leftover layout is **unset** on converted catalog surfaces so this `flex` is the real display. `.form-grid.next-hidden` is re-asserted `display:none !important` in `tailwind.input.css`. Do not put `flex` on `[data-next-component="location"]`. Payment-methods / billing-form inject keep leftover (no neutralize). |
| `.form-grid__row` | `flex w-full items-start justify-between gap-4 max-[991px]:flex-wrap max-[767px]:flex-col` | 991 wrap; 767 column. Do not put this on `[data-next-component="location"]`. |
| `.form-group` | **keep class**; `m-0 flex w-full flex-1 flex-col justify-between gap-1 p-0` | SDK floating labels init via `querySelectorAll(".form-group")`; error wrapper is `.form-group`. Dropping it freezes labels at opacity 0. |
| `.form-input` | **keep class**; `relative z-[1] flex w-full flex-col items-stretch justify-center text-sm` | SDK `closest(".form-input")` for relative + error icons. Keep `.label-checkout` leftover (opacity 0 / `.has-value`). |
| `.input-flds` (layout) | keep class; `relative mb-0 flex h-12 w-full items-center justify-center rounded-input px-3 text-[0.925rem]` | **Do not** put border / background / shadow utilities — leftover owns hover, `:focus`, `.next-focused`, `.next-error-field`, and 479 `#d4d4d4`. Token `--radius-input`. Keep `.select-field`. SDK `has-value` also sets inline `paddingTop: 14px`. |
| `.select-form-wrapper` | **keep class**; `relative flex flex-1 cursor-pointer items-center` | `findFieldWrapper` walks `.select-form-wrapper`. |
| `.caret-down` | `pointer-events-none absolute bottom-0 right-0 z-[15] flex h-12 w-10 cursor-pointer items-center justify-center rounded-br-[6px] rounded-tr-[6px] border-l border-brand-border bg-transparent` | Hairline `#e1e1e1` → `brand-border`. |
| `.select-arrow` | `flex w-3 items-center justify-center text-brand-gray` | Source `#696969` → `brand-gray`. |
| `.form-section__header` / `__subtitle` | `flex flex-col gap-2` / `text-[0.925rem]` | |
| `.bundle-cards` | `flex flex-col gap-4` | Keep `os-option` + `data-next-bundle-*`. |
| `.bundle-card` (product) | `group relative cursor-pointer rounded-cards border-2 border-brand-border bg-brand-background p-4 next-selected:border-brand next-selected:bg-brand-lighter` | Keep `.next-selected` (SDK). Token `--brand--color--primary-lighter`. Do not keep leftover `.bundle-card` (next-core would still paint). |
| `.bundle-card` radio | radio: `os-card__radio flex size-5 … shadow-[0_0_0_2px_var(--brand--color--border)] group-[.next-selected]:shadow-[0_0_0_2px_var(--brand--color--primary)]`; inner: `[transform:scale(0)]` + card `next-selected:[&_.radio-inner]:[transform:scale(1)]` | Do **not** use `[&_.os-card__radio]` — the `__` is parsed as a space. Do **not** use v4 `scale-0` (that is the `scale` property, not `transform`). |
| `.bundle-card__badge--popular` / `--deal` / `--save` | `bg-pill-primary-surface text-pill-primary` / `bg-pill-secondary-surface text-pill-secondary` / `bg-system-destructive text-brand-white` | Shared badge chrome: `inline-flex … rounded-md px-[0.6rem] py-[0.3rem] text-xs font-extrabold uppercase leading-none`. **Voucher** (`data-next-show="cart.hasCoupon()"`) must **not** get a Tailwind display utility — `inline-flex` important beats SDK `display:none` / `.next-hidden` and paints empty red dots until the exit-popup coupon is taken. Leftover `[data-next-discounts="voucher"] { display: inline-flex }` (no important) is the shown-state chrome. |
| `.checkout-trust-bar` | `flex flex-col gap-4 max-[991px]:px-5 max-[991px]:py-4` | Icons `w-5 max-[479px]:w-3.5`; copy `text-xs font-semibold leading-none text-neutral-hint max-[479px]:text-[8px]`. Never add Tailwind `invert`. |
| `.credit-card__flags` | `mx-auto w-[90%] max-w-[350px] max-[479px]:w-full` | |
| `.submit-section` | `mt-[-1rem] flex flex-col gap-2 max-[479px]:mt-0` | Keep `.submit-button__loader` / `.three-quarter-spinner` leftover (SDK `data-pb-element`). |
| `.submit-section__disclaimer` | `mt-2.5 w-full text-center text-xs text-brand-foreground/90 max-[479px]:text-[8px]` | Leftover is `--font-size--xs` (12px) then **8px** at ≤479 — not `text-xs` on mobile. Compare 478 and 480. |
| `.submit-button` | `relative flex w-full min-h-[5rem] items-center justify-center rounded-button border-2 border-brand-cta bg-brand-cta px-8 py-4 text-center font-semibold text-brand-text-inverse no-underline` | Reveal trigger: `min-h-0 px-6 py-[0.875rem]` + label `text-base uppercase`. Do **not** put display utilities on `.checkout-reveal__cta` (`important` `flex` beats leftover `display:none`). |
| `.order-bumps` | `my-4 flex flex-col gap-4` | Form-section slot. Drop leftover `.order-bumps`. |
| check03 wrapper | `flex flex-col gap-4 border-none pt-[0.875rem]` | Beats leftover `[data-component="prepurchase-upsell"]` dashed border. Keep `data-component` / `data-variant`. |
| check03 card | `relative cursor-pointer overflow-visible rounded-cards border-2 border-dashed border-brand-border bg-white p-4 next-active:border-brand next-active:bg-brand-lighter next-in-cart:border-brand next-in-cart:bg-brand-lighter max-[767px]:p-[0.875rem]` | Selected fill is `--brand--color--primary-lighter`, not `brand-light`. Keep `data-next-toggle-card`. |
| check01 / switch card | `group relative overflow-hidden rounded-cards border border-bump-border next-active:bg-brand-surface next-active:select-none next-in-cart:bg-brand-surface next-in-cart:select-none max-[767px]:rounded` | Token `#bbb`. Header selected: `group-[.next-active]:bg-brand-light group-[.next-in-cart]:bg-brand-light` (`--brand--color--primary-light`). |
| check01 checkbox | `flex size-[1.625rem] shrink-0 items-center justify-center rounded border border-bump-checkbox bg-white` | check03 is `size-5` (1.25rem). Keep `[os-component="check"]` + leftover display. |
| `.bump__switch` | leftover | `::before` opacity + slider `transform`. Do not put transform utilities on the thumb. |

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
- `base.html` always loads **both**: `next-sdk.css` (tokens + leftover hooks + unconverted payment; cart-item* leftover still shipped for receipt-orders) and compiled `tailwind.css` (`important`). Apollo does **not** load `next-core.css` at runtime; the file stays on disk so `lint:next-core` stays byte-identical. Do not wait for a `page_type` gate. Regenerate leftover with `python3 scripts/extract-apollo-next-sdk.py`.

---

## `lint:next-core` during the pilot

All eight families still ship byte-identical `next-core.css`. This infra step does **not** change that file.

Apollo `base.html` loads `next-sdk.css`, not `next-core.css`. The Apollo `next-core.css` **file** stays byte-identical (`lint:next-core` unchanged). Do not add Apollo to a skip list. Regenerate `next-sdk.css` from the canonical Olympus next-core via `python3 scripts/extract-apollo-next-sdk.py`.

---

## Receipt pass (Apollo)

Receipt **chrome + checkout shell + order-summary cosmetics** are Tailwind utilities (tokens, not hex). `receipt-orders.html` line items keep `.cart-item*` (SDK clones those nodes). Accordion keeps `data-next-accordion*` and `next-expanded` (JS toggle).

`base.html` always loads compiled `tailwind.css`. Compile uses `@import "tailwindcss" important`.

**Shared wash:** desktop `.checkout__column--right` and the mobile drawer are the same `#f5f5f5` — both use `bg-neutral-drawer`. Do not keep a second fill (`bg-neutral-100`) for the sidebar.

**Accordion height** stays unlayered leftover on `[data-next-accordion-panel]` (SDK `style.height`). Never `h-0` / expanded-auto utilities.

**Reuse:** `receipt-order-totals.html` is included in the drawer and the desktop column. Flatten Webflow leftover wrappers (`summary-wrap`, nested `overflow-clip`, `pt-[5px]`). |

**Left on `next-sdk.css` / SDK classes:**

- `data-next-*` and `data-toggle-class="next-expanded"` (JS)
- `receipt-orders.html` `.cart-item*` template (SDK clones this; `data-next-order-items`, `order.hasItems`)
- `.skeleton-*` (SDK `data-next-skeleton` / `next-display-ready`)
- `.hide` on quantity controls inside the order-item template
- Accordion panel **height** (SDK `style.height`; see leftover block in `tailwind.input.css`)

---

## Upsell pass (Apollo)

Page chrome **and offer cosmetics** on the three Apollo bundle upsells are Tailwind utilities. `upsell-protection.html` is not in this worktree.

**Left on `next-sdk.css` / SDK classes:**

- `data-next-upsell*`, `data-next-bundle-*`, `data-next-quantity-*`, `data-next-display="bundle.*"` / `package.*`
- `.os-card` / `.os-option` / `.next-selected` (JS toggle; selected look is `next-selected:` utilities)
- Accept `.button` (`.next-loading` leftover). Pulse is `animate-pulse-upsell`.
- Swiper hooks only: `data-component="swiper"`, `data-variant="sw1"`, `swiper` / `swiper-wrapper` / `swiper-slide` / `swiper-slide-thumb-active` / `.swiper-initialized`, `[swiper="…"]`, `thumbsslider`. Gallery chrome is utilities.

---

## Checkout chrome pass (Apollo)

Checkout **page chrome**, product bundle cards, form-section titles, trust bar, reviews cards, submit cosmetics, order-bump cosmetics, and **checkout form layout** (customer + shipping grids, select caret) are Tailwind utilities. `.input-flds` / `.label-checkout` / `.form-grid` stay as SDK hooks. Payment methods and reveal park/unpark stay leftover. Cart-summary cosmetics are utilities; `.cart-item*` class names stay (SDK clones the template). `bump-check02.html` is unwired on the default checkout and is still leftover.

**Tokens added:** `--color-brand-white`, `--color-neutral-300`, `--color-neutral-checkout` (`#fcfcfc`), `--color-promo-timer-pill` (`rgba(255,255,255,0.19)`), `--radius-sm`, `--radius-input`, `--animate-as-seen-in-scroll`, `--color-brand-lighter`, `--color-pill-primary` / `--color-pill-primary-surface`, `--color-pill-secondary` / `--color-pill-secondary-surface`, `--color-bump-border` (`#bbb`), `--color-bump-checkbox` (`#9b9b9b`).

**Verified vs live** (`nextcommerce-campaign-templates.netlify.app/apollo/checkout/`):

- Desktop (~1265): banner 16px / `-0.32px` / white; header pad 16 / border `#dfdfdf`; logo 150; h1 32px / `-0.2px` / `#0a265c`; section `#fcfcfc`; timer 44 / black; reveal off-screen (`position:absolute; left:-99999px`, not `display:none`).
- 768: heading 28px / `-0.16px` / center; features 2-col grid. Header stays row until 767.
- 390: heading 24px / `-0.14px`; logo 120; header pad 12; divider `none`; features column; one visible `h1`.
- Add to Cart: `.is-revealed` + panel `position:static` / `left:auto` / not inert.

**Left on `next-sdk.css` / SDK classes:**

- `data-next-*`, `data-next-element="timer"`, `data-checkout-reveal-*`
- `.checkout-form--reveal` / `.is-revealed` / `.checkout-reveal__panel` / `.checkout-reveal__cta` (Spreedly: off-screen, never `hidden`)
- `.os-card__radio` / `.radio-inner` / `.next-selected` on product bundle cards
- `.form-grid` / `.form-group` / `.form-input` / `.select-form-wrapper` (SDK hooks; leftover **layout** unset on converted catalog surfaces so utilities paint; leftover intact on payment-methods / billing-form)
- `.form-grid.next-hidden` (unlayered `display:none !important` on converted catalog grids)
- `.input-flds` / `.select-field` / `.spreedly-field` (leftover **layout** unset on converted fields; leftover hover / focus / `.next-focused` / `.next-error-field` / border / fill stay)
- `.label-checkout` / `.has-value` (floating label; opacity is leftover — do not put opacity utilities)
- `.next-hidden` on `[data-next-component="location"]`
- `[os-component="check"]` display (unlayered leftover; no display utility — voucher-dot trap)
- `.bump__switch` / `.bump__switch-slider` (`::before` fill + thumb `transform`; ON state retargeted to `[data-next-toggle-card].next-in-cart` / `.next-active`)
- `.bump__personalization` (click-stop in `checkout-apollo.js`)
- `.checkbox__icon` (1rem check glyph)
- `.payment-method*` (generated shared partial)
- `.next-toast-handler` / `.tip1_bar` / `.tip1_bar.is-warning` (payment + express error placeholder; hide until SDK shows it)
- `.cart-item*` / `data-next-cart-summary` / `data-summary-lines` / `os-cart-summary-*` (SDK clones + host-state display). Cosmetics are utilities; leftover layout is unset on `[data-next-catalog-component="order-summary"]`. receipt-orders still leftover.
- `.hide` on `{item.hasDiscount}` / scroll-hint / dormant tax. Do not put display utilities on those nodes.
- `.diagonal-strike` leftover (no important display — `.hide` must win)
- `.cart-items__scroll-hint` leftover (JS opacity + 991 hide)
- `.submit-button__loader` / `.three-quarter-spinner`
- `swiper` / `swiper-slide` / `swiper-scrollbar` / `data-component="reviews-swiper"`

---


| `.cart-box` + `.cart-box--card` | `flex flex-col gap-4 rounded-sm border border-brand-border bg-white p-6` | `--radius--label` is 4px → `rounded-sm`. Converted on checkout.html wrapper. |
| `.summary-wrapper` / `.order-summary__content` | `flex flex-col gap-4` | Drop leftover wrappers. Keep `data-next-cart-summary`. |
| `.cart-items` | keep class; `relative` | Scroll-hint leftover keys off this. |
| `.cart-summary__line.pb--header` | `mb-1 flex justify-between border-b border-brand-border pb-1 font-bold` | Amount column `text-right`. |
| `.cart-items__list` | keep class; `flex max-h-[18rem] flex-col gap-2 overflow-auto border-b border-brand-border pt-2 max-[991px]:max-h-none` | Do not put display utilities on `.cart-items__scroll-hint`. |
| `.cart-item` | **keep class**; `static z-0 items-center justify-between pb-2` | SDK clones this node. No `flex` on the item — wrapper is the row. |
| `.cart-item__wrapper` | keep class; `flex w-full flex-row items-stretch justify-between overflow-visible rounded pl-0.5` | |
| `.cart-item__details` | keep class; `relative z-[1] flex w-full flex-col justify-center pl-4 max-[991px]:pl-3 max-[479px]:text-[0.9rem]` | Variant 01/03 no-image uses `pl-0` (was `.cc-left-0`). |
| `.cart-item__content` | keep class; `flex w-full items-stretch justify-between max-[991px]:items-end` | |
| `.cart-item__description` | keep class; `flex flex-1 flex-col items-start justify-center gap-[0.15rem] text-left` | |
| `.cart-item__title` | keep class; `text-base font-bold leading-[1.3] max-[479px]:text-[0.9rem]` | Variant 02 (no os-bold) is `font-medium`. |
| unit / muted | `text-xs font-normal leading-[1.4] text-brand-text-muted` | Keep `.diagonal-strike {item.hasDiscount}` — no display utility (`.hide` token). |
| `.cart-item__image-container` | keep class; `relative flex size-16 … rounded bg-white p-0.5 shadow-cart-item` | Token `--shadow-cart-item`. Image `bg-cart-image-wash`. |
| `.cart-item__quantity-badge` | keep class; `absolute -right-[0.35rem] -top-[0.35rem] z-[1] flex size-6 … rounded-md border-2 border-white bg-black text-[0.65rem] text-white` | Qty `font-bold max-[991px]:text-[0.6rem]`. |
| `.order-totals` | keep `.os-cart-summary-totals`; `relative flex min-h-[30px] w-full flex-col gap-3 … text-sm max-[991px]:text-xs` | Empty-cart hide is unlayered leftover `display:none !important`. |
| totals line | `flex justify-between text-brand-black` | Grand total adds `text-lg font-bold`. Coin `text-sm font-normal`. |
| `.order-totals__section--inset` + discount | `mx-[-1.5rem] bg-brand-surface px-6 py-2` on the **hook node only** — no display utility (`os-cart-summary-row--discount`). Saved amount `text-discount-saved`. |
| tax / discount rows | keep `os-cart-summary-row--tax` / `--discount` | Leftover display. Do not put `flex` on these nodes. |

## Out of scope for the Apollo pilot

- Renaming `data-next-*`
- Changing checkout JS behavior
- Compiling Tailwind inside `next-campaign-page-kit`
- Visual redesign
- Deleting `exit-intent-popup.css` until that page is converted
- Converting `src/landing/` (section library) off CDN in this pass
