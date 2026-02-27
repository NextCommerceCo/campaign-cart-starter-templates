// Configure before SDK loads
window.dataLayer = window.dataLayer || [];
window.nextReady = window.nextReady || [];

window.nextConfig = {
  // Required: Your Campaign Cart API key
  apiKey: "kLGpgEfCX3iUZG16hpI5zrCH9qxcOdahDY1im6ud",
  
  // Currency behavior when country changes
  currencyBehavior: 'auto', // 'auto' | 'manual'
  
  // Payment and checkout configuration
  paymentConfig: {
    expressCheckout: {
      enabled: true, // Enable/disable express checkout methods
      requireValidation: false, // Require form validation before express checkout if radio option - not express buttons
      requiredFields: ['email', 'fname', 'lname'], // Fields required for express checkout radio option
      methodOrder: ['paypal', 'apple_pay', 'google_pay'] // Display order of express payment method buttons
    },
    cardInputConfig: {
      fieldType: {
        number: "tel",   // 'number' | 'text' | 'tel'
        cvv: "tel"
      },
      numberFormat: "prettyFormat", // 'prettyFormat' | 'plainFormat' | 'maskedFormat'
      labels: { number: "", cvv: "" },
      titles: { number: "", cvv: "" },
      placeholders: { number: "", cvv: "" },
      styles: {
        number: "",
        cvv: "",
        placeholder: ""
      },
    }
  },

  // Address and country configuration
  addressConfig: {
    defaultCountry: "US", // Low-priority fallback when campaign list is empty
    showCountries: ["US", "CA", "GB"], // Deprecated – campaign API provides countries; fallback only
    dontShowStates: ["AS", "GU", "PR", "VI"], // State codes to hide from dropdowns
  },
  
  // Discount codes configuration
  // discounts: {
    // Example discount code
    // SAVE10: {
    //     code: "SAVE10",
    //     type: "percentage", // 'percentage' | 'fixed'
    //     value: 10,
    //     scope: "order", // 'package' | 'order'
    //     description: "10% off entire order",
    //     combinable: true, // Can be combined with other discounts
    //     // Optional: packageIds: [1, 2], // For package-specific discounts
    //     // Optional: minOrderValue: 50, // Minimum order value
    //     // Optional: maxDiscount: 20 // Maximum discount amount
    // }
  // },

  // profiles: {
    // "regular": {
    //     name: "Regular Pricing",
    //     // No mappings needed - uses original package IDs
    // },
    
    // Example: Exit intent save profile
    // "SAVE_5": {
    //     name: "Exit Save 5",
    //     packageMappings: {
    //         // Original ID -> EXIT PACKAGE ID
    //         1: 9,
    //         2: 10,
    //         3: 11,
    //         4: 12,
    //         5: 13,
    //     }
    // },
  // },

  // Default profile to use (if not specified, uses "regular")
  // defaultProfile: "regular",
  
  // Google Maps integration (for address autocomplete)
  googleMaps: {
    apiKey: "your-google-maps-api-key",
    region: "US",
    enableAutocomplete: true
  },
  
  // Analytics providers configuration
  analytics: {
    enabled: true,
    mode: 'auto', // 'auto' | 'manual' | 'disabled'
    providers: {
      // Next Campaign analytics (always enabled if analytics.enabled is true)
      nextCampaign: {
          enabled: true
      },
      // Google Tag Manager
      gtm: {
        enabled: false,
        settings: {
          containerId: "GTM-XXXXXX",
          dataLayerName: "dataLayer"
        },
        // Optional: blockedEvents: ["PageView"]
      },
      // Facebook Pixel
      facebook: {
        enabled: false,
        settings: {
          pixelId: "YOUR_PIXEL_ID"
        },
        // Optional: blockedEvents: ["PageView"]
      },
      // RudderStack
      rudderstack: {
        enabled: false,
        settings: {
            // RudderStack configuration is handled by the RudderStack SDK itself
            // This just enables the adapter
        },
        // Optional: blockedEvents: ["PageView"]
      },
      // Custom analytics endpoint
      custom: {
        enabled: false,
        settings: {
            endpoint: "https://your-analytics.com/track",
            apiKey: "your-api-key"
        }
      }
    }
  },
  
  // UTM parameter transfer (preserve tracking params)
  utmTransfer: {
    enabled: true,
    applyToExternalLinks: false, // Add UTM params to external links
    debug: false, // Enable debug logging for UTM transfer
    // Optional: excludedDomains: ['example.com', 'test.org'], // Domains to exclude
    // Optional: paramsToCopy: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']
  }
};