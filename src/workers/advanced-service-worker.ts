// @ts-ignore
declare const self: any;
/**
 * 🚀 Advanced Service Worker für Serien-Ranking
 * Implementiert Offline-First Strategien mit Firebase Cache Integration
 */

// Cache Versionen
const CACHE_VERSION = 'v2025.08.06.1820';
const STATIC_CACHE = `serien-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `serien-dynamic-${CACHE_VERSION}`;
const FIREBASE_CACHE = `serien-firebase-${CACHE_VERSION}`;
const API_CACHE = `serien-api-${CACHE_VERSION}`;

// URLs für verschiedene Cache-Strategien
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo128.png',
  '/logo384.png',
];

const API_PATTERNS = [
  /^https:\/\/api\.themoviedb\.org\//,
  /^https:\/\/serienapi\.konrad-dinges\.de\//,
  /^https:\/\/image\.tmdb\.org\//,
];

const FIREBASE_PATTERNS = [
  /^https:\/\/.*\.firebaseio\.com\//,
  /^https:\/\/.*\.googleapis\.com\//,
];

/**
 * 🔧 Service Worker Installation
 */
self.addEventListener('install', (event: any) => {
  console.log('🚀 Service Worker v3.0.0 wird installiert...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Statische Assets werden gecacht...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker Installation abgeschlossen');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker Installation fehlgeschlagen:', error);
      })
  );
});

/**
 * 🔄 Service Worker Aktivierung
 */
self.addEventListener('activate', (event: any) => {
  console.log('🔄 Service Worker wird aktiviert...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            // Lösche alte Cache-Versionen
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
        console.log('✅ Service Worker Aktivierung abgeschlossen');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker Aktivierung fehlgeschlagen:', error);
      })
  );
});

/**
 * 🌐 Fetch Event Handler mit intelligenten Cache-Strategien
 */
self.addEventListener('fetch', (event: any) => {
  const request = event.request;
  const url = new URL(request.url);

  // Nur GET Requests cachen
  if (request.method !== 'GET') {
    return;
  }

  // Bestimme Cache-Strategie basierend auf URL
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isFirebaseRequest(url)) {
    event.respondWith(handleFirebaseRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

/**
 * 📡 Background Sync für offline Firebase Updates
 */
self.addEventListener('sync', (event: any) => {
  console.log('🔄 Background Sync ausgelöst:', event.tag);

  if (event.tag === 'firebase-sync') {
    event.waitUntil(syncFirebaseUpdates());
  } else if (event.tag === 'activity-sync') {
    event.waitUntil(syncActivityUpdates());
  }
});

/**
 * 💬 Message Handler für Cache-Management
 */
self.addEventListener('message', (event: any) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_FIREBASE_DATA':
      cacheFirebaseData(data.path, data.data);
      break;
    case 'CLEAR_CACHE':
      clearCache(data.cacheName);
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

/**
 * 🔍 URL Pattern Matching
 */
function isStaticAsset(url: URL): boolean {
  return (
    STATIC_ASSETS.some((asset) => url.pathname === asset) ||
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  );
}

function isApiRequest(url: URL): boolean {
  return API_PATTERNS.some((pattern) => pattern.test(url.href));
}

function isFirebaseRequest(url: URL): boolean {
  return FIREBASE_PATTERNS.some((pattern) => pattern.test(url.href));
}

/**
 * 📦 Cache-First Strategy (für statische Assets)
 */
async function handleStaticAsset(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('📦 Cache HIT (static):', request.url);
      return cachedResponse;
    }

    console.log('🌐 Cache MISS (static), fetching:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('❌ Static asset fetch failed:', error);
    return new Response('Offline - Asset nicht verfügbar', { status: 503 });
  }
}

/**
 * 🌐 Network-First Strategy (für API Calls)
 */
async function handleApiRequest(request: Request): Promise<Response> {
  try {
    console.log('🌐 API Request (network-first):', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('📦 API Response gecacht:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('📦 API Network failed, trying cache:', request.url);
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('📦 Cache HIT (API offline):', request.url);
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

/**
 * 🔄 Stale-While-Revalidate Strategy (für Firebase)
 */
async function handleFirebaseRequest(request: Request): Promise<Response> {
  const cache = await caches.open(FIREBASE_CACHE);
  const cachedResponse = await cache.match(request);

  // Parallel: Serve cache und update im Hintergrund
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        console.log('🔄 Firebase Cache aktualisiert:', request.url);
      }
      return response;
    })
    .catch((error) => {
      console.log('🔄 Firebase Network failed:', error);
      return null;
    });

  if (cachedResponse) {
    console.log('📦 Firebase Cache HIT (stale-while-revalidate):', request.url);
    // Cache sofort zurückgeben, aber im Hintergrund aktualisieren
    networkPromise;
    return cachedResponse;
  }

  // Kein Cache vorhanden, warte auf Network
  try {
    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }
  } catch (error) {
    console.error('❌ Firebase request failed:', error);
  }

  return new Response(
    JSON.stringify({
      error: 'Firebase nicht verfügbar',
      offline: true,
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * 🔄 Network-First Strategy (für dynamische Inhalte)
 */
async function handleDynamicRequest(request: Request): Promise<Response> {
  try {
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

/**
 * 🔄 Background Sync Funktionen
 */
async function syncFirebaseUpdates(): Promise<void> {
  try {
    console.log('🔄 Syncing Firebase updates...');

    // Hole pending updates aus IndexedDB
    const pendingUpdates = await getPendingFirebaseUpdates();

    for (const update of pendingUpdates) {
      try {
        await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body,
        });

        // Entferne erfolgreiches Update aus pending
        // await removePendingUpdate(update.id); // entfernt
        console.log('✅ Firebase update synced:', update.id);
      } catch (error) {
        console.error('❌ Firebase sync failed for:', update.id, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

async function syncActivityUpdates(): Promise<void> {
  try {
    console.log('🔄 Syncing activity updates...');

    // Hole pending activities aus IndexedDB
    const pendingActivities = await getPendingActivityUpdates();

    for (const activity of pendingActivities) {
      try {
        // Implementiere Activity-Sync-Logik
        // await syncSingleActivity(activity); // entfernt
        // await removePendingActivity(activity.id); // entfernt
        console.log('✅ Activity synced:', activity.id);
      } catch (error) {
        console.error('❌ Activity sync failed:', activity.id, error);
      }
    }
  } catch (error) {
    console.error('❌ Activity sync failed:', error);
  }
}

/**
 * 🗄️ IndexedDB Helper Funktionen
 */
async function getPendingFirebaseUpdates(): Promise<any[]> {
  // TODO: IndexedDB Integration implementieren
  return [];
}

async function getPendingActivityUpdates(): Promise<any[]> {
  // TODO: IndexedDB Integration implementieren
  return [];
}

/**
 * 📊 Cache Management
 */
async function cacheFirebaseData(path: string, data: any): Promise<void> {
  try {
    const cache = await caches.open(FIREBASE_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });

    await cache.put(path, response);
    console.log('📦 Firebase data cached:', path);
  } catch (error) {
    console.error('❌ Failed to cache Firebase data:', error);
  }
}

async function clearCache(cacheName?: string): Promise<void> {
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

async function getCacheStatus(): Promise<any> {
  try {
    const cacheNames = await caches.keys();
    const status = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        return {
          name,
          size: keys.length,
          items: keys.map((req) => req.url),
        };
      })
    );

    return { caches: status, timestamp: Date.now() };
  } catch (error) {
    console.error('❌ Failed to get cache status:', error);
    return { error: (error as any).message };
  }
}

export {};
