#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validateVerificationManifest } from './lib/template-verification.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const manifest = readJson('template-verification.json');
const schema = readJson('schemas/template-verification-manifest.v1.schema.json');
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

if (!validateSchema(manifest)) {
  console.error('Template verification manifest does not match its JSON schema:');
  for (const error of validateSchema.errors) {
    console.error(`- ${error.instancePath || '/'} ${error.message}`);
  }
  process.exit(1);
}

const errors = validateVerificationManifest({
  manifest,
  repository: process.env.GITHUB_REPOSITORY,
  registry: readJson('_data/campaigns.json'),
  picker: readJson('templates.json'),
  commerceCatalog: readJson('docs/commerce-surface-catalog.json'),
});

if (errors.length) {
  console.error('Template verification manifest is invalid:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const evidenceCount = Object.keys(manifest.evidence).length;
console.log(`Template verification evidence is valid (${Object.keys(manifest.families).length} families, ${evidenceCount} evidence record${evidenceCount === 1 ? '' : 's'}).`);
