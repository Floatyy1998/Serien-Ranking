import { useMemo, useState } from 'react';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useBookEvents } from '../../../hooks/books/useBookEvents';
import { computeBookYearStats } from '../../../lib/books/bookStats';

/** Lesejahr der Bücher (Ereignisse + Kennzahlen) — einmal je Seite laden, überall teilen. */
export function useBookYear() {
  const { bookList } = useBooksList();
  const [now] = useState(() => Date.now());
  const year = new Date(now).getFullYear();
  const { events } = useBookEvents([year]);
  const yearStats = useMemo(
    () => computeBookYearStats(bookList, events, year, now),
    [bookList, events, year, now]
  );
  return { now, year, yearStats };
}

export type BookYear = ReturnType<typeof useBookYear>;
