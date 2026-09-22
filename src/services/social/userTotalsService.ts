/**
 * Veroeffentlicht die lebenslangen Gesamtzahlen eines Nutzers unter
 * `users/$uid/leaderboard/totals` und liest sie fuer die Gesamt-Rangliste.
 *
 * Der Knoten liegt bewusst neben den Monatsstats: `users/$uid/leaderboard` ist
 * fuer alle angemeldeten Nutzer lesbar, der Fan-Out ist derselbe wie im
 * Freunde-Tab (ein Punkt-Read je Freund) — kein Cron, kein Backend noetig.
 */

import type { LibraryTotals } from '../../lib/stats/libraryTotals';
import type { LeaderboardTotals } from '../../types/Leaderboard';
import { dbGet, dbRef, userPath } from '../db/ref';

export const TOTALS_SCHEMA_VERSION = 1;

/** Hoechstens ein Write pro Stunde und Nutzer; spaetere Aenderungen landen
 *  ueber den Nachzuegler-Timer, gehen also nicht verloren. */
const MIN_PUBLISH_INTERVAL_MS = 60 * 60 * 1000;
const STORAGE_PREFIX = 'tvrank:totalsPublish:';

interface PublishState {
  key: string;
  ts: number;
}

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

function loadState(uid: string): PublishState | null {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? (JSON.parse(raw) as PublishState) : null;
  } catch {
    return null;
  }
}

function saveState(uid: string, state: PublishState): void {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(state));
  } catch {
    // Privater Modus / volles Kontingent: dann wird eben oefter geschrieben.
  }
}

export function toTotalsPayload(totals: LibraryTotals): Omit<LeaderboardTotals, 'updatedAt'> {
  return {
    watchtimeMinutes: Math.max(0, Math.round(totals.watchtimeMinutes)),
    episodes: Math.max(0, Math.round(totals.episodes)),
    seriesStarted: Math.max(0, Math.round(totals.seriesStarted)),
    seriesCompleted: Math.max(0, Math.round(totals.seriesCompleted)),
    movies: Math.max(0, Math.round(totals.movies)),
    v: TOTALS_SCHEMA_VERSION,
  };
}

export function totalsFingerprint(payload: Omit<LeaderboardTotals, 'updatedAt'>): string {
  return [
    payload.v,
    payload.watchtimeMinutes,
    payload.episodes,
    payload.seriesStarted,
    payload.seriesCompleted,
    payload.movies,
  ].join(':');
}

/** Leere Bibliothek = fast immer ein Ladezwischenstand, nicht die Wahrheit.
 *  Ein Null-Schnappschuss wuerde den Nutzer aus der Rangliste kippen. */
function isEmpty(payload: Omit<LeaderboardTotals, 'updatedAt'>): boolean {
  return payload.watchtimeMinutes <= 0 && payload.episodes <= 0 && payload.movies <= 0;
}

export type PublishDecision = 'publish' | 'unchanged' | 'empty' | 'throttled';

export function decidePublish(
  fingerprint: string,
  state: PublishState | null,
  now: number,
  empty: boolean
): { decision: PublishDecision; retryInMs: number } {
  if (empty) return { decision: 'empty', retryInMs: 0 };
  if (state?.key === fingerprint) return { decision: 'unchanged', retryInMs: 0 };
  const elapsed = state ? now - state.ts : Number.POSITIVE_INFINITY;
  if (elapsed < MIN_PUBLISH_INTERVAL_MS) {
    return { decision: 'throttled', retryInMs: MIN_PUBLISH_INTERVAL_MS - elapsed };
  }
  return { decision: 'publish', retryInMs: 0 };
}

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schreibt den Schnappschuss, wenn er sich geaendert hat. Greift die Drosselung,
 * wird der Write als Nachzuegler eingeplant statt verworfen.
 */
export async function publishLibraryTotals(userId: string, totals: LibraryTotals): Promise<void> {
  if (!userId) return;

  const payload = toTotalsPayload(totals);
  const fingerprint = totalsFingerprint(payload);
  const { decision, retryInMs } = decidePublish(
    fingerprint,
    loadState(userId),
    Date.now(),
    isEmpty(payload)
  );

  if (decision === 'unchanged' || decision === 'empty') return;

  if (decision === 'throttled') {
    const existing = pendingTimers.get(userId);
    if (existing) clearTimeout(existing);
    pendingTimers.set(
      userId,
      setTimeout(() => {
        pendingTimers.delete(userId);
        void publishLibraryTotals(userId, totals);
      }, retryInMs)
    );
    return;
  }

  try {
    await dbRef(userPath(userId, 'leaderboard', 'totals')).set({
      ...payload,
      updatedAt: Date.now(),
    });
    saveState(userId, { key: fingerprint, ts: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[Totals] Schnappschuss nicht geschrieben: ${message}`);
  }
}

/** Nur fuer Tests: haengende Nachzuegler-Timer verwerfen. */
export function clearPendingTotalsPublishes(): void {
  for (const timer of pendingTimers.values()) clearTimeout(timer);
  pendingTimers.clear();
}

function isUsableTotals(value: unknown): value is LeaderboardTotals {
  if (!value || typeof value !== 'object') return false;
  const totals = value as Partial<LeaderboardTotals>;
  return typeof totals.watchtimeMinutes === 'number' && totals.watchtimeMinutes >= 0;
}

/**
 * Laedt die Schnappschuesse mehrerer Nutzer. Fehlende Eintraege bleiben `null` —
 * Freunde mit altem Client werden in der Rangliste ausgewiesen statt mit 0
 * einsortiert.
 */
export async function fetchLibraryTotals(
  uids: string[]
): Promise<Record<string, LeaderboardTotals | null>> {
  const results = await Promise.all(
    uids.map(async (uid) => {
      try {
        const value = await dbGet<unknown>(userPath(uid, 'leaderboard', 'totals'));
        return { uid, totals: isUsableTotals(value) ? value : null };
      } catch {
        return { uid, totals: null };
      }
    })
  );

  const map: Record<string, LeaderboardTotals | null> = {};
  for (const { uid, totals } of results) map[uid] = totals;
  return map;
}
