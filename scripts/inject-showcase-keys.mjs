#!/usr/bin/env node
// Write the showcase demo campaign keys into each family's assets/config.js.
//
// The committed templates ship with an empty top-level apiKey so a scaffold
// made with campaign-init carries no live campaign until the developer sets
// one. The Netlify showcase build runs this first so the live previews can
// take orders against the demo campaigns. Run it locally with
// `npm run showcase:keys` to do the same; do not commit the result.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOP_LEVEL_API_KEY = /^  apiKey: "[^"\n]*",$/m;
export const KEY_SHAPE = /^[A-Za-z0-9]{20,}$/;

export function injectShowcaseKeys(root, keys) {
  const written = [];
  for (const [family, key] of Object.entries(keys)) {
    if (!KEY_SHAPE.test(key)) throw new Error(`${family}: showcase key must be 20+ alphanumeric characters`);
    const path = join(root, 'src', family, 'assets', 'config.js');
    let source;
    try { source = readFileSync(path, 'utf8'); } catch (error) {
      throw new Error(`${family}: cannot read ${path} (${error.code}); does the family still exist under src/?`);
    }
    if (!TOP_LEVEL_API_KEY.test(source)) throw new Error(`${family}: no top-level apiKey line in assets/config.js`);
    const updated = source.replace(TOP_LEVEL_API_KEY, `  apiKey: "${key}",`);
    if (updated !== source) { writeFileSync(path, updated); written.push(family); }
  }
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const keys = JSON.parse(readFileSync(join(root, 'scripts', 'showcase-keys.json'), 'utf8'));
  const written = injectShowcaseKeys(root, keys);
  console.log(`showcase keys written to ${written.length} famil${written.length === 1 ? 'y' : 'ies'}`);
  if (written.length) console.log("undo with: git checkout -- 'src/*/assets/config.js' (CI rejects a committed demo key)");
}
