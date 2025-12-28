// JavaScript extracted from templates\upsells\up05-mv.html

// Content from static file: up05-mv.js
// ============================================
// CONFIGURATION SECTION
// ============================================
const CONFIG = {
  // Product Images by Color
  colors: {
    images: {
      'white': 'https://cdn.29next.store/media/demo/uploads/white.png',
      'gray': 'https://cdn.29next.store/media/demo/uploads/gray.png',
      'black': 'https://cdn.29next.store/media/demo/uploads/black.png',
    },
    styles: {
      'white': '#FFFFFF',
      'gray': '#808080',
      'black': '#000000',
    }
  },

  // Display Order for Dropdowns
  displayOrder: {
    sizes: ['Small', 'Medium', 'Large'],
    colors: ['White', 'Gray', 'Black']
  },

  // Size Preference Order (fallback logic)
  sizePreferenceOrder: [
    ['Small', 'Medium', 'Large'],
    ['Medium', 'Large', 'Small'],
    ['Large', 'Medium', 'Small']
  ],

  // Default Selections
  defaults: {
    color: 'black', // Default color (will find closest match)
    size: 'small', // Default size
  },

  // Upsell package mapping - these are the actual package IDs from your campaign
  // These should match the single-item (non-bundle) packages
  upsellPackageMapping: {
    'white': {
      'small': 1,    // White/Small package ID
      'medium': 4,   // White/Medium package ID
      'large': 7     // White/Large package ID
    },
    'gray': {
      'small': 2,    // Gray/Small package ID
      'medium': 5,   // Gray/Medium package ID
      'large': 8     // Gray/Large package ID
    },
    'black': {
      'small': 3,    // Black/Small package ID
      'medium': 6,   // Black/Medium package ID
      'large': 9     // Black/Large package ID
    }
  }
};

// ============================================
// END CONFIGURATION SECTION
// ============================================

// Base element class
class BaseElement extends HTMLElement {
  connectedCallback() {
    if (!this._mounted) {
      this._mounted = true;
      this.mount();
    }
  }
  mount() {}
  attributeChangedCallback(n, o, v) {
    if (o !== v) this.onAttributeChange?.(n, o, v);
  }
}

// Dropdown implementation
class OSDropdown extends BaseElement {
  static observedAttributes = ['value'];
  static openDropdowns = new Set();

  mount() {
    this._toggle = this.querySelector('button');
    this._menu = this.querySelector('os-dropdown-menu');
    if (!this._toggle || !this._menu) return;
    
    this._value = this.getAttribute('value');
    this._cleanupFn = null;
    this._setupEvents();
  }

  _setupEvents() {
    this._toggle.onclick = e => {
      e.stopPropagation();
      this.isOpen ? this.closeDropdown() : this.openDropdown();
    };
    
    this.addEventListener('dropdown-item-select', e => {
      const item = e.detail.item;
      this.value = item.value;
      this._updateSelection(item);
      this.closeDropdown();
      this.dispatchEvent(new CustomEvent('variantSelected', {
        detail: { value: item.value, component: this },
        bubbles: true
      }));
    });
    
    document.addEventListener('click', e => {
      if (!this.contains(e.target) && this.isOpen) this.closeDropdown();
    });
  }

  _updateSelection(selected) {
    this.querySelectorAll('os-dropdown-item').forEach(item => {
      item.classList.toggle('selected', item === selected);
    });
    // Update toggle content
    const content = selected?.querySelector('.os-card__toggle-option');
    const existing = this._toggle.querySelector('.os-card__toggle-option');
    if (existing && content) {
      const newContent = content.cloneNode(true);
      existing.replaceWith(newContent);
    }
  }

