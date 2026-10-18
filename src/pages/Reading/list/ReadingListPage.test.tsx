// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { ReadingListPage } from './ReadingListPage';

const state = vi.hoisted(() => ({
  books: [] as Book[],
  manga: [] as Manga[],
  areas: 'both' as 'both' | 'books' | 'manga',
}));
const saveProgress = vi.hoisted(() => vi.fn());
const saveReadProgress = vi.hoisted(() => vi.fn());

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
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@mui/icons-material', () => ({ AutoStories: () => null, FilterList: () => null }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    header: ({ children }: { children?: ReactNode }) => <header>{children}</header>,
    div: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    button: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => (
      <button type="button" aria-label="Filter und Sortierung" onClick={onClick}>
        {children}
      </button>
    ),
  },
}));
vi.mock('../../Books/hooks/useBookActions', () => ({ useBookActions: () => ({ saveProgress }) }));
vi.mock('../../Manga/saveReadProgress', () => ({ saveReadProgress }));
vi.mock('../../Books/components/BookCover', () => ({ BookCover: () => null }));
vi.mock('../../../components/ui', () => ({
  BackButton: () => null,
  ScrollToTopButton: () => null,
  LoadingSpinner: ({ text }: { text?: string }) => <p>{text}</p>,
  PageLayout: ({ children }: { children?: ReactNode }) => <main>{children}</main>,
  GradientText: ({ children }: { children?: ReactNode }) => <h1>{children}</h1>,
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
  SwipeableEpisodeRow: ({
    itemKey,
    content,
    onComplete,
  }: {
    itemKey: string;
    content: ReactNode;
    onComplete: (dir: 'right') => void;
  }) => (
    <article data-testid="row" data-key={itemKey}>
      {content}
      <button type="button" onClick={() => onComplete('right')}>
        wischen {itemKey}
      </button>
    </article>
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
  lastReadAt: '2026-10-01T00:00:00Z',
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
  format: 'MANGA',
  lastReadAt: '2026-10-10T00:00:00Z',
  ...o,
});

const rows = () => screen.queryAllByTestId('row').map((r) => r.getAttribute('data-key'));

afterEach(() => {
  cleanup();
  state.books = [];
  state.manga = [];
  state.areas = 'both';
  saveProgress.mockReset();
  saveReadProgress.mockReset();
  localStorage.clear();
});

describe('ReadingListPage', () => {
  it('mischt Bücher und Manga mit Seiten- und Kapitelstand', () => {
    state.books = [book(), book({ id: 'b2', title: 'Momo', status: 'planned', currentPage: 0 })];
    state.manga = [manga()];
    render(<ReadingListPage />);
    expect(screen.getByText('3 Titel zum Lesen')).toBeInTheDocument();
    expect(rows()).toEqual(['m-7', 'b-b1', 'b-b2']);
    expect(screen.getByText(/S\. 100 \/ 400/)).toBeInTheDocument();
    expect(screen.getByText(/300 Seiten übrig/)).toBeInTheDocument();
    expect(screen.getByText('50 Kapitel übrig')).toBeInTheDocument();
    expect(screen.getByText('Geplant')).toBeInTheDocument();
  });

  it('blättert beim Wischen ein Buch 10 Seiten und einen Manga ein Kapitel weiter', () => {
    state.books = [book()];
    state.manga = [manga()];
    render(<ReadingListPage />);
    fireEvent.click(screen.getByText('wischen b-b1'));
    expect(saveProgress).toHaveBeenCalledWith(state.books[0], 110);
    fireEvent.click(screen.getByText('wischen m-7'));
    expect(saveReadProgress).toHaveBeenCalledWith('u1', state.manga[0], {
      next: 51,
      previous: 50,
      total: 100,
    });
  });

  it('zeigt bei nur Manga keine Bücher', () => {
    state.areas = 'manga';
    state.books = [book()];
    state.manga = [manga()];
    render(<ReadingListPage />);
    expect(rows()).toEqual(['m-7']);
    expect(screen.getByText('1 Manga zum Lesen')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Filter und Sortierung' }));
    expect(screen.queryByRole('button', { name: 'Bücher' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manhwa' })).toBeInTheDocument();
  });

  it('filtert über den Bücher-Chip, wenn beide Medien da sind', () => {
    state.books = [book()];
    state.manga = [manga()];
    render(<ReadingListPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Filter und Sortierung' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bücher' }));
    expect(rows()).toEqual(['b-b1']);
    expect(localStorage.getItem('readingListFormat')).toBe('books');
  });

  it('übernimmt die alte Sortierung der Manga-Leseliste', () => {
    localStorage.setItem('mangaReadingListSort', 'name-desc');
    state.books = [book()];
    state.manga = [manga()];
    render(<ReadingListPage />);
    expect(rows()).toEqual(['b-b1', 'm-7']);
    expect(localStorage.getItem('readingListSort')).toBe('name-desc');
  });

  it('erklärt die leere Leseliste passend zum Lesebereich', () => {
    state.areas = 'books';
    render(<ReadingListPage />);
    expect(screen.getByText('Keine Bücher zum Lesen')).toBeInTheDocument();
  });
});
