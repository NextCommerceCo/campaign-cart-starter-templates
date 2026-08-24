#!/usr/bin/env node
// lint-agent-contracts.mjs
//
// Validates the machine-readable agent contract layer that sits beside the
// template runtime. This is not a campaign readiness gate: it only checks that
// the catalog and CampaignSpec-shaped fixtures stay coherent.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const catalogPath = join(repoRoot, 'docs/commerce-surface-catalog.json');
const expectedFamilies = [
  'olympus',
  'apollo',
  'demeter',
  'shop-single-step',
  'shop-three-step',
  'olympus-mv-single-step',
  'apollo-mv-single-step',
  'olympus-mv-two-step',
];

const CANONICAL_NEXT_CORE = 'src/olympus/assets/css/next-core.css';

const errors = [];
const warnings = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${relative(repoRoot, path)}: invalid JSON (${error.message})`);
    return null;
  }
}

function hasPath(obj, dotted) {
  const parts = dotted.split('.');
  let cur = obj;
  for (const part of parts) {
    if (part.endsWith('[]')) {
      const key = part.slice(0, -2);
      if (!Array.isArray(cur?.[key])) return false;
      cur = cur[key][0];
      continue;
    }
    if (cur == null || !(part in cur)) return false;
    cur = cur[part];
  }
  return true;
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label}: expected a non-empty array`);
    return false;
  }
  return true;
}

function pngDimensions(path) {
  const bytes = readFileSync(path);
  if (bytes.length < 24) return null;
  const signature = bytes.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a' || bytes.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const catalog = readJson(catalogPath);
if (!catalog) process.exit(1);

if (catalog.agentContractVersion !== 1) {
  errors.push('docs/commerce-surface-catalog.json: agentContractVersion must be 1');
}

if (!catalog.sharedFrontmatterVocabulary || typeof catalog.sharedFrontmatterVocabulary !== 'object') {
  errors.push('docs/commerce-surface-catalog.json: missing sharedFrontmatterVocabulary');
}

for (const family of expectedFamilies) {
  const srcDir = join(repoRoot, 'src', family);
  if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) {
    errors.push(`src/${family}: expected template family directory`);
  }

  const entry = catalog.families?.[family];
  if (!entry) {
    errors.push(`catalog.families.${family}: missing family entry`);
    continue;
  }

  const contract = entry.agentContract;
  if (!contract) {
    errors.push(`catalog.families.${family}.agentContract: missing agent contract`);
    continue;
  }

  for (const key of ['templateRole', 'sourceOfTruth', 'frontmatter', 'surfaces', 'fixtures', 'agentNotes']) {
    if (!(key in contract)) errors.push(`catalog.families.${family}.agentContract.${key}: missing`);
  }

  requireArray(contract.fixtures, `catalog.families.${family}.agentContract.fixtures`);
  requireArray(contract.surfaces, `catalog.families.${family}.agentContract.surfaces`);
  validateTemplateReference(family, entry.templateReference);
  validateFamilyAssetReferences(family, srcDir);

  for (const fixture of contract.fixtures || []) {
    const fixturePath = join(repoRoot, fixture);
    if (!existsSync(fixturePath)) {
      errors.push(`${fixture}: referenced fixture does not exist`);
      continue;
    }
    const spec = readJson(fixturePath);
    if (!spec) continue;
    validateFixture(spec, fixturePath, family);
  }
}

