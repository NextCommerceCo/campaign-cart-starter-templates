// JavaScript extracted from templates\checkout\olympus.html

// Swiper gallery: init after DOM + Swiper are ready (Swiper script is deferred)
function initSwiperGalleries() {
  if (typeof Swiper === 'undefined') return;
  document.querySelectorAll('[data-component="swiper"][data-variant="sw1"]').forEach((sliderComponent) => {
    const sliderMain = sliderComponent.querySelector('[swiper="slider-main"]');
    const sliderThumbs = sliderComponent.querySelector('[swiper="slider-thumbs"]');
    const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
    const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
    if (!sliderMain || !sliderThumbs) return;
    // Initialize thumbs swiper first
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
    // Keyboard accessibility for thumbs
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

// Countdown timer (scarcity banner)
document.querySelectorAll('[data-next-element="timer"]').forEach(timer => {
  let [minutes, seconds] = timer.textContent.split(':').map(Number);
  let total = minutes * 60 + seconds;
  setInterval(() => {
    if (total <= 0) return;
    total--;
    const m = Math.floor(total / 60);
    const s = total % 60;
    timer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (total === 0) timer.style.color = '#ff4444';
    else if (total <= 60) timer.style.color = '#ff9800';
  }, 1000);
});
