// Regression tests for the shared AppLovin Axon adapter (_shared/analytics/js/axon.adapter.js).
// The adapter runs in a vm sandbox with a stub NextForwarder; every axon('track', …) call is captured.
// fixtures/axon/sdk-dl-purchase.json is a dl_purchase shaped from the SDK source (see its _source).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../_shared/analytics/js/axon.adapter.js', import.meta.url), 'utf8');
const SDK_PURCHASE = JSON.parse(readFileSync(new URL('fixtures/axon/sdk-dl-purchase.json', import.meta.url), 'utf8'));

function load(win = {}) {
  const calls = [];
  const warnings = [];
  let adapter;
  const window = Object.assign({
    __axonEventKey: 'k',
    axon: (...a) => calls.push(JSON.parse(JSON.stringify(a))),
    NextForwarder: { DEFAULT_MAIN_EVENTS: null, register: (a) => { adapter = a; } },
    location: { search: '', hostname: 'shop.example.com' },
    NextDataLayer: [],
    console: { log() {}, warn: (...a) => warnings.push(a.join(' ')) },
  }, win);
  vm.runInNewContext(SRC, { window, console: window.console });
  return { calls, warnings, adapter, window, seen: new Set() };
}

// Dispatch the way the SDK + next-forwarder-core.js do: a _willRedirect event is queued for the next page (no
// send, no push); otherwise isActive() -> adapter.map -> the adapter's allow/block lists -> per-adapter
// event_id dedup -> send(name, ecommerce, envelope); then the SDK appends the event to window.NextDataLayer.
function dispatch({ adapter, window, seen }, envelope) {
  if (envelope._willRedirect) return;
  const name = adapter.map[envelope.event];
  const on = (list) => list.includes(envelope.event) || list.includes(name);
  const id = envelope.event_id;
  if (adapter.isActive() && name && (!adapter.allowedEvents || on(adapter.allowedEvents)) &&
      !on(adapter.blockedEvents || []) && !(id && seen.has(id))) {
    if (id) seen.add(id);
    adapter.send(name, envelope.ecommerce || {}, envelope);
  }
  window.NextDataLayer.push(envelope);
}

const sdkItem = SDK_PURCHASE.ecommerce.items[0];

test('SDK dl_purchase through adapter.map: integer item_category_id, no .webp image, no user_data by default', () => {
  const r = load({ __axonItemCategoryId: '469' });
  dispatch(r, SDK_PURCHASE);
  const [, name, p] = r.calls[0];
  assert.equal(name, 'purchase');
  assert.equal(p.items[0].item_category_id, 469);
  assert.equal('image_url' in p.items[0], false);
  assert.equal('user_data' in p, false);
  assert.deepEqual([p.currency, p.value, p.transaction_id, p.tax, p.shipping], ['USD', 39, '101614', 0, 0]);
});

test('text item_category is never sent as item_category_id (the Axon 400)', () => {
  const r = load();
  for (const dl of ['dl_view_item', 'dl_add_to_cart', 'dl_begin_checkout', 'dl_purchase']) dispatch(r, { ...SDK_PURCHASE, event: dl, event_id: dl });
  for (const [, name, p] of r.calls) assert.equal('item_category_id' in p.items[0], false, name);
});

test('numeric SDK category wins over the campaign fallback; junk fallback is ignored', () => {
  let r = load({ __axonItemCategoryId: '469' });
  r.adapter.send('view_item', { items: [{ ...sdkItem, item_category: '2765' }] }, {});
  assert.equal(r.calls[0][2].items[0].item_category_id, 2765);
  for (const junk of ['', 'Skin Care', '0', '-5', '12.5']) {
    r = load({ __axonItemCategoryId: junk });
    r.adapter.send('view_item', { items: [sdkItem] }, {});
    assert.equal('item_category_id' in r.calls[0][2].items[0], false, junk);
  }
});

