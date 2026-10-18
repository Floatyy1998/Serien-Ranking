// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReadingAreas } from '../../../lib/reading/readingMedium';
import type { BookSearchResult } from '../../../types/Book';
import type { AniListMangaSearchResult } from '../../../types/Manga';
import { ReadingDiscoverPage } from './ReadingDiscoverPage';

const state = vi.hoisted(() => ({
  books: 1,
  manga: 1,
  areas: 'both' as ReadingAreas,
  params: new URLSearchParams(),
  shelves: [] as { id: string; sort?: string }[][],
  bookResults: [] as BookSearchResult[],
}));

const discoverManga = vi.hoisted(() => vi.fn());
const addManga = vi.hoisted(() => vi.fn());
const openAdd = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock('../../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: Array.from({ length: state.books }), loading: false }),
}));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({
    mangaList: Array.from({ length: state.manga }, (_, i) => ({ anilistId: 1000 + i })),
    hiddenMangaList: [],
    loading: false,
  }),
}));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
      status: { warning: '#f59e0b' },
    },
  }),
}));
vi.mock('../../../hooks/ui/useReadingAreas', () => ({ useReadingAreas: () => state.areas }));
vi.mock('../../../hooks/platform/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: true }),
}));
vi.mock('../../../hooks/books/useBookShelf', () => ({
  useBookShelves: (requests: { id: string; sort?: string }[]) => {
    state.shelves.push(requests);
    return {
      ref: { current: null },
      lists: requests.map((_, i) => (i === 0 ? state.bookResults : [])),
      loading: false,
      error: false,
    };
  },
  useShelfMore: () => ({
    sentinelRef: { current: null },
    items: [],
    loadingMore: false,
    exhausted: true,
  }),
}));
vi.mock('../../../hooks/books/useOwnedBooks', () => ({
  useOwnedBooks: () => () => undefined,
  useMangaForBook: () => () => undefined,
}));
vi.mock('../../../services/api/anilistService', () => ({ discoverManga }));
vi.mock('../../Books/hooks/useBookYear', () => ({
  useBookYear: () => ({ now: 0, year: 2026, yearStats: {} }),
}));
vi.mock('../../Books/useBookSections', () => ({
  useBookSections: () => ({
    genres: {
      picked: [],
      favorite: [],
      caption: undefined,
      shelves: ['fantasy', 'biography'],
      edit: vi.fn(),
    },
    dedupe: null,
    sheets: null,
  }),
}));
vi.mock('../../Books/discover/useAddFlow', () => ({
  useAddFlow: () => ({ openAdd, sheet: null }),
}));
vi.mock('../../Manga/useAddManga', () => ({
  useAddManga: () => ({ add: addManga, addingId: null }),
}));
vi.mock('../../Books/discover/DiscoverParts', () => ({
  useOpenResult: () => vi.fn(),
  GenreTiles: ({ only }: { only?: string[] }) => (
    <div data-testid="block">{`genre-tiles:${only ? 'manga' : 'all'}`}</div>
  ),
}));
type Area = { showBooks: boolean; showManga: boolean };
const area = ({ showBooks, showManga }: Area) => `${showBooks ? 'b' : ''}${showManga ? 'm' : ''}`;
vi.mock('./MixedDiscover', () => ({
  NewMixedRow: (p: Area) => <div data-testid="block">{`new:${area(p)}`}</div>,
  ForYouMixedRow: (p: Area) => <div data-testid="block">{`for-you:${area(p)}`}</div>,
  GenreMixedRow: (p: Area & { id: string }) => (
    <div data-testid="block">{`genre-${p.id}:${area(p)}`}</div>
  ),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useSearchParams: () => [
    state.params,
    (next: Record<string, string>) => {
      state.params = new URLSearchParams(next);
    },
  ],
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileTap: _whileTap,
      ...rest
    }: {
      children?: ReactNode;
      whileTap?: unknown;
      [key: string]: unknown;
    }) => <div {...rest}>{children}</div>,
  },
}));
vi.mock('@mui/icons-material', () =>
  Object.fromEntries(
    ['AutoStories', 'CheckCircle', 'NewReleases', 'Search', 'Star', 'TrendingUp', 'Whatshot'].map(
      (n) => [n, () => null]
    )
  )
);
vi.mock('../../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <main>{children}</main>,
  PageHeader: ({ title, actions }: { title: string; actions?: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
  SectionHeader: ({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => (
    <h2>
      {title}
      {onSeeAll && (
        <button type="button" onClick={onSeeAll}>
          Alle Charts
        </button>
      )}
    </h2>
  ),
  ScrollToTopButton: () => null,
  EmptyState: ({ title }: { title: string }) => <p>{title}</p>,
}));
vi.mock('../../../components/ui/feedback/LoadingSpinner', () => ({
  LoadingSpinner: ({ text }: { text?: ReactNode }) => <div>{text}</div>,
}));

const mangaResult = (over: Partial<AniListMangaSearchResult> = {}): AniListMangaSearchResult => ({
  id: 1,
  title: { romaji: 'Bleach', english: 'Bleach EN', native: null },
  coverImage: { large: 'c.jpg', medium: 'c-s.jpg' },
  bannerImage: null,
  description: null,
  chapters: 686,
  volumes: 74,
  status: 'FINISHED',
  format: 'MANGA',
  countryOfOrigin: 'JP',
  genres: ['Action'],
  averageScore: 78,
  startDate: { year: 2001, month: null, day: null },
  isAdult: false,
  ...over,
});

const bookResult = (over: Partial<BookSearchResult> = {}): BookSearchResult => ({
  id: 'ol-1',
  title: 'Dune',
  authors: ['Frank Herbert'],
  cover: 'https://covers.openlibrary.org/b/id/1-M.jpg',
  source: 'openlibrary',
  ...over,
});

const lastShelves = () => state.shelves[state.shelves.length - 1];

const blocks = () =>
  [...document.querySelectorAll('[data-testid="block"]')].map((b) => b.textContent);

const cardTitles = () =>
  [...document.querySelectorAll('.rdc-grid .mpc-title')].map((el) => el.textContent);

beforeEach(() => {
  discoverManga.mockResolvedValue({
    results: [
      mangaResult(),
      mangaResult({ id: 2, title: { romaji: 'Naruto', english: null, native: null } }),
    ],
    hasNextPage: false,
  });
  state.bookResults = [
    bookResult(),
    bookResult({ id: 'ol-2', title: 'Emma', authors: ['Jane Austen'] }),
  ];
});

afterEach(() => {
  cleanup();
  state.books = 1;
  state.manga = 1;
  state.areas = 'both';
  state.params = new URLSearchParams();
  state.shelves = [];
  discoverManga.mockReset();
  addManga.mockReset();
  openAdd.mockReset();
  navigate.mockReset();
});

describe('ReadingDiscoverPage', () => {
  it('mischt Bücher und Manga in den Charts', async () => {
    render(<ReadingDiscoverPage />);
    await waitFor(() => expect(cardTitles()).toEqual(['Dune', 'Bleach EN', 'Emma', 'Naruto']));
    expect(discoverManga).toHaveBeenCalledWith('trending', 1, 30, 'all');
    expect(lastShelves()).toEqual([{ id: 'new', sort: 'popular', limit: 80 }]);
    expect(screen.getByRole('tab', { name: 'Bald' })).toBeInTheDocument();
  });

  it('zeigt darunter die gemischten Reihen', () => {
    render(<ReadingDiscoverPage />);
    expect(blocks()).toEqual([
      'new:bm',
      'for-you:bm',
      'genre-tiles:all',
      'genre-fantasy:bm',
      'genre-biography:bm',
    ]);
  });

  it('schlägt ohne eigene Manga keine Manga vor', () => {
    state.manga = 0;
    render(<ReadingDiscoverPage />);
    expect(discoverManga).not.toHaveBeenCalled();
    expect(screen.queryByRole('tab', { name: 'Bald' })).not.toBeInTheDocument();
    expect(blocks()).toContain('new:b');
  });

  it('schlägt ohne eigene Bücher keine Bücher vor', async () => {
    state.books = 0;
    render(<ReadingDiscoverPage />);
    await waitFor(() => expect(cardTitles()).toEqual(['Bleach EN', 'Naruto']));
    expect(blocks()).toContain('genre-tiles:manga');
    expect(blocks()).not.toContain('genre-biography:m');
  });

  it('wechselt die Kategorie und nimmt beliebte Bücher mehrerer Genres', async () => {
    render(<ReadingDiscoverPage />);
    await waitFor(() => expect(discoverManga).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('tab', { name: 'Beliebt' }));
    await waitFor(() => expect(discoverManga).toHaveBeenCalledWith('popular', 1, 30, 'all'));
    const last: { id: string; sort?: string }[] = lastShelves() ?? [];
    expect(last.length).toBeGreaterThan(1);
    expect(last.every((r) => r.sort === 'popular')).toBe(true);
  });

  it('filtert die Charts auf Bücher oder ein Manga-Land', async () => {
    render(<ReadingDiscoverPage />);
    await waitFor(() => expect(cardTitles()).toHaveLength(4));
    fireEvent.click(screen.getByRole('button', { name: 'Bücher' }));
    await waitFor(() => expect(cardTitles()).toEqual(['Dune', 'Emma']));
    fireEvent.click(screen.getByRole('button', { name: 'Manhwa' }));
    await waitFor(() => expect(discoverManga).toHaveBeenCalledWith('trending', 1, 30, 'KR'));
    expect(lastShelves()).toEqual([]);
  });

  it('öffnet die ganze Kategorie aus alten Links ohne die Reihen', async () => {
    state.params = new URLSearchParams('category=top_rated');
    render(<ReadingDiscoverPage />);
    await waitFor(() => expect(discoverManga).toHaveBeenCalledWith('top_rated', 1, 30, 'all'));
    expect(blocks()).toEqual([]);
  });

  it('springt aus der Vorschau in die ganze Liste', async () => {
    render(<ReadingDiscoverPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Alle Charts' }));
    expect(state.params.get('category')).toBe('trending');
  });

  it('fügt Manga und Bücher direkt aus den Charts hinzu', async () => {
    render(<ReadingDiscoverPage />);
    await waitFor(() => expect(cardTitles()).toHaveLength(4));
    fireEvent.click(screen.getByRole('button', { name: 'Bleach EN zur Sammlung hinzufügen' }));
    expect(addManga).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Buch hinzufügen' })[0]);
    expect(openAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'ol-1' }));
  });
});
