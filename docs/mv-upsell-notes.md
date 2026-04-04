# MV Upsell — Notes & Open Questions

Working notes on multi-variant upsell behaviour. Items here are unconfirmed and need more testing before being moved into permanent docs or templates.

---

## PackageId reuse across checkout + MV upsell — coupon bleed (UNCONFIRMED)

**Observed:** When the same `packageId` is used on both the checkout bundle selector and the MV upsell bundle selector, the exit pop coupon applied during checkout (e.g. `EXIT10`) appears to carry into the upsell session. The upsell display tokens (`bundle.*.price`, `bundle.*.discountPercentage`) re-calculate using the active coupon — showing a lower price than intended. The actual accepted order price appears correct.

**Hypothesis:** The SDK carries applied voucher/coupon state across to the upsell page. Display tokens resolve against session state including the active coupon, while the submit path uses the voucher defined on the bundle card (`data-next-bundle-vouchers`).

**Possible workarounds to test:**
- Use a separate `packageId` on the upsell, scoped to a different offer in the campaign app so checkout coupons don't apply to it
- Investigate whether the session coupon can be cleared on the upsell page before display tokens resolve

---

## PackageId behaviour — AI summary (unconfirmed, needs testing)

One `packageId` in `data-next-bundle-items` = one campaign "package" ref_id. The SDK reads that package's variant options and resolves variant→SKU mapping via the campaign's variant graph — not by listing multiple packageIds in the JSON.

**Multiple packages, same product:**
- Using different packageIds on different pages is valid if they are truly independent packages with separate offer rules
- If two packages share the same offer/voucher scope in the campaign app, a coupon applied to one may affect the other — this is backend campaign config, not a JS/SDK concern
- For one upsell UI with variant dropdowns, use the correct configurable parent ref_id for that funnel; keep variant→SKU mapping in campaign data

**Multi-variant campaign app constraint:**
- Only one package per variant set appears valid for configurable MV
- Having e.g. `packageId 1` and `packageId 20` pointing to the same product variant set may share offer/coupon scope depending on campaign offer configuration

---

*Remove this file / migrate to permanent docs once the above is confirmed through testing.*
