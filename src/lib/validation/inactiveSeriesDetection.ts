import firebase from 'firebase/compat/app';
import { Series } from '../../types/Series';
import { hasActiveRewatch } from './rewatch.utils';
import { getEpisodeAirDate } from '../../utils/episodeDate';
import {
  normalizeSeasons,
  normalizeEpisodes,
  getSeriesLastWatchedAt,
} from '../episode/seriesMetrics';

export interface InactiveSeriesData {
  seriesId: number;
  lastWatchedDate: number | null;
  lastChecked: number;
  notified?: boolean;
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage in Millisekunden
const CHECK_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // Alle 7 Tage prüfen

export const getStoredInactiveData = async (
  userId: string
): Promise<Record<string, InactiveSeriesData>> => {
  try {
    const ref = firebase.database().ref(`users/${userId}/inactiveSeriesData`);
    const snapshot = await ref.once('value');
    return (snapshot.val() as Record<string, InactiveSeriesData> | null) || {};
  } catch {
    return {};
  }
};

export const storeInactiveData = async (
  userId: string,
  data: Record<string, InactiveSeriesData>
): Promise<void> => {
  try {
    const ref = firebase.database().ref(`users/${userId}/inactiveSeriesData`);
    await ref.set(data);
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

const hasUpcomingEpisodes = (series: Series): boolean => {
  const today = new Date();

  // Prüfe ob die Serie noch läuft
  const status = series.status?.toLowerCase();
  const isRunning =
    status === 'running' ||
    status === 'in production' ||
    status === 'returning series' ||
    status === 'planned' ||
    status === 'continuing';

  // Wenn Serie als laufend markiert ist, hat sie potentiell zukünftige Episoden
  if (isRunning) {
    return true;
  }

  // Prüfe ob es Episoden mit zukünftigem Datum in den Seasons gibt
  for (const season of normalizeSeasons(series.seasons)) {
    for (const episode of normalizeEpisodes(season.episodes)) {
      const airDate = getEpisodeAirDate(episode);
      if (airDate && airDate > today) {
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
  const storedData = await getStoredInactiveData(userId);
  const currentTime = Date.now();
  const inactiveSeries: Series[] = [];
  const updatedStoredData = { ...storedData };

  // Lade bereits abgewiesene Benachrichtigungen
  const notificationsRef = firebase.database().ref(`users/${userId}/inactiveSeriesNotifications`);
  const notificationsSnapshot = await notificationsRef.once('value');
  const dismissedNotifications =
    (notificationsSnapshot.val() as Record<string, { dismissed: boolean; timestamp: number }>) ||
    {};

  for (const series of seriesList) {
    // Nur Serien auf der Watchlist prüfen, aktive Rewatches überspringen
    if (!series || !series.id || !series.watchlist) continue;
    if (hasActiveRewatch(series)) continue;

    // Überspringe Serien mit zukünftigen Episoden (laufende Serien)
    if (hasUpcomingEpisodes(series)) continue;

    const seriesKey = series.id.toString();
    const stored = storedData[seriesKey];
    const lastWatchedDate = getLastWatchedDate(series);

    // Prüfe ob Benachrichtigung für diese Serie bereits abgelehnt wurde
    const dismissedData = dismissedNotifications[series.id];
    const wasDismissedRecently =
      dismissedData?.dismissed && currentTime - dismissedData.timestamp < CHECK_COOLDOWN;

    if (!stored) {
      // Erste Erfassung
      updatedStoredData[seriesKey] = {
        seriesId: series.id,
        lastWatchedDate: lastWatchedDate,
        lastChecked: currentTime,
        notified: false,
      };
    } else {
      const timeSinceLastCheck = currentTime - stored.lastChecked;
      const shouldCheckAgain = timeSinceLastCheck >= CHECK_COOLDOWN;

      // Prüfen ob Serie inaktiv ist (länger als einen Monat nicht geschaut)
      if (lastWatchedDate) {
        const timeSinceLastWatch = currentTime - lastWatchedDate;

        if (timeSinceLastWatch > ONE_MONTH_MS && !stored.notified && !wasDismissedRecently) {
          // Serie wurde länger als einen Monat nicht geschaut
          inactiveSeries.push(series);

          updatedStoredData[seriesKey] = {
            ...stored,
            lastWatchedDate: lastWatchedDate,
            lastChecked: currentTime,
            // notified bleibt false bis User interagiert
          };
        } else if (lastWatchedDate !== stored.lastWatchedDate || shouldCheckAgain) {
          // Datum aktualisiert oder regelmäßiger Check
          updatedStoredData[seriesKey] = {
            ...stored,
            lastWatchedDate: lastWatchedDate,
            lastChecked: shouldCheckAgain ? currentTime : stored.lastChecked,
            // Reset notified wenn neue Episode geschaut wurde
            notified: lastWatchedDate !== stored.lastWatchedDate ? false : stored.notified,
          };
        }
      } else if (shouldCheckAgain) {
        // Keine Watch-History, aber lastChecked aktualisieren
        updatedStoredData[seriesKey] = {
          ...stored,
          lastChecked: currentTime,
        };
      }
    }
  }

  // Aufräumen: Entferne Daten für Serien die nicht mehr in der Watchlist sind
  const currentWatchlistIds = new Set(
    seriesList.filter((s) => s && s.id && s.watchlist).map((s) => s.id.toString())
  );
  for (const key of Object.keys(updatedStoredData)) {
    if (!currentWatchlistIds.has(key)) {
      delete updatedStoredData[key];
    }
  }

  // Aktualisierte Daten speichern
  await storeInactiveData(userId, updatedStoredData);

  return inactiveSeries;
};

/**
 * Erkennt Serien mit aktivem Rewatch, die seit 30 Tagen nicht mehr rewatcht wurden.
 */
export const detectInactiveRewatches = async (
  seriesList: Series[],
  userId: string
): Promise<Series[]> => {
  const currentTime = Date.now();
  const result: Series[] = [];

  const notificationsRef = firebase.database().ref(`users/${userId}/inactiveRewatchNotifications`);
  const notificationsSnapshot = await notificationsRef.once('value');
  const dismissedNotifications =
    (notificationsSnapshot.val() as Record<string, { dismissed: boolean; timestamp: number }>) ||
    {};

  for (const series of seriesList) {
    if (!series || !series.id || !series.watchlist) continue;
    if (!hasActiveRewatch(series)) continue;

    const dismissedData = dismissedNotifications[series.id];
    const wasDismissedRecently =
      dismissedData?.dismissed && currentTime - dismissedData.timestamp < CHECK_COOLDOWN;
    if (wasDismissedRecently) continue;

    // Use the later of: last watched episode date OR rewatch start date
    const lastWatchedDate = getLastWatchedDate(series);
    const rewatchStartedAt = series.rewatch?.startedAt
      ? new Date(series.rewatch.startedAt).getTime()
      : null;

    // Take the most recent activity (either a watched episode or the rewatch start)
    const lastActivity = Math.max(lastWatchedDate || 0, rewatchStartedAt || 0);

    if (lastActivity > 0 && currentTime - lastActivity > ONE_MONTH_MS) {
      result.push(series);
    }
  }

  return result;
};

export const markInactiveSeriesAsNotified = async (
  seriesId: number,
  userId: string
): Promise<void> => {
  const storedData = await getStoredInactiveData(userId);
  const seriesKey = seriesId.toString();

  if (storedData[seriesKey]) {
    storedData[seriesKey] = {
      ...storedData[seriesKey],
      notified: true,
      lastChecked: Date.now(),
    };
    await storeInactiveData(userId, storedData);
  }
};
