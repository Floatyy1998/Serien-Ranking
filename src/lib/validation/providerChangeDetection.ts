import firebase from 'firebase/compat/app';
import { SUPPORTED_PROVIDERS } from '../../config/menuItems';
import type { Series } from '../../types/Series';

export interface ProviderChangeInfo {
  series: Series;
  addedProviders: string[];
  removedProviders: string[];
}

interface KnownProviderData {
  providers: string[];
  lastChecked: string;
}

type KnownProviders = Record<string, KnownProviderData>;

const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

const getKnownProviders = async (userId: string): Promise<KnownProviders> => {
  try {
    const snapshot = await firebase.database().ref(`users/${userId}/knownProviders`).once('value');
    return (snapshot.val() as KnownProviders | null) || {};
  } catch {
    return {};
  }
};

const getDismissedNotifications = async (
  userId: string
): Promise<Record<string, { dismissed: boolean; timestamp: number }>> => {
  try {
    const snapshot = await firebase
      .database()
      .ref(`users/${userId}/providerChangeNotifications`)
      .once('value');
    return snapshot.val() || {};
  } catch {
    return {};
  }
};

async function fetchTMDBProviders(tmdbId: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const flatrate = data.results?.DE?.flatrate;
    if (!Array.isArray(flatrate)) return [];
    return flatrate
      .map((p: { provider_name: string }) => p.provider_name)
      .filter((name: string) => SUPPORTED_PROVIDERS.has(name));
  } catch {
    return [];
  }
}

/**
 * Erkennt Provider-Änderungen für Serien auf der Watchlist.
 * Vergleicht TMDB-Provider mit gespeicherten Providern.
 * Beim ersten Lauf wird nur gespeichert, keine Notifications gezeigt.
 */
export const detectProviderChanges = async (
  seriesList: Series[],
  userId: string
): Promise<ProviderChangeInfo[]> => {
  const watchlistSeries = seriesList.filter((s) => s.watchlist && s.id);
  if (watchlistSeries.length === 0) return [];

  const [knownProviders, dismissed] = await Promise.all([
    getKnownProviders(userId),
    getDismissedNotifications(userId),
  ]);

  const changes: ProviderChangeInfo[] = [];
  const updatedKnown: KnownProviders = { ...knownProviders };
  const now = new Date().toISOString();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Maximal 5 parallele TMDB-Calls
  const batchSize = 5;
  for (let i = 0; i < watchlistSeries.length; i += batchSize) {
    const batch = watchlistSeries.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (series) => {
        const key = series.id.toString();
        const currentProviders = await fetchTMDBProviders(series.id);

        if (currentProviders.length === 0) return null;

        const known = knownProviders[key];

        // Erstmaliges Speichern: keine Notification
        if (!known) {
          updatedKnown[key] = { providers: currentProviders, lastChecked: now };
          return null;
        }

        // Dismissed-Cooldown prüfen (7 Tage)
        const dismissedEntry = dismissed[key];
        if (dismissedEntry?.dismissed && dismissedEntry.timestamp > sevenDaysAgo) {
          // Trotzdem Provider updaten
          updatedKnown[key] = { providers: currentProviders, lastChecked: now };
          return null;
        }

        const knownFiltered = known.providers.filter((p) => SUPPORTED_PROVIDERS.has(p));
        const addedProviders = currentProviders.filter((p) => !knownFiltered.includes(p));
        const removedProviders = knownFiltered.filter((p) => !currentProviders.includes(p));

        updatedKnown[key] = { providers: currentProviders, lastChecked: now };

        if (addedProviders.length > 0 || removedProviders.length > 0) {
          return { series, addedProviders, removedProviders };
        }
        return null;
      })
    );

    results.forEach((r) => {
      if (r) changes.push(r);
    });
  }

  // Aktualisierte Provider + auto-dismiss in Firebase speichern
  try {
    const updates: Record<string, unknown> = {
      [`users/${userId}/knownProviders`]: updatedKnown,
    };
    // Auto-dismiss detected changes so they don't reappear on next app start
    changes.forEach((c) => {
      updates[`users/${userId}/providerChangeNotifications/${c.series.id}`] = {
        dismissed: true,
        timestamp: Date.now(),
      };
    });
    await firebase.database().ref().update(updates);
  } catch (error) {
    console.error('[ProviderChangeDetection] Failed to store providers:', error);
  }

  return changes;
};
