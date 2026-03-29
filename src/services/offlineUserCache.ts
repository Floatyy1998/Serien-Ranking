import type { CachedUserData, FirebaseUserLike } from './offlineFirebaseTypes';

export async function cacheUserToStorage(
  user: FirebaseUserLike,
  enableIndexedDB: boolean,
  cacheDataFn: (path: string, data: unknown) => Promise<void>
): Promise<void> {
  if (!user) return;

  try {
    const userData: CachedUserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      metadata: user.metadata,
      cachedAt: Date.now(),
    };

    // Store in localStorage for quick access
    localStorage.setItem('cachedUser', JSON.stringify(userData));

    // Also store in IndexedDB for persistence
    if (enableIndexedDB) {
      await cacheDataFn(`user_${user.uid}`, userData);
    }
  } catch (error) {
    console.error('Failed to cache user:', error);
  }
}

export async function getCachedUserFromStorage(
  enableIndexedDB: boolean,
  getDB: () => Promise<IDBDatabase>
): Promise<CachedUserData | null> {
  try {
    // Try localStorage first
    const cached = localStorage.getItem('cachedUser');
    if (cached) {
      const userData = JSON.parse(cached);
      // Check if cache is not too old (24 hours)
      if (Date.now() - userData.cachedAt < 24 * 60 * 60 * 1000) {
        return userData;
      }
    }

    // Fallback to IndexedDB
    if (enableIndexedDB) {
      const db = await getDB();
      const transaction = db.transaction(['firebaseCache'], 'readonly');
      const store = transaction.objectStore('firebaseCache');

      return new Promise((resolve, reject) => {
        const request = store.get('user_*');
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
      });
    }

    return null;
  } catch (error) {
    console.error('Failed to get cached user:', error);
    return null;
  }
}

export async function clearCachedUserFromStorage(
  enableIndexedDB: boolean,
  getDB: () => Promise<IDBDatabase>
): Promise<void> {
  try {
    localStorage.removeItem('cachedUser');

    if (enableIndexedDB) {
      const db = await getDB();
      const transaction = db.transaction(['firebaseCache'], 'readwrite');
      const store = transaction.objectStore('firebaseCache');

      await new Promise<void>((resolve, reject) => {
        const request = store.delete('user_*');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error('Failed to clear cached user:', error);
  }
}
