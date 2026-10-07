/** Lese-Verlauf aus den Kapitel-Ereignissen (wrapped/{Jahr}/mangaEvents), gruppiert nach lokalem Tag. */

import type { Manga } from '../../types/Manga';
import { toChapterOperations, type RawChapterEvent } from './chapterOperations';

export type MangaReadEvent = RawChapterEvent;

export interface ReadHistoryEntry {
  anilistId: number;
  title: string;
  poster?: string;
  fromChapter: number | null;
  toChapter: number | null;
  /** Gelesene Kapitel an diesem Tag; null = nur der Stand ist bekannt (nachgetragen oder Alt-Daten). */
  chapters: number | null;
  lastAt: number;
  reread: boolean;
  /** Lesestand per großem Sprung nachgetragen — zählt nicht als gelesen. */
  imported: boolean;
}

export interface ReadHistoryDay {
  key: string;
  date: number;
  chapters: number;
  entries: ReadHistoryEntry[];
}

export interface ReadHistory {
  days: ReadHistoryDay[];
  totalChapters: number;
  activeDays: number;
  mangaCount: number;
}

const dayKey = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const dayStart = (ms: number): number => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export function buildReadHistory(
  events: MangaReadEvent[],
  library: Manga[],
  now: number,
  rangeDays: number
): ReadHistory {
  const cutoff = dayStart(now) - (rangeDays - 1) * 86400000;
  const byId = new Map(library.map((m) => [m.anilistId, m]));
  const days = new Map<string, { date: number; entries: Map<number, ReadHistoryEntry> }>();
  const seenManga = new Set<number>();

  const entryFor = (key: string, date: number, anilistId: number, fallbackTitle?: string) => {
    let day = days.get(key);
    if (!day) {
      day = { date, entries: new Map() };
      days.set(key, day);
    }
    let entry = day.entries.get(anilistId);
    if (!entry) {
      const manga = byId.get(anilistId);
      entry = {
        anilistId,
        title: manga?.title || fallbackTitle || '',
        poster: manga?.poster,
        fromChapter: null,
        toChapter: null,
        chapters: 0,
        lastAt: 0,
        reread: false,
        imported: false,
      };
      day.entries.set(anilistId, entry);
    }
    return entry;
  };

  for (const op of toChapterOperations(events)) {
    const at = op.ts * 1000;
    if (at < cutoff || at > now + 60000) continue;
    const entry = entryFor(dayKey(at), dayStart(at), op.s, op.st);
    entry.lastAt = Math.max(entry.lastAt, at);
    if (op.to !== null) entry.toChapter = Math.max(entry.toChapter ?? 0, op.to);
    if (op.bulk) {
      entry.imported = true;
    } else {
      entry.chapters = (entry.chapters ?? 0) + op.chapters;
      if (op.from !== null) {
        entry.fromChapter =
          entry.fromChapter === null ? op.from : Math.min(entry.fromChapter, op.from);
      }
    }
    if (op.reread) entry.reread = true;
    seenManga.add(op.s);
  }

  // Lesen von vor den Ereignissen: nur der Gesamtstand am letzten Lesetag ist bekannt.
  for (const manga of library) {
    if (seenManga.has(manga.anilistId) || !manga.lastReadAt || !manga.currentChapter) continue;
    const at = new Date(manga.lastReadAt).getTime();
    if (!Number.isFinite(at) || at < cutoff || at > now + 60000) continue;
    const entry = entryFor(dayKey(at), dayStart(at), manga.anilistId);
    entry.chapters = null;
    entry.toChapter = manga.currentChapter;
    entry.lastAt = at;
  }

  const result = [...days.entries()]
    .map(([key, day]) => {
      const entries = [...day.entries.values()]
        .map((e) => (e.imported && e.chapters === 0 ? { ...e, chapters: null } : e))
        .sort((a, b) => b.lastAt - a.lastAt);
      return {
        key,
        date: day.date,
        chapters: entries.reduce((sum, e) => sum + (e.chapters ?? 0), 0),
        entries,
      };
    })
    .sort((a, b) => b.date - a.date);

  const mangaIds = new Set(result.flatMap((d) => d.entries.map((e) => e.anilistId)));
  return {
    days: result,
    totalChapters: result.reduce((sum, d) => sum + d.chapters, 0),
    activeDays: result.length,
    mangaCount: mangaIds.size,
  };
}
