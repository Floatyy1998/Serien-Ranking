import firebase from 'firebase/compat/app';
import { Series } from '../interfaces/Series';

export interface NewSeasonData {
  seriesId: number;
  previousSeasonCount: number;
  currentSeasonCount: number;
  lastChecked: number;
}

const CHECK_COOLDOWN = process.env.NODE_ENV === 'development' ? 0 : 24 * 60 * 60 * 1000; // Kein Cooldown in Development

export const getStoredSeasonData = async (
  userId: string
): Promise<Record<string, NewSeasonData>> => {
  try {
    const ref = firebase.database().ref(`${userId}/newSeasonData`);
    const snapshot = await ref.once('value');
    return snapshot.val() || {};
  } catch {
    return {};
  }
};

export const storeSeasonData = async (
  userId: string,
  data: Record<string, NewSeasonData>
) => {
  try {
    const ref = firebase.database().ref(`${userId}/newSeasonData`);
    await ref.set(data);
  } catch (error) {
    console.error('Fehler beim Speichern der Staffel-Daten:', error);
  }
};

export const detectNewSeasons = async (
  seriesList: Series[],
  userId: string
): Promise<Series[]> => {
  const storedData = await getStoredSeasonData(userId);
  const currentTime = Date.now();
  const seriesWithNewSeasons: Series[] = [];
  const updatedStoredData = { ...storedData };

  for (const series of seriesList) {
    // Nur gültige Serien prüfen
    if (!series || !series.id || typeof series.seasonCount !== 'number') continue;
    
    // Nur Serien prüfen die nicht in der Watchlist sind
    if (series.watchlist) continue;

    const seriesKey = series.id.toString();
    const stored = storedData[seriesKey];

    if (!stored) {
      // Erste Erfassung - keine neue Staffel, aber Daten speichern
      updatedStoredData[seriesKey] = {
        seriesId: series.id,
        previousSeasonCount: series.seasonCount,
        currentSeasonCount: series.seasonCount,
        lastChecked: currentTime,
      };
    } else {
      // Prüfen ob genug Zeit vergangen ist (Cooldown)
      const timeSinceLastCheck = currentTime - stored.lastChecked;
      if (timeSinceLastCheck < CHECK_COOLDOWN) {
        continue;
      }

      // Prüfen ob neue Staffel hinzugekommen ist
      if (
        series.seasonCount > stored.previousSeasonCount &&
        series.seasonCount > 0
      ) {
        seriesWithNewSeasons.push(series);

        // Daten aktualisieren - neue Staffelanzahl als "previous" speichern
        updatedStoredData[seriesKey] = {
          ...stored,
          previousSeasonCount: series.seasonCount,
          currentSeasonCount: series.seasonCount,
          lastChecked: currentTime,
        };
      } else {
        // Keine neue Staffel, aber lastChecked aktualisieren
        updatedStoredData[seriesKey] = {
          ...stored,
          currentSeasonCount: series.seasonCount,
          lastChecked: currentTime,
        };
      }
    }
  }

  // Aufräumen: Entferne Daten für Serien die nicht mehr in der Liste sind
  const currentSeriesIds = new Set(seriesList.filter(s => s && s.id).map((s) => s.id.toString()));
  for (const key of Object.keys(updatedStoredData)) {
    if (!currentSeriesIds.has(key)) {
      delete updatedStoredData[key];
    }
  }

  // Aktualisierte Daten speichern
  await storeSeasonData(userId, updatedStoredData);

  return seriesWithNewSeasons;
};

export const markSeasonAsNotified = async (
  seriesId: number,
  userId: string
) => {
  const storedData = await getStoredSeasonData(userId);
  const seriesKey = seriesId.toString();

  if (storedData[seriesKey]) {
    storedData[seriesKey].lastChecked = Date.now();
    await storeSeasonData(userId, storedData);
  }
};
