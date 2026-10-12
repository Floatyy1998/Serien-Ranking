import { createContext, useContext } from 'react';
import type { Book } from '../types/Book';

export interface BooksListContextType {
  bookList: Book[];
  allBookList: Book[];
  hiddenBookList: Book[];
  loading: boolean;
  refetchBooks: () => void;
  isOffline: boolean;
  isStale: boolean;
}

export const BooksListContext = createContext<BooksListContextType>({
  bookList: [],
  allBookList: [],
  hiddenBookList: [],
  loading: true,
  refetchBooks: () => {},
  isOffline: false,
  isStale: false,
});

export const useBooksList = () => useContext(BooksListContext);
