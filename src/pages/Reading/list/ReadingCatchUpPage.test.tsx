// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SeriesProgress } from '../../../lib/books/bookSeries';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { ReadingCatchUpPage } from './ReadingCatchUpPage';

const state = vi.hoisted(() => ({
  books: [] as Book[],
  manga: [] as Manga[],
  volumes: [] as SeriesProgress[],
  areas: 'both' as 'both' | 'books' | 'manga',
}));
const navigate = vi.hoisted(() => vi.fn());
const openByTitle = vi.hoisted(() => vi.fn());

vi.mock('../../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: state.books, loading: false }),
}));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: state.manga, loading: false }),
}));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      background: { default: '#000' },
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
    },
  }),
}));
vi.mock('../../../hooks/ui/useReadingAreas', () => ({ useReadingAreas: () => state.areas }));
vi.mock('../../../hooks/platform/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: true, isDesktop: false }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@mui/icons-material', () => ({ Celebration: () => null, Schedule: () => null }));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onClick,
      'aria-label': label,
    }: {
      children?: ReactNode;
      onClick?: () => void;
      'aria-label'?: string;
    }) => (
      <div role="button" aria-label={label} data-testid="entry" onClick={onClick}>
        {children}
      </div>
    ),
  },
}));
vi.mock('../../Books/hooks/useNextVolumes', () => ({
  useNextVolumes: (books: Book[]) => ({ progress: books.length ? state.volumes : [] }),
}));
vi.mock('../../Books/hooks/useSeriesPartBooks', () => ({ useSeriesPartBooks: () => ({}) }));
vi.mock('../../Books/discover/DiscoverParts', () => ({
  useOpenByTitle: () => ({ open: openByTitle }),
  useOpenResult: () => vi.fn(),
}));
vi.mock('../../Books/components/BookCover', () => ({ BookCover: () => null }));
vi.mock('../../Books/sections/BookStatsSection', () => ({
  StatTile: ({ value, label }: { value: ReactNode; label: string }) => (
    <div data-testid="stat">
      {label}: {value}
    </div>
  ),
}));
vi.mock('../../../components/ui', () => ({
  FilterPill: ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  ),
  LoadingSpinner: ({ text }: { text?: string }) => <p>{text}</p>,
  PageLayout: ({ children }: { children?: ReactNode }) => <main>{children}</main>,
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

const book = (o: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Der Hobbit',
  authors: ['Tolkien'],
  status: 'reading',
  currentPage: 100,
  pageCount: 400,
  addedAt: '2026-01-01T00:00:00Z',
  lastReadAt: '2026-09-01T00:00:00Z',
  ...o,
});

const manga = (o: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 7,
  title: 'Berserk',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 50,
  chapters: 100,
  readStatus: 'reading',
  lastReadAt: '2026-10-10T00:00:00Z',
  ...o,
});

const volume: SeriesProgress = {
  seriesId: 'Q1',
  seriesName: 'Mittelerde',
  author: 'Tolkien',
  next: {
    part: { wikidataId: 'Q2', title: 'Die Gefährten', position: 2 },
    state: 'available',
    daysUntil: null,
  },
  ownedCount: 1,
  total: 4,
  books: [],
};

const titles = () =>
  screen.queryAllByTestId('entry').map((e) => e.getAttribute('aria-label')?.replace(' öffnen', ''));
const stats = () => screen.queryAllByTestId('stat').map((s) => s.textContent);

afterEach(() => {
  cleanup();
  state.books = [];
  state.manga = [];
  state.volumes = [];
  state.areas = 'both';
  navigate.mockReset();
  openByTitle.mockReset();
});

