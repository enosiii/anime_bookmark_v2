// Change cache version to force update
const CACHE_NAME = 'anime-bookmark-cache-v1'; // ← Increment version

const ASSETS_TO_CACHE = [
    '/anime_bookmark_v2/',
    '/anime_bookmark_v2/index.html',
    '/anime_bookmark_v2/styles2.css',
    '/anime_bookmark_v2/script.js',
    '/anime_bookmark_v2/checkbox.css',
    '/anime_bookmark_v2/abm192.png',
    '/anime_bookmark_v2/abm512.png',
    '/anime_bookmark_v2/manifest.json'
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate the service worker and clean up old caches
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

// Serve cached assets when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});