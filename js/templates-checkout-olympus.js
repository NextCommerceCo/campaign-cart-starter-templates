// JavaScript extracted from templates\checkout\olympus.html

// Inline script 4 from olympus.html
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