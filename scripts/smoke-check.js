#!/usr/bin/env node

/**
 * Smoke check for campaign-kit-templates.
 *
 * Checks each src/[slug]/ campaign for:
 * - Required frontmatter fields (title, page_type, next_success_url, etc.)
 * - campaign_include references that resolve to real files in _includes/
 * - Local scripts/styles in frontmatter that exist in assets/
 * - config.js present and has apiKey
 * - No hardcoded localhost URLs in page HTML
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

let errors = 0;
let warnings = 0;

function error(file, msg) {
  console.error(`  \x1b[31mERROR\x1b[0m  ${file}: ${msg}`);
  errors++;
}

function warn(file, msg) {
  console.warn(`  \x1b[33mWARN\x1b[0m   ${file}: ${msg}`);
  warnings++;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const val = keyMatch[2].trim();

      if (val === '') {
        // Possible array — collect indented list items that follow
        const arr = [];
        let j = i + 1;
        while (j < lines.length && /^\s+-\s/.test(lines[j])) {
          arr.push(lines[j].replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, ''));
          j++;
        }
        fm[key] = arr.length > 0 ? arr : null;
        i = j;
        continue;
      } else {
        fm[key] = val.replace(/^["']|["']$/g, '');
      }
    }
    i++;
  }

  return fm;
}

function extractIncludes(content) {
  const regex = /{%[-\s]*campaign_include\s+'([^']+)'/g;
  const includes = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    includes.push(match[1]);
  }
  return includes;
}

function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function isDirectorySafe(targetPath) {
  try {
    return fs.statSync(targetPath).isDirectory();
  } catch {
    return false;
  }
}

function hasHtmlPages(dir) {
  return safeReadDir(dir).some(name => name.endsWith('.html'));
}

function looksLikeCampaignDir(dir) {
  const hasIncludes = isDirectorySafe(path.join(dir, '_includes'));
  const hasAssets = isDirectorySafe(path.join(dir, 'assets'));
  return (hasIncludes || hasAssets) && hasHtmlPages(dir);
}

function discoverCampaigns() {
  const campaigns = [];
  const skip = new Set(['.git', '.github', 'node_modules', 'scripts', '_site']);

  const topLevel = safeReadDir(REPO_ROOT).filter(name => {
    if (skip.has(name) || name.startsWith('.')) return false;
    return isDirectorySafe(path.join(REPO_ROOT, name));
  });

  // Primary layout: repo/<campaign-name>/src/<slug>/
  for (const folder of topLevel) {
    const srcDir = path.join(REPO_ROOT, folder, 'src');
    if (!isDirectorySafe(srcDir)) continue;

    const slugs = safeReadDir(srcDir).filter(name => isDirectorySafe(path.join(srcDir, name)));
    for (const slug of slugs) {
      const dir = path.join(srcDir, slug);
      if (looksLikeCampaignDir(dir)) {
        campaigns.push({ label: `${folder}/src/${slug}`, dir });
      }
    }
  }

  // Backward compatibility: repo/src/<slug>/
  const rootSrcDir = path.join(REPO_ROOT, 'src');
  if (isDirectorySafe(rootSrcDir)) {
    const slugs = safeReadDir(rootSrcDir).filter(name => isDirectorySafe(path.join(rootSrcDir, name)));
    for (const slug of slugs) {
      const dir = path.join(rootSrcDir, slug);
      if (looksLikeCampaignDir(dir)) {
        campaigns.push({ label: `src/${slug}`, dir });
      }
    }
  }

  return campaigns;
}

// ── Main ────────────────────────────────────────────────────────────────────

const campaigns = discoverCampaigns();

if (campaigns.length === 0) {
  console.error('\x1b[31mNo campaigns found. Expected {folder}/src/{slug}/ or src/{slug}/ directories under repo root.\x1b[0m\n');
  process.exit(1);
}

console.log(`\nChecking ${campaigns.length} campaign(s):\n`);

for (const { label, dir: campaignDir } of campaigns) {
  console.log(`[${label}]`);

  const includesDir = path.join(campaignDir, '_includes');
  const assetsDir   = path.join(campaignDir, 'assets');

  // ── config.js ─────────────────────────────────────────────────────────────
  const configPath = path.join(assetsDir, 'config.js');
  if (!fs.existsSync(configPath)) {
    error('assets/config.js', 'file not found');
  } else {
    const configContent = fs.readFileSync(configPath, 'utf8');
    if (!configContent.includes('apiKey')) {
      error('assets/config.js', "missing 'apiKey' field");
    }
  }

  // ── HTML pages ────────────────────────────────────────────────────────────
  const htmlFiles = fs.readdirSync(campaignDir).filter(f => f.endsWith('.html'));

  if (htmlFiles.length === 0) {
    warn(label, 'no HTML page files found');
  }

  for (const htmlFile of htmlFiles) {
    const filePath = path.join(campaignDir, htmlFile);
    const content  = fs.readFileSync(filePath, 'utf8');
    const fm       = parseFrontmatter(content);
    const label    = htmlFile;

    if (!fm) {
      error(label, 'no frontmatter found');
      continue;
    }

    // Required: title
    if (!fm.title) {
      error(label, "missing 'title' in frontmatter");
    }

    // Required: page_type
    if (!fm.page_type) {
      error(label, "missing 'page_type' in frontmatter");
    } else {
      if (fm.page_type === 'checkout' && !fm.next_success_url) {
        error(label, "page_type is 'checkout' but 'next_success_url' is missing");
      }
      if (fm.page_type === 'upsell') {
        if (!fm.next_upsell_accept)  error(label, "page_type is 'upsell' but 'next_upsell_accept' is missing");
        if (!fm.next_upsell_decline) error(label, "page_type is 'upsell' but 'next_upsell_decline' is missing");
      }
    }

    // Local scripts must exist
    if (Array.isArray(fm.scripts)) {
      for (const script of fm.scripts) {
        if (script.startsWith('http')) continue;
        if (!fs.existsSync(path.join(assetsDir, script))) {
          error(label, `script '${script}' not found in assets/`);
        }
      }
    }

    // Local styles must exist
    if (Array.isArray(fm.styles)) {
      for (const style of fm.styles) {
        if (style.startsWith('http')) continue;
        if (!fs.existsSync(path.join(assetsDir, style))) {
          error(label, `style '${style}' not found in assets/`);
        }
      }
    }

    // campaign_include targets must exist in _includes/
    const includes = extractIncludes(content);
    for (const inc of includes) {
      if (!fs.existsSync(path.join(includesDir, inc))) {
        error(label, `{% campaign_include '${inc}' %} — not found in _includes/`);
      }
    }

    // No hardcoded localhost URLs in page body
    const body = stripFrontmatter(content);
    if (/https?:\/\/localhost/i.test(body)) {
      warn(label, "contains hardcoded localhost URL");
    }
  }

  console.log('');
}

// ── Summary ──────────────────────────────────────────────────────────────────
if (errors === 0 && warnings === 0) {
  console.log('\x1b[32m✓ All checks passed\x1b[0m\n');
} else {
  if (warnings > 0) console.warn(`\x1b[33m⚠ ${warnings} warning(s)\x1b[0m`);
  if (errors   > 0) console.error(`\x1b[31m✗ ${errors} error(s)\x1b[0m\n`);
}

if (errors > 0) process.exit(1);
