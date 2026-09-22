#!/usr/bin/env python3
"""Extract Apollo next-sdk.css from the canonical next-core.css.

Copies :root tokens plus leftover/SDK hook rules (forms state, payment,
cart-item, billing, loaders, skeletons, reveal). Does not copy converted
chrome / bundle / bump cosmetics.

Usage (from repo root):
  python3 scripts/extract-apollo-next-sdk.py
"""

from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "src/olympus/assets/css/next-core.css"
DEST = REPO / "src/apollo/assets/css/next-sdk.css"

TOKENS = [
    "data-next-await",
    "next-await-shimmer",
    "next-display-ready",
    "next-hidden",
    "next-location-hidden",
    "next-hidden-form",
    "next-loading",
    "next-error",
    "next-focused",
    "next-slot",
    "data-button",
    "is-submitting",
    "data-next-action",
    "input-flds",
    "label-checkout",
    "form-grid",
    "form-grid__row",
    "form-group",
    "form-input",
    "select-form-wrapper",
    "caret-down",
    "select-arrow",
    "select-field",
    "spreedly",
    "payment-method",
    "cart-item",
    "cart-items",
    "cart-box",
    "checkout-reveal",
    "checkout-form--reveal",
    "submit-button__loader",
    "three-quarter-spinner",
    "os-card__radio",
    "radio-inner",
    "skeleton",
    "checkbox__icon",
    "checkbox__input",
    "checkout__checkbox",
    "checkbox-wrapper",
    "billing-address",
    "next-error-label",
    "coupon-tag",
    "coupon-tags",
    "spinner-rotate",
    "spinner-arc",
    "addErrorIcon",
    "addTick",
    "next-toast-handler",
    "tip1_bar",
    "payment-btn",
    "exp-checkout",
    "express-checkout",
    "bump__switch",
]

HEADER = """\
/*
 * next-sdk.css — Apollo leftover sheet (pilot).
 *
 * Loaded by Apollo base.html INSTEAD of next-core.css.
 * src/apollo/assets/css/next-core.css stays on disk and stays
 * byte-identical (lint:next-core). Do not edit that copy for Apollo.
 *
 * This file is: :root tokens (Campaigns OS brand-theme) + SDK hooks +
 * still-unconverted leftover (payment-methods, cart-item*, billing inject,
 * loaders, skeletons, reveal park). Converted chrome/bundles/bumps/form
 * LAYOUT is Tailwind. Catalog neutralize in tailwind.input.css still
 * unsets leftover form layout on converted customer/shipping fields.
 *
 * Regenerate: python3 scripts/extract-apollo-next-sdk.py
 */
"""

NEXT_HIDDEN = """
/* SDK + leftover hide. campaign-cart.css also sets .next-hidden; keep a local
   copy so location gating does not depend on CDN sheet order. */
.next-hidden,
.next-location-hidden {
  display: none;
}
"""


def skip_comment(text: str, pos: int) -> int:
    if text.startswith("/*", pos):
        end = text.find("*/", pos + 2)
        return len(text) if end < 0 else end + 2
    return pos


def read_block(text: str, pos: int) -> tuple[str, int]:
    assert text[pos] == "{"
    depth = 0
    j = pos
    n = len(text)
    while j < n:
        if text.startswith("/*", j):
            j = skip_comment(text, j)
            continue
        ch = text[j]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[pos + 1 : j], j + 1
        elif ch in ("'", '"'):
            q = ch
            j += 1
            while j < n and text[j] != q:
                if text[j] == "\\":
                    j += 2
                    continue
                j += 1
        j += 1
    return text[pos + 1 :], n


def selector_wanted(sel: str) -> bool:
    if sel.strip() in {".hide", "hide"}:
        return True
    if re.search(r"(^|[\s,>])\.hide($|[\s,:{])", sel):
        return True
    return any(token in sel for token in TOKENS)


def rule_wanted(prelude: str) -> bool:
    km = re.match(r"@keyframes\s+([\w-]+)", prelude.strip())
    if km:
        return selector_wanted(km.group(1))
    return any(selector_wanted(part) for part in prelude.split(","))


def extract(text: str) -> str:
    n = len(text)
    out: list[str] = []

    root_m = re.search(r":root\s*\{", text)
    if root_m:
        inner, _ = read_block(text, root_m.end() - 1)
        out.append(":root {" + inner + "}\n")
        out.append(NEXT_HIDDEN)

    pos = 0
    while pos < n:
        pos = skip_comment(text, pos)
        if pos >= n:
            break
        if text[pos].isspace():
            pos += 1
            continue
        start = pos
        while pos < n and text[pos] not in "{;":
            if text.startswith("/*", pos):
                pos = skip_comment(text, pos)
                continue
            pos += 1
        if pos >= n:
            break
        prelude = text[start:pos].strip()
        if text[pos] == ";":
            pos += 1
            continue
        inner, end = read_block(text, pos)
        pos = end

        if prelude.strip() == ":root":
            continue

        if prelude.startswith("@media") or prelude.startswith("@supports"):
            sub: list[str] = []
            q = 0
            ln = len(inner)
            while q < ln:
                while q < ln and inner[q].isspace():
                    q += 1
                if q < ln and inner.startswith("/*", q):
                    q = skip_comment(inner, q)
                    continue
                if q >= ln:
                    break
                st = q
                while q < ln and inner[q] not in "{;":
                    q += 1
                if q >= ln:
                    break
                pre = inner[st:q].strip()
                if inner[q] == ";":
                    q += 1
                    continue
                depth = 0
                bstart = q
                while q < ln:
                    if inner[q] == "{":
                        depth += 1
                    elif inner[q] == "}":
                        depth -= 1
                        if depth == 0:
                            q += 1
                            break
                    q += 1
                body = inner[bstart:q]
                if rule_wanted(pre):
                    sub.append(pre + " " + body)
            if sub:
                out.append(prelude + " {\n" + "".join("  " + s + "\n" for s in sub) + "}\n")
            continue

        if rule_wanted(prelude):
            out.append(prelude + " {" + inner + "}\n")

    return HEADER + "\n" + "\n".join(out)


def main() -> None:
    css = extract(SRC.read_text())
    css = re.sub(r"\n{3,}", "\n\n", css)
    DEST.write_text(css)
    print(f"wrote {DEST.relative_to(REPO)} ({DEST.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
