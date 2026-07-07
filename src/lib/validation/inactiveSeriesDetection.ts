import type { Series } from '../../types/Series';
import { dbGet, dbRef, dbUpdate, paths, userPath } from '../../services/db/ref';
import { hasActiveRewatch } from './rewatch.utils';
import { getEpisodeAirDate } from '../../utils/episodeDate';
import {
  normalizeSeasons,
  normalizeEpisodes,
  getSeriesLastWatchedAt,
} from '../episode/seriesMetrics';
import {
  getInactiveThresholdDays,
  getSnoozedUntil,
  cleanupSnoozes,
} from '../settings/notificationSettings';

export interface InactiveSeriesData {
  seriesId: number;
  lastWatchedDate: number | null;
  lastChecked: number;
  notified?: boolean;
  /** Wann die Notification dem User zuletzt gezeigt wurde. Zusammen mit dem
   * RENOTIFY_COOLDOWN entscheidet das, ob nach Ablauf wieder erinnert wird. */
  notifiedAt?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Grace-Periode für noch nicht geschaute, aber kürzlich ausgestrahlte Episoden.
 * Bewusst hartcodiert: das ist eine "User hat noch X Tage Zeit"-Regel, nicht
 * der konfigurierbare Inaktivitäts-Schwellwert. */
const RECENT_AIR_GRACE_DAYS = 30;
/** Wie oft Watch-Status persistent re-gecheckt wird. Kurz, damit Watch-Resets
 * schnell erkannt werden und nicht in einem Wochen-Cooldown stecken bleiben. */
const WATCH_CHECK_COOLDOWN = 1 * DAY_MS;
/** Cooldown nach explizitem Dismiss / Snooze / Action. Es gibt aktuell keinen
 * automatischen Mount-Marker mehr — die Karte verfolgt den User bis er reagiert. */
const RENOTIFY_COOLDOWN = 30 * DAY_MS;

export const getStoredInactiveData = async (
  userId: string
): Promise<Record<string, InactiveSeriesData>> => {
  try {
    return (
      (await dbGet<Record<string, InactiveSeriesData>>(userPath(userId, 'inactiveSeriesData'))) ||
      {}
    );
  } catch {
    return {};
  }
};

export const storeInactiveData = async (
  userId: string,
  data: Record<string, InactiveSeriesData>
): Promise<void> => {
  try {
    await dbRef(userPath(userId, 'inactiveSeriesData')).set(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[InactiveSeriesDetection] Failed to store inactive data: ${message}`);
  }
};

/**
 * Returns the most recent watch timestamp as epoch ms, or null if never watched.
 * Delegates to the shared `getSeriesLastWatchedAt` helper.
 */
const getLastWatchedDate = (series: Series): number | null => {
  const iso = getSeriesLastWatchedAt(series);
  if (iso === '1900-01-01') return null;
  const ts = new Date(iso).getTime();
  return isNaN(ts) ? null : ts;
};

/**
 * Prüft ob die Serie noch nicht als inaktiv gelten sollte:
 * - Laufende Serien (Status "running" etc.) → überspringe
 * - Zukünftige Episoden → überspringe
 * - Kürzlich ausgestrahlte Episoden (< 30 Tage) die noch nicht geschaut wurden → überspringe
 *   (User bekommt 30 Tage ab Ausstrahlung, um die Folge zu schauen)
 */
const shouldSkipForInactivity = (series: Series): boolean => {
  const status = series.status?.toLowerCase();
  const isRunning =
    status === 'running' ||
    status === 'in production' ||
    status === 'returning series' ||
    status === 'planned' ||
    status === 'continuing';

  if (isRunning) {
    return true;
  }

  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const graceMs = RECENT_AIR_GRACE_DAYS * DAY_MS;

  for (const season of normalizeSeasons(series.seasons)) {
    for (const episode of normalizeEpisodes(season.episodes)) {
      const airDate = getEpisodeAirDate(episode);
      if (!airDate) continue;

      // Zukünftige oder heutige Episode → überspringe
      if (airDate >= todayStart) return true;

      // Bereits ausgestrahlt aber innerhalb der Grace-Periode und nicht geschaut
      // → User hat noch Zeit, die Folge zu schauen
      const daysSinceAired = now - airDate.getTime();
      if (daysSinceAired < graceMs && !episode.watched) {
        return true;
      }
    }
  }

  return false;
};

export const detectInactiveSeries = async (
  seriesList: Series[],
  userId: string
): Promise<Series[]> => {
  const [storedData, thresholdDays, snoozed] = await Promise.all([
    getStoredInactiveData(userId),
    getInactiveThresholdDays(userId),
    getSnoozedUntil('inactive', userId),
  ]);

  // thresholdDays === 0 bedeutet: Feature deaktiviert
  if (thresholdDays <= 0) return [];

  const thresholdMs = thresholdDays * DAY_MS;
  const currentTime = Date.now();
  const inactiveSeries: Series[] = [];
  const updatedStoredData = { ...storedData };

  // Lade bereits abgewiesene Benachrichtigungen
  const dismissedNotifications =
    (await dbGet<Record<string, { dismissed: boolean; timestamp: number }>>(
      paths.notificationState(userId, 'inactiveSeriesNotifications')
    )) || {};

  for (const series of seriesList) {
    // Nur Serien auf der Watchlist prüfen, aktive Rewatches überspringen
    if (!series || !series.id || !series.watchlist) continue;
    if (hasActiveRewatch(series)) continue;

    // Überspringe Serien mit zukünftigen oder kürzlich ausgestrahlten ungeschauten Episoden
    if (shouldSkipForInactivity(series)) continue;

    const seriesKey = series.id.toString();
    const stored = storedData[seriesKey];
    const lastWatchedDate = getLastWatchedDate(series);

    // Cooldown nach explizitem Dismiss: nicht erneut zeigen bis RENOTIFY_COOLDOWN um ist.
    const dismissedData = dismissedNotifications[series.id];
    const wasDismissedRecently =
      dismissedData?.dismissed && currentTime - dismissedData.timestamp < RENOTIFY_COOLDOWN;
    const snoozedUntil = snoozed[seriesKey];
    const isSnoozed = typeof snoozedUntil === 'number' && snoozedUntil > currentTime;

    if (!stored) {
      // Erste Erfassung: trotzdem direkt prüfen ob die Serie schon inaktiv ist.
      // So gehen Notifications bei Daten-Reset/Migration nicht für einen Run verloren,
      // und User, die eine bereits "alte" Serie zur Watchlist hinzufügen, werden
      // direkt erinnert.
      updatedStoredData[seriesKey] = {
        seriesId: series.id,
        lastWatchedDate: lastWatchedDate,
        lastChecked: currentTime,
        notified: false,
      };
      if (
        lastWatchedDate &&
        currentTime - lastWatchedDate > thresholdMs &&
        !wasDismissedRecently &&
        !isSnoozed
      ) {
        inactiveSeries.push(series);
      }
      continue;
    }

    const watchChanged = lastWatchedDate !== stored.lastWatchedDate;
    // Wenn der User in der Zwischenzeit geschaut hat: notified-Flag resetten,
    // damit beim erneuten Inaktivwerden wieder erinnert wird.
    const newNotified = watchChanged ? false : (stored.notified ?? false);
    const newNotifiedAt = watchChanged ? undefined : stored.notifiedAt;

    let isInactive = false;
    if (lastWatchedDate) {
      const timeSinceLastWatch = currentTime - lastWatchedDate;
      if (timeSinceLastWatch > thresholdMs) {
        // Re-Notify nach Cooldown: auch wenn die Serie schon mal "notified" war,
        // erinnern wir nach RENOTIFY_COOLDOWN erneut — solange noch nichts geschaut
        // und der User die letzte Notification nicht explizit weggeklickt hat.
        const notifiedCooldownPassed =
          !newNotified ||
          (typeof newNotifiedAt === 'number' && currentTime - newNotifiedAt >= RENOTIFY_COOLDOWN);

        if (notifiedCooldownPassed && !wasDismissedRecently && !isSnoozed) {
          isInactive = true;
        }
      }
    }

    if (isInactive) {
      inactiveSeries.push(series);
    }

    const shouldRefreshCheck = currentTime - stored.lastChecked >= WATCH_CHECK_COOLDOWN;
    updatedStoredData[seriesKey] = {
      ...stored,
      lastWatchedDate: lastWatchedDate,
      lastChecked: shouldRefreshCheck ? currentTime : stored.lastChecked,
      notified: newNotified,
      ...(newNotifiedAt !== undefined ? { notifiedAt: newNotifiedAt } : {}),
    };
    // Wenn notifiedAt durch Watch-Reset weg ist, sicherstellen dass das Feld nicht
    // versehentlich vom Spread-stored mitgenommen wird.
    if (newNotifiedAt === undefined) {
      delete updatedStoredData[seriesKey].notifiedAt;
    }
  }

  // Aufräumen: Entferne Daten für Serien die nicht mehr in der Watchlist sind
  const currentWatchlistIds = new Set(
    seriesList.filter((s) => s && s.id && s.watchlist).map((s) => s.id.toString())
  );
  const notificationCleanup: Record<string, null> = {};
  for (const key of Object.keys(updatedStoredData)) {
    if (!currentWatchlistIds.has(key)) {
      delete updatedStoredData[key];
      notificationCleanup[userPath(userId, 'inactiveSeriesNotifications', key)] = null;
    }
  }
  for (const key of Object.keys(dismissedNotifications)) {
    if (!currentWatchlistIds.has(key)) {
      notificationCleanup[userPath(userId, 'inactiveSeriesNotifications', key)] = null;
    }
  }
  if (Object.keys(notificationCleanup).length > 0) {
    try {
      await dbUpdate(notificationCleanup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[InactiveSeriesDetection] Failed to cleanup notifications: ${message}`);
    }
  }

