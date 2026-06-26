// StillWorks Service Worker — PWA offline shell
const CACHE_VERSION = 'sw-v2';
const BASE = '/ZenoVibes';

const APP_SHELL = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/pages/shop.html',
  BASE + '/pages/sell.html',
  BASE + '/pages/account.html',
  BASE + '/pages/product.html',
  BASE + '/pages/categories.html',
  BASE + '/css/style.css',
  BASE + '/css/components.css',
  BASE + '/js/config.js',
  BASE + '/js/db.js',
  BASE + '/js/app.js',
  BASE + '/js/home.js',
  BASE + '/js/engagement.js',
  BASE + '/js/subcat-images.js',
  BASE + '/js/pwa.js',
  BASE + '/manifest.json',
  BASE + '/images/icons/icon-192.png',
  BASE + '/images/icons/icon-512.png',
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Google Sheets / Apps Script: network-first
  if (url.hostname === 'docs.google.com' || url.hostname.endsWith('script.google.com')) {
    event.respondWith(networkFirstWithCache(request, 'api-cache-v2'));
    return;
  }

  // Same-origin app shell: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(networkFirstWithCache(request, 'misc-cache-v2'));
});

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

function offlineFallback(request) {
  const isNavigation = request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html');
  if (isNavigation) {
    return new Response(OFFLINE_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  return new Response('Offline', { status: 503 });
}

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