  openDropdown() {
    OSDropdown.closeAllDropdowns();
    this.setAttribute('open', '');
    this._toggle.classList.add('active');
    
    const updatePosition = () => {
      const toggleRect = this._toggle.getBoundingClientRect();
      const menuHeight = 300;
      const spaceBelow = window.innerHeight - toggleRect.bottom;
      const spaceAbove = toggleRect.top;
      const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      
      Object.assign(this._menu.style, {
        opacity: '1',
        visibility: 'visible',
        position: 'absolute',
        width: `${this.getBoundingClientRect().width}px`,
        zIndex: '1000',
        maxHeight: '300px',
        overflowY: 'auto',
        left: '0'
      });
      
      if (openAbove) {
        this._menu.style.top = 'auto';
        this._menu.style.bottom = `${this.offsetHeight + 8}px`;
        this._menu.style.transform = 'translateY(0)';
      } else {
        this._menu.style.top = `${this._toggle.offsetHeight + 8}px`;
        this._menu.style.bottom = 'auto';
        this._menu.style.transform = 'translateY(0)';
      }
    };
    
    updatePosition();
    
    const handleScroll = () => {
      if (this.isOpen) updatePosition();
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    this._cleanupFn = () => window.removeEventListener('scroll', handleScroll);
    
    OSDropdown.openDropdowns.add(this);
  }

  closeDropdown() {
    this.removeAttribute('open');
    this._toggle.classList.remove('active');
    Object.assign(this._menu.style, { opacity: '0', visibility: 'hidden' });
    if (this._cleanupFn) {
      this._cleanupFn();
      this._cleanupFn = null;
    }
    OSDropdown.openDropdowns.delete(this);
  }

  static closeAllDropdowns() {
    OSDropdown.openDropdowns.forEach(d => d.closeDropdown());
  }

  get value() { return this._value; }
  set value(val) {
    if (this._value === val) return; // Avoid unnecessary updates
    this._value = val;
    this.setAttribute('value', val);

    // Ensure the dropdown items are rendered before updating selection
    const updateSelection = () => {
      const item = this.querySelector(`os-dropdown-item[value="${val}"]`);
      if (item) {
        this._updateSelection(item);
      }
    };

    // If items aren't ready yet, defer the update
    if (this.querySelector('os-dropdown-item')) {
      updateSelection();
    } else {
      requestAnimationFrame(updateSelection);
    }
  }

  get isOpen() { return this.hasAttribute('open'); }
}

class OSDropdownMenu extends BaseElement {
  mount() {
    Object.assign(this.style, {
      position: 'absolute',
      zIndex: '1000',
      transition: 'opacity 0.2s, visibility 0.2s',
      opacity: '0',
      visibility: 'hidden'
    });
  }
}

class OSDropdownItem extends BaseElement {
  mount() {
    this._value = this.getAttribute('value');
    this.onclick = () => {
      if (!this.hasAttribute('disabled')) {
        this.closest('os-dropdown')?.dispatchEvent(
          new CustomEvent('dropdown-item-select', {
            detail: { item: this },
            bubbles: true
          })
        );
      }
    };
  }
  get value() { return this._value; }
}

// Loading Overlay
class LoadingOverlay {
  constructor() {
    this.overlay = null;
  }

  show() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'next-loading-overlay';
    this.overlay.innerHTML = `
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .next-loading-spinner .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: var(--brand--color--primary, #000);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      </style>
      <div class="next-loading-spinner">
        <div class="spinner"></div>
      </div>
    `;

    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '9999'
    });

    document.body.appendChild(this.overlay);
  }

  hide() {
    if (!this.overlay) return;

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = null;
      }
    }, 500);
  }
}

// Main Upsell Controller
class UpsellController {
  constructor() {
    this.currentQuantity = 1;
    this.selectedVariants = new Map();
    this.productId = null;
    this.loadingOverlay = new LoadingOverlay();
    this.init();
  }

  async init() {
    await this._waitForSDK();
    this._getProductId();
    this._cacheElements();
    this._bindEvents();
    this._populateDropdowns();
    this._initializeFirstRow();
    this._updatePricing();
  }

