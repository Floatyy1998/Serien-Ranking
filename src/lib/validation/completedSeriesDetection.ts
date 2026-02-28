import firebase from 'firebase/compat/app';
import { Series } from '../../types/Series';
import { hasActiveRewatch } from './rewatch.utils';

export interface CompletedSeriesData {
  seriesId: number;
  allEpisodesWatched: boolean;
  seriesStatus: string | null;
  lastChecked: number;
  notified?: boolean;
}

const CHECK_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // Alle 7 Tage prüfen

export const getStoredCompletedData = async (
  userId: string
): Promise<Record<string, CompletedSeriesData>> => {
  try {
    const ref = firebase.database().ref(`users/${userId}/completedSeriesData`);
    const snapshot = await ref.once('value');
    return snapshot.val() || {};
  } catch {
    return {};
  }
};

export const storeCompletedData = async (
  userId: string,
  data: Record<string, CompletedSeriesData>
) => {
  try {
    const ref = firebase.database().ref(`users/${userId}/completedSeriesData`);
    await ref.set(data);
  } catch (error) {
    console.error('Error storing completed series data:', error);
  }
};

const areAllEpisodesWatched = (series: Series): boolean => {
  const today = new Date();
  let hasAiredEpisodes = false;
  let allWatched = true;

  if (series.seasons) {
    for (const season of series.seasons) {
      if (season.episodes) {
        for (const episode of season.episodes) {
          // Nur ausgestrahlte Episoden zählen
          if (episode.air_date) {
            const airDate = new Date(episode.air_date);
            if (airDate <= today) {
              hasAiredEpisodes = true;
              if (!episode.watched) {
                allWatched = false;
              }
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
  const storedData = await getStoredCompletedData(userId);
  const currentTime = Date.now();
  const completedSeries: Series[] = [];
  const updatedStoredData = { ...storedData };

  // Lade bereits abgewiesene Benachrichtigungen
  const notificationsRef = firebase.database().ref(`users/${userId}/completedSeriesNotifications`);
  const notificationsSnapshot = await notificationsRef.once('value');
  const dismissedNotifications = notificationsSnapshot.val() || {};

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
      dismissedData?.dismissed && currentTime - dismissedData.timestamp < CHECK_COOLDOWN;

    if (!stored) {
      // Erste Erfassung
      updatedStoredData[seriesKey] = {
        seriesId: series.id,
        allEpisodesWatched: allEpisodesWatched,
        seriesStatus: series.status || null,
        lastChecked: currentTime,
        notified: false,
      };
    } else {
      const timeSinceLastCheck = currentTime - stored.lastChecked;
      const shouldCheckAgain = timeSinceLastCheck >= CHECK_COOLDOWN;

      // Prüfen ob Serie komplett geschaut ist und beendet
      if (allEpisodesWatched && seriesEnded && !stored.notified && !wasDismissedRecently) {
        // Serie ist komplett geschaut und beendet
        completedSeries.push(series);

        updatedStoredData[seriesKey] = {
          ...stored,
          allEpisodesWatched: allEpisodesWatched,
          seriesStatus: series.status || null,
          lastChecked: currentTime,
          // notified bleibt false bis User interagiert
        };
      } else if (shouldCheckAgain) {
        // Regelmäßiger Check
        updatedStoredData[seriesKey] = {
          ...stored,
          allEpisodesWatched: allEpisodesWatched,
          seriesStatus: series.status || null,
          lastChecked: currentTime,
          // Reset notified wenn Serie nicht mehr komplett ist
          notified: allEpisodesWatched === stored.allEpisodesWatched ? stored.notified : false,
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
  await storeCompletedData(userId, updatedStoredData);

  return completedSeries;
};

export const markCompletedSeriesAsNotified = async (seriesId: number, userId: string) => {
  const storedData = await getStoredCompletedData(userId);
  const seriesKey = seriesId.toString();

  if (storedData[seriesKey]) {
    storedData[seriesKey] = {
      ...storedData[seriesKey],
      notified: true,
      lastChecked: Date.now(),
    };
    await storeCompletedData(userId, storedData);
  }
};
