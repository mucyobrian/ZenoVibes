// StillWorks PWA — Service Worker registration + install prompt
// Include this script in every page just before </body>

(function () {
  'use strict';

  // ── Register Service Worker ───────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    // Resolve SW path regardless of whether we're in root or /pages/
    const swPath = location.pathname.startsWith('/pages/')
      ? '../sw.js'
      : 'sw.js';

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(swPath, { scope: '/' })
        .then(reg => {
          console.log('[SW] Registered, scope:', reg.scope);

          // Notify user when a new version is available
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                showUpdateBanner();
              }
            });
          });
        })
        .catch(err => console.warn('[SW] Registration failed:', err));
    });
  }

  // ── Install prompt (Android Chrome "Add to Home Screen") ─────────────────
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;

    // Only show the banner if user hasn't dismissed it this session
    if (!sessionStorage.getItem('pwa-banner-dismissed')) {
      showInstallBanner();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallBanner();
    console.log('[PWA] App installed');
  });

  // ── Install banner UI ─────────────────────────────────────────────────────
  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-inner">
        <img src="${resolveIconPath()}" alt="StillWorks" class="pwa-banner-icon"/>
        <div class="pwa-banner-text">
          <strong>Add StillWorks to your phone</strong>
          <span>Shop & sell — works offline too</span>
        </div>
        <button class="pwa-banner-install" id="pwaInstallBtn">Install</button>
        <button class="pwa-banner-dismiss" id="pwaDismissBtn" aria-label="Dismiss">✕</button>
      </div>
    `;

    // Inject styles inline so this works before CSS loads
    const style = document.createElement('style');
    style.textContent = `
      #pwa-install-banner {
        position: fixed;
        bottom: 68px; /* sit above the tab bar */
        left: 0; right: 0;
        z-index: 9999;
        padding: 0 12px 8px;
        animation: pwa-slide-up 0.3s ease;
      }
      @keyframes pwa-slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);   opacity: 1; }
      }
      .pwa-banner-inner {
        background: #1a1a1a;
        color: #fff;
        border-radius: 14px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      .pwa-banner-icon {
        width: 40px; height: 40px;
        border-radius: 8px;
        flex-shrink: 0;
      }
      .pwa-banner-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .pwa-banner-text strong { font-size: 0.85rem; }
      .pwa-banner-text span   { font-size: 0.75rem; color: #aaa; }
      .pwa-banner-install {
        background: #e63329;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
      }
      .pwa-banner-dismiss {
        background: none;
        border: none;
        color: #888;
        font-size: 1rem;
        cursor: pointer;
        padding: 4px;
        flex-shrink: 0;
      }
      #pwa-update-banner {
        position: fixed;
        top: 0; left: 0; right: 0;
        background: #1a1a1a;
        color: #fff;
        text-align: center;
        padding: 10px 16px;
        font-size: 0.85rem;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      #pwa-update-banner button {
        background: #e63329;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 5px 12px;
        font-size: 0.8rem;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') hideInstallBanner();
      deferredPrompt = null;
    });

    document.getElementById('pwaDismissBtn').addEventListener('click', () => {
      sessionStorage.setItem('pwa-banner-dismissed', '1');
      hideInstallBanner();
    });
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  }

  // ── Update available banner ───────────────────────────────────────────────
  function showUpdateBanner() {
    if (document.getElementById('pwa-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.innerHTML = `
      <span>New version of StillWorks available</span>
      <button id="pwaUpdateBtn">Refresh</button>
    `;
    document.body.prepend(banner);

    document.getElementById('pwaUpdateBtn').addEventListener('click', () => {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        location.reload();
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function resolveIconPath() {
    return location.pathname.startsWith('/pages/')
      ? '../images/icons/icon-192.png'
      : 'images/icons/icon-192.png';
  }

})();
