//Slider functionality
document.addEventListener("DOMContentLoaded", function () {
  const slider = document.querySelector(".hero-slider");
  const slides = document.querySelectorAll(".hero-slider .slide");
  const prevBtn = document.querySelector(".slider-nav.left");
  const nextBtn = document.querySelector(".slider-nav.right");

  let currentIndex = 1; // start from first real slide
  let isAnimating = false;

  // Clone first and last slides
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);

  // Add clones to the slider
  slider.appendChild(firstClone);
  slider.insertBefore(lastClone, slides[0]);

  const allSlides = document.querySelectorAll(".hero-slider .slide"); // updated list
  const totalSlides = allSlides.length;

  // Set initial position
  slider.style.transform = `translateX(-100%)`;

  function goToSlide(index) {
    if (isAnimating) return;
    isAnimating = true;

    slider.style.transition = 'transform 0.8s ease-in-out';
    slider.style.transform = `translateX(-${index * 100}%)`;

    currentIndex = index;

    // Handle looping transition end
    slider.addEventListener('transitionend', () => {
      if (currentIndex === totalSlides - 1) {
        // Moved to fake last (firstClone), jump to real first
        slider.style.transition = 'none';
        slider.style.transform = `translateX(-100%)`;
        currentIndex = 1;
      } else if (currentIndex === 0) {
        // Moved to fake first (lastClone), jump to real last
        slider.style.transition = 'none';
        slider.style.transform = `translateX(-${totalSlides - 2}00%)`;
        currentIndex = totalSlides - 2;
      }
      isAnimating = false;
    }, { once: true });
  }

  // Button Controls
  nextBtn.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });

  prevBtn.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });

  // Auto-slide every 5s
  let autoSlide = setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 5000);

  // Reset auto-slide on manual interaction
  [nextBtn, prevBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      clearInterval(autoSlide);
      autoSlide = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 5000);
    });
  });

  // Data-link redirection
  document.addEventListener("click", function (e) {
    const button = e.target.closest("button[data-link]");
    if (button) {
      const target = button.getAttribute("data-link");
      if (target) {
        window.location.href = target;
      }
    }
  });
});


const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
  bar.addEventListener('click', () => {
    nav.classList.add('active');
    document.body.classList.add('nav-open'); // hide icons
  });
}

if (close) {
  close.addEventListener('click', () => {
    nav.classList.remove('active');
    document.body.classList.remove('nav-open'); // show icons again
  });
}

// Dropdown Toggle for mobile
const dropdownLink = document.querySelector('#navbar li.dropdown > a');
const dropdownMenu = document.querySelector('#navbar li.dropdown ul');

if (dropdownLink && dropdownMenu) {
  dropdownLink.addEventListener('click', (e) => {
    // Only toggle on mobile view
    if (window.innerWidth <= 799) {
      e.preventDefault(); // prevent link jump
      dropdownMenu.classList.toggle('show');
    }
  });
}



