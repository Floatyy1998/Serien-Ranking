/**
 * 📦 Offline-Cache-IO (IndexedDB via offlineFirebaseService + Service Worker).
 *
 * Alle Funktionen sind bewusst fehler-tolerant: Cache-Misses und
 * Schreibfehler sind still — die Daten leben weiterhin im Memory-State,
 * der Aufrufer fällt auf das Netzwerk zurück.
 */
import { offlineFirebaseService } from '../../services/offlineFirebaseService';

export interface SaveToCacheOptions {
  ttl: number;
  version?: number;
  enableOfflineSupport: boolean;
  cacheInServiceWorker: boolean;
}

/**
 * Daten aus allen verfügbaren Caches laden (aktuell: IndexedDB).
 */
export async function loadFromCache<T>(
  path: string,
  enableOfflineSupport: boolean
): Promise<T | null> {
  if (!enableOfflineSupport) return null;
  try {
    // 1. Versuche IndexedDB Cache
    const cachedData = await offlineFirebaseService.getCachedData(path);
    if (cachedData) {
      return cachedData as T;
    }
    // 2. Fallback: Memory Cache (falls implementiert)
    // Hier könnte ein Memory-Cache implementiert werden
    return null;
  } catch {
    return null; // cache miss is silent — caller falls back to network
  }
}

/**
 * Daten in alle Caches speichern (IndexedDB + optional Service Worker).
 */
export async function saveToCache<T>(
  path: string,
  newData: T,
  options: SaveToCacheOptions
): Promise<void> {
  const { ttl, version, enableOfflineSupport, cacheInServiceWorker } = options;
  if (!enableOfflineSupport) return;
  try {
    // IndexedDB Cache (mit Version falls vorhanden)
    await offlineFirebaseService.cacheData(path, newData, ttl, version);
    // Service Worker Cache (falls aktiviert)
    if (cacheInServiceWorker && 'serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_FIREBASE_DATA',
          data: { path, data: newData },
        });
      }
    }
  } catch {
    // ignore — cache write failures are non-fatal; data is still in memory state
  }
}

/**
 * Gecachte Daten für einen Pfad entfernen.
 */
export async function clearCachedPath(path: string, enableOfflineSupport: boolean): Promise<void> {
  try {
    if (enableOfflineSupport) {
      await offlineFirebaseService.removeCachedData(path);
    }
  } catch {
    // ignore — cache eviction failures are non-fatal
  }
}
