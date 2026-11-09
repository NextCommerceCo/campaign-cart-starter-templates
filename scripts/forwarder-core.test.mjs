// Regression tests for the shared forwarder core (_shared/analytics/js/next-forwarder-core.js): the SDK 0.5
// first_in_session AddToCart filter and the customer bridge. The core runs in a vm sandbox with a stub
// document and an optional stub window.next; events go through window.NextDataLayerTransformFn as the SDK
// pushes them.
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

const ORDER = {
  ref_id: 'R1', user: { email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe', phone: '+16505550194' },
  shipping_address: { first_name: 'Jane', last_name: 'Doe', line1: '1 Main', city: 'San Francisco', state: 'CA', postcode: '94107', country: 'US' },
};
const CHECKOUT = {
  id: 'c1', user: { email: 'typed@example.com', first_name: 'Jan', last_name: '' },
  shipping_address: { first_name: 'Jan', last_name: 'D', line1: '2 Side', city: 'Leeds', postcode: 'LS1 1AA', country: 'GB', phone: '+447700900123' },
};

test('customer(): {} on SDK 0.4 (no next.snapshot, no next.analytics)', () => {
  const r = load({ next: { on() {} } });
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {});
});

test('customer(): purchase reads next.snapshot().order, flat and trimmed', () => {
  const r = load({ next: { snapshot: () => ({ order: ORDER, checkout: CHECKOUT }) } });
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {
    email: 'jane@example.com', phone: '+16505550194', first_name: 'Jane', last_name: 'Doe',
    city: 'San Francisco', state: 'CA', postcode: '94107', country: 'US',
  });
});

test('customer(): checkout events read the checkout, address phone and names filling the user', () => {
  const r = load({ next: { snapshot: () => ({ checkout: CHECKOUT }) } });
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_begin_checkout' }) }, {
    email: 'typed@example.com', phone: '+447700900123', first_name: 'Jan', last_name: 'D',
    city: 'Leeds', postcode: 'LS1 1AA', country: 'GB',
  });
});

test('customer(): falls back to the latest next.analytics.on order / checkout when snapshot has none', () => {
  let handler;
  const r = load({ next: { snapshot: () => ({}), analytics: { on: (name, fn) => { assert.equal(name, '*'); handler = fn; } } } });
  r.fwd.customer({ event: 'dl_purchase' }); // hooks lazily
  handler({ object: 'order', event_type: 'checkout_completed', data: ORDER });
  handler({ object: 'cart_line', event_type: 'product_added_to_cart', data: {} });
  assert.equal(r.fwd.customer({ event: 'dl_upsell_purchase' }).email, 'jane@example.com');
  assert.equal(r.fwd.customer({ event: 'dl_user_data' }).email, 'jane@example.com', 'upsell page: no checkout -> the order');
});

test('customer(): next.analytics.on is hooked once, at next:initialized when the SDK loads after the core', () => {
  let calls = 0;
  const r = load();
  r.window.next = { analytics: { on: () => { calls++; } } };
  r.listeners['next:initialized'].forEach((fn) => fn());
  r.fwd.customer({ event: 'dl_purchase' });
  assert.equal(calls, 1);
});
