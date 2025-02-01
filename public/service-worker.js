const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './src/index.css',
  './src/App.css',
  './src/index.tsx',
  './src/App.tsx',
  './src/theme.ts',
  './src/components/Header.tsx',
  './src/components/Legend.tsx',
  './src/components/SearchFilters.tsx',
  './src/components/SeriesGrid.tsx',
  './src/components/SeriesCard.tsx',
  // Fügen Sie hier weitere Dateien hinzu, die zwischengespeichert werden sollen
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            console.log(`Service Worker: Deleting cache ${cacheToDelete}`);
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  console.log(`Service Worker: Fetch event for ${event.request.url}`);
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              console.log(
                `Service Worker: Caching new data for ${event.request.url}`
              );
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            console.log(
              `Service Worker: Fetch failed, returning cached data for ${event.request.url}`
            );
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log(
          `Service Worker: Returning cached data for ${event.request.url}`
        );
        return response;
      }
      console.log(`Service Worker: Fetching new data for ${event.request.url}`);
      return fetch(event.request).catch(() => {
        console.log(
          `Service Worker: Fetch failed, returning cached index.html`
        );
        return caches.match('./index.html');
      });
    })
  );
});
