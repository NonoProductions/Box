// Service Worker for PWA
const CACHE_NAME = 'smart-box-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch - Network First Strategy für Entwicklung
self.addEventListener('fetch', (event) => {
  // Für CSS und JS: Network First (immer neueste Version)
  if (event.request.url.includes('.css') || event.request.url.includes('.js')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache die neue Version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback zu Cache wenn Netzwerk fehlschlägt
          return caches.match(event.request);
        })
    );
  } else {
    // Für andere Dateien: Cache First
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

