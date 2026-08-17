#!/usr/bin/env node
/**
 * sync-shared.mjs — generate each template family's copies of shared files from the canonical
 * sources under _shared/, so shared capabilities stay identical across every family without
 * hand-copying.
 *
 * Shared roots:
 *   _shared/analytics/_includes/*.html  ->  src/<family>/_includes/*.html
 *   _shared/analytics/js/*.js           ->  src/<family>/assets/js/*.js
 *   _shared/checkout/_includes/*.html   ->  src/<family>/_includes/*.html
 *   _shared/checkout/images/*.svg       ->  src/<family>/assets/images/*.svg
 *
 * Generated .html/.js files get a GENERATED header pointing back at the source; .svg copies are
 * byte-identical (an injected comment would sit before the XML declaration and break the file).
 * The analytics capability is inert until a campaign sets the matching id in _data/campaigns.json
 * (empty id = off), so syncing to a family adds the capability WITHOUT turning anything on. The
 * checkout payment-methods partial renders all method radios by default and the SDK filters them
 * to the campaign's available_payment_methods at runtime, so syncing it is likewise inert.
 *
 * Usage:
 *   node scripts/sync-shared.mjs           # write generated copies into every family
 *   node scripts/sync-shared.mjs --check   # verify no drift (CI); exit 1 if any family is stale
 *
 * `src/landing/` is intentionally excluded (its analytics are commented-out examples only, and it
 * has no checkout).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Families that carry the checkout/analytics layouts (landing is excluded by design).
const FAMILIES = [
  'apollo', 'apollo-mv-single-step', 'demeter', 'olympus',
  'olympus-mv-single-step', 'olympus-mv-two-step', 'shop-single-step', 'shop-three-step',
];

// Each shared root maps (sourceSubdir, extension) -> per-family destination + file kind.
const SHARED_ROOTS = [
  {
    name: 'analytics',
    dirs: [
      { sub: '_includes', ext: '.html', destDir: join('_includes'), kind: 'html' },
      { sub: 'js', ext: '.js', destDir: join('assets', 'js'), kind: 'js' },
    ],
  },
  {
    name: 'checkout',
    dirs: [
      { sub: '_includes', ext: '.html', destDir: join('_includes'), kind: 'html' },
      { sub: 'images', ext: '.svg', destDir: join('assets', 'images'), kind: 'raw' },
    ],
  },
];

const CHECK = process.argv.includes('--check');

// GENERATED header per file type. Kept out of the source files so _shared/ stays clean/diffable
// (the analytics js/ sources remain byte-identical to analytics-tracking-docs/examples for easy
// re-sync). kind 'raw' gets no header — the copy must stay byte-identical to the source.
function header(rootName, relSourcePath, kind) {
  const msg = `GENERATED from _shared/${rootName}/${relSourcePath} — edit the source and run \`npm run sync:shared\`. Do not edit this copy.`;
  if (kind === 'html') return `{%- comment -%} ${msg} {%- endcomment -%}\n`;
  if (kind === 'js') return `/* ${msg} */\n`;
  return '';
}

function jobs() {
  const out = [];
  for (const root of SHARED_ROOTS) {
    const base = join(ROOT, '_shared', root.name);
    for (const d of root.dirs) {
      const dir = join(base, d.sub);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)) {
        if (!f.endsWith(d.ext)) continue;
        out.push({
          src: join(dir, f),
          rootName: root.name,
          rel: `${d.sub}/${f}`,
          destSub: join(d.destDir, f),
          kind: d.kind,
        });
      }
    }
  }
  return out;
}

let drift = 0, wrote = 0;
const list = jobs();

for (const fam of FAMILIES) {
  for (const j of list) {
    const expected = header(j.rootName, j.rel, j.kind) + readFileSync(j.src, 'utf8');
    const destPath = join(ROOT, 'src', fam, j.destSub);
    const current = existsSync(destPath) ? readFileSync(destPath, 'utf8') : null;
    if (current === expected) continue;
    if (CHECK) {
      drift++;
      console.error(`[sync:shared] DRIFT  src/${fam}/${j.destSub}`);
    } else {
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, expected);
      wrote++;
      console.log(`[sync:shared] wrote  src/${fam}/${j.destSub}`);
    }
  }
}

if (CHECK) {
  if (drift) { console.error(`[sync:shared] FAIL — ${drift} file(s) out of sync. Run \`npm run sync:shared\`.`); process.exit(1); }
  console.log(`[sync:shared] PASS — all ${FAMILIES.length} families match _shared/ (${list.length} files each).`);
} else {
  console.log(`[sync:shared] done — ${wrote} file(s) written across ${FAMILIES.length} families (${list.length} files each).`);
}