  _waitForSDK() {
    return new Promise(resolve => {
      const check = () => {
        if (window.next?.addUpsell && window.next?.getCampaignData) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  _getProductId() {
    const campaign = window.next.getCampaignData();
    this.productId = campaign?.packages?.[0]?.product_id;

    if (!this.productId) {
      try {
        const cache = JSON.parse(sessionStorage.getItem('next-campaign-cache') || '{}');
        this.productId = cache.campaign?.packages?.[0]?.product_id;
      } catch (error) {
        console.error('Failed to get product ID:', error);
      }
    }

    if (!this.productId) {
      console.error('Warning: Product ID not found.');
    }
  }

  _cacheElements() {
    // Look for the container that holds the variant rows
    this.variantsContainer = document.querySelector('.os-card__variant-options');

    // If not found, try alternative selector
    if (!this.variantsContainer) {
      this.variantsContainer = document.querySelector('.os-slots');
    }

    this.quantityButtons = document.querySelectorAll('[data-next-upsell-quantity-toggle]');
    this.acceptButton = document.querySelector('[data-next-upsell-action="add"]');
    this.originalPriceElement = document.getElementById('originalPrice');
    this.currentPriceElement = document.getElementById('currentPrice');
    this.savingsElement = document.querySelector('[data-next-display="package.savingsPercentage"]');

    console.log('Cached elements:', {
      variantsContainer: this.variantsContainer,
      quantityButtons: this.quantityButtons.length,
      acceptButton: this.acceptButton
    });
  }

  _bindEvents() {
    // Quantity button clicks
    this.quantityButtons.forEach(button => {
      button.addEventListener('click', () => {
        const quantity = parseInt(button.getAttribute('data-next-upsell-quantity-toggle'));
        this.selectQuantity(quantity);
      });
    });

    // Accept button click
    if (this.acceptButton) {
      this.acceptButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.acceptUpsell();
      });
    }

    // Decline button click
    const declineButton = document.querySelector('[data-next-upsell-action="skip"]');
    if (declineButton) {
      declineButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.declineUpsell();
      });
    }

    // Listen for variant selections
    document.addEventListener('variantSelected', (e) => this._handleVariantSelection(e.detail));
  }

  _populateDropdowns() {
    if (!this.productId) {
      console.error('Cannot populate dropdowns without product ID');
      return;
    }

    const availableColors = window.next.getAvailableVariantAttributes(this.productId, 'color');
    const availableSizes = window.next.getAvailableVariantAttributes(this.productId, 'size');

    console.log('Populating dropdowns with:', { availableColors, availableSizes });

    // Populate all existing slots
    let allRows = this.variantsContainer?.querySelectorAll('[next-tier-slot]');

    // If no rows with next-tier-slot found, try to find grids with dropdowns
    if (!allRows || allRows.length === 0) {
      console.log('No [next-tier-slot] rows found, searching for grids with dropdowns...');
      const grids = this.variantsContainer?.querySelectorAll('.os-card__upsell-grid');
      if (grids) {
        allRows = Array.from(grids).filter(grid => grid.querySelector('os-dropdown'));
        // Add next-tier-slot attribute to found rows
        allRows.forEach((row, index) => {
          if (!row.hasAttribute('next-tier-slot')) {
            row.setAttribute('next-tier-slot', index + 1);
          }
        });
      }
    }

    console.log(`Found ${allRows?.length || 0} rows to populate`);

    allRows?.forEach(row => {
      const rowNumber = +row.getAttribute('next-tier-slot');
      console.log(`Populating row ${rowNumber}`);
      this._populateDropdownsForRow(row, rowNumber, availableColors, availableSizes);
    });
  }

