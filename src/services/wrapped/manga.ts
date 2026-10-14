/** Manga-Teil des Jahresrückblicks aus wrapped/{Jahr}/mangaEvents (reine Berechnung). */

import {
  toChapterOperations,
  toVolumeOperations,
  type RawChapterEvent,
} from '../../lib/manga/chapterOperations';
import type { MangaWrappedStats } from '../../types/Wrapped';

export interface WrappedMangaEvent extends RawChapterEvent {
  rat?: number;
}

/** Nur für die Reihenfolge der Top-Manga: ein Band entspricht grob so vielen Kapiteln. */
const CHAPTERS_PER_VOLUME = 9;

export function calculateMangaStats(
  events: WrappedMangaEvent[],
  year: number
): MangaWrappedStats | null {
  const perManga = new Map<
    number,
    { title: string; chapters: number; volumes: number; rating?: number }
  >();
  const perMonth = new Array(12).fill(0) as number[];
  const perMonthVolumes = new Array(12).fill(0) as number[];
  let totalChapters = 0;
  let totalVolumes = 0;

  const entryFor = (id: number, title?: string) => {
    const entry = perManga.get(id) ?? { title: title || '', chapters: 0, volumes: 0 };
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

  for (const op of toVolumeOperations(events)) {
    const date = new Date(op.ts * 1000);
    if (date.getFullYear() !== year || op.bulk) continue;
    entryFor(op.s, op.st).volumes += op.volumes;
    totalVolumes += op.volumes;
    perMonthVolumes[date.getMonth()] += op.volumes;
  }

  for (const event of events) {
    if (event?.t !== 'rg' || typeof event.rat !== 'number' || typeof event.ts !== 'number')
      continue;
    if (new Date(event.ts * 1000).getFullYear() !== year) continue;
    entryFor(event.s, event.st).rating = event.rat;
  }

  if (totalChapters === 0 && totalVolumes === 0) return null;

  const amount = (m: { chapters: number; volumes: number }) =>
    m.chapters + m.volumes * CHAPTERS_PER_VOLUME;
  const topManga = [...perManga.entries()]
    .filter(([, m]) => amount(m) > 0)
    .sort((a, b) => amount(b[1]) - amount(a[1]) || a[1].title.localeCompare(b[1].title))
    .slice(0, 5)
    .map(([anilistId, m]) => ({
      anilistId,
      title: m.title,
      chapters: m.chapters,
      ...(m.volumes > 0 ? { volumes: m.volumes } : {}),
      rating: m.rating,
    }));

  const monthly = totalChapters > 0 ? perMonth : perMonthVolumes;
  const bestMonth = monthly.reduce(
    (best, value, index) => (value > monthly[best] ? index : best),
    0
  );

  return {
    totalChapters,
    ...(totalVolumes > 0 ? { totalVolumes, mostReadMonthVolumes: perMonthVolumes[bestMonth] } : {}),
    uniqueManga: [...perManga.values()].filter((m) => amount(m) > 0).length,
    topManga,
    mostReadMonth: bestMonth,
    mostReadMonthChapters: perMonth[bestMonth],
  };
}
