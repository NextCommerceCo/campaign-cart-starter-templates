import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  computeVerificationDigest,
  validateVerificationManifest,
  verificationInputsMatchRef,
} from './lib/template-verification.mjs';

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

function validate(manifest, pickerOverride = picker) {
  return validateVerificationManifest({
    manifest,
    repository: base.repository,
    visibility: 'public',
    registry,
    picker: pickerOverride,
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
  const pickerWithUnknownFamily = { templates: [...picker.templates, { slug: 'demeter' }] };
  assert.ok(validate(manifest, pickerWithUnknownFamily).some((error) => error.includes('picker family demeter is missing from manifest')));
});

test('rejects picker entries without a slug', () => {
  const manifest = structuredClone(base);
  assert.ok(validate(manifest, { templates: [{}] }).some((error) => error.includes('entry is missing slug')));
});

test('rejects a hidden family marked public_picker', () => {
  const manifest = structuredClone(base);
  const hiddenPicker = { templates: [{ slug: 'olympus', hidden: true }] };
  assert.ok(validate(manifest, hiddenPicker).some((error) => error.includes('marked for a picker but missing')));
});

test('requires strict ISO date-times', () => {
  const manifest = structuredClone(base);
  manifest.source.verified_at = 'August 12, 2026';
  assert.ok(validate(manifest).some((error) => error.includes('must be an ISO date-time')));
});

test('requires https evidence URLs', () => {
  const manifest = structuredClone(base);
  manifest.verification.checks[0].url = 'http://example.com/run';
  assert.ok(validate(manifest).some((error) => error.includes('must use https')));
});

test('ignores untracked files when computing the source digest', (t) => {
  const root = createGitFixture(t);
  const before = computeVerificationDigest(root);
  writeFileSync(join(root, 'src', 'olympus', 'local-build.css'), 'untracked build output');
  assert.equal(computeVerificationDigest(root), before);
});

test('detects when tracked verification inputs differ from the source SHA', (t) => {
  const root = createGitFixture(t);
  const sourceSha = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.equal(verificationInputsMatchRef(root, sourceSha), true);
  writeFileSync(join(root, 'src', 'olympus', 'index.html'), 'changed template');
  assert.equal(verificationInputsMatchRef(root, sourceSha), false);
});

function createGitFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'template-verification-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, '_data'), { recursive: true });
  mkdirSync(join(root, 'docs'), { recursive: true });
  mkdirSync(join(root, 'src', 'olympus'), { recursive: true });
  writeFileSync(join(root, '_data', 'campaigns.json'), '{}');
  writeFileSync(join(root, 'templates.json'), '{}');
  writeFileSync(join(root, 'docs', 'commerce-surface-catalog.json'), '{}');
  writeFileSync(join(root, 'src', 'olympus', 'index.html'), 'verified template');
  execFileSync('git', ['-C', root, 'init', '--quiet']);
  execFileSync('git', ['-C', root, 'config', 'user.email', 'verification-test@example.com']);
  execFileSync('git', ['-C', root, 'config', 'user.name', 'Verification Test']);
  execFileSync('git', ['-C', root, 'add', '.']);
  execFileSync('git', ['-C', root, 'commit', '--quiet', '-m', 'fixture']);
  return root;
}
