// JavaScript extracted from templates\landing-pages\lp05.html

// Inline script 4 from lp05.html
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

// Inline script 5 from lp05.html
(() => {
  var t = "https://cdn.jsdelivr.net/npm/@finsweet/attributes-accordion@1/accordion.js",
    e = document.querySelector(`script[src="${t}"]`);
  e || (e = document.createElement("script"), e.async = !0, e.src = t, document.head.append(e));
})();