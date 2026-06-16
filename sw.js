/* QuantView service worker
   - Precache the app shell so the app opens offline / installs as a PWA.
   - Same-origin assets (symbols list, icons) use stale-while-revalidate.
   - Navigations use network-first (so deployed updates show), falling back to cache offline.
   - Cross-origin requests (TradingView widgets, Plotly CDN) are left to the network untouched;
     those need live data and can't be reliably cached.
   Bump CACHE_VERSION whenever you ship new files to force clients to refresh. */

const CACHE_VERSION = 'quantview-v3';

// App shell — small, always-needed files.
const PRECACHE_URLS = [
  './',
  './index.html',
  './cse-symbols.js',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only handle our own origin. Let TradingView / Plotly / everything else go straight to network.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first so users get the latest deploy, with offline fallback to cached shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Same-origin assets: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req)
          .then(res => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
