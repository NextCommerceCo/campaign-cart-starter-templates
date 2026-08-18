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
  refreshVerificationManifest,
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
    .some((error) => error.includes('expected repository (Example/fork)')));
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

const refreshInput = {
  sha: 'd'.repeat(40),
  fingerprint: `git-index-sha256:${'e'.repeat(64)}`,
  runUrl: 'https://example.com/run/2',
  completedAt: '2026-08-18T09:00:00Z',
};

test('refresh records new evidence and repoints families without touching status', () => {
  const manifest = structuredClone(base);
  const { manifest: next, evidenceId, changed } = refreshVerificationManifest({
    manifest,
    registry,
    ...refreshInput,
  });
  assert.equal(changed, true);
  assert.equal(evidenceId, 'sdk-0.4.36-2026-08-18');
  assert.equal(next.evidence[evidenceId].source.sha, refreshInput.sha);
  assert.equal(next.families.olympus.evidence, evidenceId);
  assert.equal(next.families.olympus.campaigns_os_status, 'certified');
  assert.ok(next.evidence[evidenceId], 'historical evidence is preserved alongside the new record');
  assert.ok(next.evidence['sdk-0.4.34-2026-08-12']);
  assert.deepEqual(validate(next), []);
});

test('refresh is a no-op when evidence already matches the current corpus', () => {
  const manifest = structuredClone(base);
  const first = refreshVerificationManifest({ manifest, registry, ...refreshInput });
  const second = refreshVerificationManifest({ manifest: first.manifest, registry, ...refreshInput });
  assert.equal(second.changed, false);
  assert.equal(second.manifest, first.manifest);
});

test('refresh suffixes the evidence id on a same-day re-certification of a different commit', () => {
  const manifest = structuredClone(base);
  const first = refreshVerificationManifest({ manifest, registry, ...refreshInput });
  const second = refreshVerificationManifest({
    manifest: first.manifest,
    registry,
    ...refreshInput,
    sha: 'f'.repeat(40),
    fingerprint: `git-index-sha256:${'0'.repeat(64)}`,
  });
  assert.equal(second.evidenceId, 'sdk-0.4.36-2026-08-18.2');
  assert.deepEqual(validate(second.manifest), []);
});

test('refresh never repoints a family that has no evidence reference', () => {
  const manifest = structuredClone(base);
  manifest.families.demeter = { campaigns_os_status: 'candidate' };
  const { manifest: next, changed } = refreshVerificationManifest({
    manifest,
    registry: { ...registry, demeter: { sdk_version: '0.4.36' } },
    ...refreshInput,
  });
  assert.equal(changed, true, 'stale verified families still trigger a refresh');
  assert.equal(next.families.olympus.evidence, 'sdk-0.4.36-2026-08-18');
  assert.equal(Object.hasOwn(next.families.demeter, 'evidence'), false,
    'unverified family stays unverified until a human points it at evidence');
});

test('refresh treats an unverified family as current when verified families match', () => {
  const manifest = structuredClone(base);
  const first = refreshVerificationManifest({ manifest, registry, ...refreshInput });
  first.manifest.families.demeter = { campaigns_os_status: 'candidate' };
  const second = refreshVerificationManifest({
    manifest: first.manifest,
    registry: { ...registry, demeter: { sdk_version: '0.4.36' } },
    ...refreshInput,
  });
  assert.equal(second.changed, false,
    'a family awaiting its first human-assigned evidence must not force refresh churn');
});

test('refresh reuses an identical same-day evidence record instead of rewriting it', () => {
  const manifest = structuredClone(base);
  const first = refreshVerificationManifest({ manifest, registry, ...refreshInput });
  // Point one family back at old evidence so the manifest is stale again,
  // while the matching same-day record already exists.
  first.manifest.families.olympus.evidence = evidenceId;
  const recordBefore = structuredClone(first.manifest.evidence['sdk-0.4.36-2026-08-18']);
  const second = refreshVerificationManifest({ manifest: first.manifest, registry, ...refreshInput });
  assert.equal(second.changed, true);
  assert.equal(second.evidenceId, 'sdk-0.4.36-2026-08-18');
  assert.equal(Object.keys(second.manifest.evidence).length, 2, 'no duplicate record appended');
  assert.deepEqual(second.manifest.evidence['sdk-0.4.36-2026-08-18'], recordBefore,
    'existing record content is untouched');
  assert.equal(second.manifest.families.olympus.evidence, 'sdk-0.4.36-2026-08-18');
});

test('refresh refuses a registry with mixed SDK versions', () => {
  assert.throws(
    () => refreshVerificationManifest({
      manifest: structuredClone(base),
      registry: { olympus: { sdk_version: '0.4.36' }, apollo: { sdk_version: '0.4.35' } },
      ...refreshInput,
    }),
    /disagree on sdk_version/,
  );
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
