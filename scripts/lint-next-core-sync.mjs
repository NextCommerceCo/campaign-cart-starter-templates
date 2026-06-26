// lint-next-core-sync.mjs
//
// Asserts that every template family ships a byte-identical next-core.css.
//
// next-core.css is the shared base stylesheet — every family is meant to carry
// the exact same file, and any change must be propagated to all of them. This
// has historically drifted by hand (e.g. a shared rule added to some families
// but not others), so this linter makes the invariant a hard gate.
//
// Design notes:
//   - The canonical file path is pinned (CANONICAL = 'olympus') for lint history — not a flagship-family choice.
//   - The canonical family list is pinned (FAMILIES). We do NOT infer "correct" from a majority vote (4 families
//     accidentally agreeing on bad content must not redefine the canonical) and
//     we do NOT infer the family set from "who has the file" (deleting the file
//     from N families would otherwise shrink the set and pass — a fail-open hole).
//   - A family in FAMILIES that is missing next-core.css is a hard failure.
//   - A src/<dir> that ships next-core.css but is NOT in FAMILIES is a hard
//     failure too, so the pinned list cannot silently fall out of date.
//   - Comparison is byte-exact on purpose: whitespace / line-ending / BOM
//     differences are real drift we want to catch.
//
// USAGE
//   node scripts/lint-next-core-sync.mjs   # exits non-zero on any drift (no "report only" mode)
//
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const srcRoot = join(repoRoot, 'src');

const REL = 'assets/css/next-core.css';

// Canonical template families that MUST ship an identical next-core.css.
// Mirrors the promoted-family list in lint-sdk.mjs. (src/landing/ ships
// tokens.css only and is intentionally absent.)
const FAMILIES = [
  'olympus',
  'apollo',
  'apollo-mv-single-step',
  'limos',
  'demeter',
  'shop-single-step',
  'shop-three-step',
  'olympus-mv-single-step',
  'olympus-mv-two-step',
];
const CANONICAL = 'olympus'; // fixed reference — not a majority vote

function sha(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

console.log(`[lint-next-core] checking ${FAMILIES.length} families share an identical ${REL}`);

const failures = [];

// 1. The pinned list must stay current: any family dir that ships next-core.css
//    but isn't in FAMILIES means the list is stale.
const onDisk = readdirSync(srcRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(srcRoot, e.name, REL)))
  .map((e) => e.name);
for (const dir of onDisk) {
  if (!FAMILIES.includes(dir)) {
    failures.push(`unknown family "${dir}" ships ${REL} but is not in the canonical FAMILIES list — add it to scripts/lint-next-core-sync.mjs`);
  }
}

// 2. The canonical reference must exist. If it doesn't, we can't compute drift
//    for the others — but we still run the presence sweep below so the report
//    lists every missing file in one pass instead of bailing on the first.
const canonicalPath = join(srcRoot, CANONICAL, REL);
const haveCanonical = existsSync(canonicalPath);
let refHash = null;
let refLines = [];
if (!haveCanonical) {
  failures.push(`canonical reference is MISSING: ${relative(repoRoot, canonicalPath)} — cannot compute drift for other families until it is restored`);
} else {
  const refContent = readFileSync(canonicalPath);
  refHash = sha(refContent);
  refLines = refContent.toString('utf8').split('\n');
}

// 3. Every family must ship the file and (when the canonical exists) match it
//    byte-for-byte.
for (const family of FAMILIES) {
  if (family === CANONICAL) continue;
  const path = join(srcRoot, family, REL);
  if (!existsSync(path)) {
    failures.push(`${relative(repoRoot, path)} is MISSING (every family must ship next-core.css)`);
    continue;
  }
  if (!haveCanonical) continue; // presence noted; drift uncheckable without a reference
  const content = readFileSync(path);
  if (sha(content) === refHash) continue;

  // Drift — point at the first differing line.
  const lines = content.toString('utf8').split('\n');
  let firstDiff = -1;
  const max = Math.max(lines.length, refLines.length);
  for (let i = 0; i < max; i++) {
    if (lines[i] !== refLines[i]) {
      firstDiff = i;
      break;
    }
  }
  const where =
    firstDiff === -1
      ? 'differs only in length'
      : `first diff at line ${firstDiff + 1}:\n      ${CANONICAL}: ${JSON.stringify(refLines[firstDiff] ?? '<EOF>')}\n      ${family}: ${JSON.stringify(lines[firstDiff] ?? '<EOF>')}`;
  failures.push(`${relative(repoRoot, path)} (${lines.length} lines) drifted from src/${CANONICAL}/${REL} — ${where}`);
}

if (failures.length === 0) {
  console.log(`[lint-next-core] PASS — all ${FAMILIES.length} families match src/${CANONICAL}/${REL}`);
  process.exit(0);
}

console.error(`\n[lint-next-core] FAIL — next-core.css is out of sync (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
for (const f of failures) console.error(`  ✗ ${f}`);
console.error(
  `\n  Fix: propagate the intended next-core.css so every family matches the canonical (src/${CANONICAL}/${REL}).\n` +
    `  Inspect with:  diff src/${CANONICAL}/${REL} src/<family>/${REL}\n`,
);
process.exit(1);
