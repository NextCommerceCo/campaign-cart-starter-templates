#!/usr/bin/env node
// lint-agent-contracts.mjs
//
// Validates the machine-readable agent contract layer that sits beside the
// template runtime. This is not a campaign readiness gate: it only checks that
// the catalog and CampaignSpec-shaped fixtures stay coherent.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const catalogPath = join(repoRoot, 'docs/commerce-surface-catalog.json');
const expectedFamilies = [
  'olympus',
  'limos',
  'demeter',
  'shop-single-step',
  'shop-three-step',
  'olympus-mv-single-step',
  'olympus-mv-two-step',
];

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
  for (const warning of warnings) console.log(`  - ${warning}`);
}

if (errors.length) {
  console.log(`[lint-agent-contracts] FAIL - ${errors.length} error(s):`);
  for (const error of errors) console.log(`  - ${error}`);
  process.exit(1);
}

console.log('[lint-agent-contracts] PASS');
