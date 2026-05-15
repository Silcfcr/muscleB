// ============================================
// MUSCLE B LANDING PAGE
// ============================================

let currentLanguage = 'en';
let currentMenuLang = 'en';
let contentData = {};
let currentCategory = 'protein';
let currentMenuIndex = 0;
let menuItems = [];
let itemsPerView = 3;

// ============================================
// INIT
// ============================================

async function init() {
  try {
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) currentLanguage = savedLang;

    const response = await fetch('content.json');
    contentData = await response.json();

    updateLanguage(currentLanguage);
    setupCarousel();
    setupEventListeners();
    setupMobileNav();
    setupFullMenu();
    setupLightbox();
    setupRevealAnimations();
    setupSmoothScroll();
    updateMenuDisplay();
    updateReviews();

    handleResize();
    window.addEventListener('resize', handleResize);
  } catch (error) {
    console.error('Error loading content:', error);
  }
}

// ============================================
// i18n
// ============================================

function updateLanguage(lang) {
  if (!contentData[lang]) return;
  currentLanguage = lang;
  const content = contentData[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = getNestedValue(content, key);
    if (value !== undefined && value !== null) {
      el.textContent = value;
    }
  });

  updateHeroSection(content);
  updateAboutSection(content);
  updateMenuSection(content);
  updateReviewsSection(content);
  updateLocationSection(content);
  updateFooterSection(content);

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('selectedLanguage', lang);
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

function updateHeroSection(content) {
  const hero = content.hero;
  document.querySelector('.hero-tagline').textContent = hero.tagline;
  document.querySelector('.hero-subtitle').textContent = hero.subtitle;
  document.querySelector('.hero-description').textContent = hero.description;
  document.getElementById('heroCtaBtn').textContent = hero.cta;
}

function updateAboutSection(content) {
  const about = content.about;
  document.querySelector('.about-subtitle').textContent = about.description;

  const featureCards = document.querySelectorAll('.feature-card');
  about.features.forEach((title, index) => {
    if (featureCards[index]) {
      const h3 = featureCards[index].querySelector('h3');
      if (h3) h3.textContent = title;
    }
  });

  if (about.featureDesc) {
    about.featureDesc.forEach((desc, index) => {
      const p = featureCards[index]?.querySelector('p');
      if (p) p.textContent = desc;
    });
  }
}

function updateMenuSection(content) {
  document.querySelector('.menu-title').textContent = content.menu.title;
  updateMenuDisplay();
}

function updateReviewsSection(content) {
  const reviews = content.reviews;
  document.querySelector('.reviews-title').textContent = reviews.title;
  document.getElementById('ratingNumber').textContent = reviews.rating;
  document.getElementById('reviewCount').textContent = reviews.totalReviews || reviews.count;
  updateReviews();
}

function updateLocationSection(content) {
  const location = content.location;
  document.querySelector('.location-title').textContent = location.title;
  document.getElementById('addressText').textContent = location.address;
  document.getElementById('hoursText').textContent = location.hours.allDays;
  const footerAddr = document.getElementById('footerAddress');
  if (footerAddr) footerAddr.textContent = location.shortAddress || 'Đà Lạt, Lâm Đồng';
}

function updateFooterSection(content) {
  document.getElementById('footerTagline').textContent = content.footer.tagline;
}

// ============================================
// MENU CAROUSEL
// ============================================

function setupCarousel() {
  updateMenuDisplay();
}

function updateMenuDisplay() {
  const content = contentData[currentLanguage];
  if (!content?.menu?.[currentCategory]) return;

  const category = content.menu[currentCategory];
  menuItems = category.items;
  renderCarouselItems();
}

