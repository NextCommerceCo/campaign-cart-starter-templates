#!/usr/bin/env node
// lint-sdk.mjs — v0 SDK-markup discipline linter for campaign-cart-starter-templates
//
// Enforces the v0 component catalog rule: SDK attribute roots MUST live inside a
// canonical partial (under _includes/), not inlined in page templates.
//
// Two modes (run both by default):
//   --source    Scan src/<scope>/<page>.html for SDK attribute roots. Pages must use
//               {% campaign_include 'X.html' %} instead of inlining the markup.
//   --rendered  Scan _site/<scope>/**/*.html (post-build) for SDK attribute roots
//               that are NOT inside a data-next-catalog-component="<name>" wrapper.
//               This catches "agent copied canonical markup raw to game the gate."
//
// SCOPE for v0 = olympus + checkout page only. Other template families still inline;
// other olympus pages (presell/landing/upsell/receipt) deferred to v1 cross-page expansion.
//
// Usage:
//   node scripts/lint-sdk.mjs                       # both modes, scope=olympus, pages=checkout
//   node scripts/lint-sdk.mjs --source              # source-only
//   node scripts/lint-sdk.mjs --rendered            # rendered-only
//   node scripts/lint-sdk.mjs --pages=all           # all pages in scope (graduates to v1+)
//   node scripts/lint-sdk.mjs --pages=checkout,upsell  # explicit page set
//   node scripts/lint-sdk.mjs --scope=promoted --pages=checkout,select # promoted catalog families
//   node scripts/lint-sdk.mjs --scope=all           # all template families (graduates to v1)
//   CI=1 node scripts/lint-sdk.mjs                  # exit non-zero on violations

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const args = new Set(process.argv.slice(2));
const wantSource = args.has('--source') || (!args.has('--source') && !args.has('--rendered'));
const wantRendered = args.has('--rendered') || (!args.has('--source') && !args.has('--rendered'));
const scopeArg = [...args].find((a) => a.startsWith('--scope='));
const scope = scopeArg ? scopeArg.split('=')[1] : 'olympus'; // v0 default: olympus only
const pagesArg = [...args].find((a) => a.startsWith('--pages='));
const pages = pagesArg ? pagesArg.split('=')[1].split(',') : ['checkout']; // v0 default: checkout only
const allPages = pages.includes('all');
const isCI = process.env.CI === '1' || process.env.CI === 'true';
const PROMOTED_FAMILIES = [
  'olympus',
  'limos',
  'demeter',
  'shop-single-step',
  'shop-three-step',
  'olympus-mv-single-step',
  'olympus-mv-two-step',
];

// SDK attribute roots — anything containing these inside a non-partial source file is
// an inlined SDK surface that should be replaced by a {% campaign_include %} call.
// Seed list from next-campaigns-ops/skills/next-campaigns-build/references/sdk-managed-surfaces.md
const SDK_ATTR_ROOTS = [
  'data-next-bundle-selector',
  'data-next-bundle-card',
  'data-next-bundle-id',
  'data-next-bundle-items',
  'data-next-cart-summary',
  'data-next-cart-items',          // legacy 0.3.x pattern
  'data-next-payment-method',
  'data-next-payment-form',
  'data-next-express-checkout',
  'data-next-package-toggle',
  'data-next-toggle-card',
  'data-next-skeleton',
  'data-next-order-items',
  'data-next-upsell',
  'data-next-bundle-slot-template-id',
  'data-next-bundle-slots-for',
  'data-next-bundle-qty-for',
  'data-next-quantity-decrease',
  'data-next-quantity-increase',
  'data-next-quantity-display',
];

// Required-for-checkout attribute fields. Their absence (or wrong location) is a
// hard fail in the 95% gate spec.
const REQUIRED_CHECKOUT_FIELDS = ['email', 'fname', 'lname', 'address1', 'country'];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function scopedFamilies() {
  if (scope === 'promoted') return PROMOTED_FAMILIES;
  if (scope === 'all') {
    return readdirSync(join(repoRoot, 'src')).filter((d) =>
      statSync(join(repoRoot, 'src', d)).isDirectory()
    );
  }
  return [scope];
}

