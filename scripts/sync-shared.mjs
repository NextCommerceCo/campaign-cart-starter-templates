#!/usr/bin/env node
/**
 * sync-shared.mjs — generate each template family's analytics files from the single canonical
 * source in _shared/analytics/, so the Route C analytics capability stays identical across every
 * family without hand-copying.
 *
 *   _shared/analytics/_includes/*.html  ->  src/<family>/_includes/*.html
 *   _shared/analytics/js/*.js           ->  src/<family>/assets/js/*.js
 *
 * Each generated file gets a GENERATED header pointing back at the source. The capability is
 * inert until a campaign sets the matching id in _data/campaigns.json (empty id = off), so
 * syncing to a family adds the capability WITHOUT turning anything on.
 *
 * Usage:
 *   node scripts/sync-shared.mjs           # write generated copies into every family
 *   node scripts/sync-shared.mjs --check   # verify no drift (CI); exit 1 if any family is stale
 *
 * `src/landing/` is intentionally excluded (its analytics are commented-out examples only).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, '_shared', 'analytics');

// Families that carry the checkout/analytics layouts (landing is excluded by design).
const FAMILIES = [
  'apollo', 'apollo-mv-single-step', 'demeter', 'olympus',
  'olympus-mv-single-step', 'olympus-mv-two-step', 'shop-single-step', 'shop-three-step',
];

const CHECK = process.argv.includes('--check');

// GENERATED header per file type. Kept out of the source files so _shared/ stays clean/diffable
// (the js/ sources remain byte-identical to analytics-tracking-docs/examples for easy re-sync).
function header(relSourcePath, kind) {
  const msg = `GENERATED from _shared/analytics/${relSourcePath} — edit the source and run \`npm run sync:shared\`. Do not edit this copy.`;
  if (kind === 'html') return `{%- comment -%} ${msg} {%- endcomment -%}\n`;
  return `/* ${msg} */\n`;
}

// (sourceRelDir, sourceFile) -> per-family destination + file kind
function jobs() {
  const out = [];
  for (const f of readdirSync(join(SRC, '_includes'))) {
    if (f.endsWith('.html')) out.push({ src: join(SRC, '_includes', f), rel: `_includes/${f}`, destSub: join('_includes', f), kind: 'html' });
  }
  for (const f of readdirSync(join(SRC, 'js'))) {
    if (f.endsWith('.js')) out.push({ src: join(SRC, 'js', f), rel: `js/${f}`, destSub: join('assets', 'js', f), kind: 'js' });
  }
  return out;
}

let drift = 0, wrote = 0;
const list = jobs();

for (const fam of FAMILIES) {
  for (const j of list) {
    const expected = header(j.rel, j.kind) + readFileSync(j.src, 'utf8');
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
  console.log(`[sync:shared] PASS — all ${FAMILIES.length} families match _shared/analytics/ (${list.length} files each).`);
} else {
  console.log(`[sync:shared] done — ${wrote} file(s) written across ${FAMILIES.length} families (${list.length} files each).`);
}
