import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const TEMPLATE_VERIFICATION_SCHEMA = 'template-verification-manifest/v1';
export const SDK_VERSION_RE = /^0\.4\.\d+$/;
export const FINGERPRINT_RE = /^git-index-sha256:[0-9a-f]{64}$/;
export const SHA_RE = /^[0-9a-f]{40}$/;

const REQUIRED_INPUTS = [
  '_data/campaigns.json',
  'templates.json',
  'docs/commerce-surface-catalog.json',
];
const INPUT_PATHS = [...REQUIRED_INPUTS, 'src'];

export function computeVerificationFingerprint(root, extraPaths = []) {
  const index = verificationIndex(root, extraPaths);
  const hash = createHash('sha256').update(index).digest('hex');
  return `git-index-sha256:${hash}`;
}

export function hasTrackedVerificationChanges(root, extraPaths = []) {
  const output = execFileSync(
    'git',
    ['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=no', '--', ...INPUT_PATHS, ...extraPaths],
    { encoding: 'buffer' },
  );
  return output.length > 0;
}

export function validateVerificationManifest({
  manifest,
  repository,
  registry,
  picker,
  commerceCatalog,
}) {
  const errors = [];
  if (!isObject(manifest)) return ['manifest must be a JSON object'];
  if (manifest.schema_version !== TEMPLATE_VERIFICATION_SCHEMA) {
    errors.push(`schema_version must be ${TEMPLATE_VERIFICATION_SCHEMA}`);
  }
  if (repository && manifest.repository !== repository) {
    errors.push(`repository must match GITHUB_REPOSITORY (${repository})`);
  }
  if (manifest.visibility !== 'public') errors.push('visibility must be public');

  const evidence = isObject(manifest.evidence) ? manifest.evidence : {};
  for (const [evidenceId, record] of Object.entries(evidence)) {
    if (!isObject(record)) {
      errors.push(`evidence.${evidenceId} must be an object`);
      continue;
    }
    if (!SDK_VERSION_RE.test(record.sdk_version || '')) {
      errors.push(`evidence.${evidenceId}.sdk_version must match 0.4.x`);
    }
    if (!isDateTime(record.verified_at)) {
      errors.push(`evidence.${evidenceId}.verified_at must be an ISO date-time`);
    }
    if (!SHA_RE.test(record.source?.sha || '')) {
      errors.push(`evidence.${evidenceId}.source.sha must be a 40-character lowercase git SHA`);
    }
    if (!FINGERPRINT_RE.test(record.source?.fingerprint || '')) {
      errors.push(`evidence.${evidenceId}.source.fingerprint must use git-index-sha256`);
    }
    if (!Array.isArray(record.checks) || record.checks.length === 0) {
      errors.push(`evidence.${evidenceId}.checks must contain at least one check`);
    } else {
      for (const [index, check] of record.checks.entries()) {
        if (!isObject(check)) {
          errors.push(`evidence.${evidenceId}.checks[${index}] must be an object`);
          continue;
        }
        if (!check.name) errors.push(`evidence.${evidenceId}.checks[${index}].name is required`);
        if (check.status !== 'passed') errors.push(`evidence.${evidenceId}.checks[${index}].status must be passed`);
        if (!isHttpsUrl(check.url)) errors.push(`evidence.${evidenceId}.checks[${index}].url must use https`);
        if (!isDateTime(check.completed_at)) {
          errors.push(`evidence.${evidenceId}.checks[${index}].completed_at must be an ISO date-time`);
        }
      }
    }
  }

  const families = manifest.families;
  if (!isObject(families) || Object.keys(families).length === 0) {
    errors.push('families must be a non-empty object');
    return errors;
  }

  const registryFamilies = Object.keys(registry || {}).sort();
  const manifestFamilies = Object.keys(families).sort();
  for (const family of difference(registryFamilies, manifestFamilies)) {
    errors.push(`registry family ${family} is missing from manifest`);
  }
  for (const family of difference(manifestFamilies, registryFamilies)) {
    errors.push(`manifest family ${family} is missing from _data/campaigns.json`);
  }

  for (const [family, current] of Object.entries(registry || {})) {
    if (!SDK_VERSION_RE.test(current?.sdk_version || '')) {
      errors.push(`_data/campaigns.json ${family}.sdk_version must match 0.4.x`);
    }
  }

  const pickerEntries = Array.isArray(picker?.templates) ? picker.templates : [];
  for (const entry of pickerEntries) {
    if (!entry?.slug) {
      errors.push('templates.json entry is missing slug');
      continue;
    }
    if (entry.hidden !== true && entry.deprecated !== true && !Object.hasOwn(families, entry.slug)) {
      errors.push(`public picker family ${entry.slug} is missing from manifest`);
    }
  }

  for (const family of Object.keys(commerceCatalog?.families || {})) {
    if (!Object.hasOwn(families, family)) {
      errors.push(`commerce catalog family ${family} is missing from manifest`);
    }
  }

  for (const [family, record] of Object.entries(families)) {
    if (!isObject(record)) {
      errors.push(`families.${family} must be an object`);
      continue;
    }
    if (record.evidence !== undefined && !Object.hasOwn(evidence, record.evidence)) {
      errors.push(`families.${family}.evidence references unknown evidence ${record.evidence}`);
    }
    if (!['certified', 'candidate', 'not_applicable'].includes(record.campaigns_os_status)) {
      errors.push(`families.${family}.campaigns_os_status is invalid`);
    }
  }
  return errors;
}

