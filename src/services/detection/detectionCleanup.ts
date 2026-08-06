/**
 * Räumt den Erkennungs-Zustand eines Titels ab, wenn der Titel gelöscht wird.
 *
 * Bis Aug 2026 blieb pro gelöschter Serie ein gutes Dutzend Knoten liegen
 * (Provider-Stand, Melde-Marker, Staffelzähler), pro gelöschtem Film einer.
 * Unsichtbar für den Nutzer, weil alle Erkennungen über die *vorhandene* Liste
 * laufen — aber der Ballast wächst mit jedem Löschen mit.
 */
import { dbGet, dbUpdate, userPath } from '../db/ref';

/** Knoten, die je Serien-Id genau einen Eintrag halten. */
const SERIES_NODES = [
  'knownProviders',
  'completedSeriesData',
  'completedSeriesNotifications',
  'inactiveSeriesData',
  'inactiveSeriesNotifications',
  'inactiveRewatchData',
  'inactiveRewatchNotifications',
  'newSeasonNotifications',
  'providerChangeNotifications',
  'unratedSeriesNotifications',
] as const;

/**
 * Multi-Path-Update-Map für alle Knoten mit einfachem Id-Schlüssel.
 * `animeMangaNotifications` fehlt hier bewusst — der Schlüssel ist
 * `${seriesId}-${staffel}` und braucht einen Lookup, siehe unten.
 */
export function buildSeriesCleanup(uid: string, seriesId: string | number): Record<string, null> {
  const id = String(seriesId);
  const updates: Record<string, null> = {};
  for (const node of SERIES_NODES) updates[userPath(uid, node, id)] = null;
  updates[userPath(uid, 'meta', 'seasonCounts', id)] = null;
  return updates;
}

export function buildMovieCleanup(uid: string, movieId: string | number): Record<string, null> {
  return { [userPath(uid, 'movieProviderData', String(movieId))]: null };
}

/** Schlüssel aus `animeMangaNotifications`, die zu dieser Serie gehören. */
export function matchHandoffKeys(keys: string[], seriesId: string | number): string[] {
  const prefix = `${seriesId}-`;
  return keys.filter((key) => key.startsWith(prefix));
}

/** Best effort — ein fehlgeschlagenes Aufräumen darf das Löschen nie blockieren. */
export async function cleanupSeriesDetectionState(
  uid: string,
  seriesId: string | number
): Promise<void> {
  if (!uid || seriesId === undefined || seriesId === null) return;
  try {
    const updates = buildSeriesCleanup(uid, seriesId);
    const handoff = await dbGet<Record<string, unknown>>(
      userPath(uid, 'animeMangaNotifications')
    ).catch(() => null);
    if (handoff) {
      for (const key of matchHandoffKeys(Object.keys(handoff), seriesId)) {
        updates[userPath(uid, 'animeMangaNotifications', key)] = null;
      }
    }
    await dbUpdate(updates);
  } catch {
    // Wie alle Firebase-Writes der App: still scheitern, nicht werfen
  }
}

export async function cleanupMovieDetectionState(
  uid: string,
  movieId: string | number
): Promise<void> {
  if (!uid || movieId === undefined || movieId === null) return;
  try {
    await dbUpdate(buildMovieCleanup(uid, movieId));
  } catch {
    // still
  }
}
