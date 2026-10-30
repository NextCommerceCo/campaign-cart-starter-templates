// Regression tests for the shared AppLovin Axon adapter (_shared/analytics/js/axon.adapter.js).
// The adapter runs in a vm sandbox with a stub NextForwarder; every axon('track', …) call is captured.
// fixtures/axon/axon-structures.json + axon-category-ids.json are Axon Pixel Helper 1.3.6's own rules
// (sources inside each file); fixtures/axon/purchase-payload.json is the expected purchase call.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../_shared/analytics/js/axon.adapter.js', import.meta.url), 'utf8');
const fixture = (name) => JSON.parse(readFileSync(new URL(`fixtures/axon/${name}`, import.meta.url), 'utf8'));
const SCHEMA = fixture('axon-structures.json').events;
const CATEGORY_IDS = new Set(fixture('axon-category-ids.json').ids);
const EXPECTED_PURCHASE = fixture('purchase-payload.json');

function load(win = {}) {
  const calls = [];
  let adapter;
  const window = Object.assign({
    __axonEventKey: 'k',
    axon: (...a) => calls.push(JSON.parse(JSON.stringify(a))),
    NextForwarder: { DEFAULT_MAIN_EVENTS: null, register: (a) => { adapter = a; } },
  }, win);
  vm.runInNewContext(SRC, { window, console });
  return { calls, adapter };
}

// What the SDK (campaign-cart 0.4.43) puts on dl_purchase: item_category is the campaign NAME, item_image a
// .webp thumbnail, payment label as display text, buyer in user_properties (from order.user).
const sdkItem = {
  item_id: 'DEMO-1', item_name: 'Demo Product', price: 39, quantity: 1, item_brand: 'Demo Brand',
  item_variant_id: '15', item_category: 'Demo Campaign',
  item_image: 'https://d1w87fp8j98gad.cloudfront.net/media/thumbnails/demo.webp',
};
const purchaseEc = { currency: 'USD', value: 39, transaction_id: '101614', tax: 0, shipping: 0, items: [sdkItem] };
const buyer = { visitor_type: 'guest', customer_email: '  Jane.Doe@Example.COM ', customer_phone: '+1 (812) 315-8899', customer_id: '1234567' };
const evt = (up) => ({ event: 'dl_purchase', user_properties: up });

