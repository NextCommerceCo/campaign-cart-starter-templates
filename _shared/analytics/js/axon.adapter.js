/**
 * axon.adapter.js — AppLovin Axon adapter for next-forwarder-core.js (Route C, no GTM).
 *
 * Maps the SDK's dl_* stream to Axon's standard events and sends them with axon('track', …).
 * Generic plumbing (hook, consent ordering, dedup, replay, _willRedirect, page_view, event toggles)
 * lives in next-forwarder-core.js — this file is pure Axon mapping.
 *
 * Load order (all gated on campaign.axon_event_key, on EVERY page incl. receipt/upsell):
 *   1. Axon base code (analytics-head.snippet.html) — defines window.axon + sets window.__axonEventKey
 *   2. next-forwarder-core.js
 *   3. this file
 *
 * Axon specifics that differ from GA4:
 *   - FIXED standard-event list — no custom events. So upsells map to `purchase` (Approach B): each
 *     accepted upsell fires another purchase with a distinct `{orderId}-US{n}` transaction_id. Value
 *     is accurate; purchase COUNT inflates (N upsells = N+1) — brief the media buyer before reading AOV.
 *   - `purchase` REQUIRES currency, items, value, tax, shipping, transaction_id (SDK provides all;
 *     upsells carry tax:0/shipping:0).
 *   - Identifier is an EVENT KEY, not a pixel id.
 *   - item_category_id is an INTEGER Google product-taxonomy id. The SDK's item_category is the campaign
 *     NAME (text), which Axon rejects with HTTP 400 for the whole event — so it is sent only when it is a
 *     positive integer, else the per-campaign window.__axonItemCategoryId (campaigns.json
 *     axon_item_category_id), else left out.
 *   - image_url must end in .png/.jpg/.jpeg; the SDK's .webp package thumbnails are dropped.
 *   - payment_type is an enum (credit_card / redeemable / deferred / payment_on_delivery / wallet / other);
 *     the SDK's labels ("Credit Card", "Apple Pay", …) are mapped onto it.
 * Enhanced matching: `user_data` is sent on purchase + the checkout events (USER_DATA_EVENTS) from the SDK's
 * user_properties (customer_email / customer_phone / customer_id). Axon requires user_data.email on
 * purchase. Axon's pixel.js hashes email/phone in the browser, so they are passed plaintext: email trimmed
 * and lowercased, phone as E.164 digits without '+', user_id only when >= 6 chars. ON by default; turn off
 * with window.__axonSendUserData = false (campaigns.json axon_send_user_data: "false").
 *
 * Debug: ?nfdebug=true or localhost, then window.NextForwarder.getStatus().
 */
