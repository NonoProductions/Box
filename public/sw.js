const STATIC_CACHE = 'smart-box-static-v1';
const RUNTIME_CACHE = 'smart-box-runtime-v1';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => ![STATIC_CACHE, RUNTIME_CACHE].includes(cacheName))
            .map(cacheName => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (!isSameOrigin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  const isStaticAsset =
    requestUrl.pathname.startsWith('/assets/') ||
    ['style', 'script', 'worker', 'image', 'font', 'manifest'].includes(event.request.destination);

  if (isStaticAsset) {
    event.respondWith(cacheFirst(event.request));
  }
});

async function networkFirst(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    runtimeCache.put(request, response.clone());
    return response;
  } catch {
    const cachedResponse = await runtimeCache.match(request);
    return cachedResponse || caches.match('/');
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const response = await fetch(request);
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  runtimeCache.put(request, response.clone());
  return response;
}
