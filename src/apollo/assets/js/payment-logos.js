// payment-logos.js — reveal only the payment methods the campaign offers (payment-logos.html).
// Shared by checkout and upsell pages: add `js/payment-logos.js` to the page scripts wherever the partial
// is included. Self-initialising: cache pass at DOMContentLoaded, live pass on next:initialized.

/**
 * Payment logos — reveal only the methods the campaign offers (upsell/payment-logos.html).
 * Two passes, same rule: each [data-payment-logo="<code>"] is shown when its code is in
 * available_payment_methods + available_express_payment_methods; data-payment-force="show|hide"
 * (frontmatter payment_flags.show_*) wins over the campaign.
 *   1. At DOMContentLoaded from the SDK's campaign cache in sessionStorage — written when the shopper hit
 *      the landing / checkout page first, so the upsell paints the right row with no network wait.
 *      Key: next-campaign-cache_<CURRENCY> (observed SDK 0.4.38; matched by prefix, never hardcoded whole —
 *      SDK keys can gain a __<scope> suffix), value { campaign, timestamp, apiKey }.
 *   2. On next:initialized from next.getCampaignData() — the live truth, in case the cache was stale or absent.
 * If neither is available the row keeps its server-rendered state (cards + forced logos).
 */
function readCachedCampaign() {
  try {
    var apiKey = window.nextConfig && window.nextConfig.apiKey;
    var best = null;
    for (var i = 0; i < sessionStorage.length; i++) {
      var key = sessionStorage.key(i);
      if (!/^next-campaign-cache(_|__|$)/.test(key)) continue;
      var parsed = JSON.parse(sessionStorage.getItem(key) || 'null');
      var campaign = parsed && parsed.campaign;
      if (!campaign || !campaign.available_payment_methods) continue;
      if (apiKey && parsed.apiKey && parsed.apiKey !== apiKey) continue;
      if (!best || (parsed.timestamp || 0) > (best.timestamp || 0)) best = parsed;
    }
    return best && best.campaign;
  } catch (e) { return null; }
}

function initPaymentLogos(source) {
  var rows = document.querySelectorAll('[data-payment-logos]');
  if (!rows.length) return;
  var data = null;
  if (source === 'live') {
    if (window.next && typeof window.next.getCampaignData === 'function') data = window.next.getCampaignData();
  } else {
    data = readCachedCampaign();
  }
  if (!data) return;
  var offered = {};
  [].concat(data.available_payment_methods || [], data.available_express_payment_methods || []).forEach(function(m) {
    var code = typeof m === 'string' ? m : (m && m.code);
    if (code) offered[code] = true;
  });
  rows.forEach(function(row) {
    row.querySelectorAll('[data-payment-logo]').forEach(function(img) {
      var force = img.getAttribute('data-payment-force');
      var show = force === 'show' ? true : force === 'hide' ? false : !!offered[img.getAttribute('data-payment-logo')];
      img.hidden = !show;
    });
    row.dataset.paymentLogosReady = source === 'live' ? 'live' : 'cache';
  });
}

(function () {
  function onReady() { initPaymentLogos('cache'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady); else onReady();
  window.addEventListener('next:initialized', function () { initPaymentLogos('live'); });
})();
