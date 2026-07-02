/**
 * serienVersion-Vergleich (versionPath-Skip).
 *
 * Auf `versionPath` (z.B. users/{uid}/meta/serienVersion) liegt ein
 * Versions-Zähler, der bei jedem Write gebumpt wird. Stimmen Remote- und
 * Cache-Version überein, ist der IndexedDB-Cache aktuell und der teure
 * Full-Load kann übersprungen werden (Multi-Device-korrekt).
 */
import firebase from 'firebase/compat/app';
import { offlineFirebaseService } from '../../services/offlineFirebaseService';

/**
 * Nur wenn BEIDE Versionen vorhanden sind und übereinstimmen, darf der
 * Full-Load übersprungen werden. Fehlende Version (null) → kein Skip.
 */
export function versionsMatch(remoteVersion: number | null, cachedVersion: number | null): boolean {
  return remoteVersion !== null && cachedVersion !== null && remoteVersion === cachedVersion;
}

/** Firebase liefert null für "nicht vorhanden" — im Hook wird undefined geführt. */
export function normalizeVersion(version: number | null | undefined): number | undefined {
  return version ?? undefined;
}

/** Liest den Remote-Versionszähler (undefined wenn nicht vorhanden). */
export async function fetchRemoteVersion(versionPath: string): Promise<number | undefined> {
  const vSnap = await firebase.database().ref(versionPath).once('value');
  return normalizeVersion(vSnap.val());
}

/**
 * Liest Remote-Version (Firebase, eine einzelne Zahl) und Cache-Version
 * (IndexedDB) parallel. Wirft bei Firebase-Fehlern — der Aufrufer macht dann
 * sicherheitshalber einen Full-Load.
 */
export async function fetchVersionPair(
  versionPath: string,
  path: string
): Promise<{ remoteVersion: number | null; cachedVersion: number | null }> {
  const [remoteVersionSnap, cachedVersion] = await Promise.all([
    firebase.database().ref(versionPath).once('value'),
    offlineFirebaseService.getCacheVersion(path),
  ]);
  return { remoteVersion: remoteVersionSnap.val(), cachedVersion };
}