test('image_url kept only for .png/.jpg/.jpeg', () => {
  const urls = {
    'https://cdn.example.com/p.jpg': true, 'https://cdn.example.com/p.JPEG?v=2': true, 'https://cdn.example.com/p.png': true,
    'https://cdn.example.com/p.webp': false, 'https://cdn.example.com/p.jpg.webp': false, '/relative/p.jpg': false,
  };
  for (const [url, kept] of Object.entries(urls)) {
    const { calls, adapter } = load();
    adapter.send('view_item', { items: [{ ...sdkItem, item_image: url }] }, {});
    assert.equal(calls[0][2].items[0].image_url, kept ? url : undefined, url);
  }
});

test('payment_type maps SDK labels to the Axon enum', () => {
  const cases = {
    'Credit Card': 'credit_card', 'Apple Pay': 'wallet', PayPal: 'wallet', Klarna: 'deferred',
    'Gift Card': 'redeemable', 'Cash on Delivery': 'payment_on_delivery', iDEAL: 'other', credit_card: 'credit_card',
  };
  for (const [label, want] of Object.entries(cases)) {
    const { calls, adapter } = load();
    adapter.send('add_payment_info', { currency: 'USD', value: 1, payment_type: label }, {});
    assert.equal(calls[0][2].payment_type, want, label);
  }
});

test('user_data is off by default, on purchase only when __axonSendUserData === true', () => {
  let r = load();
  dispatch(r, SDK_PURCHASE);
  assert.equal('user_data' in r.calls[0][2], false);
  for (const notTrue of ['true', 1, 'yes']) {
    r = load({ __axonSendUserData: notTrue });
    dispatch(r, SDK_PURCHASE);
    assert.equal('user_data' in r.calls[0][2], false, String(notTrue));
  }
  r = load({ __axonSendUserData: true });
  const carried = [];
  for (const dl of Object.keys(r.adapter.map)) {
    const before = r.calls.length;
    dispatch(r, { ...SDK_PURCHASE, event: dl, event_id: dl });
    if (r.calls[before][2]?.user_data) carried.push(dl);
  }
  assert.deepEqual(carried.sort(), ['dl_purchase', 'dl_upsell_purchase']);
  assert.deepEqual(r.calls.find((c) => c[2]?.user_data)[2].user_data, { email: 'jane.doe@example.com', phone: '18123158899' });
});

test('a consent script can set the flag after load', () => {
  const r = load();
  dispatch(r, SDK_PURCHASE);
  r.window.__axonSendUserData = true;
  dispatch(r, { ...SDK_PURCHASE, event_id: 'evt-2' });
  assert.equal('user_data' in r.calls[0][2], false);
  assert.ok(r.calls[1][2].user_data);
});

test('user_data normalisation: short ids and non-E.164 phones are left out', () => {
  const send = (up) => {
    const r = load({ __axonSendUserData: true });
    r.adapter.send('purchase', SDK_PURCHASE.ecommerce, { event: 'dl_purchase', user_properties: up });
    return r.calls[0][2].user_data;
  };
  assert.deepEqual(send({ customer_email: 'a@b.co', customer_phone: '812-315-8899', customer_id: '5' }), { email: 'a@b.co' });
  assert.deepEqual(send({ customer_phone: '+447700900123' }), { phone: '447700900123' });
  assert.deepEqual(send({ customer_email: 'not-an-email', customer_id: '1234567' }), { user_id: '1234567' });
  assert.equal(send({ customer_email: 'not-an-email' }), undefined);
});

test('one console warning per page for a purchase without user_data, only with ?nfdebug=true', () => {
  let r = load();
  dispatch(r, SDK_PURCHASE);
  assert.equal(r.warnings.length, 0);
  r = load({ location: { search: '?nfdebug=true', hostname: 'shop.example.com' } });
  dispatch(r, SDK_PURCHASE);
  dispatch(r, { ...SDK_PURCHASE, event_id: 'evt-2' });
  assert.equal(r.calls.length, 2);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /purchase sent without user_data \(axon_send_user_data is off\)/);
});

