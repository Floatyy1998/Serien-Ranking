// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { ReadingRatingsPage } from './ReadingRatingsPage';

const state = vi.hoisted(() => ({
  books: [] as Book[],
  manga: [] as Manga[],
  areas: 'both' as 'both' | 'books' | 'manga',
}));
const rate = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock('@mui/icons-material', () => ({
  Star: () => <span />,
  WorkspacePremium: () => <span />,
}));
vi.mock('../../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: state.books, loading: false }),
}));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: state.manga, loading: false }),
}));
vi.mock('../../../hooks/ui/useReadingAreas', () => ({ useReadingAreas: () => state.areas }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
    },
  }),
}));
vi.mock('../../Books/hooks/useBookActions', () => ({ useBookActions: () => ({ rate }) }));
vi.mock('../../Books/components/BookCover', () => ({ BookCover: () => <div /> }));
vi.mock('../../../components/ui/overlay/QuickRatingSheet', () => ({
  QuickRatingSheet: ({
    seriesTitle,
    onRate,
  }: {
    seriesTitle: string;
    onRate: (value: number) => void;
  }) => (
    <div role="dialog" aria-label={seriesTitle}>
      <button type="button" onClick={() => onRate(8)}>
        Speichern
      </button>
    </div>
  ),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, subtitle }: { title?: ReactNode; subtitle?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <span>{subtitle}</span>
    </div>
  ),
  EmptyState: ({ title }: { title?: ReactNode }) => <div>{title}</div>,
}));

const book = (over: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Der Name des Windes',
  authors: ['Patrick Rothfuss'],
  status: 'completed',
  currentPage: 600,
  pageCount: 600,
  rating: 8.5,
  addedAt: '2026-01-01',
  ...over,
});

const manga = (over: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 7,
  title: 'Berserk',
  poster: 'p.jpg',
  rating: { u1: 10 },
  currentChapter: 20,
  chapters: 40,
  readStatus: 'reading',
  format: 'MANGA',
  countryOfOrigin: 'JP',
  ...over,
});

const opened = () =>
  screen.getAllByRole('button', { name: /öffnen$/ }).map((b) => b.getAttribute('aria-label'));

afterEach(() => {
  cleanup();
  state.books = [];
  state.manga = [];
  state.areas = 'both';
  navigate.mockReset();
  rate.mockReset();
});

describe('ReadingRatingsPage', () => {
  it('rankt Bücher und Manga gemeinsam mit Podium und Rangliste', () => {
    state.books = [
      book(),
      book({ id: 'b2', title: 'Die Stadt', rating: 7, authors: ['Anna Autor'] }),
      book({ id: 'b3', title: 'Abend', rating: 7 }),
    ];
    state.manga = [manga(), manga({ anilistId: 8, title: 'Tower of God', rating: { u1: 6 } })];
    render(<ReadingRatingsPage />);
    expect(screen.getByRole('heading', { name: 'Bewertungen' })).toBeInTheDocument();
    expect(screen.getByText('5 bewertet · Ø 7,7')).toBeInTheDocument();
    expect(opened()).toEqual([
      'Berserk öffnen',
      'Der Name des Windes öffnen',
      'Abend öffnen',
      'Die Stadt öffnen',
      'Tower of God öffnen',
    ]);
    const list = within(screen.getByRole('list', { name: 'Rangliste' }));
    const rows = list.getAllByRole('button');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringMatching(/^3Die Stadt.*Buch.*Anna Autor.*7,0$/),
      expect.stringMatching(/^5Tower of God.*Manga.*6,0$/),
    ]);
    expect(screen.getByText('8,5')).toBeInTheDocument();
  });

  it('filtert nach Medium', () => {
    state.books = [book()];
    state.manga = [manga()];
    render(<ReadingRatingsPage />);
    expect(screen.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Bücher' }));
    expect(opened()).toEqual(['Der Name des Windes öffnen']);
    fireEvent.click(screen.getByRole('button', { name: 'Manga' }));
    expect(opened()).toEqual(['Berserk öffnen']);
  });

  it('zeigt für reine Buchleser keine Manga und keine Medien-Filter', () => {
    state.areas = 'books';
    state.books = [book()];
    state.manga = [manga()];
    render(<ReadingRatingsPage />);
    expect(opened()).toEqual(['Der Name des Windes öffnen']);
    expect(screen.queryByRole('button', { name: 'Bücher' })).toBeNull();
  });

  it('öffnet beim Antippen das Detail', () => {
    state.books = [book({ id: 'abc' })];
    state.manga = [manga()];
    render(<ReadingRatingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Berserk öffnen' }));
    expect(navigate).toHaveBeenCalledWith('/manga/7');
    fireEvent.click(screen.getByRole('button', { name: 'Der Name des Windes öffnen' }));
    expect(navigate).toHaveBeenCalledWith('/books/abc');
  });

  it('bietet Beendetes ohne Wertung zum Bewerten an', () => {
    state.books = [book({ id: 'x', title: 'Offen', rating: 0 })];
    state.manga = [manga({ title: 'Monster', rating: {}, readStatus: 'completed' })];
    render(<ReadingRatingsPage />);
    expect(screen.getByText('Noch keine Bewertungen')).toBeInTheDocument();
    const queue = within(screen.getByRole('region', { name: 'Noch zu bewerten' }));
    fireEvent.click(queue.getByRole('button', { name: 'Monster bewerten' }));
    expect(navigate).toHaveBeenCalledWith('/manga/7#rating');
    fireEvent.click(queue.getByRole('button', { name: 'Offen bewerten' }));
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(rate).toHaveBeenCalledWith(expect.objectContaining({ id: 'x' }), 8);
  });
});
