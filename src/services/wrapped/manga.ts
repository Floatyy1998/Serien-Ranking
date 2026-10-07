/** Manga-Teil des Jahresrückblicks aus wrapped/{Jahr}/mangaEvents (reine Berechnung). */

import { toChapterOperations, type RawChapterEvent } from '../../lib/manga/chapterOperations';
import type { MangaWrappedStats } from '../../types/Wrapped';

export interface WrappedMangaEvent extends RawChapterEvent {
  rat?: number;
}

export function calculateMangaStats(
  events: WrappedMangaEvent[],
  year: number
): MangaWrappedStats | null {
  const perManga = new Map<number, { title: string; chapters: number; rating?: number }>();
  const perMonth = new Array(12).fill(0) as number[];
  let totalChapters = 0;

  const entryFor = (id: number, title?: string) => {
    const entry = perManga.get(id) ?? { title: title || '', chapters: 0 };
    if (title && !entry.title) entry.title = title;
    perManga.set(id, entry);
    return entry;
  };

  // Nachgetragene Lesestände (großer Sprung auf einmal) zählen nicht als gelesen.
  for (const op of toChapterOperations(events)) {
    const date = new Date(op.ts * 1000);
    if (date.getFullYear() !== year || op.bulk) continue;
    entryFor(op.s, op.st).chapters += op.chapters;
    totalChapters += op.chapters;
    perMonth[date.getMonth()] += op.chapters;
  }

  for (const event of events) {
    if (event?.t !== 'rg' || typeof event.rat !== 'number' || typeof event.ts !== 'number')
      continue;
    if (new Date(event.ts * 1000).getFullYear() !== year) continue;
    entryFor(event.s, event.st).rating = event.rat;
  }

  if (totalChapters === 0) return null;

  const topManga = [...perManga.entries()]
    .filter(([, m]) => m.chapters > 0)
    .sort((a, b) => b[1].chapters - a[1].chapters || a[1].title.localeCompare(b[1].title))
    .slice(0, 5)
    .map(([anilistId, m]) => ({
      anilistId,
      title: m.title,
      chapters: m.chapters,
      rating: m.rating,
    }));

  const bestMonth = perMonth.reduce(
    (best, value, index) => (value > perMonth[best] ? index : best),
    0
  );

  return {
    totalChapters,
    uniqueManga: [...perManga.values()].filter((m) => m.chapters > 0).length,
    topManga,
    mostReadMonth: bestMonth,
    mostReadMonthChapters: perMonth[bestMonth],
  };
}
