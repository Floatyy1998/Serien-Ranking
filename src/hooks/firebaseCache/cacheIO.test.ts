import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/offlineFirebaseService', () => ({
  offlineFirebaseService: {
    getCachedData: vi.fn(),
    cacheData: vi.fn(),
    removeCachedData: vi.fn(),
  },
}));

import { offlineFirebaseService } from '../../services/offlineFirebaseService';
import { clearCachedPath, loadFromCache, saveToCache } from './cacheIO';

const mocked = vi.mocked(offlineFirebaseService);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getCachedData.mockResolvedValue(null);
  mocked.cacheData.mockResolvedValue(undefined);
  mocked.removeCachedData.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadFromCache', () => {
  it('liefert gecachte Daten aus IndexedDB', async () => {
    mocked.getCachedData.mockResolvedValue({ s1: { rating: 5 } });
    await expect(loadFromCache('users/u1/series', true)).resolves.toEqual({ s1: { rating: 5 } });
    expect(mocked.getCachedData).toHaveBeenCalledWith('users/u1/series');
  });

  it('gibt null zurück und fragt den Cache NICHT an, wenn Offline-Support aus ist', async () => {
    await expect(loadFromCache('users/u1/series', false)).resolves.toBeNull();
    expect(mocked.getCachedData).not.toHaveBeenCalled();
  });

  it('Cache-Miss (null) → null', async () => {
    await expect(loadFromCache('users/u1/series', true)).resolves.toBeNull();
  });

  it('Cache-Fehler ist still → null (Aufrufer fällt aufs Netzwerk zurück)', async () => {
    mocked.getCachedData.mockRejectedValue(new Error('idb kaputt'));
    await expect(loadFromCache('users/u1/series', true)).resolves.toBeNull();
  });
});

describe('saveToCache', () => {
  const options = {
    ttl: 60_000,
    version: 42,
    enableOfflineSupport: true,
    cacheInServiceWorker: false,
  };

  it('schreibt Daten mit ttl und Version in IndexedDB', async () => {
    await saveToCache('users/u1/series', { s1: {} }, options);
    expect(mocked.cacheData).toHaveBeenCalledWith('users/u1/series', { s1: {} }, 60_000, 42);
  });

  it('schreibt nichts, wenn Offline-Support aus ist', async () => {
    await saveToCache('users/u1/series', { s1: {} }, { ...options, enableOfflineSupport: false });
    expect(mocked.cacheData).not.toHaveBeenCalled();
  });

  it('schluckt Schreibfehler (non-fatal, Daten bleiben im Memory-State)', async () => {
    mocked.cacheData.mockRejectedValue(new Error('quota exceeded'));
    await expect(saveToCache('users/u1/series', { s1: {} }, options)).resolves.toBeUndefined();
  });

  it('postet zusätzlich an den Service Worker, wenn aktiviert und Controller vorhanden', async () => {
    const postMessage = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage } } });
    await saveToCache('users/u1/series', { s1: {} }, { ...options, cacheInServiceWorker: true });
    expect(postMessage).toHaveBeenCalledWith({
      type: 'CACHE_FIREBASE_DATA',
      data: { path: 'users/u1/series', data: { s1: {} } },
    });
  });

  it('postet NICHT an den Service Worker, wenn cacheInServiceWorker aus ist', async () => {
    const postMessage = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage } } });
    await saveToCache('users/u1/series', { s1: {} }, options);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('postet NICHT, wenn kein Service-Worker-Controller aktiv ist', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { controller: null } });
    await expect(
      saveToCache('users/u1/series', { s1: {} }, { ...options, cacheInServiceWorker: true })
    ).resolves.toBeUndefined();
    expect(mocked.cacheData).toHaveBeenCalled();
  });
});

describe('clearCachedPath', () => {
  it('entfernt die gecachten Daten für den Pfad', async () => {
    await clearCachedPath('users/u1/series', true);
    expect(mocked.removeCachedData).toHaveBeenCalledWith('users/u1/series');
  });

  it('tut nichts, wenn Offline-Support aus ist', async () => {
    await clearCachedPath('users/u1/series', false);
    expect(mocked.removeCachedData).not.toHaveBeenCalled();
  });

  it('schluckt Fehler beim Entfernen', async () => {
    mocked.removeCachedData.mockRejectedValue(new Error('idb kaputt'));
    await expect(clearCachedPath('users/u1/series', true)).resolves.toBeUndefined();
  });
});
