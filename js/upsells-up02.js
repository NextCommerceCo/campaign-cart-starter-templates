// JavaScript extracted from templates\upsells\up02.html

// Swiper gallery: init after DOM + Swiper are ready (Swiper script is deferred)
function initSwiperGalleries() {
  if (typeof Swiper === 'undefined') return;
  document.querySelectorAll('[data-component="swiper"][data-variant="sw1"]').forEach((sliderComponent) => {
    const sliderMain = sliderComponent.querySelector('[swiper="slider-main"]');
    const sliderThumbs = sliderComponent.querySelector('[swiper="slider-thumbs"]');
    const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
    const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
    if (!sliderMain || !sliderThumbs) return;
    const thumbsSwiper = new Swiper(sliderThumbs, {
      slidesPerView: 6,
      spaceBetween: 10,
      freeMode: false,
      watchSlidesProgress: true,
      watchOverflow: true,
      centerInsufficientSlides: true,
      breakpoints: {
        768: { slidesPerView: 6, spaceBetween: 10 },
        480: { slidesPerView: 6, spaceBetween: 8 },
      },
    });
    new Swiper(sliderMain, {
      slidesPerView: 1,
      spaceBetween: 0,
      navigation: { nextEl: buttonNextEl, prevEl: buttonPrevEl },
      thumbs: { swiper: thumbsSwiper },
    });
    sliderThumbs.querySelectorAll('.swiper-slide').forEach((slide, index) => {
      slide.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          thumbsSwiper.slideTo(index, 300);
        }
      });
    });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSwiperGalleries);
} else {
  initSwiperGalleries();
}

// Inline script 5 from up01.html
function preventBack() {
  window.history.forward();
}
setTimeout(preventBack, 0);
window.onunload = function() {};