import assert from 'node:assert/strict';
import test from 'node:test';

import { findLiveSdkTemplateTokens } from './lib/sdk-template-token-lint.mjs';

test('flags SDK template tokens that can paint in the live DOM', () => {
  assert.deepEqual(
    findLiveSdkTemplateTokens([
      '<div>{item.price}</div>',
      '<span>{total}</span>',
    ].join('\n')),
    [
      { token: '{item.price}', line: 1 },
      { token: '{total}', line: 2 },
    ],
  );
});

test('allows SDK tokens inside inert template fragments, including nested templates', () => {
  const source = [
    '<div data-next-cart-summary>',
    '  <template>',
    '    <div>{total}</div>',
    '    <div data-summary-lines>',
    '      <template><span>{item.price}</span></template>',
    '    </div>',
    '  </template>',
    '</div>',
  ].join('\n');

  assert.deepEqual(findLiveSdkTemplateTokens(source), []);
});

test('ignores documentation tokens in Liquid and HTML comments', () => {
  const source = [
    '{% comment %}{item.price}{% endcomment %}',
    '{%- comment -%}',
    '  {shipping}',
    '{%- endcomment -%}',
    '<!-- {total} -->',
    '<div>{{ liquid_value }}</div>',
  ].join('\n');

  assert.deepEqual(findLiveSdkTemplateTokens(source), []);
});

test('resumes enforcement after a whitespace-controlled Liquid comment', () => {
  const source = [
    '{%- comment -%}',
    '  {item.price}',
    '{%- endcomment -%}',
    '<div>{total}</div>',
  ].join('\n');

  assert.deepEqual(
    findLiveSdkTemplateTokens(source),
    [{ token: '{total}', line: 4 }],
  );
});

test('ignores non-rendered script and style text', () => {
  const source = [
    '<script>const example = "{item.price}";</script>',
    '<style>.example::after { content: "{total}"; }</style>',
  ].join('\n');

  assert.deepEqual(findLiveSdkTemplateTokens(source), []);
});

test('does not let template-like text inside scripts hide a later live token', () => {
  const source = [
    '<script>const example = "<template>{item.price}";</script>',
    '<div>{item.price}</div>',
  ].join('\n');

  assert.deepEqual(
    findLiveSdkTemplateTokens(source),
    [{ token: '{item.price}', line: 2 }],
  );
});

test('resumes enforcement after a template closes and preserves line numbers', () => {
  const source = [
    '<template>{item.price}</template>',
    '<div>',
    '  {shipping}',
    '</div>',
  ].join('\n');

  assert.deepEqual(
    findLiveSdkTemplateTokens(source),
    [{ token: '{shipping}', line: 3 }],
  );
});
