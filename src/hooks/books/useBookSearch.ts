import { useEffect, useState } from 'react';
import { searchBooks } from '../../services/api/booksApi';
import type { BookSearchResult } from '../../types/Book';

export function useBookSearch(query: string, delay = 350) {
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchBooks(trimmed, controller.signal)
        .then((list) => {
          setResults(list);
          setError(false);
        })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return;
          setResults([]);
          setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delay]);

  return { results, loading, error };
}
