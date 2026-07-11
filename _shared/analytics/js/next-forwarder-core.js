/**
 * next-forwarder-core.js — shared plumbing for Route C (code-controlled) analytics forwarders.
 *
 * Registers the SDK's NextDataLayerTransformFn hook ONCE and fans every surviving event out to any
 * number of vendor adapters (GA4, TikTok, Snap, …). Owns the generic concerns so each adapter is
 * pure mapping:
 *   - consent ordering — runs the prior transformFn chain FIRST, forwards only what survives
 *   - redirect handling — skips events flagged _willRedirect (they fire pre-redirect AND replay
 *     post-redirect through the transformFn; forwarding only the replay prevents a cross-page
 *     double-fire and matches the SDK's own providers, which fire only after the redirect)
 *   - dedup — per-adapter, keyed on event_id (guards same-page-load duplicates)
 *   - replay — re-plays events already queued in NextDataLayer when an adapter registers late
 *   - event toggles — per-adapter allowedEvents (allowlist) + blockedEvents (denylist), both
 *     client-configurable per campaign and matched against the dl_* source name (precise) or the
 *     mapped vendor name (coarser). Allow-list is applied first, then block-list removes from it.
 *     Adapters that omit allowedEvents default to NextForwarder.DEFAULT_MAIN_EVENTS (main funnel +
 *     conversion; obscure events like login/sign_up off).
 *   - data quality — warns once/event when a value is sent without a currency (vendors drop it)
 *   - contact/identity — optional onContact hook: fires when the SDK creates a prospect cart
 *     (next:prospect-cart-created), for identity adapters (e.g. Triple Whale). Consent-gated, once
 *     per session. Only active if an adapter opts in — non-identity adapters never touch PII.
 *   - debug — one switch (?nfdebug=true or localhost) + NextForwarder.getStatus()
 *
 * Load this BEFORE any adapter. Adapters call NextForwarder.register(adapter).
 *
 * Adapter contract:
 *   {
 *     name: 'ga4',
 *     isActive: function () -> boolean,          // is this vendor loaded/configured on the page?
 *     map: { dl_add_to_cart: 'add_to_cart', … }, // dl_* event -> vendor event name
 *     send: function (vendorName, ecommerce, event) -> void, // do the vendor call
 *     allowedEvents: ['dl_purchase', 'dl_add_to_cart'], // optional: ONLY these fire. Omitted/[] ->
 *                                                       //   DEFAULT_MAIN_EVENTS; explicit null -> all
 *     blockedEvents: ['dl_login', 'dl_sign_up'],        // optional: suppress these (applied after allow)
 *     onContact: function ({email?, phone?, acceptsMarketing?, source}) {}  // optional identity hook
 *   }
 */
