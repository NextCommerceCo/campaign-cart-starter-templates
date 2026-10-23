import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { injectShowcaseKeys, TOP_LEVEL_API_KEY } from './inject-showcase-keys.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const keys = JSON.parse(readFileSync(join(root, 'scripts/showcase-keys.json'), 'utf8'));
const families = readdirSync(join(root, 'src')).filter(f => existsSync(join(root, 'src', f, 'assets/config.js'))).sort();
const configs = families.map(f => `src/${f}/assets/config.js`);

test('every committed family config ships with an empty commerce apiKey', () => {
  assert.ok(configs.length >= 8);
  for (const path of configs) {
    const source = readFileSync(join(root, path), 'utf8');
    const match = source.match(TOP_LEVEL_API_KEY);
    assert.ok(match, `${path}: top-level apiKey line missing`);
    assert.equal(match[0], '  apiKey: "",', `${path}: the demo key must not be committed; run the showcase inject only in the showcase build`);
  }
});

test('the showcase key map covers exactly the families that have a config', () => {
  assert.deepEqual(Object.keys(keys).sort(), families);
  for (const key of Object.values(keys)) assert.match(key, /^[A-Za-z0-9]{20,}$/);
});

test('inject writes only the top-level key and is idempotent', () => {
  const copy = mkdtempSync(join(tmpdir(), 'showcase-keys-'));
  try {
    for (const family of families) cpSync(join(root, 'src', family, 'assets'), join(copy, 'src', family, 'assets'), { recursive: true });
    assert.deepEqual(injectShowcaseKeys(copy, keys).sort(), families);
    assert.deepEqual(injectShowcaseKeys(copy, keys), []);
    for (const family of families) {
      const before = readFileSync(join(root, 'src', family, 'assets/config.js'), 'utf8').split('\n');
      const after = readFileSync(join(copy, 'src', family, 'assets/config.js'), 'utf8').split('\n');
      const changed = after.map((line, i) => line !== before[i] ? i : -1).filter(i => i >= 0);
      assert.equal(changed.length, 1, `${family}: exactly one line changes`);
      assert.equal(after[changed[0]], `  apiKey: "${keys[family]}",`);
    }
  } finally { rmSync(copy, { recursive: true, force: true }); }
});