function validateTemplateReference(family, reference) {
  if (reference == null) return;
  const label = `catalog.families.${family}.templateReference`;
  if (typeof reference !== 'object' || Array.isArray(reference)) {
    errors.push(`${label}: expected an object`);
    return;
  }

  for (const key of ['id', 'family', 'version']) {
    if (typeof reference[key] !== 'string' || !reference[key].trim()) {
      errors.push(`${label}.${key}: expected a non-empty string`);
    }
  }
  if (reference.family !== family) {
    errors.push(`${label}.family: expected "${family}", got ${JSON.stringify(reference.family)}`);
  }
  if (typeof reference.source_commit !== 'string' || !/^[0-9a-f]{40}$/.test(reference.source_commit)) {
    errors.push(`${label}.source_commit: expected a full 40-character commit SHA`);
  } else {
    reportTemplateReferenceStaleness(family, reference, label);
  }
  if (typeof reference.provenance_path !== 'string' || !reference.provenance_path.trim()) {
    errors.push(`${label}.provenance_path: expected a non-empty string`);
  } else if (!existsSync(join(repoRoot, reference.provenance_path))) {
    errors.push(`${label}.provenance_path: ${reference.provenance_path} does not exist`);
  }
  if (typeof reference.provenance_url !== 'string' || !reference.provenance_url.startsWith('https://')) {
    errors.push(`${label}.provenance_url: expected an HTTPS URL`);
  }
  if (!reference.contract_path && !reference.artifact_path) {
    errors.push(`${label}: expected contract_path or artifact_path`);
  }
  if (reference.contract_path && !existsSync(join(repoRoot, reference.contract_path))) {
    errors.push(`${label}.contract_path: ${reference.contract_path} does not exist`);
  }

  if (!requireArray(reference.standard_viewport_refs, `${label}.standard_viewport_refs`)) return;
  const viewports = new Set();
  const ids = new Set();
  for (const [index, ref] of reference.standard_viewport_refs.entries()) {
    const refLabel = `${label}.standard_viewport_refs[${index}]`;
    if (!ref || typeof ref !== 'object' || Array.isArray(ref)) {
      errors.push(`${refLabel}: expected an object`);
      continue;
    }
    if (typeof ref.id !== 'string' || !ref.id.trim()) errors.push(`${refLabel}.id: expected a non-empty string`);
    else if (ids.has(ref.id)) errors.push(`${refLabel}.id: duplicate id "${ref.id}"`);
    else ids.add(ref.id);

    if (!['desktop', 'mobile', 'tablet'].includes(ref.viewport)) {
      errors.push(`${refLabel}.viewport: expected desktop, mobile, or tablet`);
    } else if (viewports.has(ref.viewport)) {
      errors.push(`${refLabel}.viewport: duplicate ${ref.viewport} proof`);
    } else {
      viewports.add(ref.viewport);
    }

    if (!ref.path && !ref.url) errors.push(`${refLabel}: expected path or url`);
    if (!Number.isInteger(ref.width) || ref.width < 1) errors.push(`${refLabel}.width: expected a positive integer`);
    if (!Number.isInteger(ref.height) || ref.height < 1) errors.push(`${refLabel}.height: expected a positive integer`);
    const validSha256 = typeof ref.sha256 === 'string' && /^[0-9a-f]{64}$/.test(ref.sha256);
    if (!validSha256) {
      errors.push(`${refLabel}.sha256: expected 64 lowercase hex characters`);
    }

    if (ref.path) {
      const requiredPrefix = `docs/template-references/${family}/`;
      if (!ref.path.startsWith(requiredPrefix)) {
        errors.push(`${refLabel}.path: expected a path under ${requiredPrefix}`);
        continue;
      }
      const artifactPath = join(repoRoot, ref.path);
      if (!existsSync(artifactPath)) {
        errors.push(`${refLabel}.path: ${ref.path} does not exist`);
      } else {
        const dimensions = pngDimensions(artifactPath);
        if (!dimensions) {
          errors.push(`${refLabel}.path: ${ref.path} must be a PNG screenshot`);
        } else if (dimensions.width !== ref.width || dimensions.height !== ref.height) {
          errors.push(
            `${refLabel}: dimensions metadata ${ref.width}x${ref.height} does not match ` +
              `${ref.path} (${dimensions.width}x${dimensions.height})`
          );
        }
        if (validSha256) {
          const actual = createHash('sha256').update(readFileSync(artifactPath)).digest('hex');
          if (actual !== ref.sha256) errors.push(`${refLabel}.sha256: expected ${actual} for ${ref.path}`);
        }
      }
    }
  }

  for (const viewport of ['desktop', 'mobile']) {
    if (!viewports.has(viewport)) errors.push(`${label}.standard_viewport_refs: missing ${viewport} proof`);
  }
}

