// Regression tests for the shared Meta Pixel extras (_shared/analytics/js/meta.adapter.js).
// The adapter runs in a vm sandbox with a stub NextForwarder, document, localStorage and SDK; every
// fbq(...) call and next.addMetadata(...) call is captured.
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

// A stub SDK: getAttribution().metadata + addMetadata/on, recording what was written.
function sdk(metadata = {}) {
  const added = [];
  const handlers = {};
  return {
    added, handlers, metadata,
    getAttribution: () => ({ metadata }),
    addMetadata: (k, v) => { added.push([k, v]); metadata[k] = v; },
    on: (e, fn) => { handlers[e] = fn; },
  };
}

const ready = (r, s) => r.window.nextReady.forEach((fn) => fn(s));

test('cookie re-sync: copies _fbp/_fbc into metadata on SDK ready, with advanced matching off', () => {
  const r = load({ cookie: '_fbp=fb.1.111.222; _fbc=fb.1.333.abc' });
  const s = sdk({ fbclid: 'abc' });
  ready(r, s);
  assert.deepEqual(s.added, [['fb_fbp', 'fb.1.111.222'], ['fb_fbc', 'fb.1.333.abc']]);
  assert.equal(r.timers.length, 0, 'no polling once both cookies are in');
  assert.equal(r.adapter, undefined, 'advanced matching adapter not registered when the flag is off');
  assert.equal(r.fbq.length, 0, 'never calls fbq');
});

test('cookie re-sync: polls until the pixel sets _fbp, then re-syncs on cart:updated and popstate', () => {
  const r = load({ cookie: '' });
  const s = sdk({});
  ready(r, s);
  assert.equal(s.added.length, 0);
  assert.equal(r.timers.length, 1);
  r.doc.cookie = '_fbp=fb.1.111.222';
  r.timers[0]();
  assert.deepEqual(s.added, [['fb_fbp', 'fb.1.111.222']]);
  assert.equal(r.timers[0], null, 'poll cleared once _fbp is in (no fbclid, so no _fbc expected)');
  s.metadata.fb_fbp = '';             // the SDK puts the stale value back on a cart update
  s.handlers['cart:updated']();
  assert.deepEqual(s.added.at(-1), ['fb_fbp', 'fb.1.111.222']);
  s.metadata.fb_fbp = '';
  r.listeners.popstate[0]();
  assert.equal(s.added.length, 3);
});

test('cookie re-sync: gives up after 20 polls (10 s)', () => {
  const r = load({ cookie: '' });
  ready(r, sdk({}));
  for (let i = 0; i < 20; i++) r.timers[0] && r.timers[0]();
  assert.equal(r.timers[0], null);
});

test('advanced matching off: no fb_external_id, no init, even with forwarder present', () => {
  const r = load({ win: { __metaAdvancedMatching: '' } });
  const s = sdk({});
  ready(r, s);
  assert.equal(s.added.some(([k]) => k === 'fb_external_id'), false);
  assert.equal(r.adapter, undefined);
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
  assert.deepEqual(r.fbq, [['init', '123456', { em: 'jane@example.com', fn: 'jane', ln: 'doe', ph: '16505550194', country: 'us', external_id: 'vid-123' }]]);
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
  assert.deepEqual(r.fbq[0][2], { em: 'a@b.co', ph: '447700900123', ct: 'longsutton', st: 'lin', zp: 'pe129aa', country: 'gb', external_id: 'vid-123' });
});

test('on checkout the form wins over stale user_properties (starting country, empty address)', () => {
  const r = load({
    win: { __metaAdvancedMatching: 'true' },
    fields: { fname: { value: 'Jane' }, country: { value: 'US' }, city: { value: 'New York' }, province: { value: 'NY' }, postal: { value: '10118' } },
  });
  r.adapter.send('AddPaymentInfo', {}, { event: 'dl_add_payment_info', user_properties: {
    customer_email: 'jane@example.com', customer_country: 'CA', customer_first_name: '', customer_city: '', customer_zip: '',
  } });
  assert.deepEqual(r.fbq[0][2], { em: 'jane@example.com', country: 'us', fn: 'jane', ct: 'newyork', st: 'ny', zp: '10118', external_id: 'vid-123' });
});

test('a national phone with no E.164 attribute is not sent; init does not wait for a phone', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, fields: { phone: { value: '(650) 555-0194' } } });
  r.adapter.onContact({ phone: '(650) 555-0194', email: 'a@b.co', source: 'field' });
  r.adapter.send('InitiateCheckout', {}, { user_properties: {} });
  assert.deepEqual(r.fbq[0][2], { em: 'a@b.co', external_id: 'vid-123' });
});

