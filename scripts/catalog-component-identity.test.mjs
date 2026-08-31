import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const expressCheckoutPath = new URL(
  '../src/olympus/_includes/express-checkout.html',
  import.meta.url,
);
const expectedComponentName = 'express-checkout';

test('Olympus express checkout metadata matches its catalog wrapper', () => {
  const source = readFileSync(expressCheckoutPath, 'utf8');
  const metadataName = source.match(/^\s*next_component:\s*([^\s]+)/m)?.[1];
  const wrapperName = source.match(/data-next-catalog-component=["']([^"']+)["']/)?.[1];

  assert.ok(metadataName, 'expected express-checkout.html to declare next_component metadata');
  assert.ok(wrapperName, 'expected express-checkout.html to declare a catalog wrapper');
  assert.equal(metadataName, expectedComponentName);
  assert.equal(wrapperName, expectedComponentName);
  assert.equal(metadataName, wrapperName);
});
