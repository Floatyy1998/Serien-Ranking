import firebase from 'firebase/compat/app';
import { Series } from '../../types/Series';

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
    return snapshot.val() || {};
  } catch {
    return {};
  }
};

export const storeInactiveData = async (
  userId: string,
  data: Record<string, InactiveSeriesData>
) => {
  try {
    const ref = firebase.database().ref(`users/${userId}/inactiveSeriesData`);
    await ref.set(data);
  } catch (error) {
    console.error('Error storing inactive series data:', error);
  }
};

const getLastWatchedDate = (series: Series): number | null => {
  let lastWatchedAt: number | null = null;

  if (series.seasons) {
    for (const season of series.seasons) {
      if (season.episodes) {
        for (const episode of season.episodes) {
          if (episode.watched) {
            // Sammle alle möglichen Watch-Daten für diese Episode
            const dates: number[] = [];

            // lastWatchedAt hat höchste Priorität (wird bei Rewatches aktualisiert)
            if (episode.lastWatchedAt) {
              dates.push(new Date(episode.lastWatchedAt).getTime());
            }

            // firstWatchedAt als Fallback
            if (episode.firstWatchedAt) {
              dates.push(new Date(episode.firstWatchedAt).getTime());
            }

            // Finde das neueste Datum dieser Episode
            if (dates.length > 0) {
              const episodeLatestDate = Math.max(...dates);
              if (!lastWatchedAt || episodeLatestDate > lastWatchedAt) {
                lastWatchedAt = episodeLatestDate;
              }
            }
          }
        }
      }
    }
  }

  return lastWatchedAt;
};

const hasUpcomingEpisodes = (series: Series): boolean => {
  const today = new Date();

  // Prüfe ob die Serie noch läuft
  const status = series.status?.toLowerCase();
  const isRunning = (
    status === 'running' ||
    status === 'in production' ||
    status === 'returning series' ||
    status === 'planned' ||
    status === 'continuing'
  );

  // Wenn Serie als laufend markiert ist, hat sie potentiell zukünftige Episoden
  if (isRunning) {
    return true;
  }

  // Prüfe ob es Episoden mit zukünftigem Datum in den Seasons gibt
  if (series.seasons) {
    const seasonsArr: Series['seasons'] = Array.isArray(series.seasons) ? series.seasons : Object.values(series.seasons) as Series['seasons'];
    for (const season of seasonsArr) {
      const episodes = Array.isArray(season.episodes) ? season.episodes : season.episodes ? Object.values(season.episodes) as typeof season.episodes : [];
      for (const episode of episodes) {
        if (episode.air_date) {
          const airDate = new Date(episode.air_date);
          if (airDate > today) {
            return true;
          }
        }
      }
    }
  }

  // Prüfe alle Staffeln nach zukünftigen Episoden
  if (series.seasons) {
    for (const season of series.seasons) {
      if (season.episodes) {
        for (const episode of season.episodes) {
          if (episode.air_date) {
            const airDate = new Date(episode.air_date);
            if (airDate > today && !episode.watched) {
              return true;
            }
          }
          if (episode.airDate) {
            const airDate = new Date(episode.airDate);
            if (airDate > today && !episode.watched) {
              return true;
            }
          }
          if (episode.firstAired) {
            const airDate = new Date(episode.firstAired);
            if (airDate > today && !episode.watched) {
              return true;
            }
          }
        }
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
  const dismissedNotifications = notificationsSnapshot.val() || {};

  for (const series of seriesList) {
    // Nur Serien auf der Watchlist prüfen
    if (!series || !series.id || !series.watchlist) continue;

    // Überspringe Serien mit zukünftigen Episoden (laufende Serien)
    if (hasUpcomingEpisodes(series)) continue;

    const seriesKey = series.id.toString();
    const stored = storedData[seriesKey];
    const lastWatchedDate = getLastWatchedDate(series);

    // Prüfe ob Benachrichtigung für diese Serie bereits abgelehnt wurde
    const dismissedData = dismissedNotifications[series.id];
    const wasDismissedRecently = dismissedData?.dismissed &&
      (currentTime - dismissedData.timestamp) < CHECK_COOLDOWN;

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

        if (
          timeSinceLastWatch > ONE_MONTH_MS &&
          !stored.notified &&
          !wasDismissedRecently
        ) {
          // Serie wurde länger als einen Monat nicht geschaut
          inactiveSeries.push(series);

          updatedStoredData[seriesKey] = {
            ...stored,
            lastWatchedDate: lastWatchedDate,
            lastChecked: currentTime,
            // notified bleibt false bis User interagiert
          };
        } else if (
          lastWatchedDate !== stored.lastWatchedDate ||
          shouldCheckAgain
        ) {
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
    seriesList
      .filter(s => s && s.id && s.watchlist)
      .map(s => s.id.toString())
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

export const markInactiveSeriesAsNotified = async (
  seriesId: number,
  userId: string
) => {
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
