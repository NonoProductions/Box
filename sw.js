// Service Worker for PWA
const CACHE_NAME = 'smart-box-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/config.js',
  '/manifest.json'
];

// Install - sofort aktivieren
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API-Aufrufe (Supabase etc.) NIEMALS cachen - immer direkt durchleiten
  if (url.includes('supabase.co') || url.includes('/rest/') || url.includes('/auth/')) {
    return;
  }

  // Für eigene Dateien (HTML, CSS, JS): Network First
  if (url.includes('.html') || url.includes('.css') || url.includes('.js') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Icons, Manifest etc.: Cache First
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

// Activate - alte Caches sofort löschen
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
    }).then(() => self.clients.claim())
  );
});

