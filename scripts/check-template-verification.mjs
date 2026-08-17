#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeVerificationDigest,
  validateVerificationManifest,
} from './lib/template-verification.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const manifest = readJson('template-verification.json');
const errors = validateVerificationManifest({
  manifest,
  repository: 'NextCommerceCo/campaign-cart-starter-templates',
  visibility: 'public',
  registry: readJson('_data/campaigns.json'),
  picker: readJson('templates.json'),
  expectedDigest: computeVerificationDigest(root),
});

if (errors.length) {
  console.error('Template verification manifest is invalid:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Template verification manifest is current (${Object.keys(manifest.families).length} families, ${manifest.source.digest}).`);