function renderCarouselItems() {
  const track = document.getElementById('carouselTrack');
  track.innerHTML = '';

  menuItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'carousel-item';
    el.innerHTML = `
      <div class="menu-item-name">${escapeHtml(item.name)}</div>
      ${item.protein && item.protein !== '0g' ? `<div class="menu-item-protein">${escapeHtml(item.protein)} protein</div>` : ''}
      <div class="menu-item-description">${escapeHtml(item.description || '')}</div>
      <div class="menu-item-price">${escapeHtml(item.price)}</div>
    `;
    track.appendChild(el);
  });

  const indicatorsContainer = document.getElementById('indicators');
  indicatorsContainer.innerHTML = '';
  const numPages = Math.max(1, Math.ceil(menuItems.length / itemsPerView));

  for (let i = 0; i < numPages; i++) {
    const dot = document.createElement('button');
    dot.className = `indicator-dot ${i === 0 ? 'active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    indicatorsContainer.appendChild(dot);
  }

  currentMenuIndex = 0;
  updateCarouselPosition();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMetric(value) {
  if (!value) return '—';
  return String(value).includes('/') ? value : `${value}/5`;
}

function updateCarouselPosition() {
  const track = document.getElementById('carouselTrack');
  const items = track.querySelectorAll('.carousel-item');
  if (!items.length) return;

  const gap = parseFloat(getComputedStyle(track).gap) || 24;
  const offset = currentMenuIndex * itemsPerView * (items[0].offsetWidth + gap);
  track.style.transform = `translateX(-${offset}px)`;

  document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === currentMenuIndex);
  });
}

function nextSlide() {
  const maxIndex = Math.max(0, Math.ceil(menuItems.length / itemsPerView) - 1);
  currentMenuIndex = currentMenuIndex < maxIndex ? currentMenuIndex + 1 : 0;
  updateCarouselPosition();
}

function previousSlide() {
  const maxIndex = Math.max(0, Math.ceil(menuItems.length / itemsPerView) - 1);
  currentMenuIndex = currentMenuIndex > 0 ? currentMenuIndex - 1 : maxIndex;
  updateCarouselPosition();
}

function goToSlide(index) {
  currentMenuIndex = index;
  updateCarouselPosition();
}

// ============================================
// REVIEWS
// ============================================

function updateReviews() {
  const content = contentData[currentLanguage];
  if (!content?.reviews) return;

  const reviews = content.reviews;
  const container = document.getElementById('reviewsGrid');
  container.innerHTML = '';

  reviews.items.forEach(review => {
    const card = document.createElement('article');
    card.className = 'review-card reveal';
    const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);

    card.innerHTML = `
      <div class="review-header">
        <div>
          <div class="review-author">${escapeHtml(review.name)}</div>
          <div class="review-title">${escapeHtml(review.title)}</div>
        </div>
        <div class="review-rating" aria-label="${review.stars} stars">${stars}</div>
      </div>
      <div class="review-time">${escapeHtml(review.timeAgo)}</div>
      <p class="review-text">${escapeHtml(review.text)}</p>
      <div class="review-metrics">
        <div class="metric-item">
          <span class="metric-label">Food</span>
          <span class="metric-value">${formatMetric(review.food)}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Service</span>
          <span class="metric-value">${formatMetric(review.service)}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Ambiance</span>
          <span class="metric-value">${formatMetric(review.ambiance)}</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  observeRevealElements(container.querySelectorAll('.reveal'));
}

// ============================================
// FULL MENU VIEWER
// ============================================

function setupFullMenu() {
  document.querySelectorAll('.menu-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.menu-lang-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentMenuLang = btn.dataset.menuLang;
      updateMenuImages();
    });
  });

  updateMenuImages();
}

function updateMenuImages() {
  const buttons = document.querySelectorAll('.menu-page-btn');
  buttons.forEach((btn, index) => {
    const src = currentMenuLang === 'vi'
      ? btn.dataset.menuVi
      : btn.dataset.menuEn;
    const img = btn.querySelector('img');
    if (img && src) {
      img.src = src;
      img.alt = `Muscle B menu page ${index + 1} (${currentMenuLang === 'vi' ? 'Vietnamese' : 'English'})`;
    }
  });
}

// ============================================
// LIGHTBOX
// ============================================

function setupLightbox() {
  const dialog = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');

  document.querySelectorAll('.menu-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.querySelector('img')?.src;
      if (!src) return;
      img.src = src;
      dialog.showModal();
    });
  });

  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

// ============================================
// MOBILE NAV
// ============================================

function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const body = document.body;

  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============================================
// REVEAL ANIMATIONS
// ============================================

let revealObserver;

function setupRevealAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    revealObserver = null;
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  observeRevealElements(document.querySelectorAll('.reveal'));
}

function observeRevealElements(elements) {
  if (!revealObserver) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }
  elements.forEach(el => revealObserver.observe(el));
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => updateLanguage(btn.dataset.lang));
  });

  document.querySelectorAll('.menu-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      updateMenuDisplay();
    });
  });

  document.getElementById('prevBtn').addEventListener('click', previousSlide);
  document.getElementById('nextBtn').addEventListener('click', nextSlide);
  document.getElementById('grabBtn').addEventListener('click', openGrab);
  document.getElementById('whatsappBtn').addEventListener('click', openWhatsApp);
  document.getElementById('heroCtaBtn').addEventListener('click', openGrab);
  document.getElementById('shareMenuBtn').addEventListener('click', shareMenu);
}

function openGrab() {
  window.open('https://r.grab.com/g/6-20260515_152542_CA7AB650219B495DA6B65D46B47D04B7_MEXMPS-5-C4N2NLA1WFMAFE', '_blank');
}

function openWhatsApp() {
  const message = encodeURIComponent('Hi, I would like to order from Muscle B!');
  window.open(`https://wa.me/840984344053?text=${message}`, '_blank');
}

function shareMenu() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({
      title: 'Muscle B',
      text: 'Healthy, High Protein Meals in Đà Lạt',
      url
    });
  } else {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function handleResize() {
  const width = window.innerWidth;
  const newItemsPerView = width < 480 ? 1 : width < 1024 ? 2 : 3;
  if (newItemsPerView !== itemsPerView) {
    itemsPerView = newItemsPerView;
    renderCarouselItems();
  } else {
    updateCarouselPosition();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') previousSlide();
  else if (e.key === 'ArrowRight') nextSlide();
  else if (e.key === 'Escape') {
    document.getElementById('lightbox')?.close();
  }
});

document.addEventListener('DOMContentLoaded', init);
