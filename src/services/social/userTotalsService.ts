/**
 * Veroeffentlicht die lebenslangen Gesamtzahlen eines Nutzers unter
 * `users/$uid/leaderboard/totals` und liest sie fuer die Gesamt-Rangliste.
 *
 * Der Knoten liegt bewusst neben den Monatsstats: `users/$uid/leaderboard` ist
 * fuer alle angemeldeten Nutzer lesbar, der Fan-Out ist derselbe wie im
 * Freunde-Tab (ein Punkt-Read je Freund) — kein Cron, kein Backend noetig.
 */

import type { LibraryTotals } from '../../lib/stats/libraryTotals';
import type { LeaderboardTotals, ReadingCounts } from '../../types/Leaderboard';
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

const READING_PREFIX = 'tvrank:readingPublish:';

function loadReadingKey(uid: string): string | null {
  try {
    return localStorage.getItem(`${READING_PREFIX}${uid}`);
  } catch {
    return null;
  }
}

function saveReadingKey(uid: string, key: string): void {
  try {
    localStorage.setItem(`${READING_PREFIX}${uid}`, key);
  } catch {
    // Dann wird beim nächsten Start eben noch einmal geschrieben.
  }
}

/** Schreibt die Zahl der Manga und Bücher, sobald sie sich ändert. */
export async function publishReadingCounts(userId: string, counts: ReadingCounts): Promise<void> {
  if (!userId) return;
  const manga = Math.max(0, Math.round(counts.manga));
  const books = Math.max(0, Math.round(counts.books));
  const key = `${manga}:${books}`;
  const previous = loadReadingKey(userId);
  if (previous === key) return;
  // Wer nie gelesen hat, bekommt keinen Knoten — eine Null zählt nur nach echten Einträgen.
  if (previous === null && manga === 0 && books === 0) return;
  try {
    await dbRef(userPath(userId, 'leaderboard', 'reading')).set({
      manga,
      books,
      updatedAt: Date.now(),
    });
    saveReadingKey(userId, key);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[Totals] Lese-Zahlen nicht geschrieben: ${message}`);
  }
}

const readingCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0;

export function parseReadingCounts(value: unknown): ReadingCounts | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  return { manga: readingCount(raw.manga), books: readingCount(raw.books) };
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

export interface PublishedLibraryCounts {
  series: number;
  movies: number;
  manga: number;
  books: number;
}

/** Dieselben Zahlen wie im Verzeichnis „Öffentliche Profile": Serien = begonnene Serien. */
export async function fetchLibraryCounts(
  uids: string[]
): Promise<Record<string, PublishedLibraryCounts | null>> {
  const results = await Promise.all(
    uids.map(async (uid) => {
      const [totals, reading] = await Promise.all([
        dbGet<unknown>(userPath(uid, 'leaderboard', 'totals')).catch(() => null),
        dbGet<unknown>(userPath(uid, 'leaderboard', 'reading')).catch(() => null),
      ]);
      const usable = isUsableTotals(totals) ? totals : null;
      const lesen = parseReadingCounts(reading);
      if (!usable && !lesen) return { uid, counts: null };
      return {
        uid,
        counts: {
          series: readingCount(usable?.seriesStarted),
          movies: readingCount(usable?.movies),
          manga: lesen?.manga ?? 0,
          books: lesen?.books ?? 0,
        },
      };
    })
  );

  const map: Record<string, PublishedLibraryCounts | null> = {};
  for (const { uid, counts } of results) map[uid] = counts;
  return map;
}