  _populateDropdownsForRow(row, rowNumber, availableColors, availableSizes) {
    // Populate color dropdown
    const colorDropdown = row.querySelector('os-dropdown[next-variant-option="color"]');
    if (colorDropdown) {
      const menu = colorDropdown.querySelector('os-dropdown-menu');
      if (menu) {
        menu.innerHTML = '';
        availableColors.forEach(color => {
          const colorKey = color.toLowerCase().replace(/\s+/g, '-');
          const item = document.createElement('os-dropdown-item');
          item.setAttribute('value', color);
          item.classList.add('os-card__variant-dropdown-item');
          item.innerHTML = `
            <div class="os-card__toggle-option">
              <div class="os-card__variant-toggle-info">
                <div class="os-card__option-swatch" style="background-color: ${CONFIG.colors.styles[colorKey] || '#ccc'}"></div>
                <div class="os-card__variant-toggle-name">${color}</div>
              </div>
            </div>
          `;
          menu.appendChild(item);
        });
      }
    }

    // Populate size dropdown
    const sizeDropdown = row.querySelector('os-dropdown[next-variant-option="size"]');
    if (sizeDropdown) {
      const menu = sizeDropdown.querySelector('os-dropdown-menu');
      if (menu) {
        menu.innerHTML = '';

        const sortedSizes = CONFIG.displayOrder.sizes.filter(size =>
          availableSizes.some(availSize => availSize.toLowerCase() === size.toLowerCase())
        );

        sortedSizes.forEach(size => {
          const matchingSize = availableSizes.find(availSize =>
            availSize.toLowerCase() === size.toLowerCase()
          ) || size;

          const item = document.createElement('os-dropdown-item');
          item.setAttribute('value', matchingSize);
          item.classList.add('os-card__variant-dropdown-item');
          item.innerHTML = `
            <div class="os-card__toggle-option">
              <div class="os-card__variant-toggle-info">
                <div class="os-card__variant-toggle-name">${matchingSize}</div>
              </div>
            </div>
          `;
          menu.appendChild(item);
        });
      }
    }
  }

  _initializeFirstRow() {
    if (!this.productId) return;

    const availableColors = window.next.getAvailableVariantAttributes(this.productId, 'color');
    const availableSizes = window.next.getAvailableVariantAttributes(this.productId, 'size');

    console.log('Available variants:', { colors: availableColors, sizes: availableSizes });

    const defaultColor = availableColors.find(color =>
      color.toLowerCase().includes(CONFIG.defaults.color.toLowerCase())
    ) || availableColors[0];

    const defaultSize = availableSizes.find(size =>
      size.toLowerCase() === CONFIG.defaults.size.toLowerCase()
    ) || availableSizes[0];

    // Try to find first row with next-tier-slot attribute, or fallback to .os-card__upsell-grid
    let firstRow = this.variantsContainer?.querySelector('[next-tier-slot="1"]');

    if (!firstRow) {
      // Fallback: find the first .os-card__upsell-grid that contains dropdowns
      const grids = this.variantsContainer?.querySelectorAll('.os-card__upsell-grid');
      if (grids && grids.length > 0) {
        // Find the grid that has dropdowns (not the label row)
        for (const grid of grids) {
          if (grid.querySelector('os-dropdown')) {
            firstRow = grid;
            // Add the attribute so we can find it later
            firstRow.setAttribute('next-tier-slot', '1');
            break;
          }
        }
      }
    }

    console.log('First row found:', firstRow);

    if (firstRow) {
      const colorDropdown = firstRow.querySelector('os-dropdown[next-variant-option="color"]');
      const sizeDropdown = firstRow.querySelector('os-dropdown[next-variant-option="size"]');

      console.log('Dropdowns found:', { colorDropdown, sizeDropdown });

      const defaultVariants = {
        color: defaultColor || 'Black',
        size: defaultSize || 'Small'
      };

      this.selectedVariants.set(1, defaultVariants);

      if (colorDropdown) {
        colorDropdown.value = defaultVariants.color;
        this._updateSwatch(colorDropdown, defaultVariants.color);
        this._updateImage(firstRow, defaultVariants.color);
      }
      if (sizeDropdown) sizeDropdown.value = defaultVariants.size;

      this._updateStock(firstRow, 1);
    } else {
      console.error('Could not find first row to initialize');
    }
  }

  selectQuantity(quantity) {
    if (quantity === this.currentQuantity) return;

    this.currentQuantity = quantity;

    // Update button states
    this.quantityButtons.forEach(btn => {
      const btnQty = parseInt(btn.getAttribute('data-next-upsell-quantity-toggle'));
      btn.classList.toggle('next-selected', btnQty === quantity);
    });

    // Update rows
    this._updateRows(quantity);

    // Update pricing
    this._updatePricing();
  }

