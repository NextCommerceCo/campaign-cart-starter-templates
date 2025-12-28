// JavaScript extracted from templates\upsells\up02.html

// Inline script 4 from up02.html
document.querySelectorAll('[swiper="sw12"]').forEach((sliderComponent) => {
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

// Inline script 5 from up02.html
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