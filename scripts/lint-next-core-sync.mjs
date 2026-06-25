// lint-next-core-sync.mjs
//
// Asserts that every template family ships a byte-identical next-core.css.
//
// next-core.css is the shared base stylesheet — every family is meant to carry
// the exact same file, and any change must be propagated to all of them. This
// has historically drifted by hand (e.g. a shared rule added to some families
// but not others), so this linter makes the invariant a hard gate.
//
// Files checked: src/<family>/assets/css/next-core.css
//   (src/landing/ ships tokens.css only and is naturally excluded.)
//
// USAGE
//   node scripts/lint-next-core-sync.mjs        # report drift, exit 0
//   CI=1 node scripts/lint-next-core-sync.mjs   # exit non-zero on drift
//
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const srcRoot = join(repoRoot, 'src');

const REL = 'assets/css/next-core.css';

function sha(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

// Discover every family that ships a next-core.css.
const families = readdirSync(srcRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => existsSync(join(srcRoot, name, REL)))
  .sort();

console.log(`[lint-next-core] checking ${families.length} families share an identical ${REL}`);

if (families.length < 2) {
  console.log('[lint-next-core] PASS (fewer than 2 files — nothing to compare)');
  process.exit(0);
}

const entries = families.map((family) => {
  const path = join(srcRoot, family, REL);
  const content = readFileSync(path);
  return { family, path, content, hash: sha(content) };
});

// Group by hash; the largest group is the reference, the rest are drifted.
const byHash = new Map();
for (const e of entries) {
  if (!byHash.has(e.hash)) byHash.set(e.hash, []);
  byHash.get(e.hash).push(e);
}

if (byHash.size === 1) {
  console.log('[lint-next-core] PASS — all next-core.css files are identical');
  process.exit(0);
}

// Pick the reference group (most members; ties broken by first family alphabetically).
const groups = [...byHash.values()].sort(
  (a, b) => b.length - a.length || a[0].family.localeCompare(b[0].family),
);
const reference = groups[0];
const refLines = reference[0].content.toString('utf8').split('\n');

console.error(
  `\n[lint-next-core] FAIL — next-core.css has drifted across families.\n` +
    `  Reference (${reference.length}/${entries.length} agree): ${reference.map((e) => e.family).join(', ')}`,
);

for (const group of groups.slice(1)) {
  for (const e of group) {
    const lines = e.content.toString('utf8').split('\n');
    // Find the first differing line to point the developer at the drift.
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
        : `first diff at line ${firstDiff + 1}:\n      reference: ${JSON.stringify(refLines[firstDiff] ?? '<EOF>')}\n      ${e.family}: ${JSON.stringify(lines[firstDiff] ?? '<EOF>')}`;
    console.error(`  ✗ ${relative(repoRoot, e.path)} (${lines.length} lines) — ${where}`);
  }
}

console.error(
  `\n  Fix: propagate the intended next-core.css to every family so all ${entries.length} files match.\n` +
    `  Inspect with:  diff src/${reference[0].family}/${REL} src/<drifted-family>/${REL}\n`,
);

// Drift is always a hard failure (locally and in CI).
process.exit(1);
