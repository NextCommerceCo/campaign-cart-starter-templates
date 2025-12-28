// JavaScript extracted from templates\checkout\olympus-mv-billing.html

// Inline script 4 from olympus-mv-billing.html
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