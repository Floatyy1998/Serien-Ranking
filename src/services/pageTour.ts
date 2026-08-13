/**
 * Merkt sich, welche Seitenhilfen ein Konto schon gesehen hat.
 *
 * Der Zustand liegt am Konto (`users/$uid/pageToursSeen`), nicht am Gerät —
 * sonst liefe dieselbe Hilfe auf Handy, Tablet und im Browser noch einmal.
 * localStorage bleibt als Spiegel daneben: er ist sofort da, während der
 * RTDB-Lesevorgang noch läuft, und trägt den Stand offline weiter.
 */

import type { SeenTours } from '../lib/pageTour';
import { dbGet, dbRef, userPath } from './db/ref';

const STORAGE_KEY = 'pageToursSeen';

const sanitize = (raw: unknown): SeenTours => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const seen: SeenTours = {};
  for (const [path, version] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof version === 'number' && Number.isFinite(version)) seen[path] = version;
  }
  return seen;
};

/** Route-Muster enthalten `/` und `:` — beides taugt nicht als RTDB-Schlüssel. */
const encodePath = (path: string): string => path.replace(/[/:.#$[\]]/g, '_');

const encodeSeen = (seen: SeenTours): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [path, version] of Object.entries(seen)) out[encodePath(path)] = version;
  return out;
};

const readLocal = (): SeenTours => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
};

const writeLocal = (seen: SeenTours): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    /* Quota voll — der Kontostand in der RTDB bleibt die Wahrheit */
  }
};

/** Sofort verfügbarer Stand, bevor die RTDB geantwortet hat. */
export const readSeenTours = (): SeenTours => readLocal();

/**
 * Kontostand holen und mit dem lokalen Spiegel vereinen. Die höhere Version
 * gewinnt, damit ein zweites Gerät nichts zurückdreht.
 */
export const loadSeenTours = async (uid: string): Promise<SeenTours> => {
  const local = readLocal();
  try {
    const remote = sanitize(await dbGet(userPath(uid, 'pageToursSeen')));
    const merged: SeenTours = { ...local };
    // Der Remote-Stand ist kodiert (Schrägstriche ersetzt) — lokal steht das
    // Route-Muster, also über die Kodierung vergleichen statt über den Schlüssel.
    for (const [path, version] of Object.entries(local)) {
      const encoded = encodePath(path);
      if ((remote[encoded] ?? 0) > version) merged[path] = remote[encoded];
    }
    for (const [encoded, version] of Object.entries(remote)) {
      const known = Object.keys(merged).some((p) => encodePath(p) === encoded);
      if (!known) merged[encoded] = version;
    }
    writeLocal(merged);
    return merged;
  } catch {
    return local; // offline oder Regel-Fehler: der lokale Stand reicht
  }
};

export const writeSeenTours = (seen: SeenTours, uid?: string): void => {
  writeLocal(seen);
  if (!uid) return;
  try {
    dbRef(userPath(uid, 'pageToursSeen'))
      .set(encodeSeen(seen))
      .catch(() => {});
  } catch {
    /* Schreiben ist best effort — der lokale Spiegel trägt weiter */
  }
};

/** Alle Hilfen wieder aktivieren (Knopf in den Einstellungen). */
export const resetSeenTours = (uid?: string): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nichts zu tun */
  }
  if (!uid) return;
  try {
    dbRef(userPath(uid, 'pageToursSeen'))
      .remove()
      .catch(() => {});
  } catch {
    /* best effort */
  }
};
