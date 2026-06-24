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
  buildGridBanners();

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

// ── Grid Banners (4-tile promotional grid below hero) ────────────
// Each tile reads its config from CONFIG.GRID_BANNERS and navigates
// to the home page with the matching category filter pre-applied.
function buildGridBanners() {
  const container = document.getElementById('gridBanners');
  if (!container) return;

  const banners = (CONFIG.GRID_BANNERS || []);
  if (!banners.length) { container.style.display = 'none'; return; }

  container.innerHTML = banners.map((b, i) => {
    // Clicking a tile selects the category pill then scrolls to the products grid
    const onclick = b.action === 'sellers'
      ? `showSellerDirectory()`
      : b.category && b.category !== 'all'
        ? `selectCategory('${b.category}', document.querySelector('.cat-pill[onclick*=\\'${b.category}\\']')); document.getElementById('categorySections')?.scrollIntoView({behavior:'smooth', block:'start'})`
        : `selectCategory('all', document.querySelector('.cat-pill')); document.getElementById('categorySections')?.scrollIntoView({behavior:'smooth', block:'start'})`;

    return `
      <a class="grid-banner-tile"
         href="#"
         onclick="event.preventDefault(); ${onclick}"
         aria-label="${escHtml(b.label || 'Browse ' + (b.category || 'all'))} — tap to filter"
         data-banner-index="${i}">
        <img
          src="${escHtml(b.image)}"
          alt="${escHtml(b.label || '')}"
          loading="lazy"
          onerror="this.parentElement.classList.add('grid-banner-tile--no-img'); this.style.display='none'"
        />
        <div class="grid-banner-label">
          ${escHtml(b.label || '')}
          <br><span class="grid-banner-chip">View &rsaquo;</span>
        </div>
      </a>`;
  }).join('');
}


// ── Seller Directory (triggered from grid banner tiles) ──────────
let sellerDirectoryActive = false;

function showSellerDirectory() {
  sellerDirectoryActive = true;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  const container = document.getElementById('categorySections');
  if (!container) return;
  container.innerHTML = `
    <div class="seller-dir-header">
      <button class="seller-dir-back" onclick="closeSellerDirectory()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back
      </button>
      <h2 class="seller-dir-title">All Sellers</h2>
    </div>
    <div class="seller-dir-grid" id="sellerDirGrid">
      <div class="skeleton-card"></div><div class="skeleton-card"></div>
      <div class="skeleton-card"></div><div class="skeleton-card"></div>
    </div>`;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  _renderSellerCards();
}

async function _renderSellerCards() {
  const sellerMap = {};
  for (const p of allProducts) {
    const key = p.sellerPhone || p.sellerName;
    if (!sellerMap[key]) {
      sellerMap[key] = { name: p.sellerName || 'Seller', phone: p.sellerPhone || '', city: p.sellerCity || '', avatar: p.sellerAvatarUrl || '', count: 0 };
    }
    sellerMap[key].count++;
  }
  const sellers = Object.values(sellerMap);

  const statsArr = await Promise.all(
    sellers.map(s => s.phone && window.ENG ? ENG.getSellerStats(s.phone).catch(() => null) : Promise.resolve(null))
  );

  const grid = document.getElementById('sellerDirGrid');
  if (!grid) return;
  if (!sellers.length) { grid.innerHTML = '<p class="no-results" style="display:block">No sellers yet.</p>'; return; }

  grid.innerHTML = sellers.map((s, i) => {
    const stats  = statsArr[i] || {};
    const subs   = stats.subscribers != null ? stats.subscribers : '—';
    const views  = stats.totalViews  != null ? stats.totalViews  : '—';
    const likes  = stats.totalLikes  != null ? stats.totalLikes  : '—';
    const rating = stats.avgRating   != null ? parseFloat(stats.avgRating).toFixed(1) : '—';
    const initials = (s.name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarHtml = s.avatar
      ? `<img class="seller-card-avatar" src="${escHtml(s.avatar)}" alt="${escHtml(s.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="seller-card-initials" style="display:none">${initials}</div>`
      : `<div class="seller-card-initials">${initials}</div>`;
    const phone  = s.phone ? s.phone.replace(/\D/g, '') : '';
    const waHref = phone ? `https://wa.me/${phone}?text=${encodeURIComponent('Hi, I found you on StillWorks!')}` : '#';
    const sellerKey = escHtml(s.phone || s.name);
    return `
      <div class="seller-card">
        <div class="seller-card-top">
          <div class="seller-card-avatar-wrap">${avatarHtml}</div>
          <div class="seller-card-info">
            <div class="seller-card-name">${escHtml(s.name)}</div>
            ${s.city ? `<div class="seller-card-city">📍 ${escHtml(s.city)}</div>` : ''}
            <div class="seller-card-posts">${s.count} listing${s.count !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="seller-card-stats">
          <div class="seller-stat">
            <svg width="15" height="15" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="seller-stat-val">${subs}</span><span class="seller-stat-lbl">Subscribers</span>
          </div>
          <div class="seller-stat">
            <svg width="15" height="15" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span class="seller-stat-val">${views}</span><span class="seller-stat-lbl">Views</span>
          </div>
          <div class="seller-stat">
            <svg width="15" height="15" fill="none" stroke="#22c55e" stroke-width="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            <span class="seller-stat-val">${likes}</span><span class="seller-stat-lbl">Likes</span>
          </div>
          <div class="seller-stat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span class="seller-stat-val">${rating}</span><span class="seller-stat-lbl">Avg Rating</span>
          </div>
        </div>
        <div class="seller-card-actions">
          <button class="seller-btn-listings" onclick="filterBySeller('${sellerKey}')">View Listings</button>
          ${phone ? `<a class="seller-btn-wa" href="${waHref}" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.554 4.11 1.523 5.843L0 24l6.32-1.497A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.82 9.82 0 0 1-5.007-1.371l-.36-.214-3.732.883.933-3.617-.235-.372A9.818 9.818 0 0 1 2.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/></svg>
            WhatsApp
          </a>` : ''}
        </div>
      </div>`;
  }).join('');
}

function filterBySeller(sellerKey) {
  closeSellerDirectory();
  const container = document.getElementById('categorySections');
  if (!container) return;
  const loc = getUserLocation();
  const products = allProducts.filter(p => p.sellerPhone === sellerKey || p.sellerName === sellerKey);
  const seller = products[0] ? products[0].sellerName : 'Seller';
  container.innerHTML = `
    <section class="cat-section">
      <div class="cat-section-head">
        <div class="cat-section-title">${escHtml(seller)}'s Listings
          <span class="cat-section-count">(${products.length})</span>
        </div>
        <button class="seller-dir-back" style="margin-left:auto" onclick="clearFilters()">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> All
        </button>
      </div>
      <div class="products-grid">${products.map(p => buildProductCard(p, loc?.lat, loc?.lng)).join('')}</div>
    </section>`;
}

function closeSellerDirectory() {
  sellerDirectoryActive = false;
  buildCategorySections();
}

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