(function () {
  'use strict';

  if (window.NextForwarder) return; // already loaded

  var MAX_SEEN = 500;
  var adapters = [];
  var hookInstalled = false;
  var userTransform = null; // a consent/redaction transform installed before or after us (runs first)

  // Default allowlist for adapters that don't specify one: the main funnel + conversion events.
  // Obscure events (login, sign_up, subscribe, search, view_cart, remove_from_cart, item lists) are
  // OFF by default — enable per campaign via <vendor>_allowed_events. Keyed by dl_* source name.
  var DEFAULT_MAIN_EVENTS = [
    'dl_user_data',        // page_view
    'dl_view_item', 'dl_add_to_cart', 'dl_begin_checkout',
    'dl_add_shipping_info', 'dl_add_payment_info',
    'dl_purchase', 'dl_upsell_purchase'
  ];

  var DEBUG =
    /[?&]nfdebug=true/.test(window.location.search) ||
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  function log() {
    if (DEBUG && window.console) console.log.apply(console, ['[NextForwarder]'].concat([].slice.call(arguments)));
  }

  // Data-quality checks that are true for every value-based vendor, warned once per event_id.
  var warned = {};
  function preprocess(evt) {
    if (!evt || !evt.event || !evt.event_id || warned[evt.event_id]) return;
    var ec = evt.ecommerce;
    if (ec && ec.value !== undefined && ec.value !== null && !ec.currency) {
      warned[evt.event_id] = true;
      if (window.console && window.console.warn) {
        console.warn('[NextForwarder] "' + evt.event + '" has a value but no currency — GA4 and ' +
          'other vendors drop the monetary value without an ISO-4217 currency. event_id=' + evt.event_id);
      }
    }
  }

  // ---- contact / identity bridge (opt-in via adapter.onContact) -----------------------
  // For adapters that resolve identity (e.g. Triple Whale). Fires when the SDK creates a PROSPECT CART
  // (ProspectCartEnhancer: valid email/phone + first/last name + items in cart) via its
  // `next:prospect-cart-created` DOM event — emitted ONCE per session. We reuse the SDK's field
  // detection, validation, debounce, name/cart checks, and accepts_marketing consent rather than
  // re-scraping fields ourselves. Only active if an adapter opts in with onContact, so non-identity
  // adapters (GA4/Axon/Taboola) never touch PII.
  //
  // Trade-off (see adapter READMEs): fires once with whatever's valid then — in the default emailEntry
  // mode that's usually email (+name), not a separate phone beacon (the vendor still gets phone via the
  // prospect PATCH / order + its session cookie). No Contact if the prospect enhancer is disabled. The
  // alternate "capture on every field entry" path is documented if a merchant needs pre-name capture.
  var contactAdapters = [];
  var prospectHooked = false;
  var contactFired = false;

  function fieldVal(sel) { var el = document.querySelector(sel); return (el && el.value) ? el.value.trim() : ''; }

  // Phone must match the SDK's normalization (E.164 via intl-tel-input) or Triple Whale-style identity
  // joins against the order/feed silently fail. Prefer the intl-tel-input instance's getNumber(); fall
  // back to the raw input only if it isn't available. Mirrors ProspectCartEnhancer.getFormattedPhoneNumber.
  function phoneVal() {
    var el = document.querySelector('[data-next-checkout-field="phone"], [os-checkout-field="phone"], input[type="tel"]');
    if (!el) return '';
    var iti = el.iti || (window.intlTelInput && window.intlTelInput.getInstance && window.intlTelInput.getInstance(el));
    if (iti && typeof iti.getNumber === 'function') {
      try { var e164 = iti.getNumber(); if (e164) return e164; } catch (err) {}
    }
    return el.value ? el.value.trim() : '';
  }

  function onProspectCartCreated(e) {
    if (contactFired) return; // SDK emits once/session; in-memory guard against a stray re-fire
    var d = (e && e.detail) || {}, pc = d.prospectCart || {}, cart = d.cart || {};
    var email = pc.email || cart.email || fieldVal('[data-next-checkout-field="email"], [os-checkout-field="email"]');
    var phone = pc.phone || cart.phone || phoneVal(); // SDK-formatted E.164 preferred; raw only as last resort
    if (!email && !phone) return;
    var am = document.querySelector('[data-next-checkout-field="accepts_marketing"], [os-checkout-field="accepts_marketing"]');
    if (am && !am.checked) { log('contact blocked: accepts_marketing unchecked'); return; }
    contactFired = true;
    var contact = { email: email || undefined, phone: phone || undefined,
      acceptsMarketing: am ? !!am.checked : undefined, source: 'prospect' };
    for (var i = 0; i < contactAdapters.length; i++) {
      try { contactAdapters[i].onContact(contact); contactAdapters[i]._contacts++; log(contactAdapters[i].name, 'contact'); }
      catch (err) { log(contactAdapters[i].name, 'onContact error', err); }
    }
  }

  function installProspectHook() {
    if (prospectHooked || typeof document === 'undefined') return;
    prospectHooked = true;
    document.addEventListener('next:prospect-cart-created', onProspectCartCreated);
  }

  function processForAdapter(adapter, evt) {
    if (!evt || !evt.event) return;
    // Redirect-queued events (e.g. dl_purchase, dl_upsell_purchase) fire on the checkout page with
    // this flag, BEFORE the SDK queues them across the redirect. The transformFn runs at push()
    // time — before the SDK's willRedirect check — so we'd see the event here (pre-redirect) AND
    // again when it replays on the receipt page (flag stripped), double-firing across two page
    // loads that in-memory dedup can't span. Skip it now; forward the post-redirect replay instead.
    // This matches the SDK's own providers, which are notified only after the willRedirect return.
    // NB: skip BEFORE the dedup-add below, or page 1 would mark the id seen and suppress page 2.
    if (evt._willRedirect) return;
    try {
      if (!adapter.isActive()) return;
      var name = adapter.map[evt.event];
      if (!name) return; // this adapter doesn't map this event

      // Per-adapter allowlist: if set, ONLY listed events fire (source dl_* name or vendor name).
      if (adapter._allowed && !(adapter._allowed[evt.event] || adapter._allowed[name])) {
        log(adapter.name, 'not in allowlist', evt.event); return;
      }
      // Then the denylist removes from whatever survived the allowlist.
      if (adapter._blocked && (adapter._blocked[evt.event] || adapter._blocked[name])) {
        log(adapter.name, 'blocked', evt.event); return;
      }

      var id = evt.event_id;
      if (id) {
        if (adapter._seenSet[id]) { log(adapter.name, 'dup dropped', evt.event, id); return; }
        adapter._seenSet[id] = true;
        adapter._seen.push(id);
        if (adapter._seen.length > MAX_SEEN) delete adapter._seenSet[adapter._seen.shift()];
      }

      adapter.send(name, evt.ecommerce || {}, evt);
      adapter._count++;
      log(adapter.name, 'sent', name);
    } catch (e) {
      log(adapter.name, 'error', e); // never break the data layer
    }
  }

  // The forwarding transform: run any user/consent transform FIRST, forward survivors to adapters,
  // and return the (possibly transformed) event so NextDataLayer stays consistent.
  function forwarderTransform(evt) {
    var kept = userTransform ? userTransform(evt) : evt;
    if (kept) {
      preprocess(kept);
      for (var i = 0; i < adapters.length; i++) processForAdapter(adapters[i], kept);
    }
    return kept; // MUST return so NextDataLayer stays consistent
  }

  // Re-forward everything already queued in NextDataLayer (idempotent: per-adapter event_id dedup).
  // Only needed on the fallback path below; the accessor keeps the hook live so the common path
  // never loses an event.
  function replayQueued() {
    (window.NextDataLayer || []).forEach(function (evt) {
      preprocess(evt);
      for (var i = 0; i < adapters.length; i++) processForAdapter(adapters[i], evt);
    });
  }

  function installHook() {
    if (hookInstalled) return;
    hookInstalled = true;

    // Capture a transform installed before us (consent/redaction) — it keeps running first.
    var existing = window.NextDataLayerTransformFn;
    if (typeof existing === 'function' && existing !== forwarderTransform) userTransform = existing;

    // ⚠️ The SDK's NextAnalytics constructor does `window.NextDataLayerTransformFn = null` at init
    // (campaign-cart src/utils/analytics/index.ts, v0.4.30+). This file loads in <head> BEFORE the
    // SDK module executes, so a PLAIN ASSIGNMENT here is always wiped and no event reaches the
    // adapters (Route C forwards zero events, deterministically). Define the global as an ACCESSOR
    // instead: reads always return the forwarding wrapper (so DataLayerManager.push always invokes
    // us), and writes land in the user-transform slot — so the SDK's null reset, a config.transformFn,
    // setTransformFunction(), and any later consent script keep their documented behaviour; they just
    // can't evict forwarding. Writing null / a non-function clears only the user chain (mirrors what
    // the SDK's reset intends). configurable:true = deliberate escape hatch for a future redefine.
    try {
      Object.defineProperty(window, 'NextDataLayerTransformFn', {
        configurable: true,
        get: function () { return forwarderTransform; },
        set: function (fn) {
          userTransform = (typeof fn === 'function' && fn !== forwarderTransform) ? fn : null;
        }
      });
    } catch (e) {
      // Fallback if the property is somehow non-definable: assign now, then re-assert after SDK init
      // and replay anything pushed in the gap. next:initialized is the SDK's documented init event.
      window.NextDataLayerTransformFn = forwarderTransform;
      document.addEventListener('next:initialized', function () {
        var cur = window.NextDataLayerTransformFn;
        if (cur !== forwarderTransform) {
          if (typeof cur === 'function') userTransform = cur;
          window.NextDataLayerTransformFn = forwarderTransform;
          replayQueued();
        }
      });
    }
  }

  window.NextForwarder = {
    DEFAULT_MAIN_EVENTS: DEFAULT_MAIN_EVENTS,
    register: function (adapter) {
      if (!adapter || !adapter.name || typeof adapter.send !== 'function' ||
          typeof adapter.isActive !== 'function' || !adapter.map) {
        log('ignored invalid adapter', adapter && adapter.name);
        return this;
      }
      adapter._seen = [];
      adapter._seenSet = {};
      adapter._count = 0;
      adapter._contacts = 0;
      if (typeof adapter.onContact === 'function') { contactAdapters.push(adapter); installProspectHook(); }
      // Quiet by default, enforced HERE: an adapter that OMITS allowedEvents (or passes an empty
      // list) gets DEFAULT_MAIN_EVENTS — the core owns the documented default instead of trusting
      // every adapter to re-implement the fallback. Pass null explicitly to forward every mapped
      // event. (The shipped adapters parse <vendor>_allowed_events themselves and always set this
      // property, so their behavior is unchanged.)
      var allowedList = adapter.allowedEvents;
      if (allowedList === undefined || (allowedList && !allowedList.length)) allowedList = DEFAULT_MAIN_EVENTS;
      adapter._allowed = null;
      if (allowedList && allowedList.length) {
        adapter._allowed = {};
        for (var a2 = 0; a2 < allowedList.length; a2++) adapter._allowed[allowedList[a2]] = true;
      }
      adapter._blocked = null;
      if (adapter.blockedEvents && adapter.blockedEvents.length) {
        adapter._blocked = {};
        for (var b = 0; b < adapter.blockedEvents.length; b++) adapter._blocked[adapter.blockedEvents[b]] = true;
      }
      adapters.push(adapter);
      installHook();
      // Replay events already queued before this adapter registered. NextDataLayer only holds
      // events that survived the consent chain, so replaying it is consent-safe. Per-adapter
      // dedup means a late-registering adapter still receives the full backlog.
      (window.NextDataLayer || []).forEach(function (evt) { preprocess(evt); processForAdapter(adapter, evt); });
      log('registered', adapter.name, '| replayed', (window.NextDataLayer || []).length, 'queued events');
      return this;
    },
    getStatus: function () {
      return adapters.map(function (a) {
        return {
          name: a.name, active: a.isActive(), sent: a._count, contacts: a._contacts,
          allowed: a._allowed ? Object.keys(a._allowed) : 'all', blocked: a.blockedEvents || []
        };
      });
    },
    setDebug: function (on) { DEBUG = !!on; }
  };
})();
