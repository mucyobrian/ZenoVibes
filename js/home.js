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

// ── Top-level category fallback icons (used only if the thumbnail image fails to load) ──
const TOPCAT_EMOJI = {
  all: '🗂️', electronics: '📱', fashion: '👗', accessories: '👜', food: '🥑',
  furniture: '🛋️', vehicles: '🚗', health: '💊', sports: '⚽', books: '📚',
  agriculture: '🌾', services: '🛠️', property: '🏠', babies: '🧸', other: '📦',
};

// ── Swap hero banner + headline/subtext for the active category ──
function applyHeroForCategory(catId) {
  const hero  = document.getElementById('heroSection');
  const title = document.getElementById('heroTitle');
  const sub   = document.getElementById('heroSub');
  if (!hero) return;

  const cat = CONFIG.CATEGORIES.find(c => c.id === catId) || CONFIG.CATEGORIES.find(c => c.id === 'all');
  const bannerUrl = cat?.banner || CONFIG.HERO_IMAGE;

  // Preload so we don't flash a broken image if the category banner file
  // doesn't exist yet — fall back to the generic Hero.jpg silently.
  const img = new Image();
  img.onload = () => setHeroBg(bannerUrl);
  img.onerror = () => setHeroBg(CONFIG.HERO_IMAGE);
  img.src = bannerUrl;

  function setHeroBg(url) {
    hero.style.backgroundImage =
      `linear-gradient(135deg, rgba(40,32,150,0.88) 0%, rgba(45,36,168,0.82) 60%, rgba(55,48,208,0.8) 100%), url('${url}')`;
  }

  if (title) title.innerHTML = cat?.heroTitle || 'Find used stuff near you';
  if (sub)   sub.textContent = cat?.heroSub || 'No fees. Post your used stuff. Someone will take it.';
}

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
        <img class="subcat-img" src="${cat.image}" alt="${escHtml(sc)}"
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
  const label = document.getElementById('catPickerLabel');
  const thumb = document.getElementById('catPickerThumb');
  if (label) label.textContent = 'All Categories';
  if (thumb) thumb.style.display = 'none';
  applyHeroForCategory('all');
  applyFilters();
}

// ── Boot ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initHome);
