import { useEffect, useMemo, useState } from 'react';
import { bookMatchKey } from '../../../lib/books/bookIdentity';
import { computeReadingTaste, type TasteGenre } from '../../../lib/books/readingTaste';
import { loadShelfGenreIndex } from '../../../services/api/bookStatic';
import type { Book } from '../../../types/Book';

let sharedIndex: Promise<Map<string, TasteGenre[]>> | undefined;

/** Lesegeschmack aus Kategorien plus den Genre-Regalen des Tagesexports. */
export function useReadingTaste(books: Book[]) {
  const [index, setIndex] = useState<Map<string, TasteGenre[]> | null>(null);

  useEffect(() => {
    let alive = true;
    sharedIndex ??= loadShelfGenreIndex();
    void sharedIndex.then((map) => {
      if (alive) setIndex(map);
    });
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(
    () =>
      computeReadingTaste(
        books,
        (book) => index?.get(book.id) ?? index?.get(bookMatchKey(book.title, book.authors)) ?? []
      ),
    [books, index]
  );
}
