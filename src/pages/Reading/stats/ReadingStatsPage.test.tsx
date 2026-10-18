// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CompactBookEvent } from '../../../lib/books/bookEvents';
import type { RawChapterEvent } from '../../../lib/manga/chapterOperations';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { ReadingStatsPage } from './ReadingStatsPage';

const year = new Date().getFullYear();
const nowSec = Math.floor(Date.now() / 1000);

const state = vi.hoisted(() => ({
  areas: 'both' as 'both' | 'books' | 'manga',
  books: [] as Book[],
  manga: [] as Manga[],
  bookEvents: [] as CompactBookEvent[],
  mangaEvents: [] as RawChapterEvent[],
}));

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    [
      'AutoStories',
      'ChevronLeft',
      'ChevronRight',
      'CollectionsBookmark',
      'Devices',
      'Insights',
      'Person',
      'Sell',
      'Star',
      'AutoFixHigh',
      'Bolt',
      'DarkMode',
      'Favorite',
      'Fingerprint',
      'HistoryEdu',
      'Lightbulb',
      'RocketLaunch',
    ].map((n) => [n, stub])
  );
});
vi.mock('../../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: state.books, loading: false }),
}));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: state.manga, loading: false }),
}));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#0f0',
      accent: '#00f',
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
      status: { warning: '#f90', success: '#0c0', error: '#f00' },
    },
  }),
}));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../../hooks/ui/useReadingAreas', () => ({ useReadingAreas: () => state.areas }));
vi.mock('../../../hooks/books/useBookEvents', () => ({
  useBookEvents: (years: number[]) => ({
    events: years.length ? state.bookEvents : [],
    loading: false,
  }),
}));
vi.mock('./hooks/useMangaYearEvents', () => ({
  useMangaYearEvents: (_year: number, enabled: boolean) => ({
    events: enabled ? state.mangaEvents : [],
    loading: false,
  }),
}));
vi.mock('../../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <main>{children}</main>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  LoadingSpinner: () => <div>lädt</div>,
  EmptyState: ({ title }: { title: string }) => <p>{title}</p>,
}));
vi.mock('../../Books/components/BookCover', () => ({ BookCover: () => null }));
vi.mock('../../Books/components/Bookshelf', () => ({
  Bookshelf: ({ books, hrefFor }: { books: Book[]; hrefFor: (b: Book) => string }) => (
    <ul data-testid="shelf">
      {books.map((b) => (
        <li key={b.id}>{`${b.title}>${hrefFor(b)}`}</li>
      ))}
    </ul>
  ),
}));
vi.mock('../../Books/sections/BookStatsSection', () => ({
  StatTile: ({ value, label }: { value: ReactNode; label: string }) => (
    <div data-testid="tile">{`${label}: ${value}`}</div>
  ),
  MonthBars: () => null,
}));

const book = (over: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Der Name des Windes',
  authors: ['Patrick Rothfuss'],
  status: 'completed',
  completedAt: `${year}-01-05T10:00:00`,
  currentPage: 600,
  pageCount: 600,
  categories: ['Fiction / Fantasy / Epic'],
  rating: 9,
  addedAt: `${year}-01-01T10:00:00`,
  ...over,
});

const manga = (over: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 7,
  title: 'Frieren',
  poster: 'frieren.jpg',
  rating: { u1: 7 },
  currentChapter: 120,
  readStatus: 'completed',
  completedAt: `${year}-01-06T10:00:00`,
  genres: ['Fantasy', 'Adventure'],
  ...over,
});

const setup = () => {
  state.books = [book()];
  state.manga = [manga()];
  state.bookEvents = [{ ts: nowSec - 60, t: 'pg', s: 'b1', st: 'Buch', n: 40 }];
  state.mangaEvents = [{ ts: nowSec - 30, t: 'ch', s: 7, ch: 120, ch0: 118, n: 3 }];
};

const tiles = () => screen.queryAllByTestId('tile').map((el) => el.textContent);

afterEach(() => {
  cleanup();
  navigate.mockReset();
  state.areas = 'both';
  state.books = [];
  state.manga = [];
  state.bookEvents = [];
  state.mangaEvents = [];
});

describe('ReadingStatsPage', () => {
  it('zeigt Bücher und Manga gemeinsam im Lesejahr', () => {
    setup();
    render(<ReadingStatsPage />);
    const shown = tiles();
    expect(shown).toContain('Bücher beendet: 1');
    expect(shown).toContain('Manga beendet: 1');
    expect(shown).toContain('Seiten gelesen: 40');
    expect(shown).toContain('Kapitel gelesen: 3');
    expect(shown).toContain('Lesetage: 1');
    expect(shown.some((s) => s?.startsWith('Ø Bewertung · 2 bewertet: 8,0'))).toBe(true);
    expect(screen.getByText('Lieblingsgenres')).toBeTruthy();
    expect(screen.getByText('Fantasy')).toBeTruthy();
    expect(screen.getByText('2 Titel')).toBeTruthy();
    expect(screen.getByText('Abenteuer')).toBeTruthy();
  });

  it('stellt Bücher und Manga ins Regal „Gelesen"', () => {
    setup();
    render(<ReadingStatsPage />);
    const shelf = screen.getByTestId('shelf').textContent ?? '';
    expect(shelf).toContain('Der Name des Windes>/books/b1');
    expect(shelf).toContain('Frieren>/manga/7');
  });

  it('öffnet einen meistgelesenen Manga', () => {
    setup();
    render(<ReadingStatsPage />);
    fireEvent.click(screen.getByText('3 Kapitel'));
    expect(navigate).toHaveBeenCalledWith('/manga/7');
  });

  it('zeigt bei nur Büchern keine Manga-Werte', () => {
    setup();
    state.areas = 'books';
    render(<ReadingStatsPage />);
    const shown = tiles();
    expect(shown).toContain('Bücher beendet: 1');
    expect(shown.some((s) => s?.startsWith('Manga beendet'))).toBe(false);
    expect(shown.some((s) => s?.startsWith('Kapitel'))).toBe(false);
    expect(screen.queryByText('Meistgelesene Manga')).toBeNull();
    expect(screen.getByTestId('shelf').textContent).not.toContain('Frieren');
  });

  it('zeigt bei nur Manga keine Buch-Werte', () => {
    setup();
    state.areas = 'manga';
    render(<ReadingStatsPage />);
    const shown = tiles();
    expect(shown).toContain('Manga beendet: 1');
    expect(shown.some((s) => s?.startsWith('Bücher'))).toBe(false);
    expect(shown.some((s) => s?.startsWith('Seiten'))).toBe(false);
    expect(screen.queryByText('Meistgelesene Autoren')).toBeNull();
  });

  it('zählt Status und Formate über beide Medien', () => {
    setup();
    state.books.push(
      book({ id: 'b2', status: 'reading', format: 'audio', completedAt: undefined })
    );
    render(<ReadingStatsPage />);
    expect(screen.getByText('Status-Verteilung')).toBeTruthy();
    expect(screen.getByText('Lese ich')).toBeTruthy();
    expect(screen.getByText('Hörbuch')).toBeTruthy();
    expect(screen.getByText('Gedruckt')).toBeTruthy();
    expect(screen.getAllByText('Manga').length).toBeGreaterThan(0);
  });

  it('zeigt ohne Bücher und Manga einen Leerzustand', () => {
    render(<ReadingStatsPage />);
    expect(screen.getByText('Noch nichts gelesen')).toBeTruthy();
  });
});
