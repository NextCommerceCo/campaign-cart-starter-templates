// JavaScript extracted from templates\receipt\re02.html

// Inline script 3 from re02.html
function prettyPaymentName(e = "") {
  const t = {
    card_token: "Credit Card",
    "credit card": "Credit Card",
    apple_pay: "Apple Pay",
    "apple pay": "Apple Pay",
    google_pay: "Google Pay",
    "google pay": "Google Pay",
    paypal: "Paypal"
  };
  return t[e.toLowerCase()] || e || "Unknown"
}

function updatePaymentNames() {
  document.querySelectorAll('[data-next-display="order.paymentMethod"]').forEach(e => {
    const t = e.textContent.trim();
    e.textContent = prettyPaymentName(t)
  })
}
const runUpdate = () => {
  try {
    updatePaymentNames()
  } catch {}
};
runUpdate();
window.addEventListener("load", () => setTimeout(runUpdate, 1));
new MutationObserver(e => {
  e.some(t => [...t.addedNodes].some(n => 1 === n.nodeType && (n.matches?.('[data-next-display="order.paymentMethod"]') || n.querySelector?.('[data-next-display="order.paymentMethod"]')))) && runUpdate()
}).observe(document.body, {
  childList: !0,
  subtree: !0
});
document.addEventListener("DOMContentLoaded", runUpdate);
window.addEventListener("next:initialized", runUpdate);