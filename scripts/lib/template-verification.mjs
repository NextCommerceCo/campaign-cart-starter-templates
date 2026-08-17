import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export const TEMPLATE_VERIFICATION_SCHEMA = 'template-verification-manifest/v0';
export const SDK_VERSION_RE = /^0\.4\.\d+$/;
export const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
export const SHA_RE = /^[0-9a-f]{40}$/;

const REQUIRED_INPUTS = [
  '_data/campaigns.json',
  'templates.json',
  'docs/commerce-surface-catalog.json',
];
const INPUT_PATHS = [...REQUIRED_INPUTS, 'src'];

export function collectVerificationInputs(root, extraPaths = []) {
  const requiredInputs = [...REQUIRED_INPUTS, ...extraPaths];
  const trackedInputs = execFileSync(
    'git',
    ['-C', root, 'ls-files', '-z', '--', ...INPUT_PATHS, ...extraPaths],
    { encoding: 'utf8' },
  ).split('\0').filter(Boolean);
  const trackedSet = new Set(trackedInputs);

  for (const input of requiredInputs) {
    if (!trackedSet.has(input)) throw new Error(`required verification input is not tracked: ${input}`);
  }

  return [...new Set(trackedInputs)].sort((a, b) => a.localeCompare(b)).map((input) => {
    const path = join(root, input);
    let stats;
    try {
      stats = lstatSync(path);
    } catch (error) {
      throw new Error(`tracked verification input is missing: ${input}`, { cause: error });
    }
    if (stats.isSymbolicLink()) throw new Error(`verification inputs cannot be symbolic links: ${input}`);
    if (!stats.isFile()) throw new Error(`verification input is not a file: ${input}`);
    return path;
  });
}

export function computeVerificationDigest(root, extraPaths = []) {
  const hash = createHash('sha256');
  for (const path of collectVerificationInputs(root, extraPaths)) {
    const name = relative(root, path).split('\\').join('/');
    hash.update(name);
    hash.update('\0');
    hash.update(readFileSync(path));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

export function verificationInputsMatchRef(root, ref, extraPaths = []) {
  if (!SHA_RE.test(ref || '')) return false;
  const result = spawnSync(
    'git',
    ['-C', root, 'diff', '--quiet', ref, '--', ...INPUT_PATHS, ...extraPaths],
    { encoding: 'utf8' },
  );
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(result.stderr.trim() || `could not compare verification inputs with ${ref}`);
}

export function validateVerificationManifest({
  manifest,
  repository,
  visibility,
  registry,
  picker,
  expectedDigest,
  sourceMatchesCurrent = true,
}) {
  const errors = [];
  if (!isObject(manifest)) return ['manifest must be a JSON object'];
  if (manifest.schema_version !== TEMPLATE_VERIFICATION_SCHEMA) {
    errors.push(`schema_version must be ${TEMPLATE_VERIFICATION_SCHEMA}`);
  }
  if (manifest.repository !== repository) errors.push(`repository must be ${repository}`);
  if (manifest.visibility !== visibility) errors.push(`visibility must be ${visibility}`);

  const source = manifest.source;
  if (!isObject(source)) errors.push('source must be an object');
  else {
    if (!SHA_RE.test(source.sha || '')) errors.push('source.sha must be a 40-character lowercase git SHA');
    if (!DIGEST_RE.test(source.digest || '')) errors.push('source.digest must be sha256:<64 lowercase hex>');
    if (source.digest !== expectedDigest) {
      errors.push(`source.digest is stale: expected ${expectedDigest}, got ${source.digest || '(missing)'}`);
    }
    if (!sourceMatchesCurrent) errors.push('source.sha does not match the current tracked verification inputs');
    if (!isDateTime(source.verified_at)) errors.push('source.verified_at must be an ISO date-time');
  }

  const verification = manifest.verification;
  if (!isObject(verification) || verification.scope !== 'template_contract_ci') {
    errors.push('verification.scope must be template_contract_ci');
  }
  const checks = verification?.checks;
  if (!Array.isArray(checks) || checks.length === 0) errors.push('verification.checks must contain at least one check');
  else {
    for (const [index, check] of checks.entries()) {
      if (!isObject(check)) {
        errors.push(`verification.checks[${index}] must be an object`);
        continue;
      }
      if (!check.name) errors.push(`verification.checks[${index}].name is required`);
      if (check.status !== 'passed') errors.push(`verification.checks[${index}].status must be passed`);
      if (!isHttpsUrl(check.url)) errors.push(`verification.checks[${index}].url must use https`);
      if (!isDateTime(check.completed_at)) errors.push(`verification.checks[${index}].completed_at must be an ISO date-time`);
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

  const pickerEntries = Array.isArray(picker?.templates) ? picker.templates : [];
  const pickerFamilies = new Set();
  for (const entry of pickerEntries) {
    if (!entry?.slug) {
      errors.push('templates.json entry is missing slug');
      continue;
    }
    if (!families[entry.slug]) errors.push(`picker family ${entry.slug} is missing from manifest`);
    const isActive = entry.hidden !== true && entry.deprecated !== true;
    if (isActive) pickerFamilies.add(entry.slug);
    if (isActive && families[entry.slug]?.distribution === 'not_in_picker') {
      errors.push(`picker family ${entry.slug} is marked not_in_picker`);
    }
  }

  for (const [family, record] of Object.entries(families)) {
    if (!isObject(record)) {
      errors.push(`families.${family} must be an object`);
      continue;
    }
    if (!['commerce_family', 'section_library'].includes(record.kind)) errors.push(`families.${family}.kind is invalid`);
    if (!SDK_VERSION_RE.test(record.sdk_version || '')) errors.push(`families.${family}.sdk_version must match 0.4.x`);
    if (registry?.[family]?.sdk_version !== record.sdk_version) {
      errors.push(`families.${family}.sdk_version must match _data/campaigns.json (${registry?.[family]?.sdk_version || 'missing'})`);
    }
    if (!['verified', 'candidate', 'superseded'].includes(record.verification_status)) {
      errors.push(`families.${family}.verification_status is invalid`);
    }
    if (!['certified', 'candidate', 'not_applicable'].includes(record.campaigns_os_status)) {
      errors.push(`families.${family}.campaigns_os_status is invalid`);
    }
    if (!['public_picker', 'private_picker', 'not_in_picker'].includes(record.distribution)) {
      errors.push(`families.${family}.distribution is invalid`);
    }
    if (visibility === 'public' && record.distribution === 'private_picker') {
      errors.push(`families.${family} cannot be private_picker in a public manifest`);
    }
    if (record.distribution !== 'not_in_picker' && !pickerFamilies.has(family)) {
      errors.push(`families.${family} is marked for a picker but missing from templates.json`);
    }
    if (record.source_path !== `src/${family}`) errors.push(`families.${family}.source_path must be src/${family}`);
  }
  return errors;
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
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
