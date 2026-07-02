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
 *     allowedEvents: ['dl_purchase', 'dl_add_to_cart'], // optional: if set, ONLY these fire (null = all)
 *     blockedEvents: ['dl_login', 'dl_sign_up']         // optional: suppress these (applied after allow)
 *   }
 */
(function () {
  'use strict';

  if (window.NextForwarder) return; // already loaded

  var MAX_SEEN = 500;
  var adapters = [];
  var hookInstalled = false;

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

  function installHook() {
    if (hookInstalled) return;
    hookInstalled = true;
    // Consent ordering: run the prior chain first, forward only survivors, and forward the
    // (possibly transformed) event so upstream redaction/enrichment reaches every vendor.
    var prev = window.NextDataLayerTransformFn;
    window.NextDataLayerTransformFn = function (evt) {
      var kept = prev ? prev(evt) : evt;
      if (kept) {
        preprocess(kept);
        for (var i = 0; i < adapters.length; i++) processForAdapter(adapters[i], kept);
      }
      return kept; // MUST return so NextDataLayer stays consistent
    };
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
      adapter._allowed = null;
      if (adapter.allowedEvents && adapter.allowedEvents.length) {
        adapter._allowed = {};
        for (var a2 = 0; a2 < adapter.allowedEvents.length; a2++) adapter._allowed[adapter.allowedEvents[a2]] = true;
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
          name: a.name, active: a.isActive(), sent: a._count,
          allowed: a.allowedEvents || 'all', blocked: a.blockedEvents || []
        };
      });
    },
    setDebug: function (on) { DEBUG = !!on; }
  };
})();
