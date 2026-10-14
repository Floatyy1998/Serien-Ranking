import { createContext, useContext } from 'react';
import type { Book } from '../types/Book';

export interface BooksListContextType {
  bookList: Book[];
  allBookList: Book[];
  hiddenBookList: Book[];
  /** AniList-IDs der Manga-Reihen, deren Bände als Bücher geführt werden. */
  seriesAsBooks: Set<number>;
  /** Selbst gewählte Lieblingsgenres (Genre-IDs der Bücher-Regale), leer = keine Wahl. */
  favoriteBookGenres: string[];
  loading: boolean;
  refetchBooks: () => void;
  isOffline: boolean;
  isStale: boolean;
}

export const BooksListContext = createContext<BooksListContextType>({
  bookList: [],
  allBookList: [],
  hiddenBookList: [],
  seriesAsBooks: new Set(),
  favoriteBookGenres: [],
  loading: true,
  refetchBooks: () => {},
  isOffline: false,
  isStale: false,
});

export const useBooksList = () => useContext(BooksListContext);