// dl_upsell_purchase and dl_user_data as the SDK pushes them on the page after an upsell
// (browser-verified 2026-11-02): the upsell's user_properties hold only visitor_type, the page's
// dl_user_data still has the email from the SDK's persisted user data.
const SDK_UPSELL = { ...SDK_PURCHASE, event: 'dl_upsell_purchase', event_id: 'evt-upsell-1', user_properties: { visitor_type: 'guest' },
  ecommerce: { ...SDK_PURCHASE.ecommerce, transaction_id: 'abc123-US1', affiliation: 'Upsell' } };
const SDK_USER_DATA = { event: 'dl_user_data', user_properties: { visitor_type: 'guest', customer_email: 'Jane.Doe@Example.com' }, ecommerce: { currency: 'USD', value: 0, items: [] } };

test('upsell purchase takes user_data from the page dl_user_data', () => {
  const r = load({ __axonSendUserData: true });
  dispatch(r, SDK_USER_DATA);
  dispatch(r, SDK_UPSELL);
  assert.equal(r.calls[0][1], 'page_view');
  assert.equal(r.calls[0].length, 2, 'page_view stays bare');
  assert.equal(r.calls[1][2].transaction_id, 'abc123-US1');
  assert.deepEqual(r.calls[1][2].user_data, { email: 'jane.doe@example.com' });
});

test('upsell fallback ignores the event toggles: dl_user_data need not be forwarded to Axon', () => {
  for (const toggles of [{ __axonAllowedEvents: 'dl_purchase, dl_upsell_purchase' }, { __axonBlockedEvents: 'page_view' }]) {
    const r = load({ __axonSendUserData: true, ...toggles });
    dispatch(r, SDK_USER_DATA);
    dispatch(r, SDK_UPSELL);
    assert.equal(r.calls.length, 1, JSON.stringify(toggles));
    assert.deepEqual(r.calls[0][2].user_data, { email: 'jane.doe@example.com' }, JSON.stringify(toggles));
  }
});

test('identities are never mixed: an upsell with its own keeps it whole; only the newest dl_user_data counts', () => {
  let r = load({ __axonSendUserData: true });
  dispatch(r, SDK_USER_DATA);
  dispatch(r, { ...SDK_UPSELL, user_properties: { customer_id: '1234567' } });
  assert.deepEqual(r.calls[1][2].user_data, { user_id: '1234567' }, 'no page email stitched onto the upsell id');

  r = load({ __axonSendUserData: true });
  dispatch(r, SDK_USER_DATA);
  dispatch(r, { event: 'dl_user_data', user_properties: { visitor_type: 'guest' }, ecommerce: {} });
  dispatch(r, SDK_UPSELL);
  assert.equal('user_data' in r.calls[2][2], false, 'an older visitor is not reached past the newest dl_user_data');
});

test('the order and upsell purchases on one page each reach Axon (distinct event_id); a redirect-queued one does not', () => {
  const r = load({ __axonSendUserData: true });
  dispatch(r, { ...SDK_UPSELL, _willRedirect: true });
  dispatch(r, SDK_USER_DATA);
  dispatch(r, SDK_PURCHASE);
  dispatch(r, SDK_UPSELL);
  dispatch(r, SDK_UPSELL);
  assert.deepEqual(r.calls.map((c) => c[2]?.transaction_id ?? c[1]), ['page_view', '101614', 'abc123-US1']);
});

test('page dl_user_data fallback: not without the flag, not without dl_user_data, never for an order purchase', () => {
  let r = load();
  dispatch(r, SDK_USER_DATA);
  dispatch(r, SDK_UPSELL);
  assert.equal('user_data' in r.calls[1][2], false, 'flag off');

  r = load({ __axonSendUserData: true });
  dispatch(r, SDK_UPSELL);
  assert.equal('user_data' in r.calls[0][2], false, 'no dl_user_data on the page');

  r = load({ __axonSendUserData: true });
  dispatch(r, SDK_USER_DATA);
  dispatch(r, { ...SDK_PURCHASE, user_properties: { visitor_type: 'guest' } });
  assert.equal('user_data' in r.calls[1][2], false, 'order purchase never borrows');
});