  _updateRows(quantity) {
    const existingRows = this.variantsContainer?.querySelectorAll('[next-tier-slot]');
    const currentCount = existingRows?.length || 0;

    if (quantity > currentCount) {
      for (let i = currentCount + 1; i <= quantity; i++) {
        this._createRow(i);
      }
    } else {
      existingRows?.forEach((row, index) => {
        row.style.display = index < quantity ? 'grid' : 'none';
      });
    }
  }

  _createRow(rowNumber) {
    const templateRow = this.variantsContainer?.querySelector('[next-tier-slot="1"]');
    if (!templateRow) {
      console.error('Cannot create row - template not found');
      return;
    }

    const newRow = templateRow.cloneNode(true);

    // Update row number - try multiple selectors
    const numberElement = newRow.querySelector('[data-next-bind="slot-number"]') ||
                          newRow.querySelector('.os-card__variant-number div');
    if (numberElement) {
      numberElement.textContent = `#${rowNumber}`;
    }

    const availableColors = window.next.getAvailableVariantAttributes(this.productId, 'color');
    const availableSizes = window.next.getAvailableVariantAttributes(this.productId, 'size');

    this._populateDropdownsForRow(newRow, rowNumber, availableColors, availableSizes);

    newRow.setAttribute('next-tier-slot', rowNumber);
    this.variantsContainer.appendChild(newRow);

    console.log(`Created row ${rowNumber}`);

    // Copy selection from row 1
    const row1Variants = this.selectedVariants.get(1);
    if (row1Variants) {
      this.selectedVariants.set(rowNumber, { ...row1Variants });

      const colorDropdown = newRow.querySelector('os-dropdown[next-variant-option="color"]');
      const sizeDropdown = newRow.querySelector('os-dropdown[next-variant-option="size"]');

      if (colorDropdown) {
        colorDropdown.value = row1Variants.color;
        this._updateSwatch(colorDropdown, row1Variants.color);
        this._updateImage(newRow, row1Variants.color);
      }
      if (sizeDropdown) sizeDropdown.value = row1Variants.size;
    }
  }

  _handleVariantSelection({ value, component }) {
    const row = component.closest('[next-tier-slot]');
    if (!row) return;

    const rowNumber = +row.getAttribute('next-tier-slot');
    const variantType = component.getAttribute('next-variant-option');

    if (!this.selectedVariants.has(rowNumber)) {
      this.selectedVariants.set(rowNumber, {});
    }

    const rowVariants = this.selectedVariants.get(rowNumber);
    const previousValue = rowVariants[variantType];
    rowVariants[variantType] = value;

    console.log(`Row ${rowNumber} - Selected ${variantType}: ${value}`);

    // Check if we have both color and size
    if (rowVariants.color && rowVariants.size) {
      const isOOS = this._isCompleteVariantOutOfStock(rowNumber, rowVariants);

      if (isOOS) {
        const alternative = this._findAvailableAlternative(rowNumber, variantType, value, previousValue);

        if (alternative) {
          console.log(`Auto-selecting available ${variantType === 'color' ? 'size' : 'color'}: ${alternative}`);
          const otherType = variantType === 'color' ? 'size' : 'color';
          rowVariants[otherType] = alternative;

          const otherDropdown = row.querySelector(`os-dropdown[next-variant-option="${otherType}"]`);
          if (otherDropdown) {
            otherDropdown.value = alternative;
            if (otherType === 'color') {
              this._updateSwatch(otherDropdown, alternative);
            }
          }
        }
      }
    }

    // Update visual elements
    if (variantType === 'color') {
      this._updateSwatch(component, value);
      this._updateImage(row, value);
    }

    // Update stock status
    this._updateStock(row, rowNumber);
    this._updatePricing();
  }

  _updateSwatch(dropdown, color) {
    // Update the swatch in the dropdown toggle button
    const swatch = dropdown?.querySelector('.os-card__variant-dropdown-toggle .os-card__option-swatch');
    if (swatch && color) {
      const key = color.toLowerCase().replace(/\s+/g, '-');
      if (CONFIG.colors.styles[key]) {
        swatch.style.backgroundColor = CONFIG.colors.styles[key];
      }
    }
  }

