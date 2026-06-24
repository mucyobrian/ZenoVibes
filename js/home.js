// ================================================
// SOKOHUB – home.js  (homepage logic)
// ================================================

let allProducts = [];
let activeCat = 'all';
let nearMeActive = false;
let activeSubcat = {}; // { categoryId: 'subcategoryName' | null }

// ── Init ─────────────────────────────────────────
async function initHome() {
  applyHeroForCategory('all');

  buildCategoryPills();
  populateCategoryFilter();

  // Warm the favorites cache first so heart icons render correctly
  // on the very first paint of the product cards below.
  await DB.getFavorites();

  try {
    allProducts = await DB.getProducts();
    // Merge in any listing that hasn't synced to the Sheet yet (id starts with 'local_')
    const liveNames = new Set(allProducts.map(p => p.productName));
    const stillLocalOnly = JSON.parse(localStorage.getItem('sokohub_my_listings') || '[]')
      .filter(p => String(p.id).startsWith('local_') && !liveNames.has(p.productName));
    if (stillLocalOnly.length) {
      allProducts = [...stillLocalOnly, ...allProducts];
    }
    updateStats();
    buildCategorySections();
  } catch (err) {
    console.error('Failed to load products', err);
    document.getElementById('categorySections').innerHTML =
      '<p class="no-results" style="display:block">Failed to load products. Please refresh.</p>';
  }
}

// ── Top-level category nav icons (inline SVG, stroke uses currentColor so
//    they inherit the pill's text color automatically) ──
const TOPCAT_ICONS = {
  all:          '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
  clothing:     '<path d="M8 3l4 2 4-2 3 4-2.5 2v10a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1V9L4 7z"/>',
  shoes:        '<path d="M3 17c0-2 1.5-3 3-4l6-3c1-2 3-3 5-3 1.5 0 2 1 2 2v3c2 0 4 1 4 3v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  jewelry:      '<circle cx="12" cy="12" r="7"/><path d="M9 9l3-4 3 4M9 12h6"/>',
  accessories:  '<path d="M7 8V6a5 5 0 0 1 10 0v2"/><rect x="3" y="8" width="18" height="13" rx="2"/>',
  kids:         '<circle cx="12" cy="8" r="3"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/>',
  home:         '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  beauty:       '<path d="M12 2v6M9 5h6"/><path d="M7 11h10l-1 10H8z"/>',
  telecom:      '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  electronics:  '<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M8 21h8M12 17v4"/>',
  hair:         '<path d="M5 4c4 0 4 4 7 4s3-4 7-4M5 4c0 8 2 16 7 16s7-8 7-16"/>',
  computer:     '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M2 20h20M9 20l1-4h4l1 4"/>',
  automobile:   '<path d="M3 13l2-6h14l2 6"/><path d="M3 13h18v5H3z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>',
  sports:       '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/>',
  furniture:    '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M4 11h16v6H4z"/><path d="M5 17v2M19 17v2"/>',
  vehicles:     '<path d="M3 13l2-6h14l2 6"/><path d="M3 13h18v5H3z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>',
  food:         '<path d="M6 2v7a3 3 0 0 0 6 0V2M9 9v13M17 2c-2 0-3 2-3 5s1 5 3 5 0 0 0 0v6"/>',
  books:        '<path d="M4 4h7v17H4zM13 4h7v17h-7z"/>',
  agriculture:  '<path d="M12 22V12M12 12c0-4-3-7-7-7 0 4 3 7 7 7zM12 12c0-4 3-7 7-7 0 4-3 7-7 7z"/>',
  services:     '<path d="M14.7 6.3a4 4 0 0 1 0 5.6l-7 7a2 2 0 0 1-2.8-2.8l7-7a4 4 0 0 1 5.6 0z"/><path d="M16 2l2 2-2 2-2-2z"/>',
  property:     '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 21v-6h6v6"/>',
  free:         '<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 9l9-5 9 5M12 9v11M7 9c0-2 1-4 2-4M17 9c0-2-1-4-2-4"/>',
  other:        '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
};

// ── Swap hero banner + headline/subtext for the active category ──
function applyHeroForCategory(catId) {
  const hero  = document.getElementById('heroSection');
  const title = document.getElementById('heroTitle');
  const sub   = document.getElementById('heroSub');
  if (!hero) return;

  const cat = CONFIG.CATEGORIES.find(c => c.id === catId) || CONFIG.CATEGORIES.find(c => c.id === 'all');

  if (title) title.innerHTML = cat?.heroTitle || 'Find used stuff near you';
  if (sub)   sub.textContent = cat?.heroSub || 'No fees. Post your used stuff. Someone will take it.';
}

// ── Build category pills (SHEIN-style nav row: icon + text) ─────
function buildCategoryPills() {
  const container = document.getElementById('catPills');
  if (!container) return;
  container.innerHTML = CONFIG.CATEGORIES.map(cat => `
    <button class="cat-pill ${cat.id === 'all' ? 'active' : ''}"
      onclick="selectCategory('${cat.id}', this)">
      <svg class="pill-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        ${TOPCAT_ICONS[cat.id] || TOPCAT_ICONS.other}
      </svg>
      <span>${cat.label}</span>
    </button>
  `).join('');
}

// ── Populate category image picker ───────────────
function populateCategoryFilter() {
  const dropdown = document.getElementById('catPickerDropdown');
  if (!dropdown) return;
  const allCats = CONFIG.CATEGORIES;
  dropdown.innerHTML = allCats.map(cat => `
    <button type="button" onclick="selectCatFromPicker('${cat.id}')" style="
      display:flex;align-items:center;gap:10px;width:100%;
      padding:9px 14px;border:none;background:none;cursor:pointer;
      font-size:0.9rem;color:var(--text);text-align:left;font-family:inherit;
      transition:background 0.12s;
    " onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='none'">
      <img src="${cat.image}" alt="${cat.label}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0"
        onerror="this.style.display='none'"/>
      <span>${cat.label}</span>
    </button>
  `).join('');
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!document.getElementById('catPickerWrap')?.contains(e.target)) {
      document.getElementById('catPickerDropdown').style.display = 'none';
    }
  });
}

function toggleCatPicker() {
  const dd = document.getElementById('catPickerDropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function selectCatFromPicker(catId) {
  const cat = CONFIG.CATEGORIES.find(c => c.id === catId);
  const label = document.getElementById('catPickerLabel');
  const thumb = document.getElementById('catPickerThumb');
  const hidden = document.getElementById('filterCat');
  if (catId === 'all' || !cat) {
    label.textContent = 'All Categories';
    thumb.style.display = 'none';
    hidden.value = '';
  } else {
    label.textContent = cat.label;
    thumb.src = cat.image;
    thumb.style.display = 'block';
    hidden.value = catId;
  }
  document.getElementById('catPickerDropdown').style.display = 'none';
  // Sync category pills
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  const pill = [...document.querySelectorAll('.cat-pill')].find(p => p.getAttribute('onclick')?.includes(`'${catId}'`));
  if (pill) pill.classList.add('active');
  activeCat = catId === 'all' ? 'all' : catId;
  applyHeroForCategory(activeCat);
  buildCategorySections();
}

// ── Category pill click ──────────────────────────
function selectCategory(catId, el) {
  activeCat = catId;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  applyHeroForCategory(catId);
  // Sync hidden input
  const filterCat = document.getElementById('filterCat');
  if (filterCat) filterCat.value = catId === 'all' ? '' : catId;
  // Sync image picker display
  const cat = CONFIG.CATEGORIES.find(c => c.id === catId);
  const label = document.getElementById('catPickerLabel');
  const thumb = document.getElementById('catPickerThumb');
  if (label && thumb) {
    if (!cat || catId === 'all') {
      label.textContent = 'All Categories';
      thumb.style.display = 'none';
    } else {
      label.textContent = cat.label;
      thumb.src = cat.image;
      thumb.style.display = 'block';
    }
  }
  applyFilters();
}

// ── Near Me toggle ───────────────────────────────
function toggleNearMe() {
  const toggle = document.getElementById('nearMeToggle');
  nearMeActive = toggle?.checked || false;

  if (nearMeActive && !getUserLocation()) {
    requestLocation(null);
    return;
  }
  applyFilters();
}

// ── Main filter trigger (price / sort / near-me / category dropdown) ──
function applyFilters() {
  const cat = document.getElementById('filterCat')?.value || '';
  if (cat) activeCat = cat;
  else if (document.getElementById('filterCat')) activeCat = 'all';
  buildCategorySections();
}

// ── Get filtered+sorted products for one category (respects global filters) ──
// Pass catId=null + allCats=true to get every product (the "All" flat grid).
function getProductsForCategory(catId, allCats) {
  const minP   = parseFloat(document.getElementById('minPrice')?.value || '0') || 0;
  const maxP   = parseFloat(document.getElementById('maxPrice')?.value || '0') || Infinity;
  const sortBy = document.getElementById('sortBy')?.value || 'newest';
  const loc    = getUserLocation();
  const subcat = catId ? activeSubcat[catId] : null;

  let list = allProducts.filter(p => {
    if (!allCats && p.category !== catId) return false;
    if (subcat && p.subcategory !== subcat) return false;
    if (p.price < minP) return false;
    if (maxP !== Infinity && p.price > maxP) return false;
    if (nearMeActive && loc && p.sellerLat) {
      const dist = DB.getDistanceKm(loc.lat, loc.lng, p.sellerLat, p.sellerLng);
      if (dist > CONFIG.NEAR_RADIUS_KM) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (sortBy === 'price-asc')  return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'near' && loc && a.sellerLat && b.sellerLat) {
      return DB.getDistanceKm(loc.lat, loc.lng, a.sellerLat, a.sellerLng)
           - DB.getDistanceKm(loc.lat, loc.lng, b.sellerLat, b.sellerLng);
    }
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return list;
}

// ── Build the section below the hero: subcat circles (if a specific
//    category is active) + that category's product grid. "All" just
//    shows one flat grid of every product, no per-category stacking. ──
function buildCategorySections() {
  const container = document.getElementById('categorySections');
  const noRes = document.getElementById('noResults');
  if (!container) return;

  const loc = getUserLocation();

  // ── "All" → flat grid, no subcat circles ──
  if (activeCat === 'all') {
    const products = getProductsForCategory(null, true); // null = no category filter
    container.innerHTML = products.length
      ? `<div class="products-grid">${products.map(p => buildProductCard(p, loc?.lat, loc?.lng)).join('')}</div>`
      : '';
    if (noRes) noRes.classList.toggle('hidden', products.length > 0);
    return;
  }

  // ── Specific category → subcat circles + that category's grid ──
  const cat = CONFIG.CATEGORIES.find(c => c.id === activeCat);
  const allCatProducts = allProducts.filter(p => p.category === activeCat);
  const subcats = CONFIG.SUBCATEGORIES[activeCat] || [];

  const subcatsWithProducts = subcats.filter(sc =>
    allCatProducts.some(p => p.subcategory === sc)
  );

  const subcatCirclesHtml = subcatsWithProducts.map(sc => `
    <div class="subcat-item ${activeSubcat[activeCat] === sc ? 'active' : ''}" onclick="selectSubcat('${activeCat}','${escAttr(sc)}')">
      <div class="subcat-circle">
        <img class="subcat-img" src="${getSubcatImage(activeCat, sc)}" alt="${escHtml(sc)}"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
        <span class="subcat-fallback" style="display:none">${getSubcatEmoji(activeCat, sc)}</span>
      </div>
      <div class="subcat-label">${escHtml(sc)}</div>
    </div>`).join('');

  const productsForThisCat = getProductsForCategory(activeCat);
  const productsHtml = productsForThisCat.length
    ? productsForThisCat.map(p => buildProductCard(p, loc?.lat, loc?.lng)).join('')
    : '';

  container.innerHTML = `
    <section class="cat-section">
      ${subcatCirclesHtml ? `<div class="subcat-row">${subcatCirclesHtml}</div>` : ''}
      <div class="cat-section-head">
        <div class="cat-section-title">${cat?.label || activeCat}
          <span class="cat-section-count">(${productsForThisCat.length})</span>
        </div>
      </div>
      <div class="products-grid">${productsHtml}</div>
    </section>`;

  if (noRes) noRes.classList.toggle('hidden', productsForThisCat.length > 0);
}

// ── Subcategory circle click (toggle filter within that category) ──
function selectSubcat(catId, subcat) {
  if (activeSubcat[catId] === subcat) {
    activeSubcat[catId] = null; // tap again to clear
  } else {
    activeSubcat[catId] = subcat;
  }
  buildCategorySections();
}

// SUBCAT_EMOJI, getSubcatEmoji, and getSubcatImage now live in app.js
// (shared with pages/categories.html, which also needs them).

function escAttr(str) {
  return String(str || '').replace(/'/g, "\\'");
}

function updateStats() {
  const statP = document.getElementById('statProducts');
  const statS = document.getElementById('statSellers');
  if (statP) statP.textContent = allProducts.length + '+';
  if (statS) {
    const sellers = new Set(allProducts.map(p => p.sellerPhone)).size;
    statS.textContent = sellers + '+';
  }
}

// ── Clear all filters ────────────────────────────
function clearFilters() {
  activeCat = 'all';
  nearMeActive = false;
  activeSubcat = {};
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  const firstPill = document.querySelector('.cat-pill');
  if (firstPill) firstPill.classList.add('active');
  const filterCat  = document.getElementById('filterCat');
  const minPrice   = document.getElementById('minPrice');
  const maxPrice   = document.getElementById('maxPrice');
  const sortBy     = document.getElementById('sortBy');
  const nearToggle = document.getElementById('nearMeToggle');
  if (filterCat)  filterCat.value = '';
  if (minPrice)   minPrice.value = '';
  if (maxPrice)   maxPrice.value = '';
  if (sortBy)     sortBy.value = 'newest';
  if (nearToggle) nearToggle.checked = false;
  const label = document.getElementById('catPickerLabel');
  const thumb = document.getElementById('catPickerThumb');
  if (label) label.textContent = 'All Categories';
  if (thumb) thumb.style.display = 'none';
  applyHeroForCategory('all');
  applyFilters();
}

// ── Promo carousel (auto-scrolling banner) ───────
function initPromoCarousel() {
  const track = document.getElementById('promoTrack');
  const dotsWrap = document.getElementById('promoDots');
  if (!track || !dotsWrap) return;

  const slides = track.querySelectorAll('.promo-slide');
  const dots = dotsWrap.querySelectorAll('.promo-dot');
  if (!slides.length) return;

  let current = 0;
  let timer = null;
  const AUTO_DELAY = 4000;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, AUTO_DELAY);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAuto(); // reset timer after manual interaction
    });
  });

  // Pause while the user is interacting, resume after
  const section = document.getElementById('promoCarousel');
  section.addEventListener('mouseenter', stopAuto);
  section.addEventListener('mouseleave', startAuto);
  section.addEventListener('touchstart', stopAuto, { passive: true });
  section.addEventListener('touchend', startAuto, { passive: true });

  goTo(0);
  startAuto();
}

// ── Category strip: hide on scroll-down, reveal on scroll-up ──
function initCatStripScroll() {
  const strip = document.querySelector('.cat-strip--scrollhide');
  if (!strip) return;

  let lastY = window.scrollY;
  let ticking = false;
  const SHOW_NEAR_TOP = 40; // always show once back near the very top
  const THRESHOLD = 6;      // ignore tiny jitters (e.g. iOS rubber-banding)

  function onScroll() {
    const y = window.scrollY;
    const delta = y - lastY;

    if (y <= SHOW_NEAR_TOP) {
      strip.classList.remove('cat-strip--hidden');
    } else if (Math.abs(delta) > THRESHOLD) {
      if (delta > 0) {
        strip.classList.add('cat-strip--hidden');   // scrolling down → hide
      } else {
        strip.classList.remove('cat-strip--hidden'); // scrolling up → reveal
      }
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
}

// ── Boot ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initHome);
document.addEventListener('DOMContentLoaded', initPromoCarousel);
document.addEventListener('DOMContentLoaded', initCatStripScroll);
