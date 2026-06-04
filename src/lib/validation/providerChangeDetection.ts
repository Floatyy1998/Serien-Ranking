import firebase from 'firebase/compat/app';
import { SUPPORTED_PROVIDERS } from '../../config/menuItems';
import type { Series } from '../../types/Series';
import { getProviderNotificationsEnabled } from '../settings/notificationSettings';

export interface ProviderChangeInfo {
  series: Series;
  addedProviders: string[];
  removedProviders: string[];
  /** Vollständiger aktueller Provider-Stand (TMDB) — wird beim Dismiss als
   * neuer "bekannter" Stand in `knownProviders` geschrieben. */
  currentProviders: string[];
}

interface KnownProviderData {
  providers: string[];
  lastChecked: string;
}

type KnownProviders = Record<string, KnownProviderData>;

interface ProviderNotificationState {
  shownAt?: number;
  dismissedAt?: number;
  // Legacy-Felder von vor dem Umbau — werden beim Read auf dismissedAt gemappt.
  dismissed?: boolean;
  timestamp?: number;
}

const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

// Cooldowns
// - SHOWN_COOLDOWN: nach passiver Anzeige (User hat nicht reagiert) — kurz, damit die
//   Notification beim nächsten App-Open nicht sofort wieder springt, aber nach ein paar
//   Tagen wieder sichtbar wird, wenn der User sie weiterhin ignoriert.
// - DISMISSED_COOLDOWN: nach explizitem Wegklicken oder Navigate — lang, weil der User
//   die Information aktiv quittiert hat.
const SHOWN_COOLDOWN = 3 * 24 * 60 * 60 * 1000;
const DISMISSED_COOLDOWN = 30 * 24 * 60 * 60 * 1000;

/** Normalize provider names so ad-supported tiers map to the standard name */
export const normalizeProviderName = (name: string): string | null => {
  const lower = name.toLowerCase();
  // "X Channel"-Einträge auf TMDB sind kostenpflichtige Add-Ons innerhalb anderer
  // Plattformen (z.B. "Wow Fiction Amazon Channel" — ein WOW-Channel über Prime).
  // Diese gehören NICHT zum Standard-Abo des Wirts und werden ignoriert, sonst
  // gibt es falsche Provider-Treffer ("Amazon Prime Video" obwohl nur ein Channel).
  if (lower.includes(' channel')) return null;
  if (lower.includes('netflix')) return 'Netflix';
  // Freevee wurde 2024 von Amazon eingestellt und in Prime Video integriert.
  // Historische Freevee-Watches remappen wir auf Amazon Prime Video, statt sie
  // zu verlieren — damit Stats/WatchJourney/Wrapped korrekt bleiben.
  if (lower.includes('freevee')) return 'Amazon Prime Video';
  if (lower.includes('amazon') || lower.includes('prime video')) return 'Amazon Prime Video';
  if (lower.includes('disney')) return 'Disney Plus';
  if (lower.includes('paramount')) return 'Paramount Plus';
  if (lower.includes('apple tv')) return 'Apple TV Plus';
  if (lower.includes('joyn')) return 'Joyn Plus';
  if (lower.includes('hbo') || lower === 'max') return 'HBO Max';
  if (SUPPORTED_PROVIDERS.has(name)) return name;
  return null;
};

const getKnownProviders = async (userId: string): Promise<KnownProviders> => {
  try {
    const snapshot = await firebase.database().ref(`users/${userId}/knownProviders`).once('value');
    return (snapshot.val() as KnownProviders | null) || {};
  } catch {
    return {};
  }
};

const getNotificationStates = async (
  userId: string
): Promise<Record<string, ProviderNotificationState>> => {
  try {
    const snapshot = await firebase
      .database()
      .ref(`users/${userId}/providerChangeNotifications`)
      .once('value');
    return (snapshot.val() as Record<string, ProviderNotificationState> | null) || {};
  } catch {
    return {};
  }
};

