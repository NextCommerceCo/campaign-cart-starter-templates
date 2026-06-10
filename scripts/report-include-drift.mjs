#!/usr/bin/env node
// Cross-family include/JS/CSS drift report.
//
// Compares every shared file across the seven checkout template families and
// classifies it as functionally-identical, minor/moderate drift, divergent,
// or single-family. "Functional" comparison strips {% comment %} blocks
// (component contract annotations) and data-next-catalog-component markers,
// so annotation-coverage gaps are reported separately from real code drift.
//
// Usage:
//   node scripts/report-include-drift.mjs            # human summary
//   node scripts/report-include-drift.mjs --json     # full JSON to stdout
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../src/', import.meta.url).pathname;
const FAMILIES = [
  'olympus',
  'olympus-mv-single-step',
  'olympus-mv-two-step',
  'demeter',
  'limos',
  'shop-single-step',
  'shop-three-step',
];
const SECTIONS = [
  { name: 'includes', dir: '_includes', exts: ['.html'] },
  { name: 'js', dir: 'assets/js', exts: ['.js'] },
  { name: 'css', dir: 'assets/css', exts: ['.css'] },
];

const COMMENT_RE = /{%-?\s*comment\s*-?%}[\s\S]*?{%-?\s*endcomment\s*-?%}/g;
const INLINE_COMMENT_RE = /{#-?[\s\S]*?-?#}/g;
const CATALOG_ATTR_RE = /\s*data-next-catalog-component="[^"]*"/g;
// Annotation = a next_component: key inside a comment header (not any stray
// occurrence of the literal anywhere in the file). Two syntaxes exist in the
// repo today: Liquid {% comment %} blocks (most includes) and HTML <!-- -->
// blocks (the upsell-*-offer includes).
const ANNOTATION_RE =
  /(?:{%-?\s*comment\s*-?%}[\s\S]*?^\s*next_component:[\s\S]*?{%-?\s*endcomment\s*-?%}|<!--[\s\S]*?^\s*next_component:[\s\S]*?-->)/m;
// HTML comments that carry an annotation header are stripped during
// normalization, same as Liquid comment blocks.
const HTML_ANNOTATION_RE = /<!--(?:(?!-->)[\s\S])*?^\s*next_component:[\s\S]*?-->/gm;

// Missing family/section directories must fail loudly: this script is meant
// to run as a release gate, and a silently-skipped family would produce a
// clean-looking but incomplete report.
function walk(dir, exts, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.endsWith(x))) out.push(p);
  }
  return out;
}

function normalize(text) {
  return text
    .replace(COMMENT_RE, '')
    .replace(INLINE_COMMENT_RE, '')
    .replace(HTML_ANNOTATION_RE, '')
    .replace(CATALOG_ATTR_RE, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
    .join('\n');
}

function md5(s) {
  return createHash('md5').update(s).digest('hex');
}

// Cheap changed-line metric: lines unique to a or b (multiset symmetric
// difference). Known false negatives: reordered blocks and moved duplicate
// lines count as unchanged. Acceptable here because the metric only grades
// *already-different* files into minor/moderate/divergent buckets — identity
// is decided by content hash, not by this. The 15%/40% class thresholds
// below are calibrated to this metric; re-tune them if the metric changes.
function changedLines(a, b) {
  const count = (arr) => {
    const m = new Map();
    for (const l of arr) m.set(l, (m.get(l) ?? 0) + 1);
    return m;
  };
  const la = a.split('\n');
  const lb = b.split('\n');
  const ma = count(la);
  const mb = count(lb);
  let changed = 0;
  for (const [l, n] of ma) changed += Math.max(0, n - (mb.get(l) ?? 0));
  for (const [l, n] of mb) changed += Math.max(0, n - (ma.get(l) ?? 0));
  return { changed, total: Math.max(la.length, lb.length) };
}

function readFileChecked(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch (err) {
    throw new Error(`failed to read ${p}: ${err.message}`);
  }
}

function analyzeSection({ name, dir, exts }) {
  const matrix = new Map(); // rel -> { family: absPath }
  for (const fam of FAMILIES) {
    const base = join(ROOT, fam, dir);
    let files;
    try {
      files = walk(base, exts);
    } catch (err) {
      throw new Error(`cannot scan ${fam}/${dir} — family layout changed or repo incomplete: ${err.message}`);
    }
    for (const p of files) {
      const rel = relative(base, p);
      if (!matrix.has(rel)) matrix.set(rel, {});
      matrix.get(rel)[fam] = p;
    }
  }
  const rows = [];
  for (const [rel, fams] of [...matrix.entries()].sort()) {
    const names = Object.keys(fams);
    const raw = Object.fromEntries(names.map((f) => [f, readFileChecked(fams[f])]));
    const annotated = names.filter((f) => ANNOTATION_RE.test(raw[f]));
    if (names.length < 2) {
      rows.push({ section: name, file: rel, class: 'single-family', families: names, annotated });
      continue;
    }
    const texts = Object.fromEntries(names.map((f) => [f, normalize(raw[f])]));
    const groups = new Map();
    for (const f of names) {
      const h = md5(texts[f]);
      if (!groups.has(h)) groups.set(h, []);
      groups.get(h).push(f);
    }
    if (groups.size === 1) {
      rows.push({ section: name, file: rel, class: 'functionally-identical', families: names, annotated });
      continue;
    }
    const ref = names.includes('olympus') ? 'olympus' : names[0];
    const pctVsRef = {};
    let maxPct = 0;
    for (const f of names) {
      if (f === ref) continue;
      const { changed, total } = changedLines(texts[ref], texts[f]);
      const pct = Math.round((100 * changed) / Math.max(total, 1));
      pctVsRef[f] = pct;
      maxPct = Math.max(maxPct, pct);
    }
    const cls = maxPct <= 15 ? 'func-minor' : maxPct <= 40 ? 'func-moderate' : 'func-divergent';
    rows.push({
      section: name,
      file: rel,
      class: cls,
      ref,
      variantGroups: [...groups.values()].map((g) => g.sort()),
      pctVsRef,
      maxPct,
      families: names,
      annotated,
    });
  }
  return rows;
}

const rows = SECTIONS.flatMap(analyzeSection);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  const byClass = {};
  for (const r of rows) (byClass[r.class] ??= []).push(r);
  for (const [cls, list] of Object.entries(byClass)) {
    console.log(`\n== ${cls} (${list.length}) ==`);
    for (const r of list) {
      const extra =
        r.class === 'functionally-identical' || r.class === 'single-family'
          ? `[${r.families.join(', ')}]`
          : `variants=${JSON.stringify(r.variantGroups)} pct=${JSON.stringify(r.pctVsRef)}`;
      console.log(`  ${r.section}/${r.file} ${extra}`);
    }
  }
  const annTotals = Object.fromEntries(FAMILIES.map((f) => [f, { has: 0, total: 0 }]));
  for (const r of rows) {
    if (r.section !== 'includes') continue;
    for (const f of r.families) {
      annTotals[f].total += 1;
      if (r.annotated.includes(f)) annTotals[f].has += 1;
    }
  }
  console.log('\n== next_component annotation coverage (includes) ==');
  for (const f of FAMILIES) console.log(`  ${f}: ${annTotals[f].has}/${annTotals[f].total}`);
}
