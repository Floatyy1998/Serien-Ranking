/**
 * Kapitel-Ereignisse zu Vorgängen bündeln. Alt-Ereignisse kamen je Kapitel mit gleichem
 * Zeitstempel, neue tragen `n`. Ein Sprung über mehr als BULK_CHAPTER_THRESHOLD Kapitel ist
 * ein nachgetragener Lesestand, kein Lesen — wie Bulk-Abhaken bei Serien.
 */

export const BULK_CHAPTER_THRESHOLD = 50;

export interface RawChapterEvent {
  ts: number;
  t: 'ch' | 'rg';
  s: number;
  st?: string;
  ch?: number;
  ch0?: number;
  n?: number;
  rw?: number;
}

export interface ChapterOperation {
  s: number;
  st?: string;
  ts: number;
  from: number | null;
  to: number | null;
  chapters: number;
  reread: boolean;
  bulk: boolean;
}

export function toChapterOperations(events: RawChapterEvent[]): ChapterOperation[] {
  const ops = new Map<string, ChapterOperation>();
  for (const event of events) {
    if (event?.t !== 'ch' || typeof event.ts !== 'number' || !event.s) continue;
    const key = `${event.s}:${event.ts}`;
    const op = ops.get(key) ?? {
      s: event.s,
      st: event.st,
      ts: event.ts,
      from: null,
      to: null,
      chapters: 0,
      reread: false,
      bulk: false,
    };
    op.chapters += Math.max(1, event.n ?? 1);
    if (typeof event.ch === 'number') {
      const first = typeof event.ch0 === 'number' ? event.ch0 : event.ch;
      op.from = op.from === null ? first : Math.min(op.from, first);
      op.to = op.to === null ? event.ch : Math.max(op.to, event.ch);
    }
    if (event.rw) op.reread = true;
    if (!op.st && event.st) op.st = event.st;
    ops.set(key, op);
  }
  for (const op of ops.values()) op.bulk = op.chapters > BULK_CHAPTER_THRESHOLD;
  return [...ops.values()];
}
