import { useCallback, useMemo } from 'react';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { createBookIndex, findMangaForBook } from '../../lib/books/bookIdentity';
import type { Book } from '../../types/Book';

interface OwnedLookup {
  id: string;
  hardcoverId?: number;
  title: string;
  authors?: string[];
  isbn13?: string;
}

/** Findet zu einem Treffer das eigene Buch — über ID, Hardcover-ID, ISBN oder Titel samt Band/Beteiligten. */
export function useOwnedBooks() {
  const { allBookList } = useBooksList();
  const index = useMemo(() => createBookIndex(allBookList), [allBookList]);
  return useCallback((item: OwnedLookup): Book | undefined => index.find(item), [index]);
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
