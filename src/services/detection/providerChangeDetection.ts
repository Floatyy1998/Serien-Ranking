import type { Series } from '../../types/Series';
import { dbGet, dbUpdate, paths, userPath } from '../db/ref';
import {
  getProviderNotificationsEnabled,
  getSnoozedUntil,
  cleanupSnoozes,
} from '../../lib/settings/notificationSettings';

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

// Cooldowns
// - SHOWN_COOLDOWN: nach passiver Anzeige (User hat nicht reagiert) — kurz, damit die
//   Notification beim nächsten App-Open nicht sofort wieder springt, aber nach ein paar
//   Tagen wieder sichtbar wird, wenn der User sie weiterhin ignoriert.
// - DISMISSED_COOLDOWN: nach explizitem Wegklicken oder Navigate — lang, weil der User
//   die Information aktiv quittiert hat.
const SHOWN_COOLDOWN = 3 * 24 * 60 * 60 * 1000;
const DISMISSED_COOLDOWN = 30 * 24 * 60 * 60 * 1000;

// normalizeProviderName wurde nach lib/providerName extrahiert (pure Helfer).
export { normalizeProviderName } from '../../lib/providerName';
import { normalizeProviderName } from '../../lib/providerName';

const getKnownProviders = async (userId: string): Promise<KnownProviders> => {
  try {
    return (await dbGet<KnownProviders>(userPath(userId, 'knownProviders'))) || {};
  } catch {
    return {};
  }
};

const getNotificationStates = async (
  userId: string
): Promise<Record<string, ProviderNotificationState>> => {
  try {
    return (
      (await dbGet<Record<string, ProviderNotificationState>>(
        paths.notificationState(userId, 'providerChangeNotifications')
      )) || {}
    );
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

/**
 * Provider aus den gemergten Katalog-Daten der Serie (statt Live-TMDB-Calls:
 * ein geteilter Client-API-Key skaliert nicht über viele Nutzer; der Backend-
 * Cron aktualisiert die Katalog-Provider ohnehin täglich).
 */
function getCatalogProviders(series: Series): string[] {
  const list = series.provider?.provider;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  return list
    .map((p) => (typeof p?.name === 'string' ? normalizeProviderName(p.name) : null))
    .filter((name): name is string => {
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
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

  const [knownProviders, states, snoozed] = await Promise.all([
    getKnownProviders(userId),
    getNotificationStates(userId),
    getSnoozedUntil('provider', userId),
  ]);

  const changes: ProviderChangeInfo[] = [];
  const updatedKnown: KnownProviders = { ...knownProviders };
  const now = new Date().toISOString();
  const nowMs = Date.now();

  for (const series of watchlistSeries) {
    const key = series.id.toString();
    const currentProviders = getCatalogProviders(series);

    const known = knownProviders[key];

    // Katalog (noch) leer: nur als Baseline seeden, wenn wir die Serie zum
    // ersten Mal sehen — so wird ein späteres "nichts → Provider" als Diff
    // erkannt und benachrichtigt ("Jetzt auf X"). Bei bereits bekanntem
    // Stand NICHTS tun: eine transiente Datenlücke darf NICHT als
    // Provider-Entzug fehlinterpretiert werden.
    if (currentProviders.length === 0) {
      if (!known) updatedKnown[key] = { providers: [], lastChecked: now };
      continue;
    }

    // Erstmaliges Speichern mit Provider: still seeden (kein Spam für
    // Serien, die ohnehin schon irgendwo liefen).
    if (!known) {
      updatedKnown[key] = { providers: currentProviders, lastChecked: now };
      continue;
    }

    // `known.providers` kann bei Legacy-/Teil-State fehlen → gegen undefined absichern.
    const knownFiltered = (known.providers ?? [])
      .map((p) => normalizeProviderName(p))
      .filter((p): p is string => p !== null);
    const addedProviders = currentProviders.filter((p) => !knownFiltered.includes(p));
    const removedProviders = knownFiltered.filter((p) => !currentProviders.includes(p));

    // Kein Diff → silent update
    if (addedProviders.length === 0 && removedProviders.length === 0) {
      updatedKnown[key] = { providers: currentProviders, lastChecked: now };
      continue;
    }

    // Diff erkannt — Cooldowns prüfen
    const state = states[key];
    const dismissedAt = getEffectiveDismissedAt(state);
    if (dismissedAt !== null && nowMs - dismissedAt < DISMISSED_COOLDOWN) {
      // Aktiv weggeklickt: akzeptiere neuen Stand, ruh.
      updatedKnown[key] = { providers: currentProviders, lastChecked: now };
      continue;
    }
    const snoozedUntil = snoozed[key];
    if (typeof snoozedUntil === 'number' && snoozedUntil > nowMs) {
      // User hat snoozed — knownProviders NICHT updaten, damit Diff nach Ablauf bleibt
      continue;
    }
    if (state?.shownAt && nowMs - state.shownAt < SHOWN_COOLDOWN) {
      // Wurde kürzlich passiv angezeigt — knownProviders NICHT updaten,
      // damit der Diff nach Ablauf des Cooldowns wieder entsteht.
      continue;
    }

    // Diff wird gezeigt — knownProviders bleibt unverändert, damit ein
    // Reload denselben Diff produziert (UI markiert dann shownAt/dismissedAt).
    changes.push({ series, addedProviders, removedProviders, currentProviders });
  }

  // Cleanup + Persistenz als Pfad-basiertes Update, damit gemischte Set/Null-Operationen
  // funktionieren (set + delete im selben Multi-Path-Update).
  try {
    const watchlistIds = new Set(watchlistSeries.map((s) => s.id.toString()));
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updatedKnown)) {
      if (watchlistIds.has(key)) {
        updates[userPath(userId, 'knownProviders', key)] = value;
      }
    }
    for (const key of Object.keys(knownProviders)) {
      if (!watchlistIds.has(key)) {
        updates[userPath(userId, 'knownProviders', key)] = null;
      }
    }
    for (const key of Object.keys(states)) {
      if (!watchlistIds.has(key)) {
        updates[userPath(userId, 'providerChangeNotifications', key)] = null;
      }
    }

    if (Object.keys(updates).length > 0) {
      await dbUpdate(updates);
    }
  } catch (error) {
    console.error('[ProviderChangeDetection] Failed to store providers:', error);
  }
  await cleanupSnoozes('provider', userId, new Set(watchlistSeries.map((s) => s.id.toString())));

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
    updates[userPath(userId, 'providerChangeNotifications', id, 'shownAt')] = now;
    // Falls noch ein Legacy-Feld liegt: explizit auf null, damit es nicht weiter
    // gemappt wird.
    updates[userPath(userId, 'providerChangeNotifications', id, 'dismissed')] = null;
    updates[userPath(userId, 'providerChangeNotifications', id, 'timestamp')] = null;
  });
  try {
    await dbUpdate(updates);
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
    updates[userPath(userId, 'providerChangeNotifications', seriesId)] = {
      shownAt: now,
      dismissedAt: now + jitter,
    };
    updates[userPath(userId, 'knownProviders', seriesId)] = {
      providers: currentProviders,
      lastChecked: nowISO,
    };
  });
  try {
    await dbUpdate(updates);
  } catch (error) {
    console.error('[ProviderChangeDetection] Failed to mark dismissed:', error);
  }
};
