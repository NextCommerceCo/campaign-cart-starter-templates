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
  let adapter;
  const window = Object.assign({
    __axonEventKey: 'k',
    axon: (...a) => calls.push(JSON.parse(JSON.stringify(a))),
    NextForwarder: { DEFAULT_MAIN_EVENTS: null, register: (a) => { adapter = a; } },
    console: { log() {}, warn() {} },
  }, win);
  vm.runInNewContext(SRC, { window, console: window.console });
  return { calls, adapter };
}

// Dispatch the way next-forwarder-core.js does: dl_* name -> adapter.map -> send(name, ecommerce, envelope).
function dispatch(adapter, envelope) {
  adapter.send(adapter.map[envelope.event], envelope.ecommerce || {}, envelope);
}

const sdkItem = SDK_PURCHASE.ecommerce.items[0];

test('SDK dl_purchase through adapter.map: integer item_category_id, no .webp image, no user_data', () => {
  const { calls, adapter } = load({ __axonItemCategoryId: '469' });
  dispatch(adapter, SDK_PURCHASE);
  const [, name, p] = calls[0];
  assert.equal(name, 'purchase');
  assert.equal(p.items[0].item_category_id, 469);
  assert.equal('image_url' in p.items[0], false);
  assert.equal('user_data' in p, false);
  assert.deepEqual([p.currency, p.value, p.transaction_id, p.tax, p.shipping], ['USD', 39, '101614', 0, 0]);
});

test('text item_category is never sent as item_category_id (the Axon 400)', () => {
  const { calls, adapter } = load();
  for (const dl of ['dl_view_item', 'dl_add_to_cart', 'dl_begin_checkout', 'dl_purchase']) dispatch(adapter, { ...SDK_PURCHASE, event: dl });
  for (const [, name, p] of calls) assert.equal('item_category_id' in p.items[0], false, name);
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
