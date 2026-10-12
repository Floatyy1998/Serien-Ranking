import type { CompactBookEvent } from '../../lib/books/bookEvents';
import { computeBookYearStats } from '../../lib/books/bookStats';
import type { Book } from '../../types/Book';
import type { BookWrappedStats } from '../../types/Wrapped';

/** Lesejahr für den Rückblick; null, wenn im Jahr weder Seiten noch beendete Bücher anfallen. */
export function calculateBookWrappedStats(
  books: Book[],
  events: CompactBookEvent[],
  year: number,
  now: number
): BookWrappedStats | null {
  const stats = computeBookYearStats(books, events, year, now);
  if (stats.pagesRead === 0 && stats.booksFinished === 0) return null;

  const topBooks = [...stats.finishedBooks]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.pageCount ?? 0) - (a.pageCount ?? 0))
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.title,
      author: b.authors?.[0],
      pages: b.pageCount,
      rating: b.rating,
      cover: b.cover,
    }));

  let mostReadMonth = 0;
  stats.pagesByMonth.forEach((pages, month) => {
    if (pages > stats.pagesByMonth[mostReadMonth]) mostReadMonth = month;
  });

  return {
    booksFinished: stats.booksFinished,
    pagesRead: stats.pagesRead,
    topBooks,
    longestBook: stats.longestBook
      ? { title: stats.longestBook.title, pages: stats.longestBook.pages }
      : undefined,
    mostReadMonth,
    mostReadMonthPages: stats.pagesByMonth[mostReadMonth],
  };
}
