/**
 * 🚀 Service Worker für Serien-Ranking PWA
 * Implementiert Offline-First Strategien und Background Sync
 */

// Cache Versionen
const CACHE_VERSION = 'v2025.08.04.2236';
const STATIC_CACHE = `serien-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `serien-dynamic-${CACHE_VERSION}`;
const API_CACHE = `serien-api-${CACHE_VERSION}`;

// Statische Assets für Cache-First
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo128.png',
  '/logo384.png',
];

// Installation Event
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker v3.0.0 Installation...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Statische Assets werden gecacht...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker Installation erfolgreich');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker Installation fehlgeschlagen:', error);
      })
  );
});

// Aktivierung Event
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker Aktivierung...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            return (
              cacheName.includes('serien-') &&
              !cacheName.includes(CACHE_VERSION)
            );
          })
          .map((cacheName) => {
            console.log(`🗑️ Lösche alten Cache: ${cacheName}`);
            return caches.delete(cacheName);
          });

        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('✅ Service Worker aktiviert');
        return self.clients.claim();
      })
  );
});

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Nur GET Requests cachen
  if (request.method !== 'GET') {
    return;
  }

  // Cache-Strategien basierend auf URL
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);

  if (event.tag === 'firebase-sync') {
    event.waitUntil(syncPendingOperations());
  }
});

// Message Handler
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      clearCache(data?.cacheName);
      break;
  }
});

// Helper Functions
function isStaticAsset(url) {
  return (
    STATIC_ASSETS.some((asset) => url.pathname === asset) ||
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  );
}

function isApiRequest(url) {
  return (
    url.href.includes('api.themoviedb.org') ||
    url.href.includes('serienapi.konrad-dinges.de') ||
    url.href.includes('firebaseio.com')
  );
}

// Cache-First für statische Assets
async function handleStaticAsset(request) {
  try {
    // 🛡️ Filter unsupported schemes (chrome-extension, etc.)
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      console.warn('Service Worker: Unsupported scheme, skipping cache:', request.url);
      return fetch(request);
    }

    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Static asset fetch failed:', error);
    return new Response('Offline - Asset nicht verfügbar', { status: 503 });
  }
}

// Network-First für API Calls
async function handleApiRequest(request) {
  try {
    // 🛡️ Filter unsupported schemes
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      console.warn('Service Worker: Unsupported scheme for API, skipping cache:', request.url);
      return fetch(request);
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      JSON.stringify({
        error: 'Offline - API nicht verfügbar',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Network-First für dynamische Inhalte
async function handleDynamicRequest(request) {
  try {
    // 🛡️ Filter unsupported schemes
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      console.warn('Service Worker: Unsupported scheme for dynamic content, skipping cache:', request.url);
      return fetch(request);
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback für Navigationsrequests
    if (request.mode === 'navigate') {
      const fallback = await cache.match('/');
      if (fallback) {
        return fallback;
      }
    }

    return new Response('Offline - Seite nicht verfügbar', { status: 503 });
  }
}

// Background Sync für pending operations
async function syncPendingOperations() {
  try {
    console.log('🔄 Syncing pending operations...');
    // Hier würden die pending operations aus IndexedDB geladen und verarbeitet
    // Implementation abhängig von der spezifischen Firebase-Integration
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Cache Management
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('🗑️ Cache cleared:', cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('🗑️ All caches cleared');
    }
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}
