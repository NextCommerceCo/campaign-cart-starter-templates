#!/usr/bin/env node

// Records fresh verification evidence in template-verification.json after a
// passing CI run. Mechanical facts only: it derives the SDK version from
// _data/campaigns.json, computes the current git-index fingerprint, and adds
// one evidence record pointing at the supplied CI run. It never changes
// campaigns_os_status — Campaigns OS certification stays a human decision.
//
// Usage:
//   node scripts/refresh-template-verification.mjs \
//     --sha <40-char commit> --run-url <https CI run> --completed-at <ISO date-time>
//
// The named commit must be the checked-out HEAD with no uncommitted changes to
// the verification inputs, so the recorded fingerprint provably describes it.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeVerificationFingerprint,
  hasTrackedVerificationChanges,
  refreshVerificationManifest,
} from './lib/template-verification.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));
for (const flag of ['sha', 'run-url', 'completed-at']) {
  if (!args[flag]) fail(`missing required --${flag}`);
}

const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== args.sha) {
  fail(`--sha ${args.sha} is not the checked-out HEAD (${head}); evidence must describe the exact commit that passed CI`);
}
if (hasTrackedVerificationChanges(root)) {
  fail('verification inputs have uncommitted changes; commit or discard them so the fingerprint describes the named commit');
}

const manifestPath = join(root, 'template-verification.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const registry = JSON.parse(readFileSync(join(root, '_data/campaigns.json'), 'utf8'));

let result;
try {
  result = refreshVerificationManifest({
    manifest,
    registry,
    sha: args.sha,
    fingerprint: computeVerificationFingerprint(root),
    runUrl: args['run-url'],
    completedAt: args['completed-at'],
    checkName: args['check-name'] || 'lint-sdk',
  });
} catch (error) {
  fail(error.message);
}

if (!result.changed) {
  console.log('[template-verification] Evidence is already current; nothing to record.');
} else {
  writeFileSync(manifestPath, `${JSON.stringify(result.manifest, null, 2)}\n`);
  console.log(`[template-verification] Recorded evidence ${result.evidenceId} for ${args.sha.slice(0, 12)}.`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) fail(`unexpected argument: ${argv[i]}`);
    const flag = argv[i].slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) fail(`--${flag} requires a value`);
    parsed[flag] = value;
    i += 1;
  }
  return parsed;
}

function fail(message) {
  console.error(`[template-verification] ${message}`);
  process.exit(1);
}
