// Regression tests for the shared Meta Pixel extras (_shared/analytics/js/meta.adapter.js).
// The adapter runs in a vm sandbox with a stub NextForwarder, document and localStorage; every fbq(...)
// call is captured.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../_shared/analytics/js/meta.adapter.js', import.meta.url), 'utf8');

function storage(entries = {}) {
  const keys = Object.keys(entries);
  return {
    get length() { return keys.length; },
    key: (i) => keys[i],
    getItem: (k) => (k in entries ? entries[k] : null),
  };
}

// fields: { 'data-next-checkout-field value': { value, e164 } }
function load({ win = {}, cookie = '', fields = {}, store = { visitor_id__abc: 'vid-123' }, forwarder = true } = {}) {
  const fbq = [];
  const timers = [];
  const listeners = {};
  let adapter;
  const doc = {
    cookie,
    querySelector(sel) {
      const m = sel.match(/data-next-checkout-field="([^"]+)"/);
      const f = m && fields[m[1]];
      if (!f) return null;
      if (sel.includes('[data-next-phone-e164]') && !f.e164) return null;
      return { value: f.value || '', getAttribute: (a) => (a === 'data-next-phone-e164' ? f.e164 || null : null) };
    },
  };
  const window = Object.assign({
    __metaPixelId: '123456',
    __metaAdvancedMatching: '',
    fbq: (...a) => fbq.push(JSON.parse(JSON.stringify(a))),
    location: { search: '', hostname: 'shop.example.com' },
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    console: { log() {}, warn() {} },
  }, forwarder ? { NextForwarder: { EMAIL_RE: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, register: (a) => { adapter = a; } } } : {}, win);
  vm.runInNewContext(SRC, {
    window, document: doc, localStorage: storage(store), console: window.console,
    setInterval: (fn) => { timers.push(fn); return timers.length; },
    clearInterval: (id) => { timers[id - 1] = null; },
  });
  return { fbq, timers, listeners, doc, window, get adapter() { return adapter; } };
}

test('advanced matching off: nothing registers and nothing is written', () => {
  const r = load({ win: { __metaAdvancedMatching: '' }, cookie: '_fbp=fb.1.111.222' });
  assert.equal(r.adapter, undefined);
  assert.equal(r.fbq.length, 0);
  assert.equal(r.window.nextReady, undefined, 'no SDK hook: the cookie re-sync and fb_external_id are gone (SDK 0.5.1)');
});

test('no external_id even when a visitor_id key exists (SDK 0.5.1 keeps a session id there)', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, store: { visitor_id__abc: 'session-1' } });
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: { customer_email: 'a@b.co' } });
  assert.deepEqual(r.fbq[0][2], { em: 'a@b.co' });
});

test('checkout contact only collects; the next Meta event inits once with em, E.164 ph, fn, ln, country', () => {
  const r = load({
    win: { __metaAdvancedMatching: 'true' },
    fields: { fname: { value: ' Jane ' }, lname: { value: 'Doe' } },
  });
  const a = r.adapter;
  assert.equal(a.contactRequiresMarketingConsent, false);
  assert.equal(a.contactOnFieldEntry, true);
  a.onContact({ email: ' Jane@Example.com ', source: 'field' });
  assert.equal(r.fbq.length, 0, 'email entry never inits');
  // Phone typed after the email: picked up from the SDK's E.164 attribute.
  r.doc.querySelector = ((orig) => (sel) => (sel.includes('"phone"') && sel.includes('e164')
    ? { value: '(650) 555-0194', getAttribute: () => '+16505550194' } : orig(sel)))(r.doc.querySelector);
  a.onContact({ phone: '(650) 555-0194', source: 'field' });
  assert.equal(r.fbq.length, 0, 'phone entry never inits');
  a.send('AddPaymentInfo', {}, { event: 'dl_add_payment_info', user_properties: { customer_country: 'US' } });
  assert.deepEqual(r.fbq, [['init', '123456', { em: 'jane@example.com', fn: 'jane', ln: 'doe', ph: '16505550194', country: 'us' }]]);
  a.send('Purchase', {}, { user_properties: { customer_email: 'other@example.com' } });
  assert.equal(r.fbq.length, 1, 'first init wins: never re-inits on the same page');
});

test('send reads the form at event time (no prior onContact), address included', () => {
  const r = load({
    win: { __metaAdvancedMatching: 'true' },
    fields: { email: { value: 'A@B.co' }, phone: { value: '07700 900123', e164: '+447700900123' }, country: { value: 'GB' },
      city: { value: 'Long Sutton' }, province: { value: 'LIN' }, postal: { value: 'PE12 9AA' } },
  });
  r.adapter.send('InitiateCheckout', {}, { event: 'dl_begin_checkout', user_properties: {} });
  assert.deepEqual(r.fbq[0][2], { em: 'a@b.co', ph: '447700900123', ct: 'longsutton', st: 'lin', zp: 'pe129aa', country: 'gb' });
});