(function () {
  'use strict';

  if (!window.NextForwarder) {
    if (window.console) console.warn('[axon.adapter] next-forwarder-core.js must load first');
    return;
  }

  // dl_* event -> Axon standard event name. Axon events are GA4-shaped.
  // Intentionally NOT mapped (no Axon equivalent): dl_view_item_list, dl_select_item, dl_add_shipping_info.
  var MAP = {
    dl_user_data:            'page_view',       // SDK's real pageview signal (see core); sent bare
    dl_view_item:            'view_item',
    dl_add_to_cart:          'add_to_cart',
    dl_remove_from_cart:     'remove_from_cart',
    dl_view_cart:            'view_cart',
    dl_begin_checkout:       'begin_checkout',
    dl_add_payment_info:     'add_payment_info',
    dl_view_search_results:  'search',          // Axon uses `search` with `search_term`
    dl_subscribe:            'subscribe',
    dl_purchase:             'purchase',
    dl_upsell_purchase:      'purchase',         // Approach B — Axon has no custom events (see header)
    dl_login:                'login',
    dl_sign_up:              'sign_up'
  };

  // Event-level params Axon accepts per event (beyond currency/value/items). purchase requires
  // tax+shipping; the SDK always provides them (0 on upsells), so they're always present.
  var EXTRA = {
    purchase:         ['transaction_id', 'tax', 'shipping'],
    add_payment_info: ['payment_type'],
    search:           ['search_term']
  };

  // Events that carry user_data when the shopper is known. page_view and browse events stay anonymous.
  var USER_DATA_EVENTS = { purchase: 1, begin_checkout: 1, add_payment_info: 1 };

  function userData(evt) {
    if (window.__axonSendUserData === false || window.__axonSendUserData === 'false') return undefined;
    var up = (evt && evt.user_properties) || {};
    var out = {};
    var email = typeof up.customer_email === 'string' ? up.customer_email.trim().toLowerCase() : '';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) out.email = email;
    var phone = typeof up.customer_phone === 'string' ? up.customer_phone.replace(/[\s().-]/g, '') : '';
    if (/^\+[1-9]\d{7,14}$/.test(phone)) out.phone = phone.slice(1);
    var id = up.customer_id !== undefined && up.customer_id !== null ? String(up.customer_id) : '';
    if (id.length >= 6) out.user_id = id;
    return out.email || out.phone ? out : undefined;
  }

  // item_category_id: a positive integer (Google product taxonomy) or nothing.
  function categoryId(raw) {
    var s = raw === undefined || raw === null ? '' : String(raw).trim();
    return /^\d+$/.test(s) && Number(s) > 0 ? Number(s) : undefined;
  }
  var fallbackCategoryId = categoryId(window.__axonItemCategoryId);

  var IMAGE_RE = /^https?:\/\/[^\s?#]+\.(png|jpe?g)(?:[?#].*)?$/i;

  // Axon payment_type enum; the SDK sends display labels (paymentMethodLabel). Unknown labels → 'other'.
  var PAYMENT_TYPES = { credit_card: 1, redeemable: 1, deferred: 1, payment_on_delivery: 1, wallet: 1, other: 1 };
  var PAYMENT_TYPE_BY_KEY = {
    creditcard: 'credit_card', card: 'credit_card', cardtoken: 'credit_card', savedcard: 'credit_card', debitcard: 'credit_card',
    applepay: 'wallet', googlepay: 'wallet', paypal: 'wallet', shoppay: 'wallet', link: 'wallet', swish: 'wallet', twint: 'wallet',
    venmo: 'wallet', amazonpay: 'wallet', cashapp: 'wallet',
    klarna: 'deferred', affirm: 'deferred', afterpay: 'deferred', clearpay: 'deferred', sezzle: 'deferred', zip: 'deferred',
    giftcard: 'redeemable', voucher: 'redeemable', storecredit: 'redeemable',
    cashondelivery: 'payment_on_delivery', cod: 'payment_on_delivery'
  };
  function paymentType(raw) {
    var s = String(raw).trim();
    if (PAYMENT_TYPES[s]) return s;
    return PAYMENT_TYPE_BY_KEY[s.toLowerCase().replace(/[^a-z]/g, '')] || 'other';
  }

  // Map an SDK EcommerceItem to Axon's item object (mostly GA4-shaped; a couple of renames).
  function mapItems(items) {
    return (items || []).map(function (it) {
      var out = {};
      if (it.item_id !== undefined && it.item_id !== null && it.item_id !== '') out.item_id = it.item_id;
      if (it.item_name) out.item_name = it.item_name;
      if (it.price !== undefined && it.price !== null) out.price = it.price;
      if (it.quantity !== undefined && it.quantity !== null) out.quantity = it.quantity;
      if (it.item_brand) out.item_brand = it.item_brand;
      if (it.item_variant_id) out.item_variant_id = it.item_variant_id;
      var cat = categoryId(it.item_category) || fallbackCategoryId;
      if (cat) out.item_category_id = cat;                            // Axon: integer item_category_id
      if (typeof it.item_image === 'string' && IMAGE_RE.test(it.item_image)) out.image_url = it.item_image;
      if (it.discount !== undefined && it.discount !== null && it.discount !== '') out.discount = it.discount;
      return out;
    });
  }

  function copy(from, to, keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (from[k] !== undefined && from[k] !== null && from[k] !== '') to[k] = from[k];
    }
  }

  // Per-campaign event toggles (comma-separated dl_* or Axon names from campaigns.json).
  function parseList(raw) {
    return (raw || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  var blocked = parseList(window.__axonBlockedEvents);
  var allowedRaw = parseList(window.__axonAllowedEvents);
  // allowlist: "" / absent → default main events; "all"/"*" → every mapped event; else the given subset.
  var allowed = (allowedRaw.length === 1 && (allowedRaw[0] === 'all' || allowedRaw[0] === '*'))
    ? null
    : (allowedRaw.length ? allowedRaw : window.NextForwarder.DEFAULT_MAIN_EVENTS);

  window.NextForwarder.register({
    name: 'axon',
    isActive: function () {
      return !!window.__axonEventKey && typeof window.axon === 'function';
    },
    map: MAP,
    allowedEvents: allowed,
    blockedEvents: blocked,
    send: function (name, ec, evt) {
      // page_view is not an ecommerce event — send it bare.
      if (name === 'page_view') { window.axon('track', 'page_view'); return; }

      var params = {};
      if (ec.currency) params.currency = ec.currency;
      if (ec.value !== undefined && ec.value !== null) params.value = ec.value;

      var items = mapItems(ec.items);
      if (items.length) params.items = items;

      // search_term lives on the envelope for dl_view_search_results
      if (name === 'search' && evt.search_term) params.search_term = evt.search_term;

      copy(ec, params, EXTRA[name] || []);
      if (params.payment_type !== undefined) params.payment_type = paymentType(params.payment_type);
      if (USER_DATA_EVENTS[name]) {
        var user = userData(evt);
        if (user) params.user_data = user;
      }
      window.axon('track', name, params);
    }
  });
})();
