// JavaScript extracted from templates\landing-pages\lp03.html

// Inline script 4 from lp03.html
function initiateSlider() {
  document.querySelectorAll('[swiper="sw08"]').forEach((sliderComponent) => {
    let currentSlide = 0;
    const swiperStyle = document.createElement('style');
    swiperStyle.innerHTML = `.swiper-button-disabled {opacity: 30%!important}`;
    document.body.appendChild(swiperStyle);
    const numberOfSlides = document
      .querySelector('[swiper="thumbnails-holder"]')
      .querySelectorAll('[swiper="gallery-thumbnail"]').length - 1;
    const sliderEl = sliderComponent.querySelector('[swiper="slider"]');
    const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
    const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
    const scrollbarEl = sliderComponent.querySelector('[swiper="scrollbar"]');
    const paginationEl = sliderComponent.querySelector('[swiper="pagination"]');
    const swiperModule = new Swiper(sliderEl, {
      slidesPerView: 1,
      spaceBetween: 16,
      direction: 'horizontal',
      navigation: {
        nextEl: buttonNextEl,
        prevEl: buttonPrevEl,
      },
      on: {
        slideChange: function() {
          currentSlide = this.activeIndex;
          updateActiveStates(currentSlide);
        },
      },
      pagination: {
        el: paginationEl,
      },
      breakpoints: {
        768: {
          spaceBetween: 32,
        },
      },
    });
    if (currentSlide == 0) {
      buttonPrevEl.classList.add('swiper-button-disabled');
    } else {
      buttonPrevEl.classList.remove('swiper-button-disabled');
    }
    document.querySelectorAll('[swiper="thumbnails-holder"]').forEach((container) =>
      container.querySelectorAll('[swiper="gallery-thumbnail"]').forEach((el, i) => {
        el.style.userSelect = 'none';
        el.addEventListener('click', (e) => {
          swiperModule.slideTo(i);
          currentSlide = i;
          updateActiveStates(currentSlide);
        });
      })
    );
    // Initial state
    updateActiveStates(0);
  });
}

function updateActiveStates(activeIndex) {
  // Update thumbnails
  document.querySelectorAll('[swiper="thumbnails-holder"]').forEach((container) =>
    container.querySelectorAll('[swiper="gallery-thumbnail"]').forEach((el, i) => {
      if (i === activeIndex) {
        el.setAttribute('swiper-state', 'active');
        el.classList.add('is-current');
      } else {
        el.removeAttribute('swiper-state');
        el.classList.remove('is-current');
      }
    })
  );
  // Update slides
  document.querySelectorAll('.swiper-slide').forEach((slide, i) => {
    if (i === activeIndex) {
      slide.classList.add('is-current');
    } else {
      slide.classList.remove('is-current');
    }
  });
}
initiateSlider();

// Inline script 5 from lp03.html
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