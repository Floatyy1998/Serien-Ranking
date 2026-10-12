/** Lese-Event unter `users/$uid/wrapped/{year}/bookEvents`, kurze Schlüssel wie bei mangaEvents. */
export interface CompactBookEvent {
  ts: number;
  /** pg = Seiten gelesen, fin = beendet, rg = bewertet */
  t: 'pg' | 'fin' | 'rg';
  s: string;
  st: string;
  a?: string;
  p?: number;
  p0?: number;
  n?: number;
  pc?: number;
  g?: string[];
  rat?: number;
  rr?: 1;
}

/** Größere Sprünge sind ein nachgetragener Lesestand, kein Lesen an diesem Tag. */
export const BULK_PAGE_THRESHOLD = 400;

export function eventPages(event: CompactBookEvent): number {
  if (event.t !== 'pg') return 0;
  const n = event.n ?? (event.p !== undefined && event.p0 !== undefined ? event.p - event.p0 : 0);
  return n > 0 && n <= BULK_PAGE_THRESHOLD ? n : 0;
}

export function dayKey(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function normalizeEvents(raw: unknown): CompactBookEvent[] {
  if (!raw || typeof raw !== 'object') return [];
  return Object.values(raw as Record<string, CompactBookEvent>)
    .filter((e) => e && typeof e.ts === 'number' && typeof e.s === 'string')
    .sort((a, b) => a.ts - b.ts);
}

/** Seiten je Kalendertag (lokale Zeit). */
export function pagesByDay(events: CompactBookEvent[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of events) {
    const n = eventPages(e);
    if (n > 0) out.set(dayKey(e.ts), (out.get(dayKey(e.ts)) ?? 0) + n);
  }
  return out;
}

/** Tage in Folge mit gelesenen Seiten, bis heute oder gestern. */
export function readingStreak(events: CompactBookEvent[], now: number): number {
  const days = pagesByDay(events);
  if (days.size === 0) return 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  const key = () => dayKey(Math.floor(cursor.getTime() / 1000));
  if (!days.has(key())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(key())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
