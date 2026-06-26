// Fast-checkout reveal — show only bundles + "Add to Cart" first; reveal the
// rest of the form (shipping/payment/summary/submit) on click. Opt-in via the
// .checkout-form--fast modifier (set by the fast_checkout frontmatter flag).
(function initFastCheckout() {
  // Make the off-screen (but rendered, for Spreedly) content non-interactive
  // until revealed — keeps it out of tab order and the a11y tree.
  document.querySelectorAll('.checkout-form--fast:not(.is-revealed) [data-fast-checkout-reveal]').forEach((reveal) => {
    reveal.setAttribute('inert', '');
  });
  document.querySelectorAll('[data-fast-checkout-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = btn.closest('.checkout-form--fast');
      if (!form) return;
      form.classList.add('is-revealed');
      const reveal = form.querySelector('[data-fast-checkout-reveal]');
      if (reveal) {
        reveal.removeAttribute('inert');
        reveal.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// Reviews slider — horizontal Swiper of review cards with a progress scrollbar.
// One instance per [data-component="reviews-swiper"]. observer/resizeObserver
// recalc dimensions when a responsive instance (hide-tablet-*) becomes visible.
(function initReviewsSliders() {
  if (typeof Swiper === 'undefined') return;
  document.querySelectorAll('[data-component="reviews-swiper"]').forEach((el) => {
    new Swiper(el, {
      slidesPerView: 'auto',
      spaceBetween: 16,
      grabCursor: true,
      observer: true,
      observeParents: true,
      resizeObserver: true,
      scrollbar: { el: el.querySelector('.swiper-scrollbar'), draggable: true },
    });
  });
})();

window.addEventListener('next:initialized', function() {
  initFomo();

  // Image-only exit intent — replace with your own image URL
  // Coupon must exist on the campaign (Campaigns app → discount code offer, e.g. EXIT10)
  initExitIntentImage('https://placehold.co/600x400', async () => {
    await next.applyCoupon('EXIT10');
  });
});
