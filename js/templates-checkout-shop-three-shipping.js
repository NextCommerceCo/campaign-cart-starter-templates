// JavaScript extracted from templates\checkout\shop-three\shipping.html

// Inline script 3 from shipping.html
window.CHECKOUT_CONFIG = {
  currentStep: 2,
  redirectUrl: '/templates/checkout/shop-three/information',
  stepUrls: {
    1: '/templates/checkout/shop-three/information',
    2: '/templates/checkout/shop-three/shipping',
    3: '/templates/checkout/shop-three/billing'
  }
};

// Inline script 4 from shipping.html
(function() {
  'use strict';
  // Get configuration from window
  var config = window.CHECKOUT_CONFIG || {};
  var currentStep = config.currentStep;
  var redirectUrl = config.redirectUrl || '/checkout';
  var stepUrls = config.stepUrls || {};
  // If no step configured, don't guard this page
  if (!currentStep || currentStep === 1) {
    console.log('[CheckoutGuard] No guard needed for step 1 or unconfigured page');
    return;
  }
  try {
    // Try to get checkout store from sessionStorage
    var storeData = sessionStorage.getItem('next-checkout-store');
    // If no store exists, redirect to first step
    if (!storeData) {
      console.warn('[CheckoutGuard] No checkout store found, redirecting to:', redirectUrl);
      window.location.replace(redirectUrl);
      return;
    }
    var store = JSON.parse(storeData);
    var completedStep = store.state && store.state.step ? store.state.step : 0;
    var formData = store.state && store.state.formData ? store.state.formData : {};
    console.log('[CheckoutGuard] Current page step:', currentStep, '| User completed step:', completedStep);
    console.log('[CheckoutGuard] Form data:', formData);
    // Validate that previous steps have required data
    var hasRequiredData = true;
    var missingFields = [];
    var redirectToStep = 1; // Default to step 1
    // If trying to access step 2 or higher, validate step 1 data
    if (currentStep >= 2) {
      var step1Required = ['email', 'fname', 'lname', 'address1', 'city', 'country', 'postal'];
      step1Required.forEach(function(field) {
        if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
          hasRequiredData = false;
          missingFields.push(field);
          redirectToStep = 1; // Missing step 1 data
        }
      });
    }
    // If trying to access step 3 or higher, validate step 2 data (shipping method)
    // Only check this if step 1 data is complete
    if (currentStep >= 3 && hasRequiredData) {
      var shippingMethod = store.state && store.state.shippingMethod;
      if (!shippingMethod) {
        hasRequiredData = false;
        missingFields.push('shippingMethod');
        redirectToStep = 2; // Missing step 2 data, redirect to step 2
      }
    }
    // If required data is missing, redirect to the appropriate step
    if (!hasRequiredData) {
      var targetUrl = stepUrls[redirectToStep] || redirectUrl;
      console.warn('[CheckoutGuard] Required data missing for previous steps:', missingFields);
      console.warn('[CheckoutGuard] Redirecting to step', redirectToStep, ':', targetUrl);
      window.location.replace(targetUrl);
      return;
    }
    // User hasn't completed previous step by step number
    if (completedStep < currentStep) {
      // Try to redirect to the last completed step + 1
      var targetStep = completedStep;
      var targetUrl = stepUrls[targetStep] || redirectUrl;
      console.warn('[CheckoutGuard] User at step', completedStep, 'but trying to access step', currentStep);
      console.warn('[CheckoutGuard] Redirecting to:', targetUrl);
      window.location.replace(targetUrl);
      return;
    }
    // If user has completed this step or beyond, allow them to stay
    console.log('[CheckoutGuard] Access granted - user has completed step', completedStep, 'with valid data');
  } catch (error) {
    // If any error occurs reading the store, redirect to safety
    console.error('[CheckoutGuard] Error checking store:', error);
    console.warn('[CheckoutGuard] Redirecting to:', redirectUrl);
    window.location.replace(redirectUrl);
  }
})();

// Inline script 5 from shipping.html
window.addEventListener('next:initialized', async function() {
  next.setShippingMethod(1);
});