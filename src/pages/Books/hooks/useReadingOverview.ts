import { useMemo } from 'react';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useBooksForYourShows } from '../../../hooks/books/useBasedOnBooks';
import { sortByRecentActivity } from '../../../lib/books/bookProgress';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import type { BookYear } from './useBookYear';

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

/** Alles, was die gemischte Lese-Übersicht zeigt — auf der Lesen-Seite und der Lese-Startseite. */
export function useReadingOverview({ year, yearStats }: BookYear) {
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();
  const { suggestions } = useBooksForYourShows();

  const readingBooks = useMemo(
    () => sortByRecentActivity(bookList).filter((b) => b.status === 'reading'),
    [bookList]
  );
  const readingMangaCount = useMemo(
    () => mangaList.filter((m) => m.readStatus === 'reading').length,
    [mangaList]
  );

  const mangaDoneThisYear = useMemo(
    () =>
      mangaList.filter(
        (m) =>
          m.readStatus === 'completed' &&
          m.completedAt &&
          new Date(m.completedAt).getFullYear() === year
      ).length,
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
    finishedThisYear: yearStats.booksFinished + mangaDoneThisYear,
    shelf,
    totalReading: readingBooks.length + readingMangaCount,
    chapters: mangaList.reduce((sum, m) => sum + (m.currentChapter || 0), 0),
  };
}

export type ReadingOverview = ReturnType<typeof useReadingOverview>;