function pageMatches(filePath) {
  if (allPages) return true;
  const base = filePath.split('/').pop().replace(/\.html$/, '');
  return pages.includes(base);
}

function blankIgnoredMarkup(content) {
  const preserveLines = (match) => '\n'.repeat(match.split('\n').length - 1);
  return content
    .replace(/\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/g, preserveLines)
    .replace(/<!--[\s\S]*?-->/g, preserveLines);
}

function lintSource() {
  const violations = [];
  const families = scopedFamilies();
  for (const fam of families) {
    const dir = join(repoRoot, 'src', fam);
    const files = walk(dir).filter((f) => !f.includes('/_includes/') && pageMatches(f));
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      // Strip Liquid/HTML comments so reference-block notes don't trip the linter.
      const stripped = blankIgnoredMarkup(content);
      const lines = stripped.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const attr of SDK_ATTR_ROOTS) {
          if (lines[i].includes(attr)) {
            violations.push({
              kind: 'inlined-sdk-root',
              file: relative(repoRoot, file),
              line: i + 1,
              attr,
              suggestion: includeSuggestion(attr),
              snippet: lines[i].trim().slice(0, 140),
            });
          }
        }
      }
    }
  }
  return violations;
}

function lintRendered() {
  const violations = [];
  const families = scopedFamilies();
  for (const fam of families) {
    const dir = join(repoRoot, '_site', fam);
    let files;
    try {
      // _site lays out as <fam>/<page>/index.html — match by parent dir name.
      files = walk(dir).filter((f) => {
        if (allPages) return true;
        const parts = f.split('/');
        const pageDir = parts[parts.length - 2];
        return pages.includes(pageDir);
      });
    } catch {
      continue;
    }
    for (const file of files) {
      const content = blankIgnoredMarkup(readFileSync(file, 'utf8'));
      // For each SDK attr occurrence, walk back through the rendered HTML to verify
      // the nearest ancestor with data-next-catalog-component="<name>" exists.
      // Cheap heuristic without a full parser: find each attr index, then search
      // backwards for the most recent open-tag with data-next-catalog-component.
      for (const attr of SDK_ATTR_ROOTS) {
        let from = 0;
        while (true) {
          const idx = content.indexOf(attr, from);
          if (idx === -1) break;
          from = idx + attr.length;
          if (!hasOpenCatalogWrapper(content, idx)) {
            violations.push({
              kind: 'rendered-sdk-outside-wrapper',
              file: relative(repoRoot, file),
              line: lineOf(content, idx),
              attr,
              suggestion: includeSuggestion(attr),
              note: 'No open data-next-catalog-component wrapper found.',
            });
          }
        }
      }
    }
  }
  return violations;
}

function hasOpenCatalogWrapper(content, idx) {
  let searchFrom = idx;
  while (searchFrom > 0) {
    const attrIdx = content.lastIndexOf('data-next-catalog-component=', searchFrom);
    if (attrIdx === -1) return false;

    const tagStart = content.lastIndexOf('<div', attrIdx);
    const tagEnd = content.indexOf('>', attrIdx);
    if (tagStart === -1 || tagEnd === -1) return false;
    if (tagStart <= idx && idx <= tagEnd) return true;

    let depth = 1;
    const tagRe = /<\/?div\b/gi;
    tagRe.lastIndex = tagEnd + 1;
    let match;
    while ((match = tagRe.exec(content)) && match.index < idx) {
      if (match[0].startsWith('</')) depth--;
      else depth++;
      if (depth <= 0) break;
    }

    if (depth > 0) return true;
    searchFrom = tagStart - 1;
  }
  return false;
}

