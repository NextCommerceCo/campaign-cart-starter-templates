# Campaign Cart Starter Templates

This repo contains starter HTML templates for building sales funnel pages — checkout, post-purchase upsells, and order confirmation (receipt) — using the **Campaign Cart SDK** by NextCommerce.

These are standalone HTML files. There is no framework, no build step, and no bundler. Each template is designed to be deployed as a static page.

For SDK documentation see the [official docs](https://developers.nextcommerce.com/docs/campaigns/campaign-cart/) and the [SDK source](https://github.com/NextCommerceCo/campaign-cart).

---

## Features

- **Attribute-driven architecture** - Build cart functionality with HTML attributes
- **Cart management** - Add to cart, selectors, quantity controls
- **Profile-based pricing** - Dynamic package mapping for different pricing tiers
- **Post-purchase upsells** - Maximize order value with upsell flows
- **Dynamic content** - Display prices, totals, and product data
- **Conversion tools** - FOMO notifications and exit intent popups


## Asset paths (CSS, JS, images)

Templates live at different folder depths (e.g. `templates/checkout/demeter.html` vs `templates/checkout/shop-three/information.html`). Assets (`config.js`, `css/`, `js/`, `images/`) are at the **project root**.

- **Use relative paths** from each template to the project root:
  - One level under `templates/` (e.g. `templates/checkout/demeter.html`) → `../../` (e.g. `../../config.js`, `../../css/...`, `../../images/...`).
  - Two levels under `templates/` (e.g. `templates/checkout/shop-three/information.html`) → `../../../`.
- This works for local preview and any deployment; avoid root-absolute paths (`/css/...`) unless the site is always served from the domain root.


## Utility classes — `css/next-core.css`

Utility classes extracted from `css/next-core.css`. Single-purpose, reusable classes for layout, typography, spacing, visibility, and theming.

---

### 1. Visibility & display

| Class | CSS | Description |
|-------|-----|-------------|
| `.hide` | `display: none` | Hide element |
| `.layer` | `justify-content: center; align-items: center; position: absolute; inset: 0%` | Full-bleed overlay layer (flex centered) |

**Responsive visibility:** `-up` = hidden at that width and up, `-down` = hidden at that width and down. `.hide-mobile-up` (≥480px), `.hide-md-up` (≥768px), `.hide-tablet-up` (≥992px); `.hide-tablet-down` (≤991px), `.hide-md-down` (≤767px), `.hide-mobile-down` (≤479px).

---

### 2. Overflow

| Class | CSS |
|-------|-----|
| `.overflow-hidden` | `overflow: hidden` |
| `.overflow-scroll` | `overflow: scroll` |
| `.overflow-auto` | `overflow: auto` |

---

### 3. Z-index

| Class | CSS |
|-------|-----|
| `.z-index-1` | `z-index: 1; position: relative` |
| `.z-index-2` | `z-index: 2; position: relative` |

---

### 4. Max-width

| Class | CSS |
|-------|-----|
| `.max-width-full` | `width: 100%; max-width: none` |
| `.max-width-xxlarge` … `.max-width-xxsmall` | 80rem down to 20rem |
| `.max-50ch` | `max-width: 50ch` |

Responsive: `.max-width-full-tablet`, `.max-width-full-mobile-landscape`, `.max-width-full-mobile-portrait`.

---

### 5. Containers

Centered block with max-width and horizontal auto margins: `.container-large` (80rem), `.container-medium` (64rem), `.container-small` (48rem), `.container-xsmall`.

---

### 6. Spacing

| Class | Description |
|-------|-------------|
| `.spacing-clean` | `margin: 0; padding: 0` |
| `.padding-xxsmall` | `padding: .5rem` |
| `.negative-margin-tm` | Pull content to viewport edges on tablet/mobile |

---

### 7. Typography — size

`.text-3xs`, `.text-xs`, `.text-xs-2`, `.text-sm`, `.text-md`, `.text-reg`, `.text-lg`, `.text-2xl`

---

### 8. Typography — weight

`.text-weight-normal`, `.text-weight-semibold`, `.text-weight-bold` · `.tw-300`, `.tw-500`, `.tw-600`, `.tw-700`, `.tw-800`

---

### 9. Typography — display (headlines)

`.display-xs`, `.display-sm`, `.display-md`, `.display-lg`, `.display-xl`, `.display-2xl` — large display/headline styles with balanced wrapping.

---

### 10. Typography — type scale

`.ts-2xs`, `.ts-tiny`

---

### 11. Typography — alignment & decoration

`.text-left`, `.text-center`, `.text-right`, `.text-muted`, `.font-bold`, `.text-italic`, `.text-underline`, `.text-strike`, `.text-uppercase`, `.text-no-wrap`, `.text-break`, `.text-clip-bg`

---

### 12. Color — text (semantic)

`.text-main`, `.text-surface`, `.text-accent`, `.color-destructive`, `.color-accent`

---

### 13. Color — background (brand)

Uses `:root` variables: `.bg-color-primary`, `.bg-color-secondary`, `.bg-color-secondary--light`, `.bg-color-tertiary`, `.bg-color-tertiary--light`, `.bg-color-accent`, `.bg-color-complimentary1`, `.bg-color-complimentary2`

---

### 14. Color — background (utility)

`.bg-primary`

---

### 15. Layout — flex

`.vertical-wrap`, `.vflex-left-top`, `.hflex-left-center`, `.display-col`, `.display-row` · Gap modifiers: `.cc-tiny`, `.cc-xs`, `.cc-s`, `.cc-m`, `.cc-l`, `.cc-xl`, `.cc-2xs`; `.vertical-wrap.va-middle`

---

### 16. Layout — grid

**grid-{n}col-{spacing}:** `wide` / `standard` / `compact` for 2, 3, 4, 6 columns  
**grid-custom:** `.grid-11`

**Grid placement:** Use on grid children for placement/alignment.

| Class | CSS |
|-------|-----|
| `.grid-cell` | `grid-area: span 1 / span 1 / span 1 / span 1` |
| `.grid-span-col-2` | `grid-area: span 1 / span 2 / span 1 / span 2` |
| `.justify-self-start` | `justify-self: start` |
| `.justify-self-end` | `justify-self: end` |
| `.align-self-center` | `align-self: center` |
| `.align-self-stretch` | `align-self: stretch` |
| `.place-self-center-stretch` | `place-self: center stretch` |

Responsive: `.grid-cell--sm` — same grid-area only at `max-width: 767px`.

---

### 17. Alignment & sizing

`.align-center`, `.mt-auto`, `.width-full`, `.height-full`

---

### 18. Effects

`.opacity-0`, `.opacity-50`, `.box-shadow`

---

### 19. Position

`.sticky` · `.sticky.feature10` sets `top: 6rem`

---

### Naming conventions

- **max-width-\*** — Width caps · **container-\*** — Centered containers
- **display-\*** — Headline typography or flex direction
- **text-\*** — Font size/weight · **tw-\*** — Font weight · **ts-\*** — Type scale
- **bg-color-\*** — Brand backgrounds
- **ct-\*** — Semantic chips
**Source:** All classes are in `css/next-core.css`; responsive variants are in `@media` blocks there.

