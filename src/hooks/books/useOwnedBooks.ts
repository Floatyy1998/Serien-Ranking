import { useCallback, useMemo } from 'react';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { bookMatchKey, bookTitleKey, findMangaForBook } from '../../lib/books/bookIdentity';
import type { Book } from '../../types/Book';

interface OwnedLookup {
  id: string;
  title: string;
  authors?: string[];
  isbn13?: string;
}

/** Findet zu einem Treffer das eigene Buch — über ID, ISBN oder Titel + Autor. */
export function useOwnedBooks() {
  const { allBookList } = useBooksList();
  const index = useMemo(() => {
    const map = new Map<string, Book>();
    const byTitle = new Map<string, Book>();
    for (const b of allBookList) {
      map.set(b.id, b);
      map.set(bookMatchKey(b.title, b.authors), b);
      if (b.isbn13) map.set(b.isbn13, b);
      if (!byTitle.has(bookTitleKey(b.title))) byTitle.set(bookTitleKey(b.title), b);
    }
    return { map, byTitle };
  }, [allBookList]);

  return useCallback(
    (item: OwnedLookup): Book | undefined => {
      const owned =
        index.map.get(item.id) ??
        (item.isbn13 ? index.map.get(item.isbn13) : undefined) ??
        index.map.get(bookMatchKey(item.title, item.authors));
      if (owned) return owned;
      const sameTitle = index.byTitle.get(bookTitleKey(item.title));
      return sameTitle && (!item.authors?.length || !sameTitle.authors?.length)
        ? sameTitle
        : undefined;
    },
    [index]
  );
}

/** Manga-Band als Buchtreffer, dessen Reihe schon in den eigenen Manga steht. */
export function useMangaForBook() {
  const { allMangaList } = useMangaList();
  return useCallback(
    (item: { title: string; subtitle?: string }) => findMangaForBook(item, allMangaList),
    [allMangaList]
  );
}

/** Treffer, der schon in den eigenen Büchern oder als Band bei den eigenen Manga steht. */
export function useOwnsResult() {
  const ownedFor = useOwnedBooks();
  const mangaFor = useMangaForBook();
  return useCallback(
    (item: OwnedLookup & { subtitle?: string }) => !!ownedFor(item) || !!mangaFor(item),
    [ownedFor, mangaFor]
  );
}
