import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const TEMPLATE_VERIFICATION_SCHEMA = 'template-verification-manifest/v0';
export const SDK_VERSION_RE = /^0\.4\.\d+$/;
export const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
export const SHA_RE = /^[0-9a-f]{40}$/;

export function collectVerificationInputs(root, extraPaths = []) {
  const inputs = [
    join(root, '_data', 'campaigns.json'),
    join(root, 'templates.json'),
    join(root, 'docs', 'commerce-surface-catalog.json'),
    ...walk(join(root, 'src')),
    ...extraPaths.map((path) => join(root, path)),
  ];
  return [...new Set(inputs)]
    .filter((path) => statSync(path).isFile())
    .sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
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

export function validateVerificationManifest({
  manifest,
  repository,
  visibility,
  registry,
  picker,
  expectedDigest,
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
      if (!isHttpUrl(check.url)) errors.push(`verification.checks[${index}].url must be http(s)`);
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
  const pickerFamilies = new Set(pickerEntries.map((entry) => entry.slug));
  for (const entry of pickerEntries) {
    if (!families[entry.slug]) errors.push(`picker family ${entry.slug} is missing from manifest`);
    else if (families[entry.slug].distribution === 'not_in_picker') {
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

function walk(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function difference(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
