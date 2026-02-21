// JavaScript extracted from templates\landing-pages\lp01.html

// Inline script 4 from lp01.html
document.querySelectorAll('[data-component="swiper"][data-variant="sw1"]').forEach((sliderComponent) => {
  const sliderMain = sliderComponent.querySelector('[swiper="slider-main"]');
  const sliderThumbs = sliderComponent.querySelector('[swiper="slider-thumbs"]');
  const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
  const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
  // Initialize thumbs swiper first
  const thumbsSwiper = new Swiper(sliderThumbs, {
    slidesPerView: 6, // Show a fixed number of thumbs
    spaceBetween: 10,
    freeMode: false, // Disable free mode for proper controlled movement
    watchSlidesProgress: true,
    watchOverflow: true, // Prevent extra spacing when fewer slides exist
    centerInsufficientSlides: true, // Prevents misalignment when fewer thumbs exist
    breakpoints: {
      768: {
        slidesPerView: 6, // Adjust for desktop
        spaceBetween: 10,
      },
      480: {
        slidesPerView: 6, // Adjust for mobile
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

// Inline script 5 from lp01.html
document.querySelectorAll('[swiper="TEST-013"]').forEach((sliderComponent) => {
  const sliderEl = sliderComponent.querySelector('[swiper="slider"]');
  const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
  const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
  const paginationEl = sliderComponent.querySelector('[swiper="pagination"]');
  new Swiper(sliderEl, {
    slidesPerView: 'auto', // This will make slides adapt to their width
    spaceBetween: 16,
    direction: 'horizontal',
    centeredSlides: false, // Changed to false for better auto sizing
    loop: true,
    effect: 'slide',
    pagination: {
      el: paginationEl,
    },
    navigation: {
      nextEl: buttonNextEl,
      prevEl: buttonPrevEl,
    },
    breakpoints: {
      // Breakpoints configuration
      1200: { // Large desktop
        slidesPerView: '3',
        spaceBetween: 16,
      },
      992: { // Desktop
        slidesPerView: '3',
        spaceBetween: 16,
      },
      768: { // Tablet
        slidesPerView: 3,
        spaceBetween: 16,
        centeredSlides: true,
      },
      0: { // Mobile
        slidesPerView: 1.5,
        spaceBetween: 16,
        centeredSlides: true,
      },
    },
  });
});

// Inline script 6 from lp01.html
document.querySelectorAll('[swiper="TEST-013"]').forEach((sliderComponent) => {
  const sliderEl = sliderComponent.querySelector('[swiper="slider"]');
  const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
  const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
  const paginationEl = sliderComponent.querySelector('[swiper="pagination"]');
  new Swiper(sliderEl, {
    slidesPerView: 'auto', // This will make slides adapt to their width
    spaceBetween: 16,
    direction: 'horizontal',
    centeredSlides: false, // Changed to false for better auto sizing
    loop: true,
    effect: 'slide',
    pagination: {
      el: paginationEl,
    },
    navigation: {
      nextEl: buttonNextEl,
      prevEl: buttonPrevEl,
    },
    breakpoints: {
      // Breakpoints configuration
      1200: { // Large desktop
        slidesPerView: '3',
        spaceBetween: 16,
      },
      992: { // Desktop
        slidesPerView: '3',
        spaceBetween: 16,
      },
      768: { // Tablet
        slidesPerView: 3,
        spaceBetween: 16,
        centeredSlides: true,
      },
      0: { // Mobile
        slidesPerView: 1.5,
        spaceBetween: 16,
        centeredSlides: true,
      },
    },
  });
});

// Inline script 7 from lp01.html
class PBAccordion {
  constructor() {
    this.cleanupInitialState();
    this.init();
  }
  cleanupInitialState() {
    document.querySelectorAll('[pb-component="accordion"]').forEach(accordion => {
      const group = accordion.querySelector('[pb-accordion-element="group"]');
      if (!group) return;
      const items = group.querySelectorAll('[pb-accordion-element="accordion"]');
      items.forEach(item => {
        const content = item.querySelector('[pb-accordion-element="content"]');
        const trigger = item.querySelector('[pb-accordion-element="trigger"]');
        const arrow = item.querySelector('[pb-accordion-element="arrow"]');
        const plus = item.querySelector('[pb-accordion-element="plus"]');
        if (content) {
          content.style.maxHeight = '0';
          content.style.opacity = '0';
          content.style.visibility = 'hidden';
          content.style.display = 'none';
        }
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        item.classList.remove('is-active-accordion');
        content?.classList.remove('is-active-accordion');
        if (arrow) arrow.classList.remove('is-active-accordion');
        if (plus) plus.classList.remove('is-active-accordion');
      });
      const initial = group.getAttribute('pb-accordion-initial');
      if (initial && initial !== 'none') {
        const initialItem = items[parseInt(initial) - 1];
        if (initialItem) {
          this.openAccordion(initialItem);
        }
      }
    });
  }
  init() {
    document.querySelectorAll('[pb-component="accordion"]').forEach(accordion => {
      const group = accordion.querySelector('[pb-accordion-element="group"]');
      if (!group) return;
      group.addEventListener('click', (e) => this.handleClick(e, group));
    });
  }
  handleClick(event, group) {
    const accordionItem = event.target.closest('[pb-accordion-element="accordion"]');
    if (!accordionItem) return;
    const isOpen = accordionItem.classList.contains('is-active-accordion');
    const isSingle = group.getAttribute('pb-accordion-single') === 'true';
    if (isSingle) {
      group.querySelectorAll('[pb-accordion-element="accordion"]').forEach(item => {
        if (item !== accordionItem && item.classList.contains('is-active-accordion')) {
          this.closeAccordion(item);
        }
      });
    }
    if (isOpen) {
      this.closeAccordion(accordionItem);
    } else {
      this.openAccordion(accordionItem);
    }
  }
  openAccordion(item) {
    const trigger = item.querySelector('[pb-accordion-element="trigger"]');
    const content = item.querySelector('[pb-accordion-element="content"]');
    const arrow = item.querySelector('[pb-accordion-element="arrow"]');
    const plus = item.querySelector('[pb-accordion-element="plus"]');
    content.style.visibility = 'visible';
    content.style.display = 'block';
    content.offsetHeight;
    const contentHeight = content.scrollHeight;
    requestAnimationFrame(() => {
      content.style.maxHeight = `${contentHeight}px`;
      content.style.opacity = '1';
      trigger.setAttribute('aria-expanded', 'true');
      item.classList.add('is-active-accordion');
      content.classList.add('is-active-accordion');
      if (arrow) arrow.classList.add('is-active-accordion');
      if (plus) plus.classList.add('is-active-accordion');
    });
    content.addEventListener('transitionend', () => {
      if (item.classList.contains('is-active-accordion')) {
        content.style.maxHeight = 'none';
      }
    }, {
      once: true
    });
  }
  closeAccordion(item) {
    const trigger = item.querySelector('[pb-accordion-element="trigger"]');
    const content = item.querySelector('[pb-accordion-element="content"]');
    const arrow = item.querySelector('[pb-accordion-element="arrow"]');
    const plus = item.querySelector('[pb-accordion-element="plus"]');
    content.style.maxHeight = `${content.scrollHeight}px`;
    content.style.display = 'block';
    content.offsetHeight;
    requestAnimationFrame(() => {
      content.style.maxHeight = '0';
      content.style.opacity = '0';
      trigger.setAttribute('aria-expanded', 'false');
      item.classList.remove('is-active-accordion');
      content.classList.remove('is-active-accordion');
      if (arrow) arrow.classList.remove('is-active-accordion');
      if (plus) plus.classList.remove('is-active-accordion');
    });
    content.addEventListener('transitionend', () => {
      if (!item.classList.contains('is-active-accordion')) {
        content.style.visibility = 'hidden';
        content.style.display = 'none';
      }
    }, {
      once: true
    });
  }
}
// Initialize
new PBAccordion();

// Inline script 8 from lp01.html
// Initialize (class already defined above)
new PBAccordion();

// Inline script 9 from lp01.html
document.querySelectorAll('[swiper="sw08"]').forEach((sliderComponent) => {
  // Get elements
  const sliderEl = sliderComponent.querySelector('[swiper="slider"]');
  const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
  const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
  const paginationEl = sliderComponent.querySelector('[swiper="pagination"]');
  const thumbnailsHolder = document.querySelector('[swiper="thumbnails-holder"]');
  // Initialize main swiper
  const mainSwiper = new Swiper(sliderEl, {
    slidesPerView: 1,
    spaceBetween: 16,
    direction: 'horizontal',
    navigation: {
      nextEl: buttonNextEl,
      prevEl: buttonPrevEl,
    },
    pagination: {
      el: paginationEl,
    },
    breakpoints: {
      768: {
        spaceBetween: 32,
      },
    },
    on: {
      slideChange: function() {
        // Update thumbnails when slide changes
        if (thumbnailsHolder) {
          const thumbnails = thumbnailsHolder.querySelectorAll('[swiper="gallery-thumbnail"]');
          thumbnails.forEach((thumbnail, index) => {
            if (index === this.activeIndex) {
              thumbnail.setAttribute('swiper-state', 'active');
              thumbnail.classList.add('is-current');
            } else {
              thumbnail.removeAttribute('swiper-state');
              thumbnail.classList.remove('is-current');
            }
          });
        }
      },
      init: function() {
        // Set initial active state
        if (thumbnailsHolder) {
          const firstThumbnail = thumbnailsHolder.querySelector('[swiper="gallery-thumbnail"]');
          if (firstThumbnail) {
            firstThumbnail.setAttribute('swiper-state', 'active');
            firstThumbnail.classList.add('is-current');
          }
        }
      }
    }
  });
  // Set up thumbnail click handlers
  if (thumbnailsHolder) {
    const thumbnails = thumbnailsHolder.querySelectorAll('[swiper="gallery-thumbnail"]');
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.style.userSelect = 'none';
      thumbnail.setAttribute('tabindex', '0');
      // Add click handler
      thumbnail.addEventListener('click', () => {
        mainSwiper.slideTo(index);
      });
      // Add keyboard support
      thumbnail.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          mainSwiper.slideTo(index);
        }
      });
    });
  }
});

// Inline script 10 from lp01.html
// Initialize (class already defined above)
new PBAccordion();