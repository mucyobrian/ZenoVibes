// ================================================
// SOKOHUB – home.js  (homepage logic)
// ================================================

let allProducts = [];
let activeCat = 'all';
let nearMeActive = false;
let activeSubcat = {}; // { categoryId: 'subcategoryName' | null }

// ── Init ─────────────────────────────────────────
async function initHome() {
  buildCategoryPills();
  populateCategoryFilter();

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

// ── Top-level category fallback icons (used only if the thumbnail image fails to load) ──
const TOPCAT_EMOJI = {
  all: '🗂️', electronics: '📱', fashion: '👗', accessories: '👜', food: '🥑',
  furniture: '🛋️', vehicles: '🚗', health: '💊', sports: '⚽', books: '📚',
  agriculture: '🌾', services: '🛠️', property: '🏠', babies: '🧸', other: '📦',
};

// ── Build category pills ─────────────────────────
function buildCategoryPills() {
  const container = document.getElementById('catPills');
  if (!container) return;
  container.innerHTML = CONFIG.CATEGORIES.map(cat => `
    <button class="cat-pill ${cat.id === 'all' ? 'active' : ''}"
      onclick="selectCategory('${cat.id}', this)">
      <div class="pill-thumb">
        <img class="pill-img" src="${cat.image}" alt="${cat.label}"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
        <span class="pill-fallback" style="display:none">${TOPCAT_EMOJI[cat.id] || '📦'}</span>
      </div>
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
  buildCategorySections();
}

// ── Category pill click ──────────────────────────
function selectCategory(catId, el) {
  activeCat = catId;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
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
function getProductsForCategory(catId) {
  const minP   = parseFloat(document.getElementById('minPrice')?.value || '0') || 0;
  const maxP   = parseFloat(document.getElementById('maxPrice')?.value || '0') || Infinity;
  const sortBy = document.getElementById('sortBy')?.value || 'newest';
  const loc    = getUserLocation();
  const subcat = activeSubcat[catId];

  let list = allProducts.filter(p => {
    if (p.category !== catId) return false;
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

// ── Build all category sections (subcategory circles + product row) ──
function buildCategorySections() {
  const container = document.getElementById('categorySections');
  const noRes = document.getElementById('noResults');
  if (!container) return;

  const categoriesToShow = activeCat === 'all'
    ? CONFIG.CATEGORIES.filter(c => c.id !== 'all')
    : CONFIG.CATEGORIES.filter(c => c.id === activeCat);

  let anyVisible = false;
  const sectionsHtml = categoriesToShow.map(cat => {
    const allCatProducts = allProducts.filter(p => p.category === cat.id);
    if (allCatProducts.length === 0) return ''; // skip categories with zero products entirely

    anyVisible = true;
    const subcats = CONFIG.SUBCATEGORIES[cat.id] || [];

    // Only show subcategory circles that actually have at least 1 product
    const subcatsWithProducts = subcats.filter(sc =>
      allCatProducts.some(p => p.subcategory === sc)
    );

    const subcatCirclesHtml = subcatsWithProducts.map(sc => `
      <div class="subcat-item ${activeSubcat[cat.id] === sc ? 'active' : ''}" onclick="selectSubcat('${cat.id}','${escAttr(sc)}')">
        <div class="subcat-circle">
          <img class="subcat-img" src="${cat.image}" alt="${escHtml(sc)}"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
          <span class="subcat-fallback" style="display:none">${getSubcatEmoji(cat.id, sc)}</span>
        </div>
        <div class="subcat-label">${escHtml(sc)}</div>
      </div>`).join('');

    const productsForThisCat = getProductsForCategory(cat.id);
    const loc = getUserLocation();
    const productsHtml = productsForThisCat.length
      ? productsForThisCat.map(p => buildProductCard(p, loc?.lat, loc?.lng)).join('')
      : `<p class="cat-section-empty">No products match the current filters in this category.</p>`;

    return `
    <section class="cat-section">
      <div class="cat-section-head">
        <div class="cat-section-title">
          <img class="cat-section-img" src="${cat.image}" alt="${cat.label}" onerror="this.style.display='none'" /> ${cat.label}
          <span class="cat-section-count">(${productsForThisCat.length})</span>
        </div>
        <a href="pages/categories.html?cat=${cat.id}" class="see-all">See all →</a>
      </div>
      ${subcatCirclesHtml ? `<div class="subcat-row">${subcatCirclesHtml}</div>` : ''}
      <div class="cat-products-row">${productsHtml}</div>
    </section>`;
  }).join('');

  container.innerHTML = sectionsHtml;

  if (!anyVisible) {
    if (noRes) noRes.classList.remove('hidden');
  } else {
    if (noRes) noRes.classList.add('hidden');
  }
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

// ── Subcategory emoji mapping (simple heuristic, falls back to category emoji) ──
const SUBCAT_EMOJI = {
  'Phones': '📱', 'Laptops': '💻', 'Tablets': '📱', 'TVs': '📺', 'Cameras': '📷', 'Audio': '🎧',
  "Men's Clothing": '👔', "Women's Clothing": '👗', 'Shoes': '👟', 'Bags': '👜', 'Jewelry': '💍', 'Watches': '⌚',
  'Belts': '🪢', 'Sunglasses': '🕶️', 'Hats': '🎩', 'Scarves': '🧣',
  'Fresh Produce': '🥑', 'Packaged Food': '📦', 'Beverages': '🥤', 'Snacks': '🍿', 'Homemade': '🍞',
  'Sofas': '🛋️', 'Beds': '🛏️', 'Tables': '🪑', 'Chairs': '🪑', 'Storage': '🗄️', 'Decor': '🖼️',
  'Cars': '🚗', 'Motorcycles': '🏍️', 'Bicycles': '🚲', 'Trucks': '🚚', 'Parts': '🔧',
  'Skincare': '🧴', 'Makeup': '💄', 'Hair Care': '💇', 'Supplements': '💊', 'Medical': '🩺',
  'Football': '⚽', 'Basketball': '🏀', 'Gym Equipment': '🏋️', 'Outdoor': '⛺', 'Cycling': '🚴',
  'Textbooks': '📚', 'Novels': '📖', 'Magazines': '📰', 'Stationery': '✏️', 'Arts & Crafts': '🎨',
  'Seeds': '🌱', 'Tools': '🛠️', 'Livestock': '🐄', 'Fertilizers': '🧪', 'Produce': '🌾',
  'Plumbing': '🔧', 'Electrical': '💡', 'Cleaning': '🧹', 'Tutoring': '🎓', 'Photography': '📸',
  'For Rent': '🏠', 'For Sale': '🏡', 'Land': '🗺️', 'Office Space': '🏢',
  'Clothing': '👶', 'Toys': '🧸', 'Feeding': '🍼', 'Strollers': '🚼', 'Safety': '🛡️',
};

function getSubcatEmoji(catId, subcat) {
  return SUBCAT_EMOJI[subcat] || getCatEmoji(catId);
}

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
  applyFilters();
}

// ── Boot ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initHome);
