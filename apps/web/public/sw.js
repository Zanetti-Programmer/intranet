// Service Worker — Intranet Corporativa
// Bump CACHE_VERSION to force all clients to clear stale caches.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `intranet-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept PocketBase or Next.js API routes
  if (url.pathname.startsWith('/pb/') || url.pathname.startsWith('/api/')) {
    return; // let browser handle normally
  }

  // Navigation (HTML pages): always bypass HTTP cache to get fresh HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' })).catch(() =>
        caches.match('/') || fetch(request)
      )
    );
    return;
  }

  // Immutable static assets (_next/static/ have content-hashed names): cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Everything else: network-first, no caching (manifest, icons, fonts, etc.)
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
