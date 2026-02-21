// JavaScript extracted from templates\landing-pages\lp04.html

// Inline script 4 from lp04.html
function initiateSlider() {
  document.querySelectorAll('[swiper="HERO-PDP-009"]').forEach((sliderComponent) => {
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
        0: { // From 0px
          slidesPerView: 1.4,
          spaceBetween: 16,
        },
        480: { // From 480px
          slidesPerView: 1.4,
          spaceBetween: 16,
        },
        768: { // From 768px
          slidesPerView: 1,
          spaceBetween: 16,
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

// Inline script 5 from lp04.html
const timelineContainer = document.querySelector('[pb-element="timeline-container"]');
const timelineItems = timelineContainer.querySelectorAll('[pb-element="timeline-item"]');
const timelineLine = timelineContainer.querySelector('[pb-element="timeline-line"]');
const lastDot = timelineContainer.querySelector('[pb-element="timeline-last-dot"]');
// Add CSS transitions dynamically
const style = document.createElement('style');
style.textContent = `
        [pb-element="timeline-dot"] {
            transition: opacity 0.3s ease-out;
            opacity: 0;
        }
        [pb-element="timeline-active-dot"] {
            transition: opacity 0.3s ease-out;
            opacity: 0;
        }
        [pb-element="timeline-active-dot"].cc-active {
            opacity: 1;
        }
        [pb-element="timeline-line"] {
            transition: height 0.1s linear;
        }
    `;
document.head.appendChild(style);
// Reset on page load
timelineLine.style.height = '0%';
lastDot.style.display = 'none';
timelineItems.forEach(item => {
  item.classList.remove('cc-active');
  const activeDot = item.querySelector('[pb-element="timeline-active-dot"]');
  const normalDot = item.querySelector('[pb-element="timeline-dot"]');
  if (activeDot) {
    activeDot.classList.remove('cc-active');
    activeDot.style.opacity = '0';
  }
  if (normalDot) normalDot.style.opacity = '0';
});

function calculateLineHeight() {
  const windowHeight = window.innerHeight;
  const middleScreen = windowHeight / 2;
  const containerRect = timelineContainer.getBoundingClientRect();
  const containerTop = containerRect.top;
  // Calculate distance from container top to middle of screen
  const distanceToMiddle = middleScreen - containerTop;
  // Ensure line doesn't exceed container height
  const maxHeight = containerRect.height;
  const lineHeight = Math.max(0, Math.min(distanceToMiddle, maxHeight));
  return (lineHeight / maxHeight) * 100;
}

function isElementInMiddleViewport(element, lineHeight) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const middlePoint = windowHeight / 2;
  const elementMiddle = rect.top + (rect.height / 2);
  const containerRect = timelineContainer.getBoundingClientRect();
  // Calculate the element's position relative to the container
  const elementPositionInContainer = rect.top - containerRect.top;
  const containerHeight = containerRect.height;
  const elementPercentage = (elementPositionInContainer / containerHeight) * 100;
  // Only consider the element in middle viewport if the line has reached it
  return Math.abs(elementMiddle - middlePoint) < 100 && lineHeight >= elementPercentage;
}

function activateDots(normalDot, activeDot) {
  if (normalDot) {
    normalDot.style.opacity = '1';
  }
  setTimeout(() => {
    if (normalDot) {
      normalDot.style.opacity = '0';
    }
    if (activeDot) {
      activeDot.style.opacity = '1';
      activeDot.classList.add('cc-active');
    }
  }, 300);
}

function deactivateDots(normalDot, activeDot) {
  if (activeDot) {
    activeDot.style.opacity = '0';
    activeDot.classList.remove('cc-active');
  }
  if (normalDot) {
    normalDot.style.opacity = '0';
  }
}

function updateTimeline() {
  const lineHeightPercentage = calculateLineHeight();
  timelineLine.style.height = `${lineHeightPercentage}%`;
  timelineItems.forEach((item, index) => {
    const normalDot = item.querySelector('[pb-element="timeline-dot"]');
    const activeDot = item.querySelector('[pb-element="timeline-active-dot"]');
    if (isElementInMiddleViewport(item, lineHeightPercentage)) {
      if (!item.classList.contains('cc-active')) {
        item.classList.add('cc-active');
        activateDots(normalDot, activeDot);
      }
    } else {
      const rect = item.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top + (rect.height / 2) > windowHeight / 2) {
        if (item.classList.contains('cc-active')) {
          item.classList.remove('cc-active');
          deactivateDots(normalDot, activeDot);
        }
      }
    }
  });
  // Show last dot when line reaches the end
  if (lineHeightPercentage >= 98) {
    lastDot.style.display = 'block';
  } else {
    lastDot.style.display = 'none';
  }
}
// Add scroll event listener with requestAnimationFrame for better performance
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateTimeline();
      ticking = false;
    });
    ticking = true;
  }
});
// Initial check
updateTimeline();

// Inline script 6 from lp04.html
const seeMoreBtn = document.querySelector('[pb-element="te08-button"]');
const btnText = document.querySelector('[pb-element="te08-text"]');
const arrow = document.querySelector('[pb-element="te08-arrow"]');
seeMoreBtn.addEventListener('click', function() {
  // Toggle data-expanded attribute
  const isExpanded = this.getAttribute('data-expanded') === 'true';
  this.setAttribute('data-expanded', !isExpanded);
  // Toggle hidden elements using attribute selector
  document.querySelectorAll('[data-expanded-card="true"]').forEach(element => {
    element.classList.toggle('cc-hidden');
  });
  // Update button text
  btnText.textContent = isExpanded ? 'See All 9' : 'See Less';
  // Rotate arrow
  arrow.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
  arrow.style.transition = 'transform 0.3s ease';
});