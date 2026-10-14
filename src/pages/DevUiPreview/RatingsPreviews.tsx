import type firebase from 'firebase/compat/app';
import React, { useMemo } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { BooksListContext } from '../../contexts/BooksListContext';
import type { Book, BookStatus } from '../../types/Book';
import { RatingsPage } from '../Ratings/RatingsPage';

const cover = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;

const SEEDS: [string, string, number | null, BookStatus, number, number, number?][] = [
  ['Der Kleine Hobbit', 'J.R.R. Tolkien', 14626130, 'completed', 310, 310, 10],
  ['Momo', 'Michael Ende', 14571396, 'completed', 269, 269, 9],
  ['QualityLand', 'Marc-Uwe Kling', 10478960, 'completed', 371, 371, 8],
  ['Harry Potter und der Stein der Weisen', 'J. K. Rowling', 15157474, 'completed', 302, 302, 7],
  ['Der Wüstenplanet', 'Frank Herbert', 6390607, 'reading', 608, 240],
  ['Ein Buch ohne Cover', 'Unbekannte Autorin', null, 'reading', 420, 60, 6],
  ['Die Tribute von Panem', 'Suzanne Collins', 12878037, 'planned', 397, 0],
  ['Die Herren von Winterfell', 'George R. R. Martin', 14430493, 'dropped', 571, 120],
];

const BOOKS: Book[] = SEEDS.map(([title, author, coverId, status, pages, current, rating], i) => ({
  id: `preview-${i}`,
  title,
  authors: [author],
  cover: coverId ? cover(coverId) : undefined,
  pageCount: pages,
  status,
  currentPage: current,
  rating,
  addedAt: new Date(2026, 0, 2 + i).toISOString(),
}));

const fakeUser = { uid: 'preview-user', displayName: 'Flo' } as unknown as firebase.User;

/** Bewertungsseite mit Bücher-Reiter: `?solo=ratings-books&tab=books`. */
export const RatingsBooksPreview = () => {
  const auth = useMemo(
    () => ({
      user: fakeUser,
      setUser: () => {},
      authStateResolved: true,
      onboardingComplete: true,
      setOnboardingComplete: () => {},
    }),
    []
  );
  const books = useMemo(
    () =>
      ({
        bookList: BOOKS,
        allBookList: BOOKS,
        hiddenBookList: [],
        seriesAsBooks: new Set<number>(),
        loading: false,
        refetchBooks: () => {},
        isOffline: false,
        isStale: false,
      }) as unknown as React.ContextType<typeof BooksListContext>,
    []
  );
  return (
    <AuthContext.Provider value={auth}>
      <BooksListContext.Provider value={books}>
        <div className="mobile-content" style={{ height: '100vh', overflowY: 'auto' }}>
          <RatingsPage />
        </div>
      </BooksListContext.Provider>
    </AuthContext.Provider>
  );
};