function includeSuggestion(attr) {
  const map = {
    'data-next-bundle-selector': "{% campaign_include 'bundle-selector.html' selector_id='...' %}",
    'data-next-bundle-card': "{% campaign_include 'bundle-selector.html' %}",
    'data-next-bundle-id': "{% campaign_include 'bundle-selector.html' %}",
    'data-next-bundle-items': "{% campaign_include 'bundle-selector.html' %}",
    'data-next-cart-summary': "{% campaign_include 'cart-summary01.html' %}",
    'data-next-cart-items': "{% campaign_include 'cart-summary01.html' %}",
    'data-next-payment-method': "{% campaign_include 'payment-methods.html' %}",
    'data-next-payment-form': "{% campaign_include 'payment-methods.html' %}",
    'data-next-express-checkout': "{% campaign_include 'express-checkout.html' %}",
    'data-next-package-toggle': "{% campaign_include 'bump-check01.html' %}",
    'data-next-toggle-card': "{% campaign_include 'bump-check01.html' %}",
    'data-next-skeleton': "{% campaign_include 'receipt-skeleton.html' %}",
    'data-next-order-items': "{% campaign_include 'receipt-orders.html' %}",
    'data-next-upsell': "{% campaign_include 'upsell-offer.html' %}",
    'data-next-bundle-slot-template-id': "{% campaign_include 'mv-configurable-selector.html' %}",
    'data-next-bundle-slots-for': "{% campaign_include 'mv-slot-stage.html' %}",
    'data-next-bundle-qty-for': "{% campaign_include 'single-offer-quantity-selector.html' %}",
    'data-next-quantity-decrease': "{% campaign_include 'single-offer-quantity-selector.html' %}",
    'data-next-quantity-increase': "{% campaign_include 'single-offer-quantity-selector.html' %}",
    'data-next-quantity-display': "{% campaign_include 'single-offer-quantity-selector.html' %}",
  };
  return map[attr] ?? '(see catalog: olympus/_includes/)';
}

function lineOf(content, charIdx) {
  return content.slice(0, charIdx).split('\n').length;
}

function fmt(v) {
  if (v.kind === 'inlined-sdk-root') {
    return `  ${v.file}:${v.line}\n    SDK attr [${v.attr}] inlined in page template\n    suggested: ${v.suggestion}\n    snippet:   ${v.snippet}`;
  }
  return `  ${v.file}:${v.line}\n    SDK attr [${v.attr}] outside data-next-catalog-component wrapper\n    suggested: ${v.suggestion}\n    note:      ${v.note}`;
}

const all = [];
if (wantSource) {
  console.log(`[lint-sdk] mode=source  scope=${scope}`);
  const v = lintSource();
  if (v.length === 0) console.log('  ✓ no inlined SDK roots in page templates\n');
  else {
    console.log(`  ✗ ${v.length} violation(s):`);
    for (const it of v) console.log(fmt(it));
    console.log('');
  }
  all.push(...v);
}

if (wantRendered) {
  console.log(`[lint-sdk] mode=rendered  scope=${scope}`);
  const v = lintRendered();
  if (v.length === 0) console.log('  ✓ all SDK roots in rendered HTML are inside catalog wrappers\n');
  else {
    console.log(`  ✗ ${v.length} violation(s):`);
    for (const it of v) console.log(fmt(it));
    console.log('');
  }
  all.push(...v);
}

if (all.length === 0) {
  console.log('[lint-sdk] PASS');
  process.exit(0);
}

console.log(`[lint-sdk] FAIL — ${all.length} total violation(s)`);
console.log('');
console.log('Background: v0 catalog requires SDK markup to live in canonical partials');
console.log('under olympus/_includes/, called via {% campaign_include %}. Inlined SDK');
console.log('attributes break the agentic build assumption that partials own SDK contracts.');
console.log('See: next-campaigns-ops/docs/checkout-components-inventory-2026-05-01.md');

if (isCI) process.exit(1);
process.exit(all.length > 0 ? 1 : 0);