  _updateImage(slot, color) {
    const img = slot.querySelector('[next-tier-slot-element="image"]');
    if (!img || !color) return;

    const key = color.toLowerCase().replace(/\s+/g, '-');
    if (CONFIG.colors.images[key]) {
      img.style.opacity = '0.5';
      img.src = CONFIG.colors.images[key];
      img.onload = () => img.style.opacity = '1';
    }
  }

  _updatePricing() {
    let totalRetail = 0;
    let totalSale = 0;

    for (let i = 1; i <= this.currentQuantity; i++) {
      const variants = this.selectedVariants.get(i);
      if (variants?.color && variants?.size) {
        const colorKey = variants.color.toLowerCase();
        const sizeKey = variants.size.toLowerCase();
        const upsellPackageId = CONFIG.upsellPackageMapping[colorKey]?.[sizeKey];

        if (upsellPackageId) {
          const upsellPackage = window.next.getPackage(upsellPackageId);

          console.log(`Row ${i} - Pricing:`, {
            color: variants.color,
            size: variants.size,
            upsellPackageId,
            package: upsellPackage ? {
              id: upsellPackage.ref_id,
              price: upsellPackage.price,
              priceRetail: upsellPackage.price_retail
            } : 'NOT FOUND'
          });

          if (upsellPackage) {
            totalSale += parseFloat(upsellPackage.price);
            totalRetail += parseFloat(upsellPackage.price_retail);
          }
        }
      }
    }

    if (this.originalPriceElement) {
      this.originalPriceElement.textContent = `$${totalRetail.toFixed(2)}`;
    }

    if (this.currentPriceElement) {
      this.currentPriceElement.textContent = `$${totalSale.toFixed(2)}`;
    }

    if (this.savingsElement && totalRetail > 0) {
      const savings = Math.round(((totalRetail - totalSale) / totalRetail) * 100);
      this.savingsElement.textContent = `${savings}%`;
    }
  }

  _updateStock(row, rowNumber) {
    if (!row) return;

    const rowVariants = this.selectedVariants.get(rowNumber) || {};

    ['color', 'size'].forEach(type => {
      const dropdown = row.querySelector(`os-dropdown[next-variant-option="${type}"]`);
      const items = dropdown?.querySelectorAll('os-dropdown-item');

      items?.forEach(item => {
        const value = item.getAttribute('value');

        let variantToCheck;
        if (type === 'color') {
          variantToCheck = { color: value, size: rowVariants.size };
        } else {
          variantToCheck = { color: rowVariants.color, size: value };
        }

        if (variantToCheck.color && variantToCheck.size) {
          const matchingPackage = window.next.getPackageByVariantSelection(
            this.productId,
            variantToCheck
          );

          const isOutOfStock = !matchingPackage ||
            matchingPackage.product_inventory_availability === 'out_of_stock' ||
            matchingPackage.product_purchase_availability === 'unavailable';

          if (isOutOfStock) {
            item.classList.add('next-oos');
          } else {
            item.classList.remove('next-oos');
          }
        }
      });
    });
  }

  _isCompleteVariantOutOfStock(rowNumber, fullVariant) {
    if (!fullVariant.color || !fullVariant.size || !this.productId) {
      return false;
    }

    const matchingPackage = window.next.getPackageByVariantSelection(
      this.productId,
      { color: fullVariant.color, size: fullVariant.size }
    );

    if (matchingPackage) {
      return matchingPackage.product_inventory_availability === 'out_of_stock' ||
             matchingPackage.product_purchase_availability === 'unavailable';
    }

    return true;
  }

