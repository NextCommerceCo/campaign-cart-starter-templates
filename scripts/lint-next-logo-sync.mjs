// Asserts that every public template surface ships the canonical NEXT logo.
// Comparison is byte-exact so viewBox, paths, metadata, and whitespace cannot
// drift independently between families.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const srcRoot = join(repoRoot, 'src');
const REL = 'assets/images/next-dark.svg';
const FAMILIES = [
  'olympus',
  'apollo',
  'apollo-mv-single-step',
  'demeter',
  'shop-single-step',
  'shop-three-step',
  'olympus-mv-single-step',
  'olympus-mv-two-step',
  'landing',
];
const CANONICAL = 'olympus';

const sha = (content) => createHash('sha256').update(content).digest('hex');
const failures = [];

console.log(`[lint-next-logo] checking ${FAMILIES.length} surfaces share an identical ${REL}`);

const onDisk = readdirSync(srcRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(srcRoot, entry.name, REL)))
  .map((entry) => entry.name);

for (const dir of onDisk) {
  if (!FAMILIES.includes(dir)) {
    failures.push(`unknown surface "${dir}" ships ${REL} but is not in FAMILIES`);
  }
}

const canonicalPath = join(srcRoot, CANONICAL, REL);
const haveCanonical = existsSync(canonicalPath);
const canonical = haveCanonical ? readFileSync(canonicalPath) : null;
const canonicalHash = canonical ? sha(canonical) : null;
const canonicalLines = canonical ? canonical.toString('utf8').split('\n') : [];

if (!haveCanonical) {
  failures.push(`canonical reference is MISSING: ${relative(repoRoot, canonicalPath)}`);
}

for (const family of FAMILIES) {
  if (family === CANONICAL) continue;
  const path = join(srcRoot, family, REL);
  if (!existsSync(path)) {
    failures.push(`${relative(repoRoot, path)} is MISSING`);
    continue;
  }
  if (!canonical) continue;

  const content = readFileSync(path);
  if (sha(content) === canonicalHash) continue;

  const lines = content.toString('utf8').split('\n');
  const max = Math.max(lines.length, canonicalLines.length);
  let firstDiff = -1;
  for (let index = 0; index < max; index += 1) {
    if (lines[index] !== canonicalLines[index]) {
      firstDiff = index;
      break;
    }
  }
  const detail =
    firstDiff === -1
      ? 'differs only in byte length'
      : `first diff at line ${firstDiff + 1}: ${JSON.stringify(lines[firstDiff] ?? '<EOF>')}`;
  failures.push(`${relative(repoRoot, path)} drifted from src/${CANONICAL}/${REL} (${detail})`);
}

if (failures.length === 0) {
  console.log(`[lint-next-logo] PASS — all ${FAMILIES.length} surfaces match src/${CANONICAL}/${REL}`);
  process.exit(0);
}

console.error(`\n[lint-next-logo] FAIL — canonical NEXT logo drift (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
for (const failure of failures) console.error(`  ✗ ${failure}`);
console.error(`\n  Fix: propagate src/${CANONICAL}/${REL} to every listed surface.\n`);
process.exit(1);
