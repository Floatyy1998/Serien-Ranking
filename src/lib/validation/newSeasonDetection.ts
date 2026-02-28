import firebase from 'firebase/compat/app';
import { Series } from '../../types/Series';

// Einfache Map: seriesId → bekannte Staffelanzahl
type SeasonCounts = Record<string, number>;

const NOTIFIED_KEY = 'newSeasonNotified';

const getStoredSeasonCounts = async (userId: string): Promise<SeasonCounts> => {
  try {
    const snapshot = await firebase.database().ref(`${userId}/seasonCounts`).once('value');
    return snapshot.val() || {};
  } catch {
    return {};
  }
};

const storeSeasonCounts = async (userId: string, data: SeasonCounts) => {
  try {
    await firebase.database().ref(`${userId}/seasonCounts`).set(data);
  } catch (error) {
    console.error('Failed to store season counts:', error);
  }
};

// Notified-Tracking in sessionStorage (nur für aktuelle Session relevant)
const getNotifiedIds = (): Set<string> => {
  try {
    const stored = sessionStorage.getItem(NOTIFIED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const addNotifiedIds = (ids: string[]) => {
  const notified = getNotifiedIds();
  ids.forEach((id) => notified.add(id));
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified]));
};

export const detectNewSeasons = async (seriesList: Series[], userId: string): Promise<Series[]> => {
  const storedCounts = await getStoredSeasonCounts(userId);
  const notifiedIds = getNotifiedIds();
  const seriesWithNewSeasons: Series[] = [];
  const updatedCounts: SeasonCounts = {};

  for (const series of seriesList) {
    if (!series || !series.id || typeof series.seasonCount !== 'number') continue;

    const key = series.id.toString();
    const storedCount = storedCounts[key];
    updatedCounts[key] = storedCount ?? series.seasonCount;

    if (storedCount !== undefined && series.seasonCount > storedCount && !notifiedIds.has(key)) {
      seriesWithNewSeasons.push(series);
    }
  }

  // Speichere nur wenn sich was geändert hat (neue Serien hinzugekommen)
  const hasNewEntries = Object.keys(updatedCounts).some((k) => !(k in storedCounts));
  if (hasNewEntries) {
    await storeSeasonCounts(userId, updatedCounts);
  }

  return seriesWithNewSeasons;
};

// Nach Benachrichtigung: seasonCount auf aktuellen Wert setzen
export const markMultipleSeasonsAsNotified = async (
  seriesIds: number[],
  userId: string,
  seriesList?: Series[]
) => {
  const storedCounts = await getStoredSeasonCounts(userId);
  const keys = seriesIds.map((id) => id.toString());

  // SessionStorage updaten
  addNotifiedIds(keys);

  // Firebase updaten: Staffelanzahl auf aktuellen Wert setzen
  let hasChanges = false;
  for (const id of seriesIds) {
    const key = id.toString();
    const series = seriesList?.find((s) => s.id === id);
    if (series && series.seasonCount > (storedCounts[key] ?? 0)) {
      storedCounts[key] = series.seasonCount;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    await storeSeasonCounts(userId, storedCounts);
  }
};
