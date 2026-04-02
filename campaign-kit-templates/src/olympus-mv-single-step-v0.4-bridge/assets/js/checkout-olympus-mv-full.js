// Checkout helpers for SDK bundle selector migration.
const ENABLE_EXTERNAL_SLOT_VARIATION = true;

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

function setupExternalSlotStage() {
  if (!ENABLE_EXTERNAL_SLOT_VARIATION) return;

  const selector = document.querySelector('[data-next-bundle-selector]');
  const stage = document.querySelector('#bundle-slots-stage');
  if (!selector || !stage) return;
  let suppressFullSyncUntil = 0;

  const getSelectedCard = () =>
    selector.querySelector('[data-next-bundle-card].next-selected') ||
    selector.querySelector('[data-next-bundle-card][data-next-selected="true"]');

  const getSourceRootForCard = (card) =>
    card?.querySelector('.bundle-slots-source [data-next-bundle-slots]') || null;

  const cloneWithLiveFormState = (srcSlot) => {
    const clone = srcSlot.cloneNode(true);

    const srcSelects = srcSlot.querySelectorAll('select[data-variant-code]');
    const cloneSelects = clone.querySelectorAll('select[data-variant-code]');
    srcSelects.forEach((srcSel, i) => {
      const cloneSel = cloneSelects[i];
      if (!cloneSel) return;
      cloneSel.value = srcSel.value;
    });

    const srcInputs = srcSlot.querySelectorAll('input');
    const cloneInputs = clone.querySelectorAll('input');
    srcInputs.forEach((srcInput, i) => {
      const cloneInput = cloneInputs[i];
      if (!cloneInput) return;
      if (srcInput.type === 'checkbox' || srcInput.type === 'radio') {
        cloneInput.checked = srcInput.checked;
      } else {
        cloneInput.value = srcInput.value;
      }
    });

    return clone;
  };

  const getColorSwatch = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'black') return '#000000';
    if (normalized === 'white') return '#FFFFFF';
    if (normalized === 'gray' || normalized === 'grey') return '#808080';
    return '';
  };

  const renderLegacyVariantDropdowns = (scopeRoot = stage) => {
    const variantRoots = scopeRoot.querySelectorAll('[data-next-variant-selectors]');
    variantRoots.forEach((root) => {
      const fields = Array.from(root.querySelectorAll('.next-slot-variant-field'));
      if (!fields.length) return;

      fields.forEach((field) => {
        const labelEl = field.querySelector('.next-slot-variant-label');
        const selectEl = field.querySelector('select[data-variant-code]');
        if (!labelEl || !selectEl) return;

        const code = selectEl.getAttribute('data-variant-code') || '';
        const labelText = (labelEl.textContent || '').trim() || `Select ${code}:`;
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        const selectedText = selectedOption ? selectedOption.textContent : selectEl.value;

        const group = document.createElement('div');
        group.className = 'os-card__variant-group cc-full';

        const label = document.createElement('div');
        label.className = 'os-card__variant-label';
        label.textContent = labelText;

        const dropdown = document.createElement('os-dropdown');
        dropdown.className = 'os-variant-dropdown';
        dropdown.setAttribute('next-variant-option', code);
        dropdown.setAttribute('value', selectEl.value);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'os-card__variant-dropdown-toggle';
        button.setAttribute('aria-expanded', 'false');

        const toggleOption = document.createElement('div');
        toggleOption.className = 'os-card__toggle-option';
        const toggleInfo = document.createElement('div');
        toggleInfo.className = 'os-card__variant-toggle-info';

        if (code.toLowerCase() === 'color') {
          const swatch = document.createElement('div');
          swatch.className = 'os-card__option-swatch';
          const swatchColor = getColorSwatch(selectedText || selectEl.value);
          if (swatchColor) swatch.style.backgroundColor = swatchColor;
          toggleInfo.appendChild(swatch);
        }

        const toggleName = document.createElement('div');
        toggleName.className = 'os-card__variant-toggle-name';
        toggleName.textContent = selectedText || selectEl.value;
        toggleInfo.appendChild(toggleName);
        toggleOption.appendChild(toggleInfo);

        const icon = document.createElement('div');
        icon.className = 'os-card__variant-dropdown-icon';
        icon.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
          '<path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path>' +
          '</svg>';

        button.append(toggleOption, icon);

        const menu = document.createElement('os-dropdown-menu');
        menu.setAttribute('os-element', 'dropdown-menu');
        menu.className = 'os-card__variant-dropdown-menu-v2';

        Array.from(selectEl.options).forEach((option) => {
          const item = document.createElement('os-dropdown-item');
          item.setAttribute('value', option.value);
          item.className = `os-card__variant-dropdown-item${option.selected ? ' selected' : ''}`;
          if (option.disabled) item.setAttribute('disabled', '');

          const itemToggle = document.createElement('div');
          itemToggle.className = 'os-card__toggle-option';
          const itemInfo = document.createElement('div');
          itemInfo.className = 'os-card__variant-toggle-info';

          if (code.toLowerCase() === 'color') {
            const itemSwatch = document.createElement('div');
            itemSwatch.className = 'os-card__option-swatch';
            const optionColor = getColorSwatch(option.textContent || option.value);
            if (optionColor) itemSwatch.style.backgroundColor = optionColor;
            itemInfo.appendChild(itemSwatch);
          }

          const itemName = document.createElement('div');
          itemName.className = 'os-card__variant-toggle-name';
          itemName.textContent = option.textContent || option.value;
          itemInfo.appendChild(itemName);
          itemToggle.appendChild(itemInfo);
          item.appendChild(itemToggle);
          menu.appendChild(item);
        });

        dropdown.append(button, menu);

        field.replaceChildren();
        field.append(label, dropdown, selectEl);
        selectEl.style.display = 'none';
      });
    });
  };

  const syncStageFromSelected = () => {
    const card = getSelectedCard();
    const srcRoot = getSourceRootForCard(card);
    if (!srcRoot) return;
    // Clone only; never move source nodes out of card context.
    const clones = Array.from(srcRoot.children).map((srcSlot) =>
      cloneWithLiveFormState(srcSlot)
    );
    stage.replaceChildren(...clones);
    renderLegacyVariantDropdowns();
  };

  const syncStageSlotFromSource = (extSlot, srcSlot) => {
    if (!extSlot || !srcSlot) return;

    const srcImage = srcSlot.querySelector('.next-slot__image img');
    const extImage = extSlot.querySelector('.next-slot__image img');
    if (srcImage && extImage) {
      const nextSrc = srcImage.currentSrc || srcImage.src;
      const currentSrc = extImage.currentSrc || extImage.src;
      if (nextSrc && nextSrc !== currentSrc) {
        const preloaded = new Image();
        preloaded.onload = () => {
          extImage.src = nextSrc;
        };
        preloaded.src = nextSrc;
      }
      extImage.alt = srcImage.alt;
    }

    const srcSelects = Array.from(srcSlot.querySelectorAll('select[data-variant-code]'));
    const extSelects = Array.from(extSlot.querySelectorAll('select[data-variant-code]'));
    srcSelects.forEach((srcSelect) => {
      const code = srcSelect.getAttribute('data-variant-code');
      if (!code) return;
      const extSelect =
        extSelects.find((node) => node.getAttribute('data-variant-code') === code) ||
        extSlot.querySelector(`select[data-variant-code="${code}"]`);
      if (!extSelect) return;
      extSelect.innerHTML = srcSelect.innerHTML;
      extSelect.value = srcSelect.value;
    });

    const srcPriceNodes = srcSlot.querySelectorAll('[data-next-bundle-price]');
    const extPriceNodes = extSlot.querySelectorAll('[data-next-bundle-price]');
    srcPriceNodes.forEach((srcNode, i) => {
      const extNode = extPriceNodes[i];
      if (!extNode) return;
      extNode.textContent = srcNode.textContent || '';
    });

    const srcDisplayNodes = srcSlot.querySelectorAll('[data-next-display]');
    const extDisplayNodes = extSlot.querySelectorAll('[data-next-display]');
    srcDisplayNodes.forEach((srcNode, i) => {
      const extNode = extDisplayNodes[i];
      if (!extNode) return;
      extNode.textContent = srcNode.textContent || '';
    });

    renderLegacyVariantDropdowns(extSlot);
  };

  const syncAllStagedDynamicText = () => {
    const extSlots = stage.querySelectorAll('.next-bundle-slot[data-next-bundle-id][data-next-slot-index]');
    extSlots.forEach((extSlot) => {
      const srcSlot = getSourceSlotForExternalSlot(extSlot);
      if (!srcSlot) return;

      const srcPriceNodes = srcSlot.querySelectorAll('[data-next-bundle-price]');
      const extPriceNodes = extSlot.querySelectorAll('[data-next-bundle-price]');
      srcPriceNodes.forEach((srcNode, i) => {
        const extNode = extPriceNodes[i];
        if (!extNode) return;
        extNode.textContent = srcNode.textContent || '';
      });

      const srcDisplayNodes = srcSlot.querySelectorAll('[data-next-display]');
      const extDisplayNodes = extSlot.querySelectorAll('[data-next-display]');
      srcDisplayNodes.forEach((srcNode, i) => {
        const extNode = extDisplayNodes[i];
        if (!extNode) return;
        extNode.textContent = srcNode.textContent || '';
      });
    });
  };

  const getSourceSlotForExternalSlot = (extSlot) => {
    if (!extSlot) return null;
    const bundleId = extSlot.getAttribute('data-next-bundle-id');
    const slotIndex = extSlot.getAttribute('data-next-slot-index');
    if (!bundleId || !slotIndex) return null;
    const card = selector.querySelector(
      `[data-next-bundle-card][data-next-bundle-id="${bundleId}"]`
    );
    const srcRoot = getSourceRootForCard(card);
    if (!srcRoot) return null;
    return srcRoot.querySelector(
      `.next-bundle-slot[data-next-bundle-id="${bundleId}"][data-next-slot-index="${slotIndex}"]`
    );
  };

  stage.addEventListener('change', (e) => {
    const extSelect = e.target.closest('select[data-variant-code]');
    if (!extSelect) return;
    const extSlot = extSelect.closest('.next-bundle-slot[data-next-slot-index]');
    const srcSlot = getSourceSlotForExternalSlot(extSlot);
    if (!srcSlot) return;
    const code = extSelect.getAttribute('data-variant-code');
    const srcSelect = srcSlot.querySelector(`select[data-variant-code="${code}"]`);
    if (!srcSelect) return;
    srcSelect.value = extSelect.value;
    srcSelect.dispatchEvent(new Event('change', { bubbles: true }));
    suppressFullSyncUntil = Date.now() + 250;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => syncStageSlotFromSource(extSlot, srcSlot))
    );
  });

  stage.addEventListener('click', (e) => {
    const toggle = e.target.closest('.os-card__variant-dropdown-toggle');
    if (toggle) {
      const dropdown = toggle.closest('os-dropdown');
      if (!dropdown) return;
      const menu = dropdown.querySelector('[os-element="dropdown-menu"]');
      if (!menu) return;
      const isOpen = menu.classList.contains('show');
      stage
        .querySelectorAll('[os-element="dropdown-menu"].show')
        .forEach((openMenu) => openMenu.classList.remove('show'));
      stage
        .querySelectorAll('.os-card__variant-dropdown-toggle.active')
        .forEach((openToggle) => openToggle.classList.remove('active'));
      if (!isOpen) {
        menu.classList.add('show');
        toggle.classList.add('active');
      }
      return;
    }

    const menuItem = e.target.closest('os-dropdown-item.os-card__variant-dropdown-item');
    if (menuItem && !menuItem.hasAttribute('disabled')) {
      const dropdown = menuItem.closest('os-dropdown');
      if (!dropdown) return;
      const field = dropdown.closest('.next-slot-variant-field');
      const extSelect = field?.querySelector('select[data-variant-code]');
      if (!extSelect) return;

      extSelect.value = menuItem.getAttribute('value') || '';
      extSelect.dispatchEvent(new Event('change', { bubbles: true }));

      const menu = dropdown.querySelector('[os-element="dropdown-menu"]');
      const toggleEl = dropdown.querySelector('.os-card__variant-dropdown-toggle');
      menu?.classList.remove('show');
      toggleEl?.classList.remove('active');
      return;
    }

    const extOpt = e.target.closest('[data-next-variant-option]');
    if (!extOpt) return;
    const extSlot = extOpt.closest('.next-bundle-slot[data-next-slot-index]');
    const srcSlot = getSourceSlotForExternalSlot(extSlot);
    if (!srcSlot) return;
    const code = extOpt.getAttribute('data-next-variant-option');
    const value = extOpt.getAttribute('data-next-variant-value');
    const srcOpt = srcSlot.querySelector(
      `[data-next-variant-option="${code}"][data-next-variant-value="${value}"]`
    );
    if (!srcOpt) return;
    srcOpt.click();
    suppressFullSyncUntil = Date.now() + 250;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => syncStageSlotFromSource(extSlot, srcSlot))
    );
  });

  document.addEventListener('click', (e) => {
    if (!stage.contains(e.target)) {
      stage
        .querySelectorAll('[os-element="dropdown-menu"].show')
        .forEach((openMenu) => openMenu.classList.remove('show'));
      stage
        .querySelectorAll('.os-card__variant-dropdown-toggle.active')
        .forEach((openToggle) => openToggle.classList.remove('active'));
    }
  });

  syncStageFromSelected();
  selector.addEventListener('click', () => {
    requestAnimationFrame(() => requestAnimationFrame(syncStageFromSelected));
  });

  if (window.next?.on) {
    window.next.on('bundle:selection-changed', () => {
      requestAnimationFrame(() => requestAnimationFrame(syncStageFromSelected));
      setTimeout(() => {
        syncStageFromSelected();
        syncAllStagedDynamicText();
      }, 250);
      setTimeout(() => {
        syncStageFromSelected();
        syncAllStagedDynamicText();
      }, 500);
    });
  }

  // Avoid attribute-based loops; only react to structural changes.
  const observer = new MutationObserver((mutations) => {
    const hasStructureChange = mutations.some((m) => m.type === 'childList');
    if (hasStructureChange && Date.now() > suppressFullSyncUntil) syncStageFromSelected();
  });
  observer.observe(selector, { childList: true, subtree: true });
}

window.addEventListener('next:initialized', () => {
  initFomo();
  initExitIntentImage('https://placehold.co/600x400', () => {});
  setupExternalSlotStage();
});


// Progress bar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.progressBar = new ProgressBar();
  });
} else {
  window.progressBar = new ProgressBar();
}


