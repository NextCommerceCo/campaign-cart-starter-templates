// Regression tests for the shared forwarder core (_shared/analytics/js/next-forwarder-core.js): the SDK 0.5
// first_in_session AddToCart filter. The core runs in a vm sandbox with a stub document; events go through
// window.NextDataLayerTransformFn as the SDK pushes them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../_shared/analytics/js/next-forwarder-core.js', import.meta.url), 'utf8');

function load(win = {}) {
  const listeners = {};
  const document = {
    readyState: 'complete',
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const window = Object.assign({
    location: { search: '', hostname: 'shop.example.com' },
    console: { log() {}, warn() {} },
  }, win);
  vm.runInNewContext(SRC, { window, document, console: window.console, setTimeout, clearTimeout });
  const sent = [];
  const adapter = (extra = {}) => ({
    name: 'test', isActive: () => true, allowedEvents: null,
    map: { dl_add_to_cart: 'add_to_cart', dl_purchase: 'purchase' },
    send: (name, ec, evt) => sent.push([name, evt.event_id]),
    ...extra,
  });
  const push = (evt) => window.NextDataLayerTransformFn(evt);
  return { window, document, listeners, sent, adapter, push, fwd: window.NextForwarder };
}

test('SDK 0.5 dl_add_to_cart: only the first add in the session is forwarded', () => {
  const r = load();
  r.fwd.register(r.adapter());
  r.push({ event: 'dl_add_to_cart', event_id: 'a1', first_in_session: true, ecommerce: {} });
  r.push({ event: 'dl_add_to_cart', event_id: 'a2', first_in_session: false, ecommerce: {} });
  r.push({ event: 'dl_purchase', event_id: 'p1', ecommerce: {} });
  assert.deepEqual(r.sent, [['add_to_cart', 'a1'], ['purchase', 'p1']]);
});

test('SDK 0.4 dl_add_to_cart (no first_in_session) is forwarded as before', () => {
  const r = load();
  r.fwd.register(r.adapter());
  r.push({ event: 'dl_add_to_cart', event_id: 'a1', ecommerce: {} });
  r.push({ event: 'dl_add_to_cart', event_id: 'a2', ecommerce: {} });
  assert.deepEqual(r.sent.map((s) => s[1]), ['a1', 'a2']);
});

test('allAddToCart: true forwards every SDK 0.5 add', () => {
  const r = load();
  r.fwd.register(r.adapter({ allAddToCart: true }));
  r.push({ event: 'dl_add_to_cart', event_id: 'a1', first_in_session: true, ecommerce: {} });
  r.push({ event: 'dl_add_to_cart', event_id: 'a2', first_in_session: false, ecommerce: {} });
  assert.deepEqual(r.sent.map((s) => s[1]), ['a1', 'a2']);
});

test('the filter also applies to the replayed backlog of a late adapter', () => {
  const r = load({ NextDataLayer: [
    { event: 'dl_add_to_cart', event_id: 'a1', first_in_session: true, ecommerce: {} },
    { event: 'dl_add_to_cart', event_id: 'a2', first_in_session: false, ecommerce: {} },
  ] });
  r.fwd.register(r.adapter());
  assert.deepEqual(r.sent.map((s) => s[1]), ['a1']);
});

test('getStatus() reports allAddToCart per adapter', () => {
  const r = load();
  r.fwd.register(r.adapter({ name: 'plain' }));
  r.fwd.register(r.adapter({ name: 'all', allAddToCart: true }));
  assert.deepEqual(JSON.parse(JSON.stringify(r.fwd.getStatus().map(({ name, allAddToCart }) => ({ name, allAddToCart })))), [
    { name: 'plain', allAddToCart: false },
    { name: 'all', allAddToCart: true },
  ]);
});

test('a dl_add_to_cart flag encoded other than true counts as a repeat add', () => {
  const r = load();
  r.fwd.register(r.adapter());
  ['false', 0, null].forEach((v, i) => r.push({ event: 'dl_add_to_cart', event_id: 'x' + i, first_in_session: v, ecommerce: {} }));
  assert.deepEqual(r.sent, []);
});
