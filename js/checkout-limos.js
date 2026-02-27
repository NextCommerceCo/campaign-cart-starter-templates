// JavaScript extracted from templates/checkout/limos.html

window.addEventListener('next:initialized', function() {
  initFomo();
  initExitIntent('https://placehold.co/600x400', async () => {
    const result = await next.applyCoupon('DEMO10');
    if (result.success) {
      // alert('Coupon applied successfully: ' + result.message);
    } else {
      // alert('Coupon failed: ' + result.message);
    }
  });
});