test('holds while there is no email or phone, keeping the names collected meanwhile', () => {
  const r = load({ win: { __metaAdvancedMatching: '1' }, fields: { fname: { value: 'Jane' } } });
  r.adapter.onContact({ source: 'field' });
  r.adapter.send('InitiateCheckout', {}, { user_properties: {} });
  assert.equal(r.fbq.length, 0);
  r.adapter.send('AddPaymentInfo', {}, { user_properties: { customer_phone: '+44 7700 900123' } });
  assert.deepEqual(r.fbq[0][2], { fn: 'jane', ph: '447700900123', external_id: 'vid-123' });
});

test('invalid email from contact is dropped', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  r.adapter.onContact({ email: 'not-an-email', source: 'field' });
  r.adapter.send('InitiateCheckout', {}, { user_properties: {} });
  assert.equal(r.fbq.length, 0);
});

test('visitor_id: more than one scoped key -> no external_id and no fb_external_id', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, store: { visitor_id__a: 'one', visitor_id__b: 'two' } });
  const s = sdk({});
  ready(r, s);
  assert.equal(s.added.some(([k]) => k === 'fb_external_id'), false);
  r.adapter.send('Purchase', {}, { user_properties: { customer_email: 'a@b.co' } });
  assert.deepEqual(r.fbq[0][2], { em: 'a@b.co' });
});

test('receipt dl_purchase: user_properties -> em, ph, fn, ln, ct, st, zp, country', () => {
  const r = load({ win: { __metaAdvancedMatching: 'yes' } });
  assert.deepEqual(Object.keys(r.adapter.map), ['dl_begin_checkout', 'dl_add_payment_info', 'dl_purchase', 'dl_upsell_purchase']);
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: {
    customer_email: 'JANE@example.com', customer_phone: '+1 650 555 0194', customer_first_name: 'Jane',
    customer_last_name: 'Doe', customer_city: 'San Francisco', customer_province_code: 'CA',
    customer_zip: '94 107', customer_country: 'US', customer_id: 999,
  } });
  assert.deepEqual(r.fbq[0][2], {
    em: 'jane@example.com', ph: '16505550194', fn: 'jane', ln: 'doe', ct: 'sanfrancisco', st: 'ca',
    zp: '94107', country: 'us', external_id: 'vid-123',
  });
});

test('invalid email is dropped; no visitor_id -> no external_id', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, store: {} });
  r.adapter.send('Purchase', {}, { user_properties: { customer_email: 'not-an-email', customer_phone: '+16505550194' } });
  assert.deepEqual(r.fbq[0][2], { ph: '16505550194' });
});

test('fb_external_id metadata = raw visitor_id when advanced matching is on', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' }, store: { visitor_id__xyz: 'abc-def' } });
  const s = sdk({ fb_fbp: 'x' });
  ready(r, s);
  assert.deepEqual(s.added.find(([k]) => k === 'fb_external_id'), ['fb_external_id', 'abc-def']);
});

test('isActive needs a pixel id and fbq', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true' } });
  assert.equal(r.adapter.isActive(), true);
  r.window.__metaPixelId = '';
  assert.equal(r.adapter.isActive(), false);
});

test('without next-forwarder-core.js the cookie re-sync still runs', () => {
  const r = load({ forwarder: false, cookie: '_fbp=fb.1.1.2', win: { __metaAdvancedMatching: 'true' } });
  const s = sdk({});
  ready(r, s);
  assert.deepEqual(s.added, [['fb_fbp', 'fb.1.1.2']]);
});

test('cookie re-sync: two same-named cookies -> the first one is used, not dropped', () => {
  const r = load({ cookie: '_fbp=fb.1.111.first; _fbp=fb.1.111.second' });
  const s = sdk({});
  ready(r, s);
  assert.deepEqual(s.added, [['fb_fbp', 'fb.1.111.first']]);
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

test('upsell page: dl_upsell_purchase with reset user_properties is filled from the page dl_user_data', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true', NextDataLayer: [
    { event: 'dl_user_data', user_properties: { customer_email: 'jane@example.com', customer_phone: '+16505550194',
      customer_first_name: 'Jane', customer_country: 'US' } },
  ] } });
  r.adapter.send('Purchase', {}, { event: 'dl_upsell_purchase', user_properties: { visitor_type: 'guest' } });
  assert.deepEqual(r.fbq[0][2], { em: 'jane@example.com', ph: '16505550194', fn: 'jane', country: 'us', external_id: 'vid-123' });
});

test('event user_properties win over the page dl_user_data', () => {
  const r = load({ win: { __metaAdvancedMatching: 'true', NextDataLayer: [
    { event: 'dl_user_data', user_properties: { customer_email: 'old@example.com', customer_country: 'CA' } },
  ] } });
  r.adapter.send('Purchase', {}, { event: 'dl_purchase', user_properties: { customer_email: 'new@example.com', customer_country: 'US' } });
  assert.equal(r.fbq[0][2].em, 'new@example.com');
  assert.equal(r.fbq[0][2].country, 'us');
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
