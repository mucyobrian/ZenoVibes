// ================================================
// SOKOHUB – app.js  (shared across all pages)
// ================================================

// ── Toast notifications ─────────────────────────
function showToast(msg, type = '') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Format currency ─────────────────────────────
function formatPrice(amount) {
  if (!amount && amount !== 0) return 'N/A';
  return CONFIG.currencySymbol + ' ' + Number(amount).toLocaleString();
}

// ── Format distance ─────────────────────────────
function formatDist(km) {
  if (km < 1) return Math.round(km * 1000) + 'm away';
  return km.toFixed(1) + 'km away';
}

// ── Get category emoji ──────────────────────────
function getCatEmoji(catId) {
  const cat = CONFIG.CATEGORIES.find(c => c.id === catId);
  return cat ? cat.emoji : '📦';
}

function getCatLabel(catId) {
  const cat = CONFIG.CATEGORIES.find(c => c.id === catId);
  return cat ? cat.label : 'Other';
}

// ── Build a product card HTML ────────────────────
function buildProductCard(product, userLat, userLng, listView) {
  const dist = (userLat && product.sellerLat)
    ? DB.getDistanceKm(userLat, userLng, product.sellerLat, product.sellerLng)
    : null;

  const firstImg = (Array.isArray(product.images) && product.images[0]?.url)
    ? product.images[0].url
    : product.imageUrl;

  const imgHtml = firstImg
    ? `<img class="card-img" src="${escHtml(firstImg)}" alt="${escHtml(product.productName)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="card-img-placeholder" style="display:none">${getCatEmoji(product.category)}</div>`
    : `<div class="card-img-placeholder">${getCatEmoji(product.category)}</div>`;

  const imgCount = Array.isArray(product.images) ? product.images.length : (product.imageUrl ? 1 : 0);
  const multiImgBadge = imgCount > 1
    ? `<div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.6);color:white;font-size:0.7rem;font-weight:600;padding:3px 8px;border-radius:100px">📷 ${imgCount}</div>`
    : '';

  if (listView) {
    return `
  <div class="product-card product-card--list" onclick="goToProduct('${product.id}')">
    <div style="position:relative;flex-shrink:0;width:110px;height:110px">
      ${imgHtml}
      ${multiImgBadge}
    </div>
    <div class="card-body" style="flex:1;padding:10px 12px;display:flex;flex-direction:column;justify-content:space-between">
      <div>
        <div style="font-size:0.7rem;font-weight:600;color:var(--primary);margin-bottom:4px">${getCatEmoji(product.category)} ${getCatLabel(product.category)}</div>
        <div class="card-title" style="font-size:0.95rem;margin-bottom:4px">${escHtml(product.productName)}</div>
        <div class="card-desc" style="font-size:0.8rem;-webkit-line-clamp:2">${escHtml(product.description || '')}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
        <span class="card-price" style="font-size:1rem">${formatPrice(product.price)}</span>
        <span class="card-location" style="font-size:0.75rem">
          📍 ${escHtml(product.sellerCity || '')}
          ${dist !== null ? `<span style="color:var(--success);margin-left:4px">${formatDist(dist)}</span>` : ''}
        </span>
      </div>
    </div>
  </div>`;
  }

  return `
  <div class="product-card" onclick="goToProduct('${product.id}')">
    <div style="position:relative">
      ${imgHtml}
      ${multiImgBadge}
      <div style="position:absolute;top:10px;left:10px;background:rgba(26,20,100,0.85);color:white;padding:3px 10px;border-radius:100px;font-size:0.72rem;font-weight:600">
        ${getCatEmoji(product.category)} ${getCatLabel(product.category)}
      </div>
    </div>
    <div class="card-body">
      <div class="card-title">${escHtml(product.productName)}</div>
      <div class="card-desc">${escHtml(product.description || '')}</div>
      <div class="card-footer">
        <span class="card-price">${formatPrice(product.price)}</span>
        <span class="card-location">
          📍 ${escHtml(product.sellerCity || '')}
          ${dist !== null ? `<span style="color:var(--success);margin-left:4px">${formatDist(dist)}</span>` : ''}
        </span>
      </div>
    </div>
  </div>`;
}