// Mirrors the Pixel Helper validator: missing Required = error, missing Recommended = warning, then type checks.
const IMAGE_RE = /^https?:\/\/(?:[\w-]+\.)+[\w-]+(?:\/[\w-./?%&=]*)?\.(png|jpe?g)(?:[?#].*)?$/i;
function validate(struct, value, path = '', out = { errors: [], warnings: [] }) {
  for (const [key, rule] of Object.entries(struct || {})) {
    const v = value ? value[key] : undefined;
    const p = path + key;
    if (v === undefined || v === null) {
      if (rule.requirement === 0) out.errors.push(`${p} missing`);
      else if (rule.requirement === 1) out.warnings.push(`${p} missing`);
      continue;
    }
    const s = rule.struct;
    if (Array.isArray(s)) { (Array.isArray(v) ? v : []).forEach((el, i) => validate(s[0], el, `${p}[${i}].`, out)); continue; }
    if (s && typeof s === 'object') { validate(s, v, `${p}.`, out); continue; }
    if (s === 'image_url' && !(typeof v === 'string' && IMAGE_RE.test(v))) out.warnings.push(`${p} not .png/.jpg/.jpeg`);
    else if (s === 'enum' && !rule.enum.includes(v)) out.warnings.push(`${p} "${v}" not in enum`);
    else if (s === 'product_category_id') {
      if (typeof v !== 'number' || !Number.isInteger(v)) out.errors.push(`${p} not an integer`);
      else if (!CATEGORY_IDS.has(v)) out.warnings.push(`${p} unknown category`);
    } else if (s === 'number' && (Array.isArray(v) || isNaN(Number(v)))) out.errors.push(`${p} not a number`);
  }
  return out;
}

test('purchase payload: numeric item_category_id, user_data, no .webp image (fixture)', () => {
  const { calls, adapter } = load({ __axonItemCategoryId: '469' });
  adapter.send('purchase', purchaseEc, evt(buyer));
  assert.deepEqual(calls[0], EXPECTED_PURCHASE);
  assert.deepEqual(validate(SCHEMA.purchase, calls[0][2]).errors, []);
});

test('text item_category is never sent as item_category_id (the Axon 400)', () => {
  const { calls, adapter } = load();
  for (const name of ['view_item', 'add_to_cart', 'begin_checkout', 'purchase']) adapter.send(name, purchaseEc, evt({}));
  for (const [, name, p] of calls) {
    assert.equal('item_category_id' in p.items[0], false, name);
    assert.deepEqual(validate(SCHEMA[name], p).errors.filter((e) => e.includes('item_category_id')), [], name);
  }
});

test('numeric SDK category wins over the campaign fallback; junk fallback is ignored', () => {
  let r = load({ __axonItemCategoryId: '469' });
  r.adapter.send('view_item', { items: [{ ...sdkItem, item_category: '2765' }] }, evt({}));
  assert.equal(r.calls[0][2].items[0].item_category_id, 2765);
  for (const junk of ['', 'Skin Care', '0', '-5', '12.5']) {
    r = load({ __axonItemCategoryId: junk });
    r.adapter.send('view_item', { items: [sdkItem] }, evt({}));
    assert.equal('item_category_id' in r.calls[0][2].items[0], false, junk);
  }
});

test('the unpatched mapping fails the Pixel Helper rules this fixes', () => {
  const raw = { ...purchaseEc, items: [{ ...sdkItem, item_category_id: sdkItem.item_category, image_url: sdkItem.item_image }] };
  const r = validate(SCHEMA.purchase, raw);
  assert.ok(r.errors.includes('items[0].item_category_id not an integer'), JSON.stringify(r));
  assert.ok(r.errors.includes('user_data missing'), JSON.stringify(r));
});

test('user_data rides on checkout events and purchase only', () => {
  const { calls, adapter } = load();
  for (const name of ['view_item', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'purchase']) {
    adapter.send(name, purchaseEc, evt({ customer_email: 'x@y.com' }));
  }
  adapter.send('page_view', {}, evt({ customer_email: 'x@y.com' }));
  assert.deepEqual(calls.map((c) => c[2]?.user_data), [undefined, undefined, { email: 'x@y.com' }, { email: 'x@y.com' }, { email: 'x@y.com' }, undefined]);
  assert.deepEqual(calls[5], ['track', 'page_view']);
});

test('user_data normalisation: short ids and non-E.164 phones are left out; phone alone is enough', () => {
  let r = load();
  r.adapter.send('purchase', purchaseEc, evt({ customer_email: 'a@b.co', customer_phone: '812-315-8899', customer_id: '5' }));
  assert.deepEqual(r.calls[0][2].user_data, { email: 'a@b.co' });
  r = load();
  r.adapter.send('purchase', purchaseEc, evt({ customer_phone: '+447700900123' }));
  assert.deepEqual(r.calls[0][2].user_data, { phone: '447700900123' });
  r = load();
  r.adapter.send('purchase', purchaseEc, evt({ customer_email: 'not-an-email', customer_id: '1234567' }));
  assert.equal('user_data' in r.calls[0][2], false);
  r = load();
  r.adapter.send('purchase', purchaseEc, undefined);
  assert.equal(r.calls.length, 1);
});

test('opt-out: window.__axonSendUserData = false', () => {
  for (const off of [false, 'false']) {
    const { calls, adapter } = load({ __axonSendUserData: off });
    adapter.send('purchase', purchaseEc, evt(buyer));
    assert.equal('user_data' in calls[0][2], false);
  }
});

test('image_url kept only for .png/.jpg/.jpeg', () => {
  const urls = {
    'https://cdn.example.com/p.jpg': true, 'https://cdn.example.com/p.JPEG?v=2': true, 'https://cdn.example.com/p.png': true,
    'https://cdn.example.com/p.webp': false, 'https://cdn.example.com/p.jpg.webp': false, '/relative/p.jpg': false,
  };
  for (const [url, kept] of Object.entries(urls)) {
    const { calls, adapter } = load();
    adapter.send('view_item', { items: [{ ...sdkItem, item_image: url }] }, evt({}));
    assert.equal(calls[0][2].items[0].image_url, kept ? url : undefined, url);
  }
});

test('payment_type maps SDK labels to the Axon enum', () => {
  const cases = {
    'Credit Card': 'credit_card', 'Saved Card': 'credit_card', 'Apple Pay': 'wallet', 'Google Pay': 'wallet', PayPal: 'wallet',
    'Shop Pay': 'wallet', Klarna: 'deferred', Affirm: 'deferred', 'Gift Card': 'redeemable', 'Cash on Delivery': 'payment_on_delivery',
    iDEAL: 'other', 'SEPA Direct Debit': 'other', credit_card: 'credit_card',
  };
  for (const [label, want] of Object.entries(cases)) {
    const { calls, adapter } = load();
    adapter.send('add_payment_info', { currency: 'USD', value: 1, payment_type: label }, evt({}));
    assert.equal(calls[0][2].payment_type, want, label);
  }
});

test('checkout funnel has no Pixel Helper errors with a campaign category set', () => {
  const { calls, adapter } = load({ __axonItemCategoryId: '469' });
  const flow = [
    ['view_item', { currency: 'USD', value: 39, items: [sdkItem] }, {}],
    ['add_to_cart', { currency: 'USD', value: 39, items: [sdkItem] }, {}],
    ['begin_checkout', { currency: 'USD', value: 39, items: [sdkItem] }, buyer],
    ['add_payment_info', { currency: 'USD', value: 39, items: [sdkItem], payment_type: 'Credit Card' }, buyer],
    ['purchase', purchaseEc, buyer],
    ['purchase', { ...purchaseEc, transaction_id: '101614-US1' }, buyer],
  ];
  for (const [name, ec, up] of flow) adapter.send(name, ec, evt(up));
  for (const [, name, p] of calls) {
    const r = validate(SCHEMA[name], p);
    assert.deepEqual(r.errors, [], `${name}: ${JSON.stringify(r)}`);
    // The only warning left is image_url: the SDK's thumbnails are .webp, so it is dropped rather than sent wrong.
    assert.deepEqual(r.warnings.filter((w) => !w.endsWith('image_url missing')), [], `${name}: ${JSON.stringify(r)}`);
  }
});
