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
