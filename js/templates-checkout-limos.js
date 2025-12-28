// JavaScript extracted from templates\checkout\limos.html

// Inline script 3 from limos.html
// Wait for SDK to be fully initialized
window.addEventListener('next:initialized', function() {
  // console.log('SDK initialized, starting FOMO popups...');
  // Simple usage - starts immediately with defaults
  next.fomo();
  // Optional: Listen to events for analytics
  next.on('fomo:shown', (data) => {
    // console.log('FOMO shown:', data.customer, 'purchased', data.product);
  });
});
// Control functions
function startFomo() {
  next.fomo({
    initialDelay: 2000, // Start after 2 seconds
    displayDuration: 5000, // Show for 5 seconds
    delayBetween: 10000 // 10 seconds between popups
  });
}

function stopFomo() {
  next.stopFomo();
}
// Custom configuration example
function customFomo() {
  next.fomo({
    items: [{
      text: "Premium Bundle - Save 30%",
      image: "https://example.com/premium-bundle.jpg"
    }, {
      text: "Starter Pack",
      image: "https://example.com/starter-pack.jpg"
    }],
    customers: {
      US: ["Sarah from Dallas", "Mike from Boston", "Lisa from Miami"],
      CA: ["Jean from Montreal", "Pierre from Quebec", "Marie from Toronto"]
    },
    maxMobileShows: 3, // Show max 3 times on mobile
    displayDuration: 4000,
    delayBetween: 15000,
    initialDelay: 0 // Start immediately
  });
}

// Inline script 4 from limos.html
// Wait for SDK to be fully initialized
window.addEventListener('next:initialized', function() {
  // console.log('SDK initialized, setting up exit intent...');
  // Set up exit intent popup with discount code
  next.exitIntent({
    image: 'https://placehold.co/600x400',
    action: async () => {
      const result = await next.applyCoupon('DEMO10');
      if (result.success) {
        // alert('Coupon applied successfully: ' + result.message);
      } else {
        // alert('Coupon failed: ' + result.message);
      }
    }
  });
});