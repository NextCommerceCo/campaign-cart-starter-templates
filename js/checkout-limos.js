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

// Countdown timer (scarcity banner)
document.querySelectorAll('[data-next-element="timer"]').forEach(timer => {
  let [minutes, seconds] = timer.textContent.split(':').map(Number);
  let total = minutes * 60 + seconds;
  setInterval(() => {
    if (total <= 0) return;
    total--;
    const m = Math.floor(total / 60);
    const s = total % 60;
    timer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (total === 0) timer.style.color = '#ff4444';
    else if (total <= 60) timer.style.color = '#ff9800';
  }, 1000);
});
