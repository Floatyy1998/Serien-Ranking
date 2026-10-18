import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { remainingPages } from '../books/bookProgress';
import { mangaUnreadChapters, userMangaRating } from '../manga/overview';

export interface ReadingQuickStats {
  reading: number;
  titles: number;
  rated: number;
  finished: number;
  open: number;
}

/** Zähler der Schnellzugriffe über Bücher und Manga zusammen. */
export function readingQuickStats(
  books: Book[],
  manga: Manga[],
  uid: string | undefined
): ReadingQuickStats {
  const stats = { reading: 0, titles: books.length + manga.length, rated: 0, finished: 0, open: 0 };
  for (const b of books) {
    if (b.status === 'reading') {
      stats.reading += 1;
      if ((remainingPages(b) ?? 0) > 0) stats.open += 1;
    }
    if (b.status === 'completed') stats.finished += 1;
    if ((b.rating ?? 0) > 0) stats.rated += 1;
  }
  for (const m of manga) {
    if (m.readStatus === 'reading') {
      stats.reading += 1;
      if (mangaUnreadChapters(m) > 0) stats.open += 1;
    }
    if (m.readStatus === 'completed') stats.finished += 1;
    if (userMangaRating(m, uid) > 0) stats.rated += 1;
  }
  return stats;
}
