import { dbGet, dbRef, serverTimestamp } from './db/ref';

/**
 * Spoiler-Reveals ("Spoiler trotzdem anzeigen") geräteübergreifend.
 * localStorage bleibt der synchrone Cache (bestehende Keys unverändert),
 * users/$uid/spoilerRevealed/{key} ist die geteilte Quelle. Firebase-Writes
 * sind best effort.
 */

const LEGACY_PREFIX = 'spoiler_revealed_';

export const isSpoilerRevealed = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export const markSpoilerRevealed = (uid: string | undefined, key: string): void => {
  try {
    localStorage.setItem(key, 'true');
  } catch {
    // Quota egal
  }
  if (!uid || !/^[A-Za-z0-9_-]+$/.test(key)) return;
  try {
    dbRef(`users/${uid}/spoilerRevealed/${key}`)
      .set(serverTimestamp())
      .catch(() => {});
  } catch {
    // Firebase noch nicht initialisiert — Reveal bleibt lokal
  }
};

/**
 * Einmal pro Login: Remote-Reveals in den lokalen Cache ziehen und lokale
 * Alt-Reveals (vor der Sync-Einführung) nach Firebase hochschieben.
 */
export async function syncSpoilerReveals(uid: string): Promise<void> {
  if (!uid) return;
  try {
    const remote = (await dbGet<Record<string, unknown>>(`users/${uid}/spoilerRevealed`)) || {};
    for (const key of Object.keys(remote)) {
      try {
        localStorage.setItem(key, 'true');
      } catch {
        break;
      }
    }

    const missing: Record<string, object> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(LEGACY_PREFIX) || remote[key]) continue;
      if (!/^[A-Za-z0-9_-]+$/.test(key)) continue;
      if (localStorage.getItem(key) === 'true') missing[key] = serverTimestamp();
    }
    if (Object.keys(missing).length > 0) {
      await dbRef(`users/${uid}/spoilerRevealed`).update(missing);
    }
  } catch {
    // best effort
  }
}
