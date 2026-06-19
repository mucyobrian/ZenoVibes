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
  };

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ── Parse Google Sheets JSON response ──────────
  function parseGoogleSheetsJSON(raw) {
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

  // ── Normalize a raw sheet row into a product ───
  function normalizeProduct(p) {
    let images = [];
    const rawImages = p.imagesjson || p.images_json || p.imageJson || p.images;
    if (rawImages) {
      try {
        const parsed = typeof rawImages === 'string' ? JSON.parse(rawImages) : rawImages;
        if (Array.isArray(parsed)) images = parsed;
      } catch (e) { /* not valid JSON, ignore */ }
    }
    if (images.length === 0 && (p.imageurl || p.image)) {
      images = [{ url: p.imageurl || p.image, tag: '', price: parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) }];
    }
    return {
      id: p.id,
      sellerName: p.sellername || p.name || 'Seller',
      sellerPhone: p.sellerphone || p.phone || '',
      sellerWhatsApp: p.sellerwhatsapp || p.whatsapp || p.sellerphone || '',
      sellerEmail: p.selleremail || p.email || '',
      sellerCity: p.sellercity || p.city || '',
      sellerLat: parseFloat(p.sellerlat || p.lat || 0),
      sellerLng: parseFloat(p.sellerlng || p.lng || 0),
      productName: p.productname || p.product || 'Product',
      description: p.description || '',
      price: parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')),
      category: (p.category || 'other').toLowerCase(),
      subcategory: p.subcategory || '',
      images,
      timestamp: p.timestamp || new Date().toISOString(),
      status: p.status || 'active',
    };
  }

  // ── Fetch live products from Google Sheets ──────
  async function fetchFromSheets() {
    if (CONFIG.SHEET_CSV_URL.includes('YOUR_SHEET_ID')) {
      return null;
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

    if (now - cacheTime < CACHE_TTL) {
      const cached = localStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHE);
      if (cached) return JSON.parse(cached);
    }

    const live = await fetchFromSheets();
    if (live && live.length > 0) {
      const normalized = live
        .map(normalizeProduct)
        .filter(p => p.status === 'active' || p.status === '');

      localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHE, JSON.stringify(normalized));
      localStorage.setItem(STORAGE_KEYS.CACHE_TIME, String(now));
      return normalized;
    }

    return CONFIG.DEMO_PRODUCTS;
  }

  // ── Get MY listings from the live Sheet ─────────
  // Fetches all products then filters by the logged-in seller's email.
  // This means listings show up on every device, not just the one used to post.
  async function getMyListings() {
    const user = getCurrentUser();
    if (!user) return [];

    try {
      const res = await fetch(CONFIG.SHEET_CSV_URL);
      const text = await res.text();
      const raw = parseGoogleSheetsJSON(text);
      return raw
        .map(normalizeProduct)
        .filter(p =>
          (p.sellerEmail || '').toLowerCase() === user.email.toLowerCase() &&
          p.status !== 'deleted'
        );
    } catch (e) {
      console.warn('Could not fetch my listings from Sheet', e);
      // Fallback: return locally cached listings for this user
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
      return all.filter(p => (p.sellerEmail || '').toLowerCase() === user.email.toLowerCase());
    }
  }

  // ── Save a new listing locally (optimistic) ─────
  // The real save happens via Google Form; this just lets the seller
  // see their listing immediately before the Sheet syncs.
  function saveMyListing(product) {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
    const newProduct = {
      ...product,
      id: 'prod_' + Date.now(),
      timestamp: new Date().toISOString(),
      status: 'active',
    };
    existing.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify(existing));
    // Bust the shared product cache so next load sees it
    localStorage.removeItem(STORAGE_KEYS.CACHE_TIME);
    return newProduct;
  }

  // ── Delete a listing via Apps Script API ────────
  // Removes the row from Google Sheets AND decrements the monthly count.
  async function deleteMyListing(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not logged in');

    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes('YOUR_')) {
      // No API configured — fall back to local-only delete
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
      localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify(existing.filter(p => p.id !== id)));
      return { success: true, local: true };
    }

    try {
      const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // avoid CORS preflight
        body: JSON.stringify({
          action: 'delete',
          id: id,
          sellerEmail: user.email,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');

      // Also remove from local cache so UI updates immediately
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_LISTINGS) || '[]');
      localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify(existing.filter(p => p.id !== id)));

      // Decrement monthly count
      const count = getMonthlyCount();
      if (count > 0) updateUser({ monthlyCount: count - 1, monthKey: getCurrentMonthKey() });

      // Bust shared product cache
      localStorage.removeItem(STORAGE_KEYS.CACHE_TIME);

      return data;
    } catch (e) {
      console.error('Delete API error:', e);
      throw e;
    }
  }

  // ── Update (edit) a listing via Apps Script API ─
  async function updateMyListing(id, updates) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not logged in');

    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes('YOUR_')) {
      throw new Error('Apps Script URL not configured');
    }

    try {
      const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'update',
          id: id,
          sellerEmail: user.email,
          updates: updates,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Update failed');

      // Bust shared product cache so next load reflects the edit
      localStorage.removeItem(STORAGE_KEYS.CACHE_TIME);

      return data;
    } catch (e) {
      console.error('Update API error:', e);
      throw e;
    }
  }

  // ── USER AUTH (localStorage-based) ─────────────
  function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  function register(data) {
    const users = JSON.parse(localStorage.getItem('sokohub_users') || '[]');
    if (users.find(u => u.email === data.email)) {
      throw new Error('An account with this email already exists.');
    }
    const user = {
      ...data,
      id: 'user_' + Date.now(),
      joinedAt: new Date().toISOString(),
      plan: 'free',
      monthlyCount: 0,
      monthKey: getCurrentMonthKey(),
    };
    users.push(user);
    localStorage.setItem('sokohub_users', JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  }

  function login(email, password) {
    const users = JSON.parse(localStorage.getItem('sokohub_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password.');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  function updateUser(updates) {
    const user = getCurrentUser();
    if (!user) return null;
    const updated = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    const users = JSON.parse(localStorage.getItem('sokohub_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = updated;
      localStorage.setItem('sokohub_users', JSON.stringify(users));
    }
    return updated;
  }

  // ── Monthly count tracking ──────────────────────
  function getCurrentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  }

  function getMonthlyCount() {
    const user = getCurrentUser();
    if (!user) return 0;
    if (user.monthKey !== getCurrentMonthKey()) {
      updateUser({ monthlyCount: 0, monthKey: getCurrentMonthKey() });
      return 0;
    }
    return user.monthlyCount || 0;
  }

  function incrementMonthlyCount() {
    const count = getMonthlyCount();
    const user = getCurrentUser();
    const limit = user.plan === 'paid' ? CONFIG.FREE_LIMIT + CONFIG.PAID_EXTRA : CONFIG.FREE_LIMIT;
    if (count >= limit) {
      throw new Error('limit_reached');
    }
    updateUser({ monthlyCount: count + 1, monthKey: getCurrentMonthKey() });
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
    updateUser,
    getMonthlyCount,
    incrementMonthlyCount,
    getProductLimit,
    getDistanceKm,
    buildFormUrl,
    getCurrentMonthKey,
  };
})();