// Render-affecting sources for a family's committed visual reference.
//
// The hash/dimension checks above only prove the committed PNGs are the files
// the catalog says they are. They cannot tell whether those PNGs still look
// like the template: a later PR can change Apollo's markup and leave the
// reference untouched, and every hard gate stays green while Campaigns OS QAs
// template-backed pages against an outdated baseline. That drift is silent by
// construction, so it needs a mechanical signal rather than a docs note.
//
// src/<family> is the family's own source. _shared/ and the canonical
// next-core.css are the shared sources that SYNC into it, so a change there
// reaches the rendered page in a commit that never touches src/<family>.
// Kept in step with scripts/sync-shared.mjs and scripts/lint-next-core-sync.mjs.
function renderAffectingPaths(family) {
  return [...new Set([`src/${family}`, '_shared', CANONICAL_NEXT_CORE])];
}

function git(args) {
  return execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

// Warn-only, matching the template-verification freshness reporter: a
// render-affecting change is not automatically a visual change, so a
// non-visual edit must not turn CI red. Tighten later if the warnings get
// ignored.
function reportTemplateReferenceStaleness(family, reference, label) {
  const commit = reference.source_commit;
  const recapture = `docs/template-references/${family}/README.md`;

  try {
    git(['cat-file', '-e', `${commit}^{commit}`]);
  } catch {
    warnings.push(
      `${label}: source_commit ${commit.slice(0, 12)} is not present in this clone ` +
        `(shallow checkout, or the commit was never fetched), so ${family} reference staleness could not be assessed`
    );
    return;
  }

  let changed;
  try {
    changed = git(['diff', '--name-only', commit, '--', ...renderAffectingPaths(family)]);
  } catch (error) {
    warnings.push(`${label}: could not assess ${family} reference staleness (${error.message.trim().split('\n')[0]})`);
    return;
  }

  // Markdown under these roots is provenance and notes, never rendered output:
  // no template family ships a .md page, and _shared/analytics/README.md
  // documents the sync rather than feeding it. Flagging those would spend the
  // warning on a change that cannot move a pixel.
  const files = changed.split('\n').filter(Boolean).filter((path) => !path.endsWith('.md'));
  if (!files.length) return;

  const sample = files.slice(0, 3).join(', ');
  warnings.push(
    `${label}: ${files.length} render-affecting file(s) changed since source_commit ${commit.slice(0, 12)} ` +
      `(${sample}${files.length > 3 ? `, +${files.length - 3} more` : ''}). ` +
      `The committed ${family} reference captures may no longer match the rendered page — recapture per ${recapture}.`
  );
}

validateIntentionalVariants();

function validateIntentionalVariants() {
  const iv = catalog.intentionalVariants;
  if (!iv || typeof iv !== 'object') {
    errors.push('catalog.intentionalVariants: missing intentionalVariants block');
    return;
  }
  for (const key of ['purpose', 'verified', 'regenerate', 'doNotReconcile', 'includes']) {
    if (!(key in iv)) errors.push(`catalog.intentionalVariants.${key}: missing`);
  }
  const allowedSurfaces = ['orderBump', 'orderSummary', 'checkoutHeader', 'footer', 'footerLinks'];
  if (!iv.includes || typeof iv.includes !== 'object') {
    errors.push('catalog.intentionalVariants.includes: expected an object');
    return;
  }
  for (const [inc, spec] of Object.entries(iv.includes)) {
    const label = `catalog.intentionalVariants.includes.${inc}`;
    if (!allowedSurfaces.includes(spec.surface)) {
      errors.push(`${label}.surface: "${spec.surface}" not in [${allowedSurfaces.join(', ')}]`);
    }
    if (!Array.isArray(spec.lineages) || spec.lineages.length === 0) {
      errors.push(`${label}.lineages: expected a non-empty array`);
      continue;
    }
    for (const [i, lineage] of spec.lineages.entries()) {
      if (!Array.isArray(lineage.families) || lineage.families.length === 0) {
        errors.push(`${label}.lineages[${i}].families: expected a non-empty array`);
      } else {
        for (const fam of lineage.families) {
          if (!expectedFamilies.includes(fam)) {
            errors.push(`${label}.lineages[${i}].families: unknown family "${fam}"`);
          }
        }
      }
      if (typeof lineage.note !== 'string' || !lineage.note) {
        errors.push(`${label}.lineages[${i}].note: expected a non-empty string`);
      }
    }
  }
}

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(path, files);
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

function validateFamilyAssetReferences(family, srcDir) {
  const assetPattern = /(['"])([^'"]+)\1\s*\|\s*campaign_asset/g;
  for (const file of walkFiles(srcDir)) {
    if (!['.html', '.css', '.js'].includes(extname(file))) continue;
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(assetPattern)) {
      const assetPath = match[2];
      if (/^(?:https?:)?\/\//.test(assetPath) || assetPath.startsWith('/')) continue;
      const fullPath = join(srcDir, 'assets', assetPath);
      if (!existsSync(fullPath)) {
        errors.push(`${relative(repoRoot, file)}: campaign_asset reference "${assetPath}" does not exist under src/${family}/assets/`);
      }
    }
  }
}

function validateFixture(spec, fixturePath, family) {
  const label = relative(repoRoot, fixturePath);
  for (const required of ['campaign.id', 'campaign.name', 'campaign.currency', 'campaign.language', 'funnels[]']) {
    if (!hasPath(spec, required)) errors.push(`${label}: missing ${required}`);
  }

  if (!Array.isArray(spec.funnels)) return;
  for (const [funnelIndex, funnel] of spec.funnels.entries()) {
    if (!Array.isArray(funnel.pages) || funnel.pages.length === 0) {
      errors.push(`${label}: funnels[${funnelIndex}].pages must be a non-empty array`);
      continue;
    }
    for (const [pageIndex, page] of funnel.pages.entries()) {
      for (const required of ['id', 'type', 'order', 'label']) {
        if (!(required in page)) {
          errors.push(`${label}: funnels[${funnelIndex}].pages[${pageIndex}] missing ${required}`);
        }
      }
      if (page.sdk_hints?.template_family && page.sdk_hints.template_family !== family) {
        errors.push(
          `${label}: page ${page.id || pageIndex} sdk_hints.template_family=${page.sdk_hints.template_family} does not match catalog family ${family}`
        );
      }
      if (page.template && !existsSync(join(repoRoot, page.template))) {
        warnings.push(`${label}: page ${page.id || pageIndex} template path ${page.template} does not exist`);
      }
    }
  }
}

if (warnings.length) {
  console.log(`[lint-agent-contracts] ${warnings.length} warning(s):`);
  for (const warning of warnings) emitWarning(warning);
}

// Annotate on GitHub so a warning surfaces on the PR instead of only in the log
// of a green job. Mirrors report-template-verification-freshness.mjs.
function emitWarning(message) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.warn(
      `::warning title=Agent contract warning::${message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}`
    );
  } else {
    console.log(`  - ${message}`);
  }
}

if (errors.length) {
  console.log(`[lint-agent-contracts] FAIL - ${errors.length} error(s):`);
  for (const error of errors) console.log(`  - ${error}`);
  process.exit(1);
}

console.log('[lint-agent-contracts] PASS');