  _findAvailableAlternative(rowNumber, changedType, newValue, previousValue) {
    const rowVariants = this.selectedVariants.get(rowNumber);

    if (changedType === 'color') {
      const availableSizes = window.next.getAvailableVariantAttributes(this.productId, 'size');
      const currentSize = rowVariants.size;

      if (!this._isCompleteVariantOutOfStock(rowNumber, { color: newValue, size: currentSize })) {
        return currentSize;
      }

      const sizeOrder = this._getSizePreferenceOrder(currentSize, availableSizes);

      for (const size of sizeOrder) {
        if (!this._isCompleteVariantOutOfStock(rowNumber, { color: newValue, size })) {
          return size;
        }
      }
    } else if (changedType === 'size') {
      const availableColors = window.next.getAvailableVariantAttributes(this.productId, 'color');
      const currentColor = rowVariants.color;

      if (!this._isCompleteVariantOutOfStock(rowNumber, { color: currentColor, size: newValue })) {
        return currentColor;
      }

      for (const color of availableColors) {
        if (!this._isCompleteVariantOutOfStock(rowNumber, { color, size: newValue })) {
          return color;
        }
      }
    }

    return null;
  }

  _getSizePreferenceOrder(currentSize, availableSizes) {
    let preferenceOrder = [];

    for (const order of CONFIG.sizePreferenceOrder) {
      if (order[0].toLowerCase() === currentSize.toLowerCase()) {
        preferenceOrder = order;
        break;
      }
    }

    if (preferenceOrder.length === 0) {
      return availableSizes;
    }

    return preferenceOrder.filter(size =>
      availableSizes.some(availSize => availSize.toLowerCase() === size.toLowerCase())
    );
  }

  async acceptUpsell() {
    this.acceptButton.classList.add('is-submitting');
    this.acceptButton.disabled = true;

    this.loadingOverlay.show();

    try {
      const upsellItems = [];

      console.log('=== ACCEPT UPSELL - Collecting items ===');

      for (let i = 1; i <= this.currentQuantity; i++) {
        const variants = this.selectedVariants.get(i);
        console.log(`Row ${i} variants:`, variants);

        if (variants?.color && variants?.size) {
          const colorKey = variants.color.toLowerCase();
          const sizeKey = variants.size.toLowerCase();

          const upsellPackageId = CONFIG.upsellPackageMapping[colorKey]?.[sizeKey];

          console.log(`Row ${i} - Upsell package lookup:`, {
            color: variants.color,
            size: variants.size,
            upsellPackageId: upsellPackageId || 'NOT FOUND'
          });

          if (upsellPackageId) {
            upsellItems.push({
              packageId: upsellPackageId,
              quantity: 1
            });
          } else {
            console.warn(`No upsell package mapping found for ${variants.color} / ${variants.size}`);
          }
        }
      }

      if (upsellItems.length === 0) {
        console.error('No valid items selected');
        alert('Please select color and size for all items');
        return;
      }

      console.log('=== SENDING UPSELLS TO SDK ===');
      console.log('Upsell items to add:', upsellItems);

      const upsellData = {
        items: upsellItems.map(item => ({
          packageId: item.packageId,
          quantity: item.quantity
        }))
      };

      console.log('📦 Formatted upsell data for SDK:', upsellData);

      await window.next.addUpsell(upsellData);

      console.log('✅ Upsells added successfully');

      // Get redirect URL from meta tag
      const acceptUrlMeta = document.querySelector('meta[name="next-upsell-accept-url"]');
      const acceptUrl = acceptUrlMeta?.getAttribute('content');

      if (acceptUrl) {
        const url = new URL(acceptUrl, window.location.origin);
        url.searchParams.set('quantity', this.currentQuantity);

        const currentParams = new URLSearchParams(window.location.search);
        ['debug', 'debugger', 'ref_id'].forEach(param => {
          if (currentParams.has(param)) {
            url.searchParams.set(param, currentParams.get(param));
          }
        });

        const finalUrl = url.pathname + url.search;

        console.log('Redirecting to:', finalUrl);
        window.location.href = finalUrl;
      } else {
        this.loadingOverlay.hide();
      }

    } catch (error) {
      console.error('❌ Failed to add upsells:', error);
      this.loadingOverlay.hide();
      alert('Failed to add items to your order. Please try again.');
    } finally {
      this.acceptButton.classList.remove('is-submitting');
      this.acceptButton.disabled = false;
    }
  }