test('on checkout the form wins over stale user_properties (starting country, empty address)', () => {
  const r = load({
    win: { __metaAdvancedMatching: 'true' },
    fields: { fname: { value: 'Jane' }, country: { value: 'US' }, city: { value: 'New York' }, province: { value: 'NY' }, postal: { value: '10118' } },
  });
  r.adapter.send('AddPaymentInfo', {}, { event: 'dl_add_payment_info', user_properties: {
    customer_email: 'jane@example.com', customer_country: 'CA', customer_first_name: '', customer_city: '', customer_zip: '',
  } });
  assert.deepEqual(r.fbq[0][2], { em: 'jane@example.com', country: 'us', fn: 'jane', ct: 'newyork', st: 'ny', zp: '10118' });
});

test('a national phone with no E.164 attribute is not sent; init does not wait for a phone', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, fields: { phone: { value: '(650) 555-0194' } } });
  r.adapter.onContact({ phone: '(650) 555-0194', email: 'a@b.co', source: 'field' });
  r.adapter.send('InitiateCheckout', {}, { user_properties: {} });
  assert.deepEqual(r.fbq[0][2], { em: 'a@b.co' });
});

test('holds while there is no email or phone, keeping the names collected meanwhile', () => {
  const r = load({ win: { __metaAdvancedMatching: '1' }, fields: { fname: { value: 'Jane' } } });
  r.adapter.onContact({ source: 'field' });
  r.adapter.send('InitiateCheckout', {}, { user_properties: {} });
  assert.equal(r.fbq.length, 0);
  r.adapter.send('AddPaymentInfo', {}, { user_properties: { customer_phone: '+44 7700 900123' } });
  assert.deepEqual(r.fbq[0][2], { fn: 'jane', ph: '447700900123' });
});

test('invalid email from contact is dropped', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  r.adapter.onContact({ email: 'not-an-email', source: 'field' });
  r.adapter.send('InitiateCheckout', {}, { user_properties: {} });
  assert.equal(r.fbq.length, 0);
});

test('receipt dl_purchase: user_properties -> em, ph, fn, ln, ct, st, zp, country', () => {
  const r = load({ win: { __metaAdvancedMatching: 'yes' } });
  assert.deepEqual(Object.keys(r.adapter.map), ['dl_begin_checkout', 'dl_add_payment_info', 'dl_purchase'],
    'no dl_upsell_purchase: the SDK sends Meta no Purchase for an upsell');
  assert.deepEqual([...r.adapter.allowedEvents], ['dl_begin_checkout', 'dl_add_payment_info', 'dl_purchase']);
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: {
    customer_email: 'JANE@example.com', customer_phone: '+1 650 555 0194', customer_first_name: 'Jane',
    customer_last_name: 'Doe', customer_city: 'San Francisco', customer_province_code: 'CA',
    customer_zip: '94 107', customer_country: 'US', customer_id: 999,
  } });
  assert.deepEqual(r.fbq[0][2], {
    em: 'jane@example.com', ph: '16505550194', fn: 'jane', ln: 'doe', ct: 'sanfrancisco', st: 'ca',
    zp: '94107', country: 'us',
  });
});

test('invalid email is dropped, the E.164 phone kept', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, store: {} });
  r.adapter.send('Purchase', {}, { user_properties: { customer_email: 'not-an-email', customer_phone: '+16505550194' } });
  assert.deepEqual(r.fbq[0][2], { ph: '16505550194' });
});

test('isActive needs a pixel id and fbq', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  assert.equal(r.adapter.isActive(), true);
  r.window.__metaPixelId = '';
  assert.equal(r.adapter.isActive(), false);
});

test('user_properties phone must be E.164; anything else is dropped, never guessed', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: {
    customer_email: 'jane@example.com', customer_phone: '555 0194' } });
  assert.equal(r.fbq[0][2].ph, undefined);
  assert.equal(r.fbq[0][2].em, 'jane@example.com');
});

test('onContact uses the core\'s E.164 phone when the input has no data-next-phone-e164', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, fields: { phone: { value: '(650) 555-0194' } } });
  r.adapter.onContact({ email: 'jane@example.com', phone: '+16505550194', source: 'field' });
  r.adapter.send('InitiateCheckout', {}, { event: 'dl_begin_checkout', user_properties: {} });
  assert.equal(r.fbq[0][2].ph, '16505550194');
});

test('Meta format: names and city lose punctuation, city loses spaces, US zip+4 cut to 5 digits', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: {
    customer_email: 'jane@example.com', customer_first_name: 'Mary-Jane', customer_last_name: "O'Brien",
    customer_city: "St. John's", customer_zip: '10118-1234', customer_country: 'US' } });
  const d = r.fbq[0][2];
  assert.equal(d.fn, 'maryjane');
  assert.equal(d.ln, 'obrien');
  assert.equal(d.ct, 'stjohns');
  assert.equal(d.zp, '10118');
});

test('Meta format: non-US postcode keeps its letters and digits, loses spaces and dash', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: {
    customer_email: 'jane@example.com', customer_zip: 'SW1A 1AA', customer_country: 'GB' } });
  assert.equal(r.fbq[0][2].zp, 'sw1a1aa');
});

test('E.164 minimum matches the core: 7 digits after "+" is kept', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: { customer_phone: '+2901234' } });
  assert.equal(r.fbq[0][2].ph, '2901234');
});
