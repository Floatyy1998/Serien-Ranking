/**
 * Kapitel-Ereignisse zu Vorgängen bündeln. Alt-Ereignisse kamen je Kapitel mit gleichem
 * Zeitstempel, neue tragen `n`. Ein Sprung über mehr als BULK_CHAPTER_THRESHOLD Kapitel ist
 * ein nachgetragener Lesestand, kein Lesen — wie Bulk-Abhaken bei Serien.
 */

export const BULK_CHAPTER_THRESHOLD = 50;
/** Rund 50 Kapitel — wer mehr Bände auf einmal abhakt, trägt seinen Stand nach. */
export const BULK_VOLUME_THRESHOLD = 5;

export interface RawChapterEvent {
  ts: number;
  t: 'ch' | 'rg' | 'vol';
  s: number;
  st?: string;
  ch?: number;
  ch0?: number;
  n?: number;
  vol?: number;
  v0?: number;
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

export interface VolumeOperation {
  s: number;
  st?: string;
  ts: number;
  from: number;
  to: number;
  volumes: number;
  reread: boolean;
  bulk: boolean;
}

/** Band-Ereignisse (Zählweise Bände): ein Ereignis ist ein Vorgang, `n` fehlt bei einem Band. */
export function toVolumeOperations(events: RawChapterEvent[]): VolumeOperation[] {
  const ops: VolumeOperation[] = [];
  for (const event of events) {
    if (event?.t !== 'vol' || typeof event.ts !== 'number' || !event.s) continue;
    if (typeof event.vol !== 'number') continue;
    const volumes = Math.max(1, event.n ?? 1);
    ops.push({
      s: event.s,
      st: event.st,
      ts: event.ts,
      from: typeof event.v0 === 'number' ? event.v0 : event.vol,
      to: event.vol,
      volumes,
      reread: !!event.rw,
      bulk: volumes > BULK_VOLUME_THRESHOLD,
    });
  }
  return ops;
}
