window.addEventListener('next:initialized', function() {
  initFomo();

  // Image-only exit intent — replace with your own image URL
  initExitIntentImage('https://placehold.co/600x400', async () => {
    await next.applyCoupon('SAVE10');
  });
});
