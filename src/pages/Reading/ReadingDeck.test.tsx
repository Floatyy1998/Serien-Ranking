// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import type { BookYear } from '../Books/hooks/useBookYear';
import { ReadingDeck } from './ReadingDeck';

const lists = vi.hoisted(() => ({ books: [] as Book[], manga: [] as Manga[] }));
vi.mock('../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: lists.books, allBookList: lists.books }),
}));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: lists.manga }),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
    },
  }),
}));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children?: ReactNode }) => <h1>{children}</h1>,
  HeaderActions: () => <div data-testid="header-actions" />,
}));
vi.mock('../Books/components/BookCover', () => ({ BookCover: () => null }));
vi.mock('../../hooks/platform/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: true }),
}));

const bookYear = {
  now: Date.UTC(2026, 9, 18),
  year: 2026,
  yearStats: { booksFinished: 1, pagesRead: 320 },
} as unknown as BookYear;

const book = (id: string, status: Book['status']): Book =>
  ({ id, title: id, authors: [], status, currentPage: 0, addedAt: '2026-01-01' }) as Book;

const manga = (anilistId: number, readStatus: Manga['readStatus']): Manga =>
  ({
    nmr: anilistId,
    anilistId,
    title: `M${anilistId}`,
    poster: '',
    rating: {},
    currentChapter: 10,
    readStatus,
  }) as Manga;

const renderDeck = (areas: 'both' | 'books' | 'manga' = 'both') => {
  const handlers = { onSearch: vi.fn(), onShowReading: vi.fn(), onShowCollection: vi.fn() };
  render(
    <ReadingDeck
      areas={areas}
      bookYear={bookYear}
      displayName="Floatyy"
      totalUnreadBadge={0}
      onNotificationsOpen={vi.fn()}
      {...handlers}
    />
  );
  return handlers;
};

afterEach(() => {
  cleanup();
  lists.books = [];
  lists.manga = [];
  navigate.mockReset();
});

describe('ReadingDeck', () => {
  it('begrüßt mit dem eigenen Namen', () => {
    renderDeck();
    expect(screen.getByRole('heading').textContent).toContain(', Floatyy!');
  });

  it('zeigt Buchlesern Lesejahr und Regal', () => {
    lists.books = [book('a', 'reading'), book('b', 'completed')];
    renderDeck();
    expect(screen.getByText('2 Bücher · 1 dieses Jahr gelesen')).toBeTruthy();
    expect(screen.getByRole('button', { name: '2 Im Regal' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2 Im Regal' }));
    expect(navigate).toHaveBeenCalledWith('/books/shelf');
  });

  it('zeigt Mangalesern die Sammlung', () => {
    lists.manga = [manga(1, 'reading')];
    const { onShowCollection } = renderDeck();
    expect(screen.getByText('1 Titel in deiner Sammlung')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '1 Sammlung' }));
    expect(onShowCollection).toHaveBeenCalled();
  });

  it('zeigt bei beidem gemeinsame Kennzahlen', () => {
    lists.books = [book('a', 'reading'), book('b', 'planned')];
    lists.manga = [manga(1, 'reading'), manga(2, 'completed')];
    const { onShowReading, onShowCollection } = renderDeck();
    expect(screen.getByText('2 Bücher · 2 Manga')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2 Am Lesen' }));
    expect(onShowReading).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '2 Manga' }));
    expect(onShowCollection).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '2 Bücher' }));
    expect(navigate).toHaveBeenCalledWith('/books/shelf');
  });

  it('sucht in beidem oder nur im genutzten Lesebereich', () => {
    const { onSearch } = renderDeck();
    fireEvent.click(screen.getByRole('button', { name: 'Bücher und Manga suchen' }));
    expect(onSearch).toHaveBeenCalledWith('all');
    cleanup();
    const onlyBooks = renderDeck('books');
    fireEvent.click(screen.getByRole('button', { name: 'Bücher suchen' }));
    expect(onlyBooks.onSearch).toHaveBeenCalledWith('books');
  });

  it('blendet bei nur Manga die Buch-Daten aus', () => {
    lists.books = [book('a', 'reading')];
    lists.manga = [manga(1, 'reading')];
    renderDeck('manga');
    expect(screen.queryByRole('button', { name: /Bücher/ })).toBeNull();
    expect(screen.getByText('1 Titel in deiner Sammlung')).toBeTruthy();
  });

  it('blendet die Kennzahlen aus, solange nichts da ist', () => {
    renderDeck();
    expect(screen.queryByRole('button', { name: /Am Lesen/ })).toBeNull();
  });
});
