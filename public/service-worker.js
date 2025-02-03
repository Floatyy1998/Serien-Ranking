const CACHE_NAME = 'static-cache-v3.0.5'; // Erhöhen Sie die Cache-Version
const DATA_CACHE_NAME = 'data-cache-v2.0.5'; // Erhöhen Sie die Cache-Version

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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
