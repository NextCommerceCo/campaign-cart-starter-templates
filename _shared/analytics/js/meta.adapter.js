/**
 * meta.adapter.js — Meta Pixel extras for next-forwarder-core.js (Route C helper, no GTM).
 *
 * Sends NO events of its own and loads nothing from Meta: the SDK's facebook provider
 * (analytics.providers.facebook in config.js) sends every Meta event, and the base pixel in
 * analytics-head.html loads fbevents.js. This file only works through that pixel. One job: advanced
 * matching, opt-in via meta_advanced_matching_enabled: "true".
 *
 * Load order (gated on campaign.fb_pixel_id, on EVERY page incl. receipt/upsell):
 *   1. Meta base pixel (analytics-head.html) — defines window.fbq, bare fbq('init', id),
 *      sets window.__metaPixelId and window.__metaAdvancedMatching
 *   2. next-forwarder-core.js
 *   3. this file
 *
 * Delete when the SDK's Meta destination sends customer data itself. Remove it in that same release: the
 * first fbq('init') with data wins on a page, so the adapter and the SDK would fight over it. (The _fbp /
 * _fbc cookie re-sync and the fb_external_id metadata this file used to write are gone: SDK 0.5.1 puts the
 * cookies on the order itself, campaign-cart#132.)
 *
 * Advanced matching:
 *   The SDK's Meta destination passes no customer data, and the base code is a bare fbq('init', id).
 *   This re-inits the pixel WITH customer data so the SDK's next fbq('track') carries it.
 *   Collect on entry, init at the first Meta event with em/ph:
 *   - Checkout field entry (onContact: prospect cart + valid email/phone) only COLLECTS em, ph, fn, ln.
 *     It never inits, so a phone typed after the email is not lost.
 *   - dl_begin_checkout / dl_add_payment_info / dl_purchase: send() merges the event's user_properties, then
 *     the form at that moment (em, ph, fn, ln, ct, st, zp, country), each later source winning, then inits
 *     once if an email or phone is known, otherwise holds. The form wins on checkout: before the purchase the
 *     SDK's user_properties carry only the email and country typed so far. On dl_purchase they carry the
 *     order's customer and billing address, and receipt / upsell pages have no form. send() runs inside
 *     NextDataLayerTransformFn, i.e. BEFORE the SDK notifies its destinations, so the init lands before the
 *     SDK's fbq('track') for the same event. Phone is optional: the init never waits for one.
 *     dl_upsell_purchase is not mapped: the SDK sends Meta one Purchase per order and none for an upsell.
 *     dl_add_shipping_info is deliberately not mapped: an init there would lose the fields typed after it.
 *   - Values follow Meta's format before the init (see normalize()): lowercase; names without punctuation;
 *     city without punctuation or spaces; zip without spaces or dash, US zips cut to 5 digits.
 *   - ph is digits including the country code: the SDK's E.164 (input data-next-phone-e164, SDK >= 0.4.41)
 *     at checkout (or the forwarder core's E.164 on field entry), user_properties.customer_phone at purchase, only
 *     when it is a valid E.164. No dial code is ever guessed. Known gap: on a
 *     return visit the SDK refills the phone (and data-next-phone-e164) after dl_begin_checkout, so that
 *     InitiateCheckout goes without ph.
 *   - No external_id: on SDK 0.5.1 the localStorage visitor_id key holds the campaign session id, which
 *     resets after an hour idle, so it would split one shopper into several Meta users.
 *
 *   FIRST INIT WINS (fbevents 2.9.x): the pixel keeps the user data from the first fbq('init', id, data)
 *   on a page and ignores later re-inits. So the adapter inits ONCE per page; anything learned after that
 *   on the same page is not sent.
 *
 *   Consent: NOT gated on the accepts_marketing checkbox (unlike TikTok/Snap/Pinterest advanced matching).
 *   That box is the newsletter opt-in. Meta's Business Tools Terms tie customer data to the pixel's own
 *   notice / lawful basis / cookie consent, not to marketing opt-in: if the pixel may fire, so may this,
 *   and a cookie banner or fbq('consent', 'revoke') gates both. Turning the flag on still means the
 *   campaign has handled the region's rules for sending customer data to Meta.
 *
 * Debug: ?nfdebug=true or localhost, then window.NextForwarder.getStatus(). QA with Meta Pixel Helper
 * (Advanced Matching parameters show on events after the init). When checking ud[...] by hand, capture
 * POST bodies as well as GET query strings: the pixel sends some events as hidden form POSTs.
 */
