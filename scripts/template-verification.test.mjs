import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  assessVerificationFreshness,
  computeVerificationFingerprint,
  hasTrackedVerificationChanges,
  validateVerificationManifest,
} from './lib/template-verification.mjs';

const evidenceId = 'sdk-0.4.34-2026-08-12';
const registry = { olympus: { sdk_version: '0.4.36' } };
const picker = { templates: [{ slug: 'olympus', hidden: false, deprecated: false }] };
const commerceCatalog = { families: { olympus: {} } };
const base = {
  schema_version: 'template-verification-manifest/v1',
  repository: 'NextCommerceCo/campaign-cart-starter-templates',
  visibility: 'public',
  evidence: {
    [evidenceId]: {
      sdk_version: '0.4.34',
      source: {
        sha: 'a'.repeat(40),
        fingerprint: `git-index-sha256:${'b'.repeat(64)}`,
      },
      verified_at: '2026-08-12T06:12:06Z',
      checks: [{
        name: 'lint-sdk',
        status: 'passed',
        url: 'https://example.com/run',
        completed_at: '2026-08-12T06:12:06Z',
      }],
    },
  },
  families: {
    olympus: { evidence: evidenceId, campaigns_os_status: 'certified' },
  },
};

function validate(manifest, overrides = {}) {
  return validateVerificationManifest({
    manifest,
    repository: base.repository,
    registry,
    picker,
    commerceCatalog,
    ...overrides,
  });
}

test('accepts historical evidence when the current SDK has advanced', () => {
  assert.deepEqual(validate(structuredClone(base)), []);
});

test('rejects a repository mismatch only when an expected repository is supplied', () => {
  const manifest = structuredClone(base);
  assert.deepEqual(validateVerificationManifest({ manifest, registry, picker, commerceCatalog }), []);
  assert.ok(validate(manifest, { repository: 'Example/fork' })
    .some((error) => error.includes('GITHUB_REPOSITORY')));
});

test('rejects a registry family omitted from the manifest', () => {
  const manifest = structuredClone(base);
  manifest.families = { landing: { campaigns_os_status: 'not_applicable' } };
  assert.ok(validate(manifest).some((error) => error.includes('registry family olympus is missing')));
});

test('uses own-property checks for picker slugs and evidence references', () => {
  const manifest = structuredClone(base);
  manifest.families.olympus.evidence = 'constructor';
  const maliciousPicker = { templates: [{ slug: 'constructor', hidden: false, deprecated: false }] };
  const errors = validate(manifest, { picker: maliciousPicker });
  assert.ok(errors.some((error) => error.includes('public picker family constructor is missing')));
  assert.ok(errors.some((error) => error.includes('references unknown evidence constructor')));
});

test('rejects malformed current SDK metadata', () => {
  const errors = validate(structuredClone(base), { registry: { olympus: { sdk_version: 'latest' } } });
  assert.ok(errors.some((error) => error.includes('sdk_version must match 0.4.x')));
});

test('reports corpus and SDK drift without turning it into a validation error', () => {
  const manifest = structuredClone(base);
  assert.deepEqual(validate(manifest), []);
  const assessment = assessVerificationFreshness({
    manifest,
    registry,
    currentFingerprint: `git-index-sha256:${'c'.repeat(64)}`,
  });
  assert.equal(assessment.fresh, false);
  assert.ok(assessment.warnings.some((warning) => warning.includes('corpus differs')));
  assert.ok(assessment.warnings.some((warning) => warning.includes('0.4.34 → 0.4.36')));
});

test('reports fresh when current metadata and fingerprint match evidence', () => {
  const manifest = structuredClone(base);
  const assessment = assessVerificationFreshness({
    manifest,
    registry: { olympus: { sdk_version: '0.4.34' } },
    currentFingerprint: manifest.evidence[evidenceId].source.fingerprint,
  });
  assert.deepEqual(assessment, { fresh: true, warnings: [] });
});

test('allows a newly registered family to exist without evidence', () => {
  const manifest = structuredClone(base);
  delete manifest.families.olympus.evidence;
  assert.deepEqual(validate(manifest), []);
  const assessment = assessVerificationFreshness({
    manifest,
    registry,
    currentFingerprint: manifest.evidence[evidenceId].source.fingerprint,
  });
  assert.ok(assessment.warnings.some((warning) => warning.includes('no verification evidence')));
});

test('fingerprint uses tracked index entries and ignores untracked files', (t) => {
  const root = createGitFixture(t);
  const before = computeVerificationFingerprint(root);
  writeFileSync(join(root, 'src', 'olympus', 'local-build.css'), 'untracked build output');
  assert.equal(computeVerificationFingerprint(root), before);
});

test('fingerprint changes after a tracked file is staged', (t) => {
  const root = createGitFixture(t);
  const before = computeVerificationFingerprint(root);
  writeFileSync(join(root, 'src', 'olympus', 'index.html'), 'changed template');
  assert.equal(hasTrackedVerificationChanges(root), true);
  execFileSync('git', ['-C', root, 'add', 'src/olympus/index.html']);
  assert.notEqual(computeVerificationFingerprint(root), before);
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
