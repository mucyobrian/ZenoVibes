// StillWorks Service Worker — PWA offline shell
// Cache version: bump this string to force cache refresh on next deploy
const CACHE_VERSION = 'sw-v1';

// App shell — these files are cached immediately on install
// Users get instant loads and a working offline shell even with no data
const APP_SHELL = [
  '/',
  '/index.html',
  '/pages/shop.html',
  '/pages/sell.html',
  '/pages/account.html',
  '/pages/product.html',
  '/pages/categories.html',
  '/css/style.css',
  '/css/components.css',
  '/js/config.js',
  '/js/db.js',
  '/js/app.js',
  '/js/home.js',
  '/js/engagement.js',
  '/js/subcat-images.js',
  '/manifest.json',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png',
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
// Pre-cache the app shell so first load after install is instant
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Take over immediately — don't wait for old SW to expire
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
// Clean up old cache versions from previous deploys
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
// Strategy:
//   • App shell (HTML/CSS/JS): Cache-first → always fast, works offline
//   • Google Sheets API (live product data): Network-first → fresh data when
//     online, falls back to last-cached version when offline
//   • Product images (HuggingFace, etc.): Stale-while-revalidate → show cached
//     instantly, update in background. Images are large, so we cap the cache.
//   • Everything else: Network-first with cache fallback

const SHEETS_ORIGIN = 'https://docs.google.com';
const HF_ORIGIN     = 'https://huggingface.co';

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (form submissions, API calls, etc.)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // ── Google Sheets / Apps Script: network-first ─────────────────────────
  if (url.origin === SHEETS_ORIGIN || url.hostname.endsWith('script.google.com')) {
    event.respondWith(networkFirstWithCache(request, 'api-cache-v1'));
    return;
  }

  // ── Product images (HuggingFace + any CDN image): stale-while-revalidate ──
  if (
    url.origin === HF_ORIGIN ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, 'img-cache-v1', 200));
    return;
  }

  // ── App shell (same origin HTML/CSS/JS): cache-first ───────────────────
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Default: network with cache fallback ───────────────────────────────
  event.respondWith(networkFirstWithCache(request, 'misc-cache-v1'));
});

// ── STRATEGY HELPERS ─────────────────────────────────────────────────────────

// Cache-first: serve from cache, fall back to network, store result
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback(request);
  }
}

// Network-first: try network, cache result, fall back to cache
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || offlineFallback(request);
  }
}

// Stale-while-revalidate with size cap: serve cache immediately, update async
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(async response => {
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(cache, maxEntries);
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

// Trim a cache to maxEntries (FIFO — oldest deleted first)
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
  }
}

// Offline fallback — return a simple offline page for HTML navigation requests
function offlineFallback(request) {
  const isNavigation = request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    return new Response(OFFLINE_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  // For non-HTML requests just return a 503
  return new Response('Offline', { status: 503 });
}

// Minimal offline page shown when user is offline and page isn't cached
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>StillWorks — Offline</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
      color: #1a1a1a;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    p { color: #555; font-size: 0.95rem; margin-bottom: 24px; line-height: 1.5; }
    a {
      display: inline-block;
      background: #e63329;
      color: #fff;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="icon">📶</div>
  <h1>You're offline</h1>
  <p>No internet connection right now.<br/>Connect to load new listings.</p>
  <a href="/" onclick="location.reload()">Try Again</a>
</body>
</html>`;
