import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVerificationManifest } from './lib/template-verification.mjs';

const registry = { olympus: { sdk_version: '0.4.34' } };
const picker = { templates: [{ slug: 'olympus' }] };
const base = {
  schema_version: 'template-verification-manifest/v0',
  repository: 'NextCommerceCo/campaign-cart-starter-templates',
  visibility: 'public',
  source: {
    sha: 'a'.repeat(40),
    digest: `sha256:${'b'.repeat(64)}`,
    verified_at: '2026-08-12T06:12:06Z',
  },
  verification: {
    scope: 'template_contract_ci',
    checks: [{ name: 'lint-sdk', status: 'passed', url: 'https://example.com/run', completed_at: '2026-08-12T06:12:06Z' }],
  },
  families: {
    olympus: {
      kind: 'commerce_family',
      sdk_version: '0.4.34',
      verification_status: 'verified',
      campaigns_os_status: 'certified',
      distribution: 'public_picker',
      source_path: 'src/olympus',
    },
  },
};

function validate(manifest) {
  return validateVerificationManifest({
    manifest,
    repository: base.repository,
    visibility: 'public',
    registry,
    picker,
    expectedDigest: base.source.digest,
  });
}

test('accepts a current public verification manifest', () => {
  assert.deepEqual(validate(structuredClone(base)), []);
});

test('rejects a stale source digest', () => {
  const manifest = structuredClone(base);
  manifest.source.digest = `sha256:${'c'.repeat(64)}`;
  assert.ok(validate(manifest).some((error) => error.includes('source.digest is stale')));
});

test('rejects a registry SDK mismatch', () => {
  const manifest = structuredClone(base);
  manifest.families.olympus.sdk_version = '0.4.35';
  assert.ok(validate(manifest).some((error) => error.includes('must match _data/campaigns.json')));
});

test('rejects a picker family omitted from the manifest', () => {
  const manifest = structuredClone(base);
  manifest.families = {};
  assert.ok(validate(manifest).some((error) => error.includes('families must be a non-empty object')));
});
