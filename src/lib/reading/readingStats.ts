import type { Book, BookStatus } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { dayKey, eventPages, pagesByDay, type CompactBookEvent } from '../books/bookEvents';
import { genresFromCategories, type TasteGenre } from '../books/readingTaste';
import { bookGenres } from '../books/shelfView';
import {
  toChapterOperations,
  toVolumeOperations,
  type RawChapterEvent,
} from '../manga/chapterOperations';
import { ANILIST_GENRE_FOR } from './genreMap';

export interface Tally {
  key: string;
  count: number;
}

/** Häufigkeiten absteigend, bei Gleichstand alphabetisch. */
export function tally(keys: (string | undefined | null)[], limit = Infinity): Tally[] {
  const counts = new Map<string, number>();
  for (const key of keys) if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

/** Tage seit Jahresbeginn bis heute (laufendes Jahr) bzw. alle Tage des Jahres. */
export function daysElapsedInYear(year: number, now: number): number {
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(now).getFullYear() === year ? now : new Date(year + 1, 0, 1).getTime();
  return Math.max(1, Math.ceil((end - start) / 86_400_000));
}

/** Tage in Folge mit Lesen, bis heute oder gestern. */
export function streakFromDays(days: Set<string>, now: number): number {
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

export interface MangaYearActivity {
  chapters: number;
  volumes: number;
  chaptersByMonth: number[];
  volumesByMonth: number[];
  days: Set<string>;
  /** Manga mit gelesenen Kapiteln oder Bänden im Jahr. */
  readIds: Set<number>;
}

/** Kapitel und Bände eines Jahres aus den Ereignissen; nachgetragene Sprünge zählen nicht. */
export function mangaYearActivity(events: RawChapterEvent[], year: number): MangaYearActivity {
  const out: MangaYearActivity = {
    chapters: 0,
    volumes: 0,
    chaptersByMonth: new Array(12).fill(0) as number[],
    volumesByMonth: new Array(12).fill(0) as number[],
    days: new Set(),
    readIds: new Set(),
  };
  for (const op of toChapterOperations(events)) {
    const date = new Date(op.ts * 1000);
    if (date.getFullYear() !== year || op.bulk || op.chapters <= 0) continue;
    out.chapters += op.chapters;
    out.chaptersByMonth[date.getMonth()] += op.chapters;
    out.days.add(dayKey(op.ts));
    out.readIds.add(op.s);
  }
  for (const op of toVolumeOperations(events)) {
    const date = new Date(op.ts * 1000);
    if (date.getFullYear() !== year || op.bulk || op.volumes <= 0) continue;
    out.volumes += op.volumes;
    out.volumesByMonth[date.getMonth()] += op.volumes;
    out.days.add(dayKey(op.ts));
    out.readIds.add(op.s);
  }
  return out;
}

export const isMangaFinishedInYear = (manga: Manga, year: number): boolean =>
  manga.readStatus === 'completed' &&
  !!manga.completedAt &&
  new Date(manga.completedAt).getFullYear() === year;

const MANGA_TASTE_GENRE: Record<string, TasteGenre> = {
  ...(Object.fromEntries(
    Object.entries(ANILIST_GENRE_FOR).map(([id, genre]) => [genre, id])
  ) as Record<string, TasteGenre>),
  Mystery: 'thriller',
};

/** Genre-Schlüssel: Buchgenre-ID (gemeinsam mit Manga), sonst `anilist:<Genre>` bzw. `book:<Kategorie>`. */
export function bookGenreKeys(book: Book): string[] {
  const taste = genresFromCategories(book.categories);
  if (taste.length) return taste;
  return bookGenres(book).map((g) => `book:${g}`);
}

export function mangaGenreKeys(manga: Manga): string[] {
  const keys = (manga.genres ?? [])
    .map((g) => g?.trim())
    .filter((g): g is string => !!g)
    .map((g) => MANGA_TASTE_GENRE[g] ?? `anilist:${g}`);
  return [...new Set(keys)];
}

/** Lieblingsgenres über Bücher und Manga — jeder Titel zählt je Genre einmal. */
export function rankReadingGenres(books: Book[], manga: Manga[], limit = 6): Tally[] {
  return tally([...books.flatMap(bookGenreKeys), ...manga.flatMap(mangaGenreKeys)], limit);
}

export type ReadingStatus = BookStatus;

export const READING_STATUSES: ReadingStatus[] = [
  'reading',
  'planned',
  'completed',
  'paused',
  'dropped',
];

export function statusCounts(books: Book[], manga: Manga[]): Record<ReadingStatus, number> {
  const out: Record<ReadingStatus, number> = {
    reading: 0,
    planned: 0,
    completed: 0,
    paused: 0,
    dropped: 0,
  };
  for (const b of books) if (b.status in out) out[b.status] += 1;
  for (const m of manga) if (m.readStatus in out) out[m.readStatus] += 1;
  return out;
}

export interface ReadingYearInput {
  books: Book[];
  bookEvents: CompactBookEvent[];
  manga: Manga[];
  mangaEvents: RawChapterEvent[];
  uid?: string;
  year: number;
  now: number;
}

export interface ReadingYearStats {
  booksFinished: number;
  mangaFinished: number;
  pagesRead: number;
  pagesPerDay: number;
  chaptersRead: number;
  volumesRead: number;
  chaptersPerDay: number;
  activeDays: number;
  streak: number;
  avgRating: number | null;
  ratedCount: number;
  chaptersByMonth: number[];
  volumesByMonth: number[];
  finishedBooksByMonth: number[];
  finishedMangaByMonth: number[];
  topGenres: Tally[];
  finishedManga: Manga[];
  /** Im Jahr gelesen: beendet oder mit Lese-Ereignis. */
  booksRead: Book[];
  mangaRead: Manga[];
}

/** Manga-Teil und gemeinsame Werte; die Buch-Seiten kommen aus computeBookYearStats. */
export function computeReadingYearStats(
  input: ReadingYearInput,
  book: { pagesRead: number; finishedByMonth: number[]; finishedBooks: Book[] }
): ReadingYearStats {
  const { books, bookEvents, manga, mangaEvents, uid, year, now } = input;
  const yearBookEvents = bookEvents.filter((e) => new Date(e.ts * 1000).getFullYear() === year);
  const activity = mangaYearActivity(mangaEvents, year);
  const isCurrent = new Date(now).getFullYear() === year;

  const finishedManga = manga
    .filter((m) => isMangaFinishedInYear(m, year))
    .sort(
      (a, b) =>
        new Date(a.completedAt as string).getTime() - new Date(b.completedAt as string).getTime()
    );
  const finishedMangaByMonth = new Array(12).fill(0) as number[];
  for (const m of finishedManga)
    finishedMangaByMonth[new Date(m.completedAt as string).getMonth()]++;

  const days = new Set([...pagesByDay(yearBookEvents).keys(), ...activity.days]);

  let ratingSum = 0;
  let ratedCount = 0;
  for (const b of book.finishedBooks) {
    if (b.rating && b.rating > 0) {
      ratingSum += b.rating;
      ratedCount += 1;
    }
  }
  for (const m of finishedManga) {
    const r = uid ? m.rating?.[uid] || 0 : 0;
    if (r > 0) {
      ratingSum += r;
      ratedCount += 1;
    }
  }

  const readBookIds = new Set(
    yearBookEvents.filter((e) => eventPages(e) > 0 || e.t === 'fin').map((e) => e.s)
  );
  for (const b of book.finishedBooks) readBookIds.add(b.id);
  const booksRead = books.filter((b) => readBookIds.has(b.id));
  const mangaRead = manga.filter(
    (m) => activity.readIds.has(m.anilistId) || isMangaFinishedInYear(m, year)
  );

  const elapsed = daysElapsedInYear(year, now);
  return {
    booksFinished: book.finishedBooks.length,
    mangaFinished: finishedManga.length,
    pagesRead: book.pagesRead,
    pagesPerDay: Math.round((book.pagesRead / elapsed) * 10) / 10,
    chaptersRead: activity.chapters,
    volumesRead: activity.volumes,
    chaptersPerDay: Math.round((activity.chapters / elapsed) * 10) / 10,
    activeDays: days.size,
    streak: isCurrent ? streakFromDays(days, now) : 0,
    avgRating: ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
    ratedCount,
    chaptersByMonth: activity.chaptersByMonth,
    volumesByMonth: activity.volumesByMonth,
    finishedBooksByMonth: book.finishedByMonth,
    finishedMangaByMonth,
    topGenres: rankReadingGenres(booksRead, mangaRead),
    finishedManga,
    booksRead,
    mangaRead,
  };
}

/** Meistgelesene Manga insgesamt, wenn das Jahr keine Ereignisse hat. */
export function topMangaByProgress(manga: Manga[], limit = 5): Manga[] {
  const amount = (m: Manga) =>
    m.trackBy === 'volumes' ? (m.currentVolume || 0) * 9 : m.currentChapter || 0;
  return manga
    .filter((m) => amount(m) > 0)
    .sort((a, b) => amount(b) - amount(a) || a.title.localeCompare(b.title))
    .slice(0, limit);
}
