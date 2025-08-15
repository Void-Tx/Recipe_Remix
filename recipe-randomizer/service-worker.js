// Service Worker for Recipe Randomizer PWA
const CACHE_NAME = 'recipe-randomizer-v1';
const OFFLINE_URL = 'offline.html';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  OFFLINE_URL
];

// Install event: cache app shell and offline page
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate event: clean up old caches if needed
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch event: serve cached assets, fallback to offline page if offline
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // For navigation requests, try network first, then cache, then offline page
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() =>
          caches.match(event.request).then(
            resp => resp || caches.match(OFFLINE_URL)
          )
        )
    );
  } else {
    // For other requests, try cache first, then network
    event.respondWith(
      caches.match(event.request).then(
        resp => resp ||
          fetch(event.request).then(response => {
            // Optionally cache new requests
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
      )
    );
  }
});