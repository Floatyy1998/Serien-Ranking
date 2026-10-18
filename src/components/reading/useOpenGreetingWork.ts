import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOwnedBooks } from '../../hooks/books/useOwnedBooks';
import type { ReadingGreeting } from '../../lib/text/readingGreetings';
import { searchManga } from '../../services/api/anilistService';
import { findBook } from '../../services/api/booksApi';

type GreetingWork = NonNullable<ReadingGreeting['search']>;

const bookPath = (id: string) => `/books/${encodeURIComponent(id)}`;

/** Öffnet das Werk hinter einem Gruß direkt; nur ohne Treffer geht es in die Suche. */
export function useOpenGreetingWork(onSearch: (query: string, medium: 'books' | 'manga') => void) {
  const navigate = useNavigate();
  const ownedFor = useOwnedBooks();
  const busy = useRef(false);

  return useCallback(
    async (work: GreetingWork) => {
      if (busy.current) return;
      busy.current = true;
      try {
        if (work.medium === 'books') {
          const result = await findBook(work.query, work.author);
          if (result) {
            navigate(bookPath(ownedFor(result)?.id ?? result.id), { state: { result } });
            return;
          }
        } else {
          const hit = await searchManga(work.query, 1, 5)
            .then((r) => r.results[0])
            .catch(() => undefined);
          if (hit) {
            navigate(`/manga/${hit.id}`);
            return;
          }
        }
        onSearch(work.query, work.medium);
      } finally {
        busy.current = false;
      }
    },
    [navigate, ownedFor, onSearch]
  );
}