export function assessVerificationFreshness({ manifest, registry, currentFingerprint }) {
  const warnings = [];
  const evidenceIds = new Set();
  const neverVerified = [];
  const sdkDrift = [];

  for (const [family, record] of Object.entries(manifest.families || {})) {
    if (!record?.evidence) {
      neverVerified.push(family);
      continue;
    }
    const evidence = manifest.evidence?.[record.evidence];
    if (!evidence) continue;
    evidenceIds.add(record.evidence);
    const currentSdk = registry?.[family]?.sdk_version;
    if (currentSdk && currentSdk !== evidence.sdk_version) {
      sdkDrift.push(`${family} (${evidence.sdk_version} → ${currentSdk})`);
    }
  }

  const fingerprintDrift = [...evidenceIds]
    .filter((id) => manifest.evidence[id].source.fingerprint !== currentFingerprint);
  if (fingerprintDrift.length) {
    warnings.push(`tracked template corpus differs from evidence: ${fingerprintDrift.join(', ')}`);
  }
  if (sdkDrift.length) warnings.push(`current SDK differs from verified SDK: ${sdkDrift.join(', ')}`);
  if (neverVerified.length) warnings.push(`families have no verification evidence: ${neverVerified.join(', ')}`);

  return { fresh: warnings.length === 0, warnings };
}

function verificationIndex(root, extraPaths) {
  const output = execFileSync(
    'git',
    ['-C', root, 'ls-files', '--stage', '-z', '--', ...INPUT_PATHS, ...extraPaths],
    { encoding: 'buffer' },
  );
  const entries = output.toString('utf8').split('\0').filter(Boolean);
  const paths = new Set(entries.map((entry) => entry.slice(entry.indexOf('\t') + 1)));
  for (const input of [...REQUIRED_INPUTS, ...extraPaths]) {
    if (!paths.has(input)) throw new Error(`required verification input is not tracked: ${input}`);
  }
  if (![...paths].some((path) => path.startsWith('src/'))) {
    throw new Error('no tracked verification inputs found under src/');
  }
  for (const entry of entries) {
    if (!/^[0-9]{6} [0-9a-f]+ 0\t/.test(entry)) {
      throw new Error(`verification input has a non-zero index stage: ${entry.slice(entry.indexOf('\t') + 1)}`);
    }
  }
  return output;
}

function difference(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDateTime(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
