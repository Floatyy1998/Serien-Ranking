import { useCallback, useMemo } from 'react';
import { useBooksList } from '../../contexts/BooksListContext';
import { bookMatchKey } from '../../lib/books/bookIdentity';
import type { Book } from '../../types/Book';

/** Findet zu einem Treffer das eigene Buch — über ID, ISBN oder Titel + Autor. */
export function useOwnedBooks() {
  const { allBookList } = useBooksList();
  const index = useMemo(() => {
    const map = new Map<string, Book>();
    for (const b of allBookList) {
      map.set(b.id, b);
      map.set(bookMatchKey(b.title, b.authors), b);
      if (b.isbn13) map.set(b.isbn13, b);
    }
    return map;
  }, [allBookList]);

  return useCallback(
    (item: { id: string; title: string; authors?: string[]; isbn13?: string }): Book | undefined =>
      index.get(item.id) ??
      (item.isbn13 ? index.get(item.isbn13) : undefined) ??
      index.get(bookMatchKey(item.title, item.authors)),
    [index]
  );
}
