// Shared utilities for upsell templates

// Swiper gallery: init after DOM + Swiper are ready (Swiper script is deferred)
// thumbsPerView — number of visible thumbnail slides (default 6, use 5 for portrait-ratio layouts)
function initSwiperGalleries(thumbsPerView = 6) {
  if (typeof Swiper === 'undefined') return;
  document.querySelectorAll('[data-component="swiper"][data-variant="sw1"]').forEach((sliderComponent) => {
    const sliderMain = sliderComponent.querySelector('[swiper="slider-main"]');
    const sliderThumbs = sliderComponent.querySelector('[swiper="slider-thumbs"]');
    const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
    const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
    if (!sliderMain || !sliderThumbs) return;
    const thumbsSwiper = new Swiper(sliderThumbs, {
      slidesPerView: thumbsPerView,
      spaceBetween: 10,
      freeMode: false,
      watchSlidesProgress: true,
      watchOverflow: true,
      centerInsufficientSlides: true,
      breakpoints: {
        768: { slidesPerView: thumbsPerView, spaceBetween: 10 },
        480: { slidesPerView: thumbsPerView, spaceBetween: 8 },
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
