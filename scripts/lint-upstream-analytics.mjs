#!/usr/bin/env node
/**
 * lint-upstream-analytics.mjs — verify the canonical Route C js files in _shared/analytics/js/
 * are still byte-identical to their upstream source in analytics-tracking-docs/examples/.
 *
 * That invariant ("kept byte-identical … so re-syncing from the upstream reference is a straight
 * copy", _shared/analytics/README.md) was previously stated but unenforced — hand-synced fixes
 * (e.g. the snapchat SUBSCRIBE drop) could silently drift the two trees apart.
 *
 * Scope: js/ ONLY. The HTML partials are NOT byte-identical by design — upstream ships per-vendor
 * analytics-head.snippet.html files; this repo merges them into one Liquid-gated pair of partials.
 *
 * The upstream repo is a SIBLING checkout, not a dependency, so this linter is advisory/local:
 * it exits 0 with a notice when the sibling is absent (CI does not check it out). Override the
 * location with ANALYTICS_DOCS_DIR.
 *
 * Usage:
 *   npm run lint:upstream
 *   ANALYTICS_DOCS_DIR=/path/to/analytics-tracking-docs npm run lint:upstream
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = join(ROOT, '_shared', 'analytics', 'js');
const UPSTREAM = process.env.ANALYTICS_DOCS_DIR
  ? resolve(process.env.ANALYTICS_DOCS_DIR)
  : resolve(ROOT, '..', 'analytics-tracking-docs');

// local file in _shared/analytics/js/ -> upstream path under analytics-tracking-docs/examples/
const MAP = {
  'next-forwarder-core.js': join('_shared', 'next-forwarder-core.js'),
  'ga4.adapter.js': join('direct-ga4', 'ga4.adapter.js'),
  'axon.adapter.js': join('direct-axon', 'axon.adapter.js'),
  'taboola.adapter.js': join('direct-taboola', 'taboola.adapter.js'),
  'triplewhale.adapter.js': join('direct-triplewhale', 'triplewhale.adapter.js'),
  'tiktok.adapter.js': join('direct-tiktok', 'tiktok.adapter.js'),
  'northbeam.adapter.js': join('direct-northbeam', 'northbeam.adapter.js'),
  'snapchat.adapter.js': join('direct-snapchat', 'snapchat.adapter.js'),
  'pinterest.adapter.js': join('direct-pinterest', 'pinterest.adapter.js'),
};

if (!existsSync(join(UPSTREAM, 'examples'))) {
  console.log(`[lint:upstream] SKIP — upstream repo not found at ${UPSTREAM} (set ANALYTICS_DOCS_DIR to check).`);
  process.exit(0);
}

let drift = 0;
for (const [local, upstreamRel] of Object.entries(MAP)) {
  const localPath = join(LOCAL, local);
  const upstreamPath = join(UPSTREAM, 'examples', upstreamRel);
  if (!existsSync(localPath)) { drift++; console.error(`[lint:upstream] MISSING local  _shared/analytics/js/${local}`); continue; }
  if (!existsSync(upstreamPath)) { drift++; console.error(`[lint:upstream] MISSING upstream examples/${upstreamRel}`); continue; }
  if (readFileSync(localPath, 'utf8') !== readFileSync(upstreamPath, 'utf8')) {
    drift++;
    console.error(`[lint:upstream] DRIFT  _shared/analytics/js/${local} != examples/${upstreamRel}`);
  }
}

if (drift) {
  console.error(`[lint:upstream] FAIL — ${drift} file(s) differ from analytics-tracking-docs/examples/.`);
  console.error('[lint:upstream] Fix in analytics-tracking-docs first, copy here, then `npm run sync:shared`.');
  process.exit(1);
}
console.log(`[lint:upstream] PASS — ${Object.keys(MAP).length} js files byte-identical to ${UPSTREAM}/examples/.`);
