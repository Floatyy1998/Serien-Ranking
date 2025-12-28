import firebase from 'firebase/compat/app';
import { Series } from '../../types/Series';

export interface NewSeasonData {
  seriesId: number;
  previousSeasonCount: number;
  currentSeasonCount: number;
  lastChecked: number;
  notified?: boolean; // Track if user has been notified
  detectedAt?: number; // When the new season was first detected
}

const CHECK_COOLDOWN = process.env.NODE_ENV === 'development' ? 0 : 24 * 60 * 60 * 1000;

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
  } catch (error) {}
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
    
    // Prüfe alle Serien, auch die in der Watchlist (User will über neue Staffeln informiert werden!)
    // if (series.watchlist) continue; // REMOVED - we want to track all series

    const seriesKey = series.id.toString();
    const stored = storedData[seriesKey];

    if (!stored) {
      // Erste Erfassung - keine neue Staffel, aber Daten speichern
      updatedStoredData[seriesKey] = {
        seriesId: series.id,
        previousSeasonCount: series.seasonCount,
        currentSeasonCount: series.seasonCount,
        lastChecked: currentTime,
        notified: false,
      };
    } else {
      // Prüfen ob genug Zeit vergangen ist (Cooldown) - aber nur für erneute Checks, nicht für Benachrichtigungen
      const timeSinceLastCheck = currentTime - stored.lastChecked;
      const shouldCheckAgain = timeSinceLastCheck >= CHECK_COOLDOWN || process.env.NODE_ENV === 'development';

      // Prüfen ob neue Staffel hinzugekommen ist ODER ob User noch nicht benachrichtigt wurde
      if (series.seasonCount > stored.previousSeasonCount && series.seasonCount > 0) {
        // Neue Staffel erkannt!
        if (!stored.notified) {
          // User wurde noch nicht benachrichtigt - zur Liste hinzufügen
          seriesWithNewSeasons.push(series);
        }

        // Daten aktualisieren, aber previousSeasonCount NICHT ändern bis User benachrichtigt wurde
        updatedStoredData[seriesKey] = {
          ...stored,
          currentSeasonCount: series.seasonCount,
          lastChecked: shouldCheckAgain ? currentTime : stored.lastChecked,
          detectedAt: stored.detectedAt || currentTime, // Zeitpunkt der ersten Erkennung speichern
          // previousSeasonCount bleibt unverändert bis User benachrichtigt wurde!
        };
      } else if (stored.currentSeasonCount !== series.seasonCount) {
        // Staffelanzahl hat sich geändert (könnte auch weniger sein bei Korrekturen)
        updatedStoredData[seriesKey] = {
          ...stored,
          previousSeasonCount: Math.min(stored.previousSeasonCount, series.seasonCount),
          currentSeasonCount: series.seasonCount,
          lastChecked: shouldCheckAgain ? currentTime : stored.lastChecked,
        };
      } else if (shouldCheckAgain) {
        // Keine Änderung, aber lastChecked aktualisieren
        updatedStoredData[seriesKey] = {
          ...stored,
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
  userId: string,
  updatePreviousCount: boolean = true
) => {
  const storedData = await getStoredSeasonData(userId);
  const seriesKey = seriesId.toString();

  if (storedData[seriesKey]) {
    const currentData = storedData[seriesKey];
    storedData[seriesKey] = {
      ...currentData,
      notified: true,
      lastChecked: Date.now(),
      // Nur wenn User die Benachrichtigung gesehen hat, aktualisieren wir previousSeasonCount
      previousSeasonCount: updatePreviousCount 
        ? currentData.currentSeasonCount 
        : currentData.previousSeasonCount,
    };
    await storeSeasonData(userId, storedData);
  }
};

// Markiere mehrere Serien als benachrichtigt
export const markMultipleSeasonsAsNotified = async (
  seriesIds: number[],
  userId: string,
  updatePreviousCount: boolean = true
) => {
  const storedData = await getStoredSeasonData(userId);
  let hasChanges = false;

  for (const seriesId of seriesIds) {
    const seriesKey = seriesId.toString();
    if (storedData[seriesKey]) {
      const currentData = storedData[seriesKey];
      storedData[seriesKey] = {
        ...currentData,
        notified: true,
        lastChecked: Date.now(),
        previousSeasonCount: updatePreviousCount 
          ? currentData.currentSeasonCount 
          : currentData.previousSeasonCount,
      };
      hasChanges = true;
    }
  }

  if (hasChanges) {
    await storeSeasonData(userId, storedData);
  }
};