(function () {
  'use strict';

  // ---- Advanced matching ----------------------------------------------------------------------------
  if (!window.NextForwarder) {
    if (window.console) console.warn('[meta.adapter] next-forwarder-core.js must load first');
    return;
  }
  if (!/^(true|1|yes)$/i.test(window.__metaAdvancedMatching || '')) return;

  var DEBUG =
    /[?&]nfdebug=true/.test(window.location.search) ||
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

  var EMAIL_RE = window.NextForwarder.EMAIL_RE || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // User data collected so far on this page, and whether the one effective init has happened.
  var pending = {};
  var initialised = false;

  function clean(v) { return (v === undefined || v === null) ? '' : String(v).trim().toLowerCase(); }

  // SDK user_properties -> Meta advanced matching keys. The pixel hashes the values itself; here they
  // are only trimmed and lowercased here; normalize() applies Meta's format rules before the init.
  function fromUserProperties(up) {
    up = up || {};
    var d = {};
    var email = clean(up.customer_email);
    if (email && EMAIL_RE.test(email)) d.em = email;
    var phone = digitsE164(up.customer_phone); // digits incl. country code
    if (phone) d.ph = phone;
    if (clean(up.customer_first_name)) d.fn = clean(up.customer_first_name);
    if (clean(up.customer_last_name)) d.ln = clean(up.customer_last_name);
    if (clean(up.customer_city)) d.ct = clean(up.customer_city).replace(/\s+/g, '');
    if (clean(up.customer_province_code)) d.st = clean(up.customer_province_code);
    if (clean(up.customer_zip)) d.zp = clean(up.customer_zip).replace(/\s+/g, '');
    if (clean(up.customer_country)) d.country = clean(up.customer_country);
    return d;
  }

  // E.164 ("+" then 7-15 digits, the forwarder core's / SDK's minimum) -> digits without "+". '' for anything
  // else: no dial code is guessed.
  function digitsE164(v) {
    var s = (v === undefined || v === null) ? '' : String(v).replace(/[\s().-]/g, '');
    return /^\+\d{7,15}$/.test(s) ? s.slice(1) : '';
  }

  // Checkout form value by SDK field name ('' when absent).
  function field(name) {
    var el = document.querySelector('[data-next-checkout-field="' + name + '"]');
    return el ? clean(el.value) : '';
  }

  // Phone as digits incl. country code, only from the SDK's E.164 (data-next-phone-e164). '' otherwise.
  function formPhone() {
    var el = document.querySelector('[data-next-checkout-field="phone"][data-next-phone-e164]');
    return el ? digitsE164(el.getAttribute('data-next-phone-e164')) : '';
  }

  // The checkout form as it is now (absent on receipt / upsell pages): em, ph, fn, ln and the shipping
  // address, cleaned like fromUserProperties().
  function fromForm() {
    var d = {};
    var email = field('email');
    if (email && EMAIL_RE.test(email)) d.em = email;
    var ph = formPhone();
    if (ph) d.ph = ph;
    if (field('fname')) d.fn = field('fname');
    if (field('lname')) d.ln = field('lname');
    if (field('city')) d.ct = field('city').replace(/\s+/g, '');
    if (field('province')) d.st = field('province');
    if (field('postal')) d.zp = field('postal').replace(/\s+/g, '');
    if (field('country')) d.country = field('country');
    return d;
  }

  // Meta's customer-data format (pixel advanced matching + Conversions API customer information
  // parameters): names lowercase with no punctuation; city lowercase with no punctuation and no spaces;
  // zip lowercase with no spaces or dash, US zips cut to their first 5 digits.
  var PUNCT = /[!-\/:-@\[-`{-~\u2018\u2019\u201c\u201d]/g; // ASCII punctuation + curly quotes
  function normalize(d) {
    if (d.fn) d.fn = d.fn.replace(PUNCT, '').trim();
    if (d.ln) d.ln = d.ln.replace(PUNCT, '').trim();
    if (d.ct) d.ct = d.ct.replace(PUNCT, '').replace(/\s+/g, '');
    if (d.zp) {
      var us = d.country === 'us' || /^\d{5}-\d{4}$/.test(d.zp);
      d.zp = d.zp.replace(/[\s-]/g, '');
      if (us && /^\d{9}$/.test(d.zp)) d.zp = d.zp.slice(0, 5);
    }
    for (var k in d) if (!d[k]) delete d[k];
    return d;
  }

  function collect(d) {
    for (var k in d) if (d[k]) pending[k] = d[k];
  }

  // Init once — and only once there is an email or phone (see FIRST INIT WINS).
  function apply(source) {
    if (initialised) {
      if (DEBUG && window.console) console.log('[meta.adapter] skip (already initialised)', source);
      return;
    }
    if (!pending.em && !pending.ph) {
      if (DEBUG && window.console) console.log('[meta.adapter] hold (no em/ph yet)', source, Object.keys(pending));
      return;
    }
    var copy = {};
    for (var c in pending) copy[c] = pending[c];
    normalize(copy);
    window.fbq('init', window.__metaPixelId, copy);
    initialised = true;
    if (DEBUG && window.console) console.log('[meta.adapter] init', source, Object.keys(copy));
  }

  window.NextForwarder.register({
    name: 'meta',
    isActive: function () {
      return !!window.__metaPixelId && typeof window.fbq === 'function';
    },
    // Names are labels only: send() never fires a Meta event, the SDK's facebook provider does.
    map: {
      dl_begin_checkout:   'InitiateCheckout',
      dl_add_payment_info: 'AddPaymentInfo',
      dl_purchase:         'Purchase'
    },
    allowedEvents: ['dl_begin_checkout', 'dl_add_payment_info', 'dl_purchase'],
    send: function (name, ec, evt) {
      // Lower to higher: the event's user_properties, the form (see Advanced matching in the header).
      collect(fromUserProperties(evt && evt.user_properties));
      collect(fromForm());
      apply(name);
    },
    // Collect only — the init waits for the next Meta event (see Advanced matching in the header).
    onContact: function (c) {
      var d = {};
      var email = clean(c.email);
      if (email && EMAIL_RE.test(email)) d.em = email;
      // The core's phone is already E.164-or-nothing (SDK attribute, intl-tel-input or a typed "+").
      var ph = digitsE164(c.phone) || formPhone();
      if (ph) d.ph = ph;
      if (field('fname')) d.fn = field('fname');
      if (field('lname')) d.ln = field('lname');
      collect(d);
      if (DEBUG && window.console) console.log('[meta.adapter] collect', 'contact:' + c.source, Object.keys(pending));
    },
    contactRequiresMarketingConsent: false, // see Consent in the header
    contactOnFieldEntry: true
  });
})();