  declineUpsell() {
    const declineUrlMeta = document.querySelector('meta[name="next-upsell-decline-url"]');
    const declineUrl = declineUrlMeta?.getAttribute('content');

    if (declineUrl) {
      const url = new URL(declineUrl, window.location.origin);
      url.searchParams.set('quantity', '0');

      const currentParams = new URLSearchParams(window.location.search);
      ['debug', 'debugger', 'ref_id'].forEach(param => {
        if (currentParams.has(param)) {
          url.searchParams.set(param, currentParams.get(param));
        }
      });

      const finalUrl = url.pathname + url.search;

      console.log('Declining upsell, redirecting to:', finalUrl);
      window.location.href = finalUrl;
    } else {
      console.warn('No decline URL found in meta tags');
    }
  }
}

// Progress Bar
class ProgressBar {
  constructor() {
    this.items = document.querySelectorAll('[data-progress]');
    this.sections = document.querySelectorAll('[data-progress-trigger]');
    this.completed = new Set();
    this._init();
  }

  _init() {
    const check = () => {
      const center = window.pageYOffset + window.innerHeight / 2;
      
      this.sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        const bottom = window.pageYOffset + rect.top + rect.height;
        if (center > bottom) {
          this.completed.add(s.getAttribute('data-progress-trigger'));
        }
      });
      
      let active = null;
      for (const s of this.sections) {
        const rect = s.getBoundingClientRect();
        const top = window.pageYOffset + rect.top;
        if (center >= top && center <= top + rect.height) {
          active = s.getAttribute('data-progress-trigger');
          break;
        }
      }
      
      this.items.forEach(item => {
        const name = item.getAttribute('data-progress');
        item.classList.remove('active', 'completed');
        if (this.completed.has(name)) {
          item.classList.add('completed');
        } else if (name === active) {
          item.classList.add('active');
        }
      });
    };
    
    const handleScroll = () => requestAnimationFrame(check);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    check();
  }
}

// Register elements
customElements.define('os-dropdown', OSDropdown);
customElements.define('os-dropdown-menu', OSDropdownMenu);
customElements.define('os-dropdown-item', OSDropdownItem);

// Initialize
window.addEventListener('next:initialized', function() {
  window.upsellController = new UpsellController();
});

// If SDK is already initialized
if (window.next?.addUpsell) {
  window.upsellController = new UpsellController();
}

// Inline script 4 from up05-mv.html
document.querySelectorAll('[swiper="sw12"]').forEach((sliderComponent) => {
  const sliderMain = sliderComponent.querySelector('[swiper="slider-main"]');
  const sliderThumbs = sliderComponent.querySelector('[swiper="slider-thumbs"]');
  const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
  const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
  // Initialize thumbs swiper first
  const thumbsSwiper = new Swiper(sliderThumbs, {
    slidesPerView: 5, // Show a fixed number of thumbs
    spaceBetween: 10,
    freeMode: false, // Disable free mode for proper controlled movement
    watchSlidesProgress: true,
    watchOverflow: true, // Prevent extra spacing when fewer slides exist
    centerInsufficientSlides: true, // Prevents misalignment when fewer thumbs exist
    breakpoints: {
      768: {
        slidesPerView: 5, // Adjust for desktop
        spaceBetween: 10,
      },
      480: {
        slidesPerView: 5, // Adjust for mobile
        spaceBetween: 8,
      },
    },
  });
  // Initialize main swiper with thumbs navigation
  new Swiper(sliderMain, {
    slidesPerView: 1,
    spaceBetween: 0,
    navigation: {
      nextEl: buttonNextEl,
      prevEl: buttonPrevEl,
    },
    thumbs: {
      swiper: thumbsSwiper,
    },
  });
  // Add keyboard accessibility for thumbs
  if (sliderThumbs) {
    sliderThumbs.querySelectorAll('.swiper-slide').forEach((slide, index) => {
      slide.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          thumbsSwiper.slideTo(index, 300);
        }
      });
    });
  }
});