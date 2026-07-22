import type { Series } from '../../types/Series';
import { dbGet, dbUpdate, paths, userPath } from '../db/ref';
import { getSnoozedUntil, cleanupSnoozes } from '../../lib/settings/notificationSettings';

// Einfache Map: seriesId → bekannte Staffelanzahl (vom User bestätigter Stand)
type SeasonCounts = Record<string, number>;

interface ShownEntry {
  /** Welche `seasonCount` der User zuletzt nur passiv gesehen hat. */
  shownCount: number;
  /** Wann die Notification dem User zuletzt gezeigt wurde. */
  shownAt: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Nach passiver Anzeige: kurz Ruhe, damit die Notification nicht bei jedem Reload
 * sofort wieder springt — kommt nach Cooldown wieder, falls Staffelanzahl unverändert
 * und der User immer noch nicht reagiert hat. */
const SHOWN_COOLDOWN = 3 * DAY_MS;

const getStoredSeasonCounts = async (userId: string): Promise<SeasonCounts> => {
  try {
    return (await dbGet<SeasonCounts>(userPath(userId, 'meta', 'seasonCounts'))) || {};
  } catch {
    return {};
  }
};

const storeSeasonCounts = async (
  userId: string,
  data: SeasonCounts,
  previous: SeasonCounts = {}
): Promise<void> => {
  try {
    // Per-Key-Update statt Voll-Node-Set: clobbert keine parallel gesetzten Counts
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (previous[key] !== value) {
        updates[userPath(userId, 'meta', 'seasonCounts', key)] = value;
      }
    }
    for (const key of Object.keys(previous)) {
      if (!(key in data)) {
        updates[userPath(userId, 'meta', 'seasonCounts', key)] = null;
      }
    }
    if (Object.keys(updates).length > 0) {
      await dbUpdate(updates);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[NewSeasonDetection] Failed to store season counts: ${message}`);
  }
};

const getShownEntries = async (userId: string): Promise<Record<string, ShownEntry>> => {
  try {
    return (
      (await dbGet<Record<string, ShownEntry>>(
        paths.notificationState(userId, 'newSeasonNotifications')
      )) || {}
    );
  } catch {
    return {};
  }
};

export const detectNewSeasons = async (seriesList: Series[], userId: string): Promise<Series[]> => {
  const [storedCounts, shownEntries, snoozed] = await Promise.all([
    getStoredSeasonCounts(userId),
    getShownEntries(userId),
    getSnoozedUntil('new-season', userId),
  ]);
  const seriesWithNewSeasons: Series[] = [];
  const updatedCounts: SeasonCounts = {};
  const now = Date.now();

  for (const series of seriesList) {
    if (!series || !series.id || typeof series.seasonCount !== 'number') continue;

    const key = series.id.toString();
    const storedCount = storedCounts[key];
    updatedCounts[key] = storedCount ?? series.seasonCount;

    if (storedCount === undefined || series.seasonCount <= storedCount) continue;

    // Snooze respektieren
    const snoozedUntil = snoozed[key];
    if (typeof snoozedUntil === 'number' && snoozedUntil > now) continue;

    // Es gibt einen Diff — prüfen ob die Notification erst kürzlich gezeigt wurde
    // und der Staffel-Stand identisch ist (= passive Anzeige, kein Re-Trigger durch
    // neue Staffel). Wenn ja: skip, sonst zeigen.
    const shown = shownEntries[key];
    if (shown && shown.shownCount === series.seasonCount && now - shown.shownAt < SHOWN_COOLDOWN) {
      continue;
    }

    seriesWithNewSeasons.push(series);
  }

  // Cleanup: stale Einträge entfernen (Serien nicht mehr in Liste)
  const currentIds = new Set(seriesList.filter((s) => s?.id).map((s) => s.id.toString()));
  const cleanupUpdates: Record<string, null> = {};
  for (const key of Object.keys(shownEntries)) {
    if (!currentIds.has(key)) {
      cleanupUpdates[userPath(userId, 'newSeasonNotifications', key)] = null;
    }
  }
  for (const key of Object.keys(storedCounts)) {
    if (!currentIds.has(key)) {
      delete updatedCounts[key];
    }
  }
  if (Object.keys(cleanupUpdates).length > 0) {
    try {
      await dbUpdate(cleanupUpdates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NewSeasonDetection] Failed to cleanup notifications: ${message}`);
    }
  }

  // Speichere nur wenn sich was geändert hat (neue Serien hinzugekommen, alte raus)
  const counts = Object.keys(storedCounts);
  const updated = Object.keys(updatedCounts);
  const hasEntryChange =
    counts.length !== updated.length || updated.some((k) => !(k in storedCounts));
  if (hasEntryChange) {
    await storeSeasonCounts(userId, updatedCounts, storedCounts);
  }
  await cleanupSnoozes('new-season', userId, currentIds);

  return seriesWithNewSeasons;
};

/**
 * Wird vom UI nach Anzeige der NewSeason-Notification gerufen. Setzt nur den
 * passiven shownAt-Marker — `seasonCounts` bleibt unverändert, damit der Diff
 * nach SHOWN_COOLDOWN wieder entsteht, falls der User die Info weiter ignoriert.
 */
export const markNewSeasonsAsShown = async (
  seriesList: Pick<Series, 'id' | 'seasonCount'>[],
  userId: string
): Promise<void> => {
  if (seriesList.length === 0) return;
  const updates: Record<string, unknown> = {};
  const now = Date.now();
  for (const s of seriesList) {
    if (!s.id || typeof s.seasonCount !== 'number') continue;
    updates[userPath(userId, 'newSeasonNotifications', s.id)] = {
      shownCount: s.seasonCount,
      shownAt: now,
    };
  }
  if (Object.keys(updates).length === 0) return;
  try {
    await dbUpdate(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[NewSeasonDetection] Failed to mark shown: ${message}`);
  }
};

/**
 * Nach expliziter User-Aktion (Dismiss / "Watchlist" / Navigate): seasonCount
 * auf den aktuellen Wert hochsetzen, damit der Diff verschwindet und gleichzeitig
 * den passiven shownAt-Eintrag aufräumen.
 */
export const markMultipleSeasonsAsNotified = async (
  seriesIds: number[],
  userId: string,
  seriesList?: Series[]
): Promise<void> => {
  if (seriesIds.length === 0) return;
  const storedCounts = await getStoredSeasonCounts(userId);
  const updates: Record<string, unknown> = {};

  for (const id of seriesIds) {
    const key = id.toString();
    const series = seriesList?.find((s) => s.id === id);
    if (series && series.seasonCount > (storedCounts[key] ?? 0)) {
      updates[userPath(userId, 'meta', 'seasonCounts', key)] = series.seasonCount;
    }
    updates[userPath(userId, 'newSeasonNotifications', id)] = null;
  }

  try {
    await dbUpdate(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[NewSeasonDetection] Failed to mark notified: ${message}`);
  }
};