const getEffectiveDismissedAt = (state: ProviderNotificationState | undefined): number | null => {
  if (!state) return null;
  if (typeof state.dismissedAt === 'number') return state.dismissedAt;
  // Legacy: alte Einträge schrieben {dismissed: true, timestamp}
  if (state.dismissed && typeof state.timestamp === 'number') return state.timestamp;
  return null;
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
    const seen = new Set<string>();
    return flatrate
      .map((p: { provider_name: string }) => normalizeProviderName(p.provider_name))
      .filter((name): name is string => {
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
  } catch {
    return [];
  }
}

/**
 * Erkennt Provider-Änderungen für Serien auf der Watchlist.
 *
 * Verhalten:
 * - Beim ersten Lauf (kein `known`-Eintrag): nur speichern, keine Notification.
 * - Bei Diff: zeige Notification, aber `knownProviders` wird NICHT überschrieben.
 *   So entsteht beim nächsten App-Start derselbe Diff erneut — der User sieht die
 *   Notification also wieder, solange er sie nicht aktiv weggeklickt hat.
 * - Cooldowns verhindern Spam:
 *   • SHOWN_COOLDOWN (3 Tage): wurde die Notification kürzlich rein passiv angezeigt,
 *     überspringe — sonst springt sie bei jedem Reload sofort wieder.
 *   • DISMISSED_COOLDOWN (30 Tage): wurde sie aktiv weggeklickt, akzeptiere die neuen
 *     Provider als bekannten Stand und ruh 30 Tage.
 * - Cleanup: Einträge für nicht mehr auf der Watchlist liegende Serien werden entfernt.
 */
export const detectProviderChanges = async (
  seriesList: Series[],
  userId: string
): Promise<ProviderChangeInfo[]> => {
  const enabled = await getProviderNotificationsEnabled(userId);
  if (!enabled) return [];

  const watchlistSeries = seriesList.filter((s) => s.watchlist && s.id);

  const [knownProviders, states] = await Promise.all([
    getKnownProviders(userId),
    getNotificationStates(userId),
  ]);

  const changes: ProviderChangeInfo[] = [];
  const updatedKnown: KnownProviders = { ...knownProviders };
  const now = new Date().toISOString();
  const nowMs = Date.now();

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

        const knownFiltered = known.providers
          .map((p) => normalizeProviderName(p))
          .filter((p): p is string => p !== null);
        const addedProviders = currentProviders.filter((p) => !knownFiltered.includes(p));
        const removedProviders = knownFiltered.filter((p) => !currentProviders.includes(p));

        // Kein Diff → silent update
        if (addedProviders.length === 0 && removedProviders.length === 0) {
          updatedKnown[key] = { providers: currentProviders, lastChecked: now };
          return null;
        }

        // Diff erkannt — Cooldowns prüfen
        const state = states[key];
        const dismissedAt = getEffectiveDismissedAt(state);
        if (dismissedAt !== null && nowMs - dismissedAt < DISMISSED_COOLDOWN) {
          // Aktiv weggeklickt: akzeptiere neuen Stand, ruh.
          updatedKnown[key] = { providers: currentProviders, lastChecked: now };
          return null;
        }
        if (state?.shownAt && nowMs - state.shownAt < SHOWN_COOLDOWN) {
          // Wurde kürzlich passiv angezeigt — knownProviders NICHT updaten,
          // damit der Diff nach Ablauf des Cooldowns wieder entsteht.
          return null;
        }

        // Diff wird gezeigt — knownProviders bleibt unverändert, damit ein
        // Reload denselben Diff produziert (UI markiert dann shownAt/dismissedAt).
        return { series, addedProviders, removedProviders, currentProviders };
      })
    );

    results.forEach((r) => {
      if (r) changes.push(r);
    });
  }

  // Cleanup + Persistenz als Pfad-basiertes Update, damit gemischte Set/Null-Operationen
  // funktionieren (set + delete im selben Multi-Path-Update).
  try {
    const watchlistIds = new Set(watchlistSeries.map((s) => s.id.toString()));
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updatedKnown)) {
      if (watchlistIds.has(key)) {
        updates[`users/${userId}/knownProviders/${key}`] = value;
      }
    }
    for (const key of Object.keys(knownProviders)) {
      if (!watchlistIds.has(key)) {
        updates[`users/${userId}/knownProviders/${key}`] = null;
      }
    }
    for (const key of Object.keys(states)) {
      if (!watchlistIds.has(key)) {
        updates[`users/${userId}/providerChangeNotifications/${key}`] = null;
      }
    }

    if (Object.keys(updates).length > 0) {
      await firebase.database().ref().update(updates);
    }
  } catch (error) {
    console.error('[ProviderChangeDetection] Failed to store providers:', error);
  }

  return changes;
};

/**
 * Markiert eine angezeigte Provider-Notification als "gesehen". Wird vom UI beim
 * Mount der Notification gerufen — verhindert sofortige Re-Anzeige beim nächsten
 * Reload via SHOWN_COOLDOWN.
 */
export const markProviderChangesShown = async (
  seriesIds: number[],
  userId: string
): Promise<void> => {
  if (seriesIds.length === 0) return;
  const updates: Record<string, unknown> = {};
  const now = Date.now();
  seriesIds.forEach((id) => {
    updates[`users/${userId}/providerChangeNotifications/${id}/shownAt`] = now;
    // Falls noch ein Legacy-Feld liegt: explizit auf null, damit es nicht weiter
    // gemappt wird.
    updates[`users/${userId}/providerChangeNotifications/${id}/dismissed`] = null;
    updates[`users/${userId}/providerChangeNotifications/${id}/timestamp`] = null;
  });
  try {
    await firebase.database().ref().update(updates);
  } catch (error) {
    console.error('[ProviderChangeDetection] Failed to mark shown:', error);
  }
};

/**
 * Markiert eine Notification als aktiv weggeklickt. Updated parallel die
 * `knownProviders`, weil der User damit den neuen Provider-Stand quittiert.
 */
export const markProviderChangesDismissed = async (
  changes: { seriesId: number; currentProviders: string[] }[],
  userId: string
): Promise<void> => {
  if (changes.length === 0) return;
  const updates: Record<string, unknown> = {};
  const now = Date.now();
  const nowISO = new Date().toISOString();
  changes.forEach(({ seriesId, currentProviders }) => {
    // Jitter ±2 Tage, damit Sammel-Dismiss nicht alle gleichzeitig wieder auflebt
    const jitter = (Math.random() - 0.5) * 4 * 24 * 60 * 60 * 1000;
    updates[`users/${userId}/providerChangeNotifications/${seriesId}`] = {
      shownAt: now,
      dismissedAt: now + jitter,
    };
    updates[`users/${userId}/knownProviders/${seriesId}`] = {
      providers: currentProviders,
      lastChecked: nowISO,
    };
  });
  try {
    await firebase.database().ref().update(updates);
  } catch (error) {
    console.error('[ProviderChangeDetection] Failed to mark dismissed:', error);
  }
};
