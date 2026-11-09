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

// An adapter that opts into the customer bridge.
const optIn = (r, customerData = true) => r.fwd.register(r.adapter({ name: 'id', customerData }));

test('customer(): {} on SDK 0.4 (no next.snapshot, no next.analytics)', () => {
  const r = load({ next: { on() {} } });
  optIn(r);
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {});
});

test('customer(): purchase reads next.snapshot().order, flat and trimmed', () => {
  const r = load({ next: { snapshot: () => ({ order: ORDER, checkout: CHECKOUT }) } });
  optIn(r);
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {
    email: 'jane@example.com', phone: '+16505550194', first_name: 'Jane', last_name: 'Doe',
    city: 'San Francisco', state: 'CA', postcode: '94107', country: 'US',
  });
});

test('customer(): checkout events read the checkout, address phone and names filling the user', () => {
  const r = load({ next: { snapshot: () => ({ checkout: CHECKOUT }) } });
  optIn(r);
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_begin_checkout' }) }, {
    email: 'typed@example.com', phone: '+447700900123', first_name: 'Jan', last_name: 'D',
    city: 'Leeds', postcode: 'LS1 1AA', country: 'GB',
  });
});

test('customer(): one source wholesale, never the order email with the checkout address', () => {
  const order = { user: { email: 'jane@example.com' } }; // no address on the order
  const r = load({ next: { snapshot: () => ({ order, checkout: CHECKOUT }) } });
  optIn(r);
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, { email: 'jane@example.com' });
  const empty = load({ next: { snapshot: () => ({ order: {}, checkout: CHECKOUT }) } });
  optIn(empty);
  assert.equal(empty.fwd.customer({ event: 'dl_purchase' }).email, 'typed@example.com', 'an empty order falls back whole');
});

test('customer(): an empty shipping address gives way to the billing address, whole', () => {
  const checkout = {
    user: { email: 'jane@example.com' },
    shipping_address: { first_name: 'Jane' },
    billing_address: { city: 'Leeds', postcode: 'LS1 1AA', country: 'GB' },
  };
  const r = load({ next: { snapshot: () => ({ checkout }) } });
  optIn(r);
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_begin_checkout' }) }, {
    email: 'jane@example.com', city: 'Leeds', postcode: 'LS1 1AA', country: 'GB',
  });
});

test('customer(): a preselected country alone does not make the shipping address win over billing', () => {
  const checkout = {
    user: { email: 'jane@example.com' },
    shipping_address: { country: 'US' },
    billing_address: { city: 'Leeds', state: 'WYK', postcode: 'LS1 1AA', country: 'GB' },
  };
  const r = load({ next: { snapshot: () => ({ checkout }) } });
  optIn(r);
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_begin_checkout' }) }, {
    email: 'jane@example.com', city: 'Leeds', state: 'WYK', postcode: 'LS1 1AA', country: 'GB',
  });
});

test('customer(): no opt-in adapter -> {} and no next.analytics subscription', () => {
  let calls = 0;
  const r = load({ next: { snapshot: () => ({ order: ORDER }), analytics: { on: () => { calls++; } } } });
  r.fwd.register(r.adapter());
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {});
  r.listeners['next:initialized']?.forEach((fn) => fn());
  (r.window.nextReady || []).forEach((fn) => fn(r.window.next));
  assert.equal(calls, 0);
});

test('customer(): a customerData function subscribes at register and returns data only while it is true', () => {
  let calls = 0, on = false;
  const r = load({ next: { snapshot: () => ({ order: ORDER }), analytics: { on: () => { calls++; } } } });
  optIn(r, () => on);
  assert.equal(calls, 1, 'subscribed at register, before any customer() call');
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {});
  on = true;
  assert.equal(r.fwd.customer({ event: 'dl_purchase' }).email, 'jane@example.com');
  on = false; // consent withdrawn
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {}, 'no latch: revoking the flag closes the gate');
  assert.equal(r.fwd.getStatus()[0].customerData, false);
  assert.equal(calls, 1);
});