describe('ReadingCatchUpPage', () => {
  it('mischt offene Kapitel, Restseiten und erschienene Bände', () => {
    state.books = [book()];
    state.manga = [manga()];
    state.volumes = [volume];
    render(<ReadingCatchUpPage />);
    expect(titles()).toEqual(['Der Hobbit', 'Die Gefährten', 'Berserk']);
    expect(stats()).toEqual([
      'Titel offen: 3',
      'Kapitel offen: 50',
      'Seiten offen: 300',
      'Ø Fortschritt: 33%',
    ]);
    expect(screen.getByText('3 Titel · 50 Kapitel · 300 Seiten offen')).toBeInTheDocument();
    expect(screen.getByText(/300 Seiten übrig/)).toBeInTheDocument();
    expect(screen.getByText('Mittelerde · Band 2')).toBeInTheDocument();
    expect(screen.getByText('Schon erschienen')).toBeInTheDocument();
  });

  it('sortiert beide Medien nach der längsten Pause', () => {
    state.books = [book()];
    state.manga = [manga({ lastReadAt: '2026-01-01T00:00:00Z' })];
    render(<ReadingCatchUpPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Am längsten nicht gelesen' }));
    expect(titles()).toEqual(['Berserk', 'Der Hobbit']);
    fireEvent.click(screen.getByRole('button', { name: 'Fortschritt' }));
    expect(titles()).toEqual(['Der Hobbit', 'Berserk']);
  });

  it('öffnet Buch, Manga und nächsten Band', () => {
    state.books = [book()];
    state.manga = [manga()];
    state.volumes = [volume];
    render(<ReadingCatchUpPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Der Hobbit öffnen' }));
    expect(navigate).toHaveBeenCalledWith('/books/b1');
    fireEvent.click(screen.getByRole('button', { name: 'Berserk öffnen' }));
    expect(navigate).toHaveBeenCalledWith('/manga/7');
    fireEvent.click(screen.getByRole('button', { name: 'Die Gefährten öffnen' }));
    expect(openByTitle).toHaveBeenCalledWith('Die Gefährten', 'Tolkien');
  });

  it('zeigt bei nur Büchern keine Manga und keine Kapitel', () => {
    state.areas = 'books';
    state.books = [book()];
    state.manga = [manga()];
    render(<ReadingCatchUpPage />);
    expect(titles()).toEqual(['Der Hobbit']);
    expect(stats()).not.toContain('Kapitel offen: 50');
    expect(stats().some((s) => s?.startsWith('Kapitel offen'))).toBe(false);
  });

  it('gruppiert beide Medien in der Reihenfolge der Sortierung', () => {
    state.books = [book()];
    state.manga = [manga({ lastReadAt: '2026-01-01T00:00:00Z' })];
    state.volumes = [volume];
    render(<ReadingCatchUpPage />);
    const headings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings()).toEqual(['Bücher', 'Manga']);
    expect(titles()).toEqual(['Der Hobbit', 'Die Gefährten', 'Berserk']);
    fireEvent.click(screen.getByRole('button', { name: 'Am längsten nicht gelesen' }));
    expect(headings()).toEqual(['Manga', 'Bücher']);
    expect(titles()).toEqual(['Berserk', 'Der Hobbit', 'Die Gefährten']);
  });

  it('filtert nach Medium und zieht Kacheln und Untertitel mit', () => {
    state.books = [book()];
    state.manga = [manga()];
    state.volumes = [volume];
    render(<ReadingCatchUpPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Manga' }));
    expect(titles()).toEqual(['Berserk']);
    expect(stats()).toEqual(['Titel offen: 1', 'Kapitel offen: 50', 'Ø Fortschritt: 50%']);
    expect(screen.getByText('1 Manga · 50 Kapitel offen')).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Bücher' }));
    expect(titles()).toEqual(['Der Hobbit', 'Die Gefährten']);
    expect(stats()).toEqual(['Titel offen: 2', 'Seiten offen: 300', 'Ø Fortschritt: 25%']);
    expect(screen.getByText('2 Titel · 300 Seiten offen')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Alle' }));
    expect(titles()).toEqual(['Der Hobbit', 'Die Gefährten', 'Berserk']);
    expect(stats()).toHaveLength(4);
  });

  it('bietet den Medium-Filter nur an, wenn beide Medien offen sind', () => {
    state.manga = [manga()];
    render(<ReadingCatchUpPage />);
    expect(screen.queryByRole('button', { name: 'Alle' })).toBeNull();
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });

  it('feiert, wenn alles aufgeholt ist', () => {
    state.areas = 'manga';
    state.manga = [manga({ currentChapter: 100 })];
    render(<ReadingCatchUpPage />);
    expect(screen.getByText('Alles aufgeholt!')).toBeInTheDocument();
    expect(
      screen.getByText('Du bist bei allen Manga auf dem aktuellen Stand.')
    ).toBeInTheDocument();
  });
});
