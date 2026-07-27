import { dbGet, dbRef, serverTimestamp } from './db/ref';

/**
 * Persistentes Negativ-Feedback zu Vorschlägen ("Nicht mein Ding").
 * users/$uid/recFeedback/{tmdbId} = { v: -1, t: 'series'|'movie', ts }.
 * Wird vom Heute-Abend-Picker und den KI-Empfehlungen als Blockliste gelesen.
 */
export interface RecFeedbackEntry {
  v: number;
  t: 'series' | 'movie';
  ts: number | object;
}

export async function blockRecommendation(
  uid: string,
  id: number,
  type: 'series' | 'movie'
): Promise<void> {
  if (!uid || !id) return;
  try {
    await dbRef(`users/${uid}/recFeedback/${id}`).set({ v: -1, t: type, ts: serverTimestamp() });
  } catch {
    // best effort
  }
}

export async function fetchBlockedRecommendations(uid: string): Promise<Set<number>> {
  if (!uid) return new Set();
  try {
    const data = await dbGet<Record<string, RecFeedbackEntry>>(`users/${uid}/recFeedback`);
    return new Set(
      Object.entries(data || {})
        .filter(([, e]) => e && e.v < 0)
        .map(([id]) => Number(id))
        .filter((n) => Number.isFinite(n))
    );
  } catch {
    return new Set();
  }
}