test('customer(): window.next wins over the nextReady instance, and a new instance resets what was tracked', () => {
  let handlerA, handlerB;
  const a = { snapshot: () => ({}), analytics: { on: (n, fn) => { handlerA = fn; } } };
  const b = { snapshot: () => ({}), analytics: { on: (n, fn) => { handlerB = fn; } } };
  const r = load({ next: a });
  optIn(r);
  r.window.nextReady.forEach((fn) => fn({ snapshot: () => ({ order: { user: { email: 'facade@example.com' } } }) }));
  handlerA({ object: 'order', data: ORDER });
  assert.equal(r.fwd.customer({ event: 'dl_purchase' }).email, 'jane@example.com', 'window.next is read, not the facade');
  r.window.next = b;
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {}, 'the old instance\'s order is dropped');
  handlerA({ object: 'order', data: ORDER });
  assert.deepEqual({ ...r.fwd.customer({ event: 'dl_purchase' }) }, {}, 'the old listener goes quiet');
  handlerB({ object: 'order', data: { user: { email: 'new@example.com' } } });
  assert.equal(r.fwd.customer({ event: 'dl_purchase' }).email, 'new@example.com');
});

test('getStatus() reports allAddToCart and customerData per adapter', () => {
  const r = load();
  r.fwd.register(r.adapter({ name: 'plain' }));
  r.fwd.register(r.adapter({ name: 'all', allAddToCart: true, customerData: true }));
  assert.deepEqual(JSON.parse(JSON.stringify(r.fwd.getStatus().map(({ name, allAddToCart, customerData }) => ({ name, allAddToCart, customerData })))), [
    { name: 'plain', allAddToCart: false, customerData: null },
    { name: 'all', allAddToCart: true, customerData: true },
  ]);
});

test('customer(): falls back to the latest next.analytics.on order / checkout when snapshot has none', () => {
  let handler;
  const r = load({ next: { snapshot: () => ({}), analytics: { on: (name, fn) => { assert.equal(name, '*'); handler = fn; } } } });
  optIn(r);
  handler({ object: 'order', event_type: 'checkout_completed', data: ORDER });
  handler({ object: 'cart_line', event_type: 'product_added_to_cart', data: {} });
  assert.equal(r.fwd.customer({ event: 'dl_upsell_purchase' }).email, 'jane@example.com');
  assert.equal(r.fwd.customer({ event: 'dl_user_data' }).email, 'jane@example.com', 'upsell page: no checkout -> the order');
});

test('customer(): next.analytics.on is hooked once, at next:initialized when the SDK loads after the core', () => {
  let calls = 0;
  const r = load();
  optIn(r);
  r.window.next = { analytics: { on: () => { calls++; } } };
  r.listeners['next:initialized'].forEach((fn) => fn());
  r.fwd.customer({ event: 'dl_purchase' });
  assert.equal(calls, 1);
});

test('customer(): a throwing next.analytics.on is retried, not given up on', () => {
  let calls = 0;
  const r = load({ next: { analytics: { on: () => { calls++; if (calls === 1) throw new Error('not ready'); } } } });
  optIn(r);
  r.fwd.customer({ event: 'dl_purchase' });
  r.fwd.customer({ event: 'dl_purchase' });
  assert.equal(calls, 2, 'second attempt subscribes');
});

test('customer(): uses the SDK instance window.nextReady hands over when window.next is not set', () => {
  let calls = 0;
  const instance = { snapshot: () => ({ order: ORDER }), analytics: { on: () => { calls++; } } };
  const r = load();
  optIn(r);
  r.window.nextReady.forEach((fn) => fn(instance));
  assert.equal(calls, 1);
  assert.equal(r.fwd.customer({ event: 'dl_purchase' }).email, 'jane@example.com');
});

test('a dl_add_to_cart flag encoded other than true counts as a repeat add', () => {
  const r = load();
  r.fwd.register(r.adapter());
  ['false', 0, null].forEach((v, i) => r.push({ event: 'dl_add_to_cart', event_id: 'x' + i, first_in_session: v, ecommerce: {} }));
  assert.deepEqual(r.sent, []);
});
