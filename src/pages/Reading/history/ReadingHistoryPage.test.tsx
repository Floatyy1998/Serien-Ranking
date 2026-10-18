// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { ReadingHistoryPage } from './ReadingHistoryPage';

const state = vi.hoisted(() => ({
  books: [] as Book[],
  manga: [] as Manga[],
  bookEvents: [] as unknown[],
  mangaEvents: [] as unknown[],
  areas: 'both' as 'both' | 'books' | 'manga',
  years: [] as number[][],
}));

vi.mock('../../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: state.books, allBookList: state.books, loading: false }),
}));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: state.manga, hiddenMangaList: [] }),
}));
vi.mock('../../../hooks/books/useBookEvents', () => ({
  useBookEvents: (years: number[]) => {
    state.years.push(years);
    return { events: state.bookEvents, loading: false };
  },
}));
vi.mock('../../../hooks/manga/useMangaReadEvents', () => ({
  useMangaReadEvents: () => ({ events: state.mangaEvents, loading: false }),
}));
vi.mock('../../../hooks/ui/useReadingAreas', () => ({ useReadingAreas: () => state.areas }));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
      status: { success: '#0f0', info: { main: '#0af' } },
      background: { default: '#000', surface: '#111', card: '#222' },
      border: { default: '#333' },
    },
  }),
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../../services/api/anilistService', () => ({
  getMangaCovers: async () => ({}),
}));
vi.mock('../../RecentlyWatched/RecentlyWatchedComponents', () => ({
  TimeRangeChips: ({
    timeRanges,
    onTimeRangeChange,
  }: {
    timeRanges: { days: number; label: string }[];
    onTimeRangeChange: (days: number) => void;
  }) => (
    <div>
      {timeRanges.map((r) => (
        <button key={r.days} type="button" onClick={() => onTimeRangeChange(r.days)}>
          {r.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'layout']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
});
vi.mock('../../../components/ui/feedback/EmptyState', () => ({
  EmptyState: ({ title }: { title?: ReactNode }) => <div>{title}</div>,
}));

vi.mock('../../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, subtitle }: { title?: ReactNode; subtitle?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <span>{subtitle}</span>
    </div>
  ),
  ScrollToTopButton: () => null,
  SkeletonListRow: () => null,
}));

const ts = () => Math.floor(Date.now() / 1000) - 60;

afterEach(() => {
  cleanup();
  state.books = [];
  state.manga = [];
  state.bookEvents = [];
  state.mangaEvents = [];
  state.areas = 'both';
  state.years = [];
  navigate.mockReset();
});

describe('ReadingHistoryPage', () => {
  it('zeigt den Leerzustand ohne Lese-Verlauf', () => {
    render(<ReadingHistoryPage />);
    expect(screen.getByText('Kein Lese-Verlauf')).toBeInTheDocument();
  });

  it('mischt Buch-Seiten und Manga-Kapitel am selben Tag', () => {
    const now = ts();
    state.books = [
      {
        id: 'b1',
        title: 'Der Name des Windes',
        authors: [],
        status: 'reading',
        currentPage: 150,
        pageCount: 400,
        addedAt: '2026-01-01',
      },
    ];
    state.manga = [
      {
        nmr: 1,
        anilistId: 9,
        title: 'Solo Leveling',
        poster: '',
        rating: {},
        currentChapter: 75,
        chapters: 200,
        readStatus: 'reading',
      } as Manga,
    ];
    state.bookEvents = [
      { ts: now - 30, t: 'pg', s: 'b1', st: 'Der Name des Windes', p0: 120, p: 150, n: 30 },
    ];
    state.mangaEvents = [
      { ts: now, t: 'ch', s: 9, st: 'Solo Leveling', ch: 74 },
      { ts: now, t: 'ch', s: 9, st: 'Solo Leveling', ch: 75 },
    ];
    render(<ReadingHistoryPage />);
    expect(screen.getByRole('heading', { name: 'Verlauf' })).toBeInTheDocument();
    expect(screen.getByText('Heute')).toBeInTheDocument();
    expect(screen.getByText('S. 120–150 (+30)')).toBeInTheDocument();
    expect(screen.getByText('Kap. 74–75')).toBeInTheDocument();
    expect(screen.getByText('30 S.')).toBeInTheDocument();
    expect(screen.getByText('2 Kap.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Der Name des Windes'));
    expect(navigate).toHaveBeenCalledWith('/books/b1');
    fireEvent.click(screen.getByText('Solo Leveling'));
    expect(navigate).toHaveBeenCalledWith('/manga/9');
  });

  it('filtert über die Suche nach Titel', () => {
    const now = ts();
    state.mangaEvents = [
      { ts: now, t: 'ch', s: 9, st: 'Frieren', ch: 10 },
      { ts: now, t: 'ch', s: 7, st: 'Dandadan', ch: 4 },
    ];
    render(<ReadingHistoryPage />);
    fireEvent.change(screen.getByLabelText('Buch oder Manga suchen'), {
      target: { value: 'fri' },
    });
    expect(screen.getByText('Frieren')).toBeInTheDocument();
    expect(screen.queryByText('Dandadan')).toBeNull();
  });

  it('zeigt beendete Bücher und lädt für reine Mangaleser keine Buch-Ereignisse', () => {
    state.bookEvents = [{ ts: ts(), t: 'fin', s: 'b2', st: 'Momo' }];
    render(<ReadingHistoryPage />);
    expect(screen.getAllByText('Beendet').length).toBeGreaterThan(0);
    cleanup();
    state.areas = 'manga';
    state.years = [];
    render(<ReadingHistoryPage />);
    expect(state.years.every((y) => y.length === 0)).toBe(true);
    expect(screen.queryByText('Momo')).toBeNull();
  });
});
