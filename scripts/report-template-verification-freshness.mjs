#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessVerificationFreshness,
  computeVerificationFingerprint,
  hasTrackedVerificationChanges,
} from './lib/template-verification.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

try {
  const manifest = readJson('template-verification.json');
  const currentFingerprint = computeVerificationFingerprint(root);
  const assessment = assessVerificationFreshness({
    manifest,
    registry: readJson('_data/campaigns.json'),
    currentFingerprint,
  });
  const warnings = [...assessment.warnings];
  if (hasTrackedVerificationChanges(root)) {
    warnings.push('tracked verification inputs have uncommitted changes; fingerprint reflects the Git index');
  }

  if (!warnings.length) {
    console.log('[template-verification] Current tracked corpus matches the recorded evidence.');
  } else {
    for (const warning of warnings) emitWarning(warning);
    console.log(`[template-verification] Historical evidence remains valid; ${warnings.length} freshness warning(s) do not block CI.`);
  }
} catch (error) {
  emitWarning(`could not assess freshness: ${error.message}`);
  console.log('[template-verification] Evidence shape validation is a separate hard gate; freshness reporting remains informational.');
}

function emitWarning(message) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.warn(`::warning title=Template verification is historical::${message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}`);
  } else {
    console.warn(`[template-verification] WARNING: ${message}`);
  }
}
