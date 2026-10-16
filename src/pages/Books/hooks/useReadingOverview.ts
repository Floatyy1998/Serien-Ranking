import { useMemo, useState } from 'react';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useBooksForYourShows } from '../../../hooks/books/useBasedOnBooks';
import { useBookEvents } from '../../../hooks/books/useBookEvents';
import { sortByRecentActivity } from '../../../lib/books/bookProgress';
import { computeBookYearStats } from '../../../lib/books/bookStats';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';

const mangaAsShelfBook = (m: Manga): Book => ({
  id: `manga-${m.anilistId}`,
  title: m.title,
  authors: [],
  cover: m.poster,
  status: 'completed',
  currentPage: 0,
  pageCount: m.volumes ? m.volumes * 190 : undefined,
  addedAt: m.addedAt ?? '',
  completedAt: m.completedAt,
  rating: m.rating ? Object.values(m.rating)[0] : undefined,
});

/** Alles, was die Lese-Übersicht zeigt — auf /reading und auf der Lese-Startseite. */
export function useReadingOverview() {
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();
  const [now] = useState(() => Date.now());
  const year = new Date(now).getFullYear();
  const { events } = useBookEvents([year]);
  const yearStats = useMemo(
    () => computeBookYearStats(bookList, events, year, now),
    [bookList, events, year, now]
  );
  const { suggestions } = useBooksForYourShows();

  const readingBooks = useMemo(
    () => sortByRecentActivity(bookList).filter((b) => b.status === 'reading'),
    [bookList]
  );
  const readingManga = useMemo(
    () =>
      mangaList
        .filter((m) => m.readStatus === 'reading')
        .sort(
          (a, b) => new Date(b.lastReadAt || 0).getTime() - new Date(a.lastReadAt || 0).getTime()
        )
        .slice(0, 16),
    [mangaList]
  );

  const mangaDoneThisYear = useMemo(
    () =>
      mangaList.filter(
        (m) =>
          m.readStatus === 'completed' &&
          m.completedAt &&
          new Date(m.completedAt).getFullYear() === year
      ),
    [mangaList, year]
  );

  const shelf = useMemo(() => {
    const books = bookList.filter((b) => b.status === 'completed');
    const manga = mangaList.filter((m) => m.readStatus === 'completed').map(mangaAsShelfBook);
    return [...books, ...manga]
      .sort(
        (a, b) =>
          new Date(a.completedAt || a.addedAt || 0).getTime() -
          new Date(b.completedAt || b.addedAt || 0).getTime()
      )
      .slice(-70);
  }, [bookList, mangaList]);

  return {
    bookCount: bookList.length,
    mangaCount: mangaList.length,
    year,
    yearStats,
    suggestions,
    readingBooks,
    readingManga,
    finishedThisYear: yearStats.booksFinished + mangaDoneThisYear.length,
    shelf,
    totalReading: readingBooks.length + readingManga.length,
    chapters: mangaList.reduce((sum, m) => sum + (m.currentChapter || 0), 0),
  };
}

export type ReadingOverview = ReturnType<typeof useReadingOverview>;
