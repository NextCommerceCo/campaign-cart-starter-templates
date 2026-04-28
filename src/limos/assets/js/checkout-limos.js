// JavaScript extracted from templates/checkout/limos.html

window.addEventListener('next:initialized', function() {
  initFomo();

  // Template approach — uses exit-intent-popup.html partial in _includes/
  initExitIntentTemplate('exit-intent');

  // Image-only alternative — swap in your own image URL and uncomment to use instead
  // initExitIntentImage('https://placehold.co/600x400', async () => {
  //   await next.applyCoupon('SAVE10');
  // });
});
