#!/usr/bin/env node
// Compiles the production Tailwind stylesheet for every family's landing +
// presell pages: src/<family>/assets/css/tailwind.css.
//
// base-landing.html / base-presell.html load the Tailwind Play CDN only when
// `environment == "development"`; every other build links this compiled file
// instead. The theme (design-token colour aliases + font) comes from the repo
// root tailwind.input.css, so there is one theme source; only the @source
// globs are replaced per family, scoped to the files those two layouts render.
//
//   npm run build:tailwind    rewrite every family's tailwind.css
//   npm run lint:tailwind     fail when a committed tailwind.css is stale
//                             (re-run build:tailwind after adding utility classes)

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const FAMILIES = [
  'apollo',
  'apollo-mv-single-step',
  'demeter',
  'olympus',
  'olympus-mv-single-step',
  'olympus-mv-two-step',
  'shop-single-step',
  'shop-three-step',
];

const OUTPUT = 'assets/css/tailwind.css';
const SOURCES = [
  'landing.html',
  'presell.html',
  '_layouts/base-landing.html',
  '_layouts/base-presell.html',
  '_includes/landing/**/*.html',
  // landing.js toggles utility classes at runtime (rotate-180, hidden); the
  // Play CDN generated those on the fly, the compiled file has to see them.
  'assets/js/landing/**/*.js',
  'assets/js/presell/**/*.js',
];

const template = readFileSync(join(ROOT, 'tailwind.input.css'), 'utf8');
if (!template.includes('@import "tailwindcss";')) {
  throw new Error('tailwind.input.css: expected `@import "tailwindcss";`');
}

function inputFor(family) {
  // source(none) turns off automatic content detection, so only the listed
  // landing/presell files contribute classes (checkout pages never load this CSS).
  const sources = SOURCES.map((glob) => `@source "./src/${family}/${glob}";`).join('\n');
  return template
    .replace(/^@source .*\n/gm, '')
    .replace('@import "tailwindcss";', `@import "tailwindcss" source(none);\n${sources}`);
}

function compile(family) {
  const cli = join(ROOT, 'node_modules/.bin/tailwindcss');
  const css = execFileSync(cli, ['--input', '-', '--minify'], {
    cwd: ROOT,
    input: inputFor(family),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return css.endsWith('\n') ? css : `${css}\n`;
}

const stale = [];
for (const family of FAMILIES) {
  const out = join(ROOT, 'src', family, OUTPUT);
  const css = compile(family);
  const current = existsSync(out) ? readFileSync(out, 'utf8') : null;
  if (current === css) {
    console.log(`ok     src/${family}/${OUTPUT}`);
  } else if (CHECK) {
    stale.push(family);
    console.log(`STALE  src/${family}/${OUTPUT}`);
  } else {
    writeFileSync(out, css);
    console.log(`wrote  src/${family}/${OUTPUT} (${css.length} bytes)`);
  }
}

if (stale.length) {
  console.error(`\n${stale.length} family stylesheet(s) out of date. Run: npm run build:tailwind`);
  process.exit(1);
}