  // Aktualisierte Daten speichern
  await storeInactiveData(userId, updatedStoredData);
  await cleanupSnoozes('inactive', userId, currentWatchlistIds);

  return inactiveSeries;
};

interface InactiveRewatchData {
  seriesId: number;
  lastActivity: number;
  notified?: boolean;
  notifiedAt?: number;
}

const getStoredRewatchData = async (
  userId: string
): Promise<Record<string, InactiveRewatchData>> => {
  try {
    return (
      (await dbGet<Record<string, InactiveRewatchData>>(userPath(userId, 'inactiveRewatchData'))) ||
      {}
    );
  } catch {
    return {};
  }
};

/**
 * Erkennt Serien mit aktivem Rewatch, die seit dem konfigurierten Schwellwert nicht
 * mehr rewatcht wurden. Analoge Logik wie `detectInactiveSeries`:
 * - notifiedAt blockiert Re-Anzeige bis RENOTIFY_COOLDOWN abgelaufen
 * - lastActivity-Änderung (= User hat geschaut) resettet das notified-Flag
 */
export const detectInactiveRewatches = async (
  seriesList: Series[],
  userId: string
): Promise<Series[]> => {
  const thresholdDays = await getInactiveThresholdDays(userId);
  if (thresholdDays <= 0) return [];
  const thresholdMs = thresholdDays * DAY_MS;
  const currentTime = Date.now();
  const result: Series[] = [];

  const [storedData, dismissedNotificationsData, snoozed] = await Promise.all([
    getStoredRewatchData(userId),
    dbGet<Record<string, { dismissed: boolean; timestamp: number }>>(
      paths.notificationState(userId, 'inactiveRewatchNotifications')
    ),
    getSnoozedUntil('inactive-rewatch', userId),
  ]);
  const dismissedNotifications = dismissedNotificationsData || {};

  const updatedStoredData: Record<string, InactiveRewatchData> = { ...storedData };

  for (const series of seriesList) {
    if (!series || !series.id || !series.watchlist) continue;
    if (!hasActiveRewatch(series)) continue;

    const seriesKey = series.id.toString();

    // Letzte Aktivität: spätestes Watch-Datum oder Rewatch-Start
    const lastWatchedDate = getLastWatchedDate(series);
    const rewatchStartedAt = series.rewatch?.startedAt
      ? new Date(series.rewatch.startedAt).getTime()
      : null;
    const lastActivity = Math.max(lastWatchedDate || 0, rewatchStartedAt || 0);

    const stored = storedData[seriesKey];
    const activityChanged = stored && stored.lastActivity !== lastActivity;
    const newNotified = activityChanged ? false : (stored?.notified ?? false);
    const newNotifiedAt = activityChanged ? undefined : stored?.notifiedAt;

    const dismissedData = dismissedNotifications[series.id];
    const wasDismissedRecently =
      dismissedData?.dismissed && currentTime - dismissedData.timestamp < RENOTIFY_COOLDOWN;
    const snoozedUntil = snoozed[seriesKey];
    const isSnoozed = typeof snoozedUntil === 'number' && snoozedUntil > currentTime;

    if (lastActivity > 0 && currentTime - lastActivity > thresholdMs) {
      const notifiedCooldownPassed =
        !newNotified ||
        (typeof newNotifiedAt === 'number' && currentTime - newNotifiedAt >= RENOTIFY_COOLDOWN);

      if (notifiedCooldownPassed && !wasDismissedRecently && !isSnoozed) {
        result.push(series);
      }
    }

    updatedStoredData[seriesKey] = {
      seriesId: series.id,
      lastActivity,
      notified: newNotified,
      ...(newNotifiedAt !== undefined ? { notifiedAt: newNotifiedAt } : {}),
    };
    if (newNotifiedAt === undefined) {
      delete updatedStoredData[seriesKey].notifiedAt;
    }
  }

  // Cleanup: Einträge für Serien ohne aktiven Rewatch / nicht mehr Watchlist
  const currentRewatchIds = new Set(
    seriesList
      .filter((s) => s && s.id && s.watchlist && hasActiveRewatch(s))
      .map((s) => s.id.toString())
  );

  const cleanupUpdates: Record<string, unknown> = {};
  for (const key of Object.keys(updatedStoredData)) {
    if (!currentRewatchIds.has(key)) {
      delete updatedStoredData[key];
      cleanupUpdates[userPath(userId, 'inactiveRewatchNotifications', key)] = null;
    }
  }
  for (const key of Object.keys(dismissedNotifications)) {
    if (!currentRewatchIds.has(key)) {
      cleanupUpdates[userPath(userId, 'inactiveRewatchNotifications', key)] = null;
    }
  }

  try {
    await dbRef(userPath(userId, 'inactiveRewatchData')).set(updatedStoredData);
    if (Object.keys(cleanupUpdates).length > 0) {
      await dbUpdate(cleanupUpdates);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[InactiveRewatchDetection] Failed to persist: ${message}`);
  }
  await cleanupSnoozes('inactive-rewatch', userId, currentRewatchIds);

  return result;
};

/**
 * Wird vom UI nach Anzeige der Rewatch-Inactive-Notification aufgerufen.
 */
export const markInactiveRewatchAsNotified = async (
  seriesIds: number[],
  userId: string
): Promise<void> => {
  if (seriesIds.length === 0) return;
  const updates: Record<string, unknown> = {};
  const now = Date.now();
  for (const id of seriesIds) {
    updates[userPath(userId, 'inactiveRewatchData', id, 'notified')] = true;
    updates[userPath(userId, 'inactiveRewatchData', id, 'notifiedAt')] = now;
  }
  try {
    await dbUpdate(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[InactiveRewatchDetection] Failed to mark notified: ${message}`);
  }
};

/**
 * Wird vom UI nach Anzeige der Inactive-Notification aufgerufen. Setzt das
 * `notified`-Flag plus `notifiedAt`-Timestamp, damit die Detection den
 * RENOTIFY_COOLDOWN korrekt berechnen kann.
 */
export const markInactiveSeriesAsNotified = async (
  seriesIds: number[],
  userId: string
): Promise<void> => {
  if (seriesIds.length === 0) return;
  const updates: Record<string, unknown> = {};
  const now = Date.now();
  for (const id of seriesIds) {
    updates[userPath(userId, 'inactiveSeriesData', id, 'notified')] = true;
    updates[userPath(userId, 'inactiveSeriesData', id, 'notifiedAt')] = now;
    updates[userPath(userId, 'inactiveSeriesData', id, 'lastChecked')] = now;
  }
  try {
    await dbUpdate(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[InactiveSeriesDetection] Failed to mark notified: ${message}`);
  }
};
