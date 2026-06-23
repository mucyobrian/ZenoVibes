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

// ── Get category image (replaces emoji) ─────────
function getCatEmoji(catId) {
  const emojis = {
    clothing:'👗', shoes:'👟', jewelry:'💍', accessories:'👜', kids:'🧸',
    home:'🏠', beauty:'💄', telecom:'📱', electronics:'💻', hair:'💇',
    computer:'🖥️', automobile:'🚗', sports:'⚽', furniture:'🛋️', vehicles:'🚙',
    food:'🍔', books:'📚', agriculture:'🌱', services:'🔧', property:'🏡',
    other:'📦', all:'🛍️', free:'🎁'
  };
  return emojis[catId] || '📦';
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

  const isFav = DB.isFavorite(product.id);
  const favBtnHtml = `
    <button class="fav-btn ${isFav ? 'is-fav' : ''}" data-product-id="${escHtml(product.id)}" onclick="event.stopPropagation();handleFavClick(this,'${product.id}')" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    </button>`;

  if (listView) {
    return `
  <div class="product-card--list" onclick="goToProduct('${product.id}')">
    <div class="list-img-wrap">
      ${imgHtml}
      ${multiImgBadge}
      ${favBtnHtml}
    </div>
    <div class="list-info">
      <div class="list-cat">${getCatEmoji(product.category)} ${getCatLabel(product.category)}</div>
      <div class="list-title">${escHtml(product.productName)}</div>
      <div class="list-desc">${escHtml(product.description || '')}</div>
      <div class="list-footer">
        <span class="list-price">${formatPrice(product.price)}</span>
        <span class="list-loc">📍 ${escHtml(product.sellerCity || '')}${dist !== null ? ` · <span style="color:var(--success)">${formatDist(dist)}</span>` : ''}</span>
      </div>
    </div>
  </div>`;
  }

  return `
  <div class="product-card" onclick="goToProduct('${product.id}')">
    <div style="position:relative">
      ${imgHtml}
      ${multiImgBadge}
      ${favBtnHtml}
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

// ── Handle a heart-button tap on a product card ──
// Shared by every page that renders buildProductCard output.
async function handleFavClick(btnEl, productId) {
  if (!DB.getCurrentUser()) {
    showToast('Sign in to save favorites', 'error');
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? 'account.html' : 'pages/account.html';
    return;
  }

  // Optimistic UI flip — feels instant, DB.toggleFavorite() syncs the server
  // and rolls this back automatically if the request fails.
  const willBeFav = !btnEl.classList.contains('is-fav');
  btnEl.classList.toggle('is-fav', willBeFav);
  const path = btnEl.querySelector('path');
  if (path) path.setAttribute('fill', willBeFav ? 'currentColor' : 'none');
  btnEl.setAttribute('aria-label', willBeFav ? 'Remove from favorites' : 'Add to favorites');

  try {
    await DB.toggleFavorite(productId);
    // Let any listening page (e.g. the My Favorites panel) react —
    // app.js stays page-agnostic and doesn't know about specific DOM elsewhere.
    document.dispatchEvent(new CustomEvent('favoritechange', {
      detail: { productId, isFavorite: willBeFav }
    }));
  } catch (e) {
    // Roll back on failure
    btnEl.classList.toggle('is-fav', !willBeFav);
    if (path) path.setAttribute('fill', !willBeFav ? 'currentColor' : 'none');
    showToast(e.message || 'Could not update favorites', 'error');
  }
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

// ── Search overlay toggle ─────────────────────────
function toggleSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  const isOpen = overlay.classList.toggle('open');
  if (isOpen) {
    // auto-focus the input
    setTimeout(() => document.getElementById('globalSearch')?.focus(), 50);
  }
}

function closeSearch() {
  document.getElementById('searchOverlay')?.classList.remove('open');
}

// Close overlay on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSearch();
});

// ── Global search ────────────────────────────────
function handleSearch() {
  const q = (document.getElementById('globalSearch')?.value || '').trim();
  closeSearch(); // always close overlay
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
    btn.innerHTML = user.avatarUrl
      ? `<img src="${escHtml(user.avatarUrl)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block" />`
      : `<div style="width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.9rem">${user.name.charAt(0).toUpperCase()}</div>`;
  }
})();

// ================================================
// SHARED IMAGE UPLOAD PIPELINE
// Used by both pages/sell.html (product photos) and
// pages/account.html (profile pictures). Compresses an
// image in-browser via Canvas, then uploads it through
// the Cloudflare Worker proxy to Hugging Face.
// ================================================

// Your Cloudflare Worker URL — proxies uploads to Hugging Face
const UPLOAD_WORKER_URL = 'https://zenovibes-uploads.mucyobrian2.workers.dev';

/**
 * Resizes + compresses an image file in the browser using Canvas, returns a Blob (JPEG).
 * @param {File} file - the source image file
 * @param {object} opts
 * @param {number} opts.maxDimension - max width/height in px (image is scaled down to fit, preserving aspect ratio, unless cropToSquare is used)
 * @param {number} opts.quality - JPEG quality 0–1
 * @param {boolean} opts.cropToSquare - if true, crops to a square first using opts.cropRect (from the avatar cropper), instead of preserving aspect ratio
 * @param {object} [opts.cropRect] - { sx, sy, sSize } source-pixel square region to crop from the original image (required if cropToSquare is true)
 */
function compressImage(file, opts = {}) {
  const maxDimension = opts.maxDimension || 1200;
  const quality = opts.quality != null ? opts.quality : 0.75;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = () => reject(new Error('Could not read file'));
    img.onerror = () => reject(new Error('Could not load image'));

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (opts.cropToSquare && opts.cropRect) {
        // Draw only the cropped square region, scaled to maxDimension x maxDimension
        const { sx, sy, sSize } = opts.cropRect;
        canvas.width = maxDimension;
        canvas.height = maxDimension;
        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, maxDimension, maxDimension);
      } else {
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      }

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      }, 'image/jpeg', quality);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Sends a compressed image blob to the Cloudflare Worker, returns the public Hugging Face URL.
 * @param {Blob} blob - compressed image blob
 * @param {string} originalName - original filename (used only to preserve the extension)
 * @param {string} folder - which folder to store this in: 'products', 'avatars', or 'ui'
 */
async function uploadToWorker(blob, originalName, folder = 'products') {
  const formData = new FormData();
  const safeName = (originalName || 'photo.jpg').replace(/[^a-zA-Z0-9.\-_]/g, '_');
  formData.append('file', blob, safeName.replace(/\.\w+$/, '') + '.jpg');
  formData.append('folder', folder);

  const res = await fetch(UPLOAD_WORKER_URL, { method: 'POST', body: formData });
  const data = await res.json();

  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Upload failed');
  }
  return data.url;
}
