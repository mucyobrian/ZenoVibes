// ================================================
// SOKOHUB – Database Layer
// Fetches from Google Sheets OR uses demo data
// Also handles LocalStorage for seller accounts
// ================================================

const DB = (() => {
  const STORAGE_KEYS = {
    USER: 'sokohub_user',
    PRODUCTS_CACHE: 'sokohub_products_cache',
    CACHE_TIME: 'sokohub_cache_time',
    MY_LISTINGS: 'sokohub_my_listings',
    FAVORITES_CACHE: 'sokohub_favorites_cache',
  };

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ── Hash a password in the browser before it ever leaves the device ──
  // The server (Apps Script) only ever sees/stores this hash, never the
  // real password. Uses the browser's built-in Web Crypto API.
  async function hashPassword(password) {
    const enc = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ── Parse Google Sheets JSON response ──────────
  function parseGoogleSheetsJSON(raw) {
    // Google Sheets returns JSONP-like: /*O_o*/\ngoogle.visualization.Query.setResponse({...})
    const match = raw.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
    if (!match) return [];
    const json = JSON.parse(match[1]);
    const rows = json.table.rows;
    const cols = json.table.cols.map(c => c.label.toLowerCase().replace(/\s+/g, ''));

    return rows.map((row, i) => {
      const obj = { id: `gs_${i}` };
      row.c.forEach((cell, ci) => {
        obj[cols[ci]] = cell ? cell.v : '';
      });
      return obj;
    }).filter(p => p.status !== 'rejected' && p.productname);
  }

  // ── Fetch live products from Google Sheets ──────
  async function fetchFromSheets() {
    if (CONFIG.SHEET_CSV_URL.includes('YOUR_SHEET_ID')) {
      return null; // not configured, use demo
    }
    try {
      const res = await fetch(CONFIG.SHEET_CSV_URL);
      const text = await res.text();
      return parseGoogleSheetsJSON(text);
    } catch (e) {
      console.warn('Sheets fetch failed, using cache/demo', e);
      return null;
    }
  }

  // ── Get all products (with cache) ──────────────
  async function getProducts() {
    const cacheTime = parseInt(localStorage.getItem(STORAGE_KEYS.CACHE_TIME) || '0');
    const now = Date.now();

    // Use cache if fresh
    if (now - cacheTime < CACHE_TTL) {
      const cached = localStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHE);
      if (cached) return JSON.parse(cached);
    }

    // Try live data
    const live = await fetchFromSheets();
    if (live && live.length > 0) {
      const normalized = live
        .map(p => normalizeProduct(p))
        .filter(p => p.status === 'active' || p.status === '');

      localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHE, JSON.stringify(normalized));
      localStorage.setItem(STORAGE_KEYS.CACHE_TIME, String(now));
      return normalized;
    }

    // Fall back to demo data
    return CONFIG.DEMO_PRODUCTS;
  }

  // ── Get my listings (from the live Sheet, by seller email) ─
  async function getMyListings() {
    const user = getCurrentUser();
    if (!user) return [];
    // Always fetch fresh (not the 5-min product cache) so deletes/edits show immediately
    const live = await fetchFromSheets();
    if (!live) return [];

    // Match by email when the user has one (most reliable, since two people
    // could in theory share a phone format quirk). If the user registered
    // phone-only (no email), match by phone instead — never match on a
    // blank-to-blank email, which could wrongly group different sellers together.
    const userEmail = String(user.email || '').trim().toLowerCase();
    const userPhone = String(user.phone || '').replace(/[^\d+]/g, '');

    const liveMine = live
      .filter(p => {
        if (p.status !== 'active') return false;
        if (userEmail) {
          return String(p.selleremail || '').trim().toLowerCase() === userEmail;
        }
        const rowPhone = String(p.sellerphone || '').replace(/[^\d+]/g, '');
        return userPhone && rowPhone && (rowPhone === userPhone || rowPhone.endsWith(userPhone) || userPhone.endsWith(rowPhone));
      })
      .map(p => normalizeProduct(p));

    // Clean up any local-only stub whose product has now synced to the Sheet
    // (matched by same product name, since the synced row gets a new gs_ id)
    const localStubs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
    if (localStubs.length) {
      const liveNames = new Set(liveMine.map(p => p.productName));
      const stillPending = localStubs.filter(p => !liveNames.has(p.productName));
      if (stillPending.length !== localStubs.length) {
        localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify(stillPending));
      }
    }

    return liveMine;
  }

  // ── Shared normalizer (sheet row -> app product shape) ──
  // Map whatever the sheet stored (label OR id, any case) → config id
  function resolveCategoryId(raw) {
    if (!raw) return 'other';
    const val = String(raw).trim().toLowerCase();
    // 1. Direct id match (e.g. "telecom", "electronics")
    const byId = CONFIG.CATEGORIES.find(c => c.id === val);
    if (byId) return byId.id;
    // 2. Label match (e.g. "Phones & Telecom" → "telecom")
    const byLabel = CONFIG.CATEGORIES.find(c => c.label.toLowerCase() === val);
    if (byLabel) return byLabel.id;
    // 3. Partial label match as fallback (e.g. "phones" → "telecom")
    const partial = CONFIG.CATEGORIES.find(c => val.includes(c.id) || c.label.toLowerCase().includes(val));
    if (partial) return partial.id;
    return val; // keep as-is if nothing matches
  }

  function normalizeProduct(p) {
    let images = [];
    const rawImages = p.imagesjson || p.images_json || p.images;
    if (rawImages) {
      try {
        const parsed = typeof rawImages === 'string' ? JSON.parse(rawImages) : rawImages;
        if (Array.isArray(parsed)) images = parsed;
      } catch (e) { /* not valid JSON, ignore */ }
    }
    if (images.length === 0 && (p.imageurl || p.image)) {
      images = [{ url: p.imageurl || p.image, tag: '', price: parseFloat(String(p.price||'0').replace(/[^0-9.]/g,'')) }];
    }
    return {
      id: p.id,
      sellerName: p.sellername || p.name || 'Seller',
      sellerPhone: String(p.sellerphone || p.phone || ''),
      sellerWhatsApp: String(p.sellerwhatsapp || p.whatsapp || p.sellerphone || ''),
      sellerEmail: p.selleremail || p.email || '',
      sellerCity: p.sellercity || p.city || '',
      sellerAvatarUrl: p.selleravatarurl || p.avatarurl || '',
      sellerLat: parseFloat(p.sellerlat || p.lat || 0),
      sellerLng: parseFloat(p.sellerlng || p.lng || 0),
      productName: p.productname || p.product || 'Product',
      description: p.description || '',
      price: parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')),
      category: resolveCategoryId(p.category),
      subcategory: p.subcategory || '',
      images,
      timestamp: p.timestamp || new Date().toISOString(),
      status: p.status || 'active',
    };
  }

  // ── Save a new listing locally AND send to Google Sheet via Apps Script ──
  async function saveMyListing(product) {
    const newProduct = {
      ...product,
      id: 'local_' + Date.now(),
      timestamp: new Date().toISOString(),
      status: 'active',
    };

    // Save locally first so it appears instantly in the UI
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
    existing.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify(existing));

    // Send to Google Sheet via Apps Script (same approach as delete/update)
    try {
      // Send only the product fields — not the local id or timestamp (Apps Script generates those)
      const payload = {
        sellerName:     newProduct.sellerName,
        sellerPhone:    newProduct.sellerPhone,
        sellerWhatsApp: newProduct.sellerWhatsApp,
        sellerEmail:    newProduct.sellerEmail,
        sellerCity:     newProduct.sellerCity,
        sellerLat:      newProduct.sellerLat,
        sellerLng:      newProduct.sellerLng,
        productName:    newProduct.productName,
        description:    newProduct.description,
        price:          newProduct.price,
        category:       newProduct.category,
        subcategory:    newProduct.subcategory,
        images:         newProduct.images,
        sellerAvatarUrl: newProduct.sellerAvatarUrl,
      };
      const res = await fetch(CONFIG.LISTINGS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addListing', product: payload }),
      });
      const data = await res.json();
      if (data.success && data.id) {
        // Replace the local_ id with the real Sheet row id
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
        const idx = stored.findIndex(p => p.id === newProduct.id);
        if (idx !== -1) { stored[idx].id = data.id; localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify(stored)); }
        // Bust the product cache so the new listing shows in the shop immediately
        localStorage.removeItem(STORAGE_KEYS.CACHE_TIME);
      }
    } catch(e) {
      console.error('Failed to sync listing to Sheet:', e);
      // Local save already done — product shows for the user even if sync failed
    }

    return newProduct;
  }

  // ── Delete a listing (removes the row from the Sheet) ──────
  async function deleteMyListing(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('You must be signed in');

    // If it's a local-only listing that never synced, just clear it locally
    if (String(id).startsWith('local_')) {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
      localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify(existing.filter(p => p.id !== id)));
      return { success: true };
    }

    const res = await fetch(CONFIG.LISTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // avoids CORS preflight on Apps Script
      body: JSON.stringify({ action: 'delete', id, sellerEmail: user.email, sellerPhone: user.phone }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Delete failed');

    // Free up a slot in this month's count
    const used = getMonthlyCount();
    updateUser({ monthlyCount: Math.max(0, used - 1) });

    // Bust the shared product cache so the homepage reflects the delete immediately
    localStorage.removeItem(STORAGE_KEYS.CACHE_TIME);
    return data;
  }

  // ── Update a listing (edits fields on its row in the Sheet) ─
  async function updateMyListing(id, updates) {
    const user = getCurrentUser();
    if (!user) throw new Error('You must be signed in');

    const res = await fetch(CONFIG.LISTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'update', id, sellerEmail: user.email, sellerPhone: user.phone, updates }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Update failed');

    localStorage.removeItem(STORAGE_KEYS.CACHE_TIME);
    return data;
  }

  // ── FAVORITES / WISHLIST ────────────────────────
  // Source of truth is the "Favorites" tab in the Sheet, reached via
  // CONFIG.LISTINGS_API_URL. localStorage is only a CACHE of "what's
  // favorited on this device" for instant UI — refreshed from the server
  // on load and after every change, so it follows the signed-in account
  // across every device (not just this browser).

  function getFavoritesCache_() {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES_CACHE);
    return raw === null ? null : JSON.parse(raw);
  }

  function setFavoritesCache_(ids) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES_CACHE, JSON.stringify(ids));
  }

  // Returns an array of favorited productIds. Signed-out users always get [].
  // Pass forceRefresh=true to skip the local cache and hit the server
  // (used right after add/remove so the cache can't drift from the Sheet).
  // Note: an empty cache is stored as "[]" (a real value), which is distinct
  // from "no cache yet" (null) — that's what lets the very first call on a
  // page always reach the server instead of assuming "[]" means "no favorites".
  async function getFavorites(forceRefresh) {
    const user = getCurrentUser();
    if (!user) return [];

    if (!forceRefresh) {
      const cached = getFavoritesCache_();
      if (cached !== null) return cached;
    }

    try {
      const res = await fetch(CONFIG.LISTINGS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'getFavorites', userId: user.id }),
      });
      const result = await res.json();
      if (!result.success) return getFavoritesCache_() || [];
      const ids = result.favorites.map(f => f.productId);
      setFavoritesCache_(ids);
      return ids;
    } catch (e) {
      console.warn('getFavorites: server fetch failed, using cache', e);
      return getFavoritesCache_() || [];
    }
  }

  function isFavorite(productId) {
    const cached = getFavoritesCache_() || [];
    return cached.includes(String(productId));
  }

  async function addFavorite(productId) {
    const user = getCurrentUser();
    if (!user) throw new Error('You must be signed in to save favorites');

    // Optimistic local update so the heart fills in instantly.
    const cached = getFavoritesCache_() || [];
    if (!cached.includes(String(productId))) {
      cached.push(String(productId));
      setFavoritesCache_(cached);
    }

    const res = await fetch(CONFIG.LISTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'addFavorite', userId: user.id, productId: String(productId) }),
    });
    const result = await res.json();
    if (!result.success) {
      // Roll back the optimistic update if the server rejected it.
      setFavoritesCache_(cached.filter(id => id !== String(productId)));
      throw new Error(result.error || 'Could not add favorite');
    }
    return result;
  }

  async function removeFavorite(productId) {
    const user = getCurrentUser();
    if (!user) throw new Error('You must be signed in to manage favorites');

    // Optimistic local update so the heart empties instantly.
    const cached = getFavoritesCache_() || [];
    setFavoritesCache_(cached.filter(id => id !== String(productId)));

    const res = await fetch(CONFIG.LISTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'removeFavorite', userId: user.id, productId: String(productId) }),
    });
    const result = await res.json();
    if (!result.success) {
      // Roll back the optimistic update if the server rejected it.
      cached.push(String(productId));
      setFavoritesCache_(cached);
      throw new Error(result.error || 'Could not remove favorite');
    }
    return result;
  }

  async function toggleFavorite(productId) {
    if (isFavorite(productId)) {
      await removeFavorite(productId);
      return false; // now NOT a favorite
    } else {
      await addFavorite(productId);
      return true; // now IS a favorite
    }
  }

  // Returns full product objects for everything the user has favorited,
  // by cross-referencing favorited ids against the live product list.
  async function getFavoriteProducts() {
    const user = getCurrentUser();
    if (!user) return [];
    const [ids, allProducts] = await Promise.all([getFavorites(true), getProducts()]);
    const idSet = new Set(ids);
    return allProducts.filter(p => idSet.has(String(p.id)));
  }

  // ── USER AUTH ───────────────────────────────────
  // Source of truth is the "Users" tab in the Sheet, reached via
  // CONFIG.LISTINGS_API_URL (same Apps Script as listings).
  // localStorage is only a CACHE of "who is logged in on this device",
  // refreshed every time we talk to the server — never the source of truth.
  // This is what makes login work the same on every device.

  function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  function cacheCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async function register(data) {
    const passwordHash = await hashPassword(data.password);
    const res = await fetch(CONFIG.LISTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // avoids CORS preflight on Apps Script
      body: JSON.stringify({
        action: 'register',
        name: data.name,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        city: data.city,
        avatarUrl: data.avatarUrl || '',
        passwordHash,
        monthKey: getCurrentMonthKey(),
      }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Could not create account.');
    cacheCurrentUser(result.user);
    return result.user;
  }

  async function login(identifier, password) {
    const passwordHash = await hashPassword(password);
    const res = await fetch(CONFIG.LISTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'login', identifier, passwordHash }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Invalid email/phone or password.');
    cacheCurrentUser(result.user);
    return result.user;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES_CACHE);
  }

  // Updates the user's profile/plan/monthlyCount on the server, then
  // refreshes the local cache so synchronous getters stay accurate.
  async function refreshCurrentUser() {
    const user = getCurrentUser();
    if (!user) return null;
    try {
      const res = await fetch(CONFIG.LISTINGS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'update', target: 'user', id: user.id, updates: {} }),
      });
      const result = await res.json();
      if (result.success && result.user) {
        // Keep local monthlyCount and monthKey — the server value is stale
        // because the sheet lags behind the optimistic local increment.
        const merged = { ...result.user };
        if (user.monthlyCount > (Number(result.user.monthlyCount) || 0)) {
          merged.monthlyCount = user.monthlyCount;
          merged.monthKey = user.monthKey;
        }
        cacheCurrentUser(merged);
        return merged;
      }
    } catch (e) { /* fall back to cache silently */ }
    return user;
  }

  async function updateUser(updates) {
    const user = getCurrentUser();
    if (!user) return null;

    // Update local cache immediately for a responsive UI...
    const optimistic = { ...user, ...updates };
    cacheCurrentUser(optimistic);

    try {
      const res = await fetch(CONFIG.LISTINGS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'update', target: 'user', id: user.id, updates }),
      });
      // We already saved the optimistic update to localStorage above.
      // Do NOT overwrite it with the server response — the sheet can return
      // stale or numeric-typed values that clobber what we just wrote.
    } catch (e) {
      console.warn('updateUser: server sync failed, kept local cache', e);
    }
    return optimistic;
  }

  // ── Monthly count tracking ──────────────────────
  function getCurrentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  }

  function getMonthlyCount() {
    const user = getCurrentUser();
    if (!user) return 0;
    const currentKey = getCurrentMonthKey(); // e.g. "2026-6"
    const storedKey = String(user.monthKey || '');
    // storedKey might be an ISO date like "2026-06-01T07:00:00.000Z"
    // or already "YYYY-M" — extract year and month to compare
    const keyToMonth = function(k) {
      const d = new Date(k);
      if (!isNaN(d)) return d.getFullYear() + '-' + (d.getMonth() + 1);
      return k; // already in YYYY-M format
    };
    if (keyToMonth(storedKey) !== currentKey) {
      updateUser({ monthlyCount: 0, monthKey: currentKey });
      return 0;
    }
    return Number(user.monthlyCount) || 0;
  }

  async function incrementMonthlyCount() {
    const user = getCurrentUser();
    const limit = user.plan === 'paid' ? CONFIG.FREE_LIMIT + CONFIG.PAID_EXTRA : CONFIG.FREE_LIMIT;
    // Count from actual listings — no dependency on monthlyCount in localStorage/sheet
    const myList = await getMyListings();
    const now = new Date();
    const count = myList.filter(p => {
      const d = new Date(p.timestamp);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    if (count >= limit) {
      throw new Error('limit_reached');
    }
    return count + 1;
  }

  function getProductLimit() {
    const user = getCurrentUser();
    if (!user) return CONFIG.FREE_LIMIT;
    return user.plan === 'paid' ? CONFIG.FREE_LIMIT + CONFIG.PAID_EXTRA : CONFIG.FREE_LIMIT;
  }

  // ── Distance calculation ────────────────────────
  function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // ── Send listing to Google Forms ────────────────
  function buildFormUrl(product) {
    // You need to map form field entry IDs from your Google Form
    // Go to your form → View source → find entry.XXXXXXX for each field
    const base = CONFIG.FORM_URL.replace('/viewform', '/formResponse');
    const params = new URLSearchParams({
      'entry.SELLER_NAME_ENTRY_ID': product.sellerName,
      'entry.SELLER_PHONE_ENTRY_ID': product.sellerPhone,
      'entry.SELLER_WHATSAPP_ENTRY_ID': product.sellerWhatsApp,
      'entry.SELLER_EMAIL_ENTRY_ID': product.sellerEmail,
      'entry.SELLER_CITY_ENTRY_ID': product.sellerCity,
      'entry.PRODUCT_NAME_ENTRY_ID': product.productName,
      'entry.DESCRIPTION_ENTRY_ID': product.description,
      'entry.PRICE_ENTRY_ID': product.price,
      'entry.CATEGORY_ENTRY_ID': product.category,
      'entry.IMAGE_URL_ENTRY_ID': product.imageUrl,
    });
    return `${base}?${params.toString()}`;
  }

  return {
    getProducts,
    getMyListings,
    saveMyListing,
    deleteMyListing,
    updateMyListing,
    getCurrentUser,
    register,
    login,
    logout,
    refreshCurrentUser,
    updateUser,
    getMonthlyCount,
    incrementMonthlyCount,
    getProductLimit,
    getDistanceKm,
    buildFormUrl,
    getCurrentMonthKey,
    getFavorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoriteProducts,
  };
})();
