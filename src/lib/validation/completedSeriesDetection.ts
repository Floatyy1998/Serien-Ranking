import type { Series } from '../../types/Series';
import { dbGet, dbRef, dbUpdate, paths, userPath } from '../../services/db/ref';
import { hasActiveRewatch } from './rewatch.utils';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { getSnoozedUntil, cleanupSnoozes } from '../settings/notificationSettings';

export interface CompletedSeriesData {
  seriesId: number;
  allEpisodesWatched: boolean;
  seriesStatus: string | null;
  lastChecked: number;
  notified?: boolean;
  /** Wann die Notification dem User zuletzt gezeigt wurde — verhindert via
   * RENOTIFY_COOLDOWN wiederholte Anzeige derselben "abgeschlossen"-Meldung. */
  notifiedAt?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WATCH_CHECK_COOLDOWN = 1 * DAY_MS;
/** Cooldown nach explizitem Dismiss. "Abgeschlossen" ist ein stabiler
 * Zustand — wir nerven nicht jeden Monat damit. */
const RENOTIFY_COOLDOWN = 90 * DAY_MS;

export const getStoredCompletedData = async (
  userId: string
): Promise<Record<string, CompletedSeriesData>> => {
  try {
    return (
      (await dbGet<Record<string, CompletedSeriesData>>(userPath(userId, 'completedSeriesData'))) ||
      {}
    );
  } catch {
    return {};
  }
};

export const storeCompletedData = async (
  userId: string,
  data: Record<string, CompletedSeriesData>
): Promise<void> => {
  try {
    await dbRef(userPath(userId, 'completedSeriesData')).set(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[CompletedSeriesDetection] Failed to store completed data: ${message}`);
  }
};

const areAllEpisodesWatched = (series: Series): boolean => {
  let hasAiredEpisodes = false;
  let allWatched = true;

  if (series.seasons) {
    for (const season of series.seasons) {
      if (season.episodes) {
        for (const episode of season.episodes) {
          if (hasEpisodeAired(episode)) {
            hasAiredEpisodes = true;
            if (!episode.watched) {
              allWatched = false;
            }
          }
        }
      }
    }
  }

  return hasAiredEpisodes && allWatched;
};

const isSeriesEnded = (series: Series): boolean => {
  // Prüfe verschiedene Status-Felder
  const status = series.status?.toLowerCase();

  return status === 'ended' || status === 'canceled' || status === 'cancelled';
};

export const detectCompletedSeries = async (
  seriesList: Series[],
  userId: string
): Promise<Series[]> => {
  const [storedData, snoozed] = await Promise.all([
    getStoredCompletedData(userId),
    getSnoozedUntil('completed', userId),
  ]);
  const currentTime = Date.now();
  const completedSeries: Series[] = [];
  const updatedStoredData = { ...storedData };

  // Lade bereits abgewiesene Benachrichtigungen
  const dismissedNotifications =
    (await dbGet<Record<string, { dismissed: boolean; timestamp: number }>>(
      paths.notificationState(userId, 'completedSeriesNotifications')
    )) || {};

  for (const series of seriesList) {
    // Nur Serien auf der Watchlist prüfen, aktive Rewatches überspringen
    if (!series || !series.id || !series.watchlist) continue;
    if (hasActiveRewatch(series)) continue;

    const seriesKey = series.id.toString();
    const stored = storedData[seriesKey];
    const allEpisodesWatched = areAllEpisodesWatched(series);
    const seriesEnded = isSeriesEnded(series);

    // Prüfe ob Benachrichtigung für diese Serie bereits abgelehnt wurde
    const dismissedData = dismissedNotifications[series.id];
    const wasDismissedRecently =
      dismissedData?.dismissed && currentTime - dismissedData.timestamp < RENOTIFY_COOLDOWN;
    const snoozedUntil = snoozed[seriesKey];
    const isSnoozed = typeof snoozedUntil === 'number' && snoozedUntil > currentTime;

    if (!stored) {
      // Erste Erfassung: trotzdem direkt prüfen — sonst gehen Notifications bei
      // Daten-Reset / Migration für einen Run verloren.
      updatedStoredData[seriesKey] = {
        seriesId: series.id,
        allEpisodesWatched: allEpisodesWatched,
        seriesStatus: series.status || null,
        lastChecked: currentTime,
        notified: false,
      };
      if (allEpisodesWatched && seriesEnded && !wasDismissedRecently && !isSnoozed) {
        completedSeries.push(series);
      }
      continue;
    }

    // Wenn die Serie zwischenzeitlich "nicht mehr komplett" war (z.B. neue Episode
    // ausgestrahlt aber nicht geschaut, oder User hat Episode entwatcht): Reset.
    const completenessChanged = allEpisodesWatched !== stored.allEpisodesWatched;
    const newNotified = completenessChanged ? false : (stored.notified ?? false);
    const newNotifiedAt = completenessChanged ? undefined : stored.notifiedAt;

    let isCompleted = false;
    if (allEpisodesWatched && seriesEnded) {
      const notifiedCooldownPassed =
        !newNotified ||
        (typeof newNotifiedAt === 'number' && currentTime - newNotifiedAt >= RENOTIFY_COOLDOWN);

      if (notifiedCooldownPassed && !wasDismissedRecently && !isSnoozed) {
        isCompleted = true;
      }
    }

    if (isCompleted) {
      completedSeries.push(series);
    }

    const shouldRefreshCheck = currentTime - stored.lastChecked >= WATCH_CHECK_COOLDOWN;
    updatedStoredData[seriesKey] = {
      ...stored,
      allEpisodesWatched: allEpisodesWatched,
      seriesStatus: series.status || null,
      lastChecked: shouldRefreshCheck ? currentTime : stored.lastChecked,
      notified: newNotified,
      ...(newNotifiedAt !== undefined ? { notifiedAt: newNotifiedAt } : {}),
    };
    if (newNotifiedAt === undefined) {
      delete updatedStoredData[seriesKey].notifiedAt;
    }
  }

  // Cleanup: stale Einträge entfernen (Data + Notifications)
  const currentWatchlistIds = new Set(
    seriesList.filter((s) => s && s.id && s.watchlist).map((s) => s.id.toString())
  );
  for (const key of Object.keys(updatedStoredData)) {
    if (!currentWatchlistIds.has(key)) {
      delete updatedStoredData[key];
    }
  }

  const notificationCleanup: Record<string, null> = {};
  for (const key of Object.keys(dismissedNotifications)) {
    if (!currentWatchlistIds.has(key)) {
      notificationCleanup[userPath(userId, 'completedSeriesNotifications', key)] = null;
    }
  }
  if (Object.keys(notificationCleanup).length > 0) {
    try {
      await dbUpdate(notificationCleanup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CompletedSeriesDetection] Failed to cleanup notifications: ${message}`);
    }
  }

  // Aktualisierte Daten speichern
  await storeCompletedData(userId, updatedStoredData);
  await cleanupSnoozes('completed', userId, currentWatchlistIds);

  return completedSeries;
};

/**
 * Wird vom UI nach Anzeige der Completed-Notification aufgerufen. Setzt
 * `notified: true` plus `notifiedAt`, damit die Detection beim nächsten Lauf
 * den RENOTIFY_COOLDOWN respektiert.
 */
export const markCompletedSeriesAsNotified = async (
  seriesIds: number[],
  userId: string
): Promise<void> => {
  if (seriesIds.length === 0) return;
  const updates: Record<string, unknown> = {};
  const now = Date.now();
  for (const id of seriesIds) {
    updates[userPath(userId, 'completedSeriesData', id, 'notified')] = true;
    updates[userPath(userId, 'completedSeriesData', id, 'notifiedAt')] = now;
    updates[userPath(userId, 'completedSeriesData', id, 'lastChecked')] = now;
  }
  try {
    await dbUpdate(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[CompletedSeriesDetection] Failed to mark notified: ${message}`);
  }
};