// ── Navigate to product detail page ──────────────
function goToProduct(id) {
  const isInPages = window.location.pathname.includes('/pages/');
  const base = isInPages ? 'product.html' : 'pages/product.html';
  window.location.href = `${base}?id=${encodeURIComponent(id)}`;
}

// ── Escape HTML ─────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Contact Modal ────────────────────────────────
function openContact(product) {
  const modal = document.getElementById('contactModal');
  if (!modal) return;

  document.getElementById('modalSellerName').textContent = product.sellerName || 'Seller';
  document.getElementById('modalProductName').textContent = product.productName || '';
  document.getElementById('modalPrice').textContent = formatPrice(product.price);
  document.getElementById('modalAvatar').textContent = getCatEmoji(product.category);

  const phone = String(product.sellerPhone || '').replace(/\s+/g, '');
  const wa    = String(product.sellerWhatsApp || product.sellerPhone || '').replace(/[\s+]/g, '');

  const callBtn = document.getElementById('modalCall');
  const waBtn   = document.getElementById('modalWhatsApp');

  if (phone) {
    callBtn.href = `tel:${phone}`;
    callBtn.style.display = 'flex';
  } else {
    callBtn.style.display = 'none';
  }

  if (wa) {
    const msg = encodeURIComponent(
      `Hi ${product.sellerName}, I saw your post on StillWorks and I'm interested in "${product.productName}" (${formatPrice(product.price)}). Is it still available?`
    );
    waBtn.href = `https://wa.me/${wa}?text=${msg}`;
    waBtn.style.display = 'flex';
  } else {
    waBtn.style.display = 'none';
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('contactModal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  const modal = document.getElementById('contactModal');
  if (modal && e.target === modal) closeModal();
});

// Escape key closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── Location ─────────────────────────────────────
let userLocation = JSON.parse(localStorage.getItem('sokohub_location') || 'null');

function requestLocation(e) {
  if (e) e.preventDefault();
  if (!navigator.geolocation) {
    showToast('Geolocation not supported by your browser', 'error');
    return;
  }
  const label = document.getElementById('locLabel');
  if (label) label.textContent = 'Locating…';

  navigator.geolocation.getCurrentPosition(
    pos => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      localStorage.setItem('sokohub_location', JSON.stringify(userLocation));
      if (label) label.textContent = 'Near Me ✓';
      showToast('Location set! Near Me filter is now active.', 'success');
      if (typeof applyFilters === 'function') applyFilters();
    },
    err => {
      if (label) label.textContent = 'Set Location';
      showToast('Could not get location. Please allow access.', 'error');
    }
  );
}

function getUserLocation() { return userLocation; }

// ── Tab bar: mark active tab ─────────────────────
(function markActiveTab() {
  const path = window.location.pathname;
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    const href = tab.getAttribute('href') || '';
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
      if (tab.dataset.tab === 'home') tab.classList.add('active');
    } else if (path.includes('categories') && tab.dataset.tab === 'categories') {
      tab.classList.add('active');
    } else if (path.includes('shop') && tab.dataset.tab === 'shop') {
      tab.classList.add('active');
    } else if (path.includes('account') && tab.dataset.tab === 'account') {
      tab.classList.add('active');
    }
  });
})();

// ── Global search ────────────────────────────────
function handleSearch() {
  const q = (document.getElementById('globalSearch')?.value || '').trim();
  if (!q) return;
  const isInPages = window.location.pathname.includes('/pages/');
  const base = isInPages ? 'shop.html' : 'pages/shop.html';
  window.location.href = `${base}?q=${encodeURIComponent(q)}`;
}

document.getElementById('globalSearch')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

// ── Update account button ────────────────────────
(function updateAccountBtn() {
  const user = DB.getCurrentUser();
  const btn = document.getElementById('accountBtn');
  if (user && btn) {
    btn.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.9rem">${user.name.charAt(0).toUpperCase()}</div>`;
  }
})();
