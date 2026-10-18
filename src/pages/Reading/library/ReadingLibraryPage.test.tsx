// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReadingAreas } from '../../../lib/reading/readingMedium';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { ReadingLibraryPage } from './ReadingLibraryPage';

const state = vi.hoisted(() => ({
  books: [] as Book[],
  hiddenBooks: [] as Book[],
  manga: [] as Manga[],
  hiddenManga: [] as Manga[],
  areas: 'both' as ReadingAreas,
  params: new URLSearchParams(),
}));

const toggleHideManga = vi.hoisted(() => vi.fn());
const toggleHidden = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock('../../../contexts/BooksListContext', () => ({
  useBooksList: () => ({
    bookList: state.books,
    hiddenBookList: state.hiddenBooks,
    loading: false,
  }),
}));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({
    mangaList: state.manga,
    hiddenMangaList: state.hiddenManga,
    loading: false,
    toggleHideManga,
  }),
}));
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
vi.mock('../../../hooks/ui/useReadingAreas', () => ({ useReadingAreas: () => state.areas }));
vi.mock('../../Books/hooks/useBookActions', () => ({
  useBookActions: () => ({ toggleHidden }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useSearchParams: () => [
    state.params,
    (next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => {
      state.params = typeof next === 'function' ? next(state.params) : next;
    },
  ],
}));
vi.mock('@mui/icons-material', () =>
  Object.fromEntries(
    [
      'ArrowDownward',
      'ArrowUpward',
      'AutoStories',
      'CheckCircle',
      'Close',
      'GridView',
      'LocalLibrary',
      'Search',
      'Sort',
      'Star',
      'Visibility',
    ].map((n) => [n, () => null])
  )
);
vi.mock('../../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <main>{children}</main>,
  PageHeader: ({
    title,
    subtitle,
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
  }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {actions}
    </header>
  ),
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));
vi.mock('../../../components/ui/feedback/LoadingSpinner', () => ({
  LoadingSpinner: ({ text }: { text?: ReactNode }) => <div>{text}</div>,
}));
vi.mock('../../Books/components/BookCover', () => ({ BookCover: () => null }));
vi.mock('../../Books/components/Bookshelf', () => ({
  Bookshelf: ({ books, hrefFor }: { books: Book[]; hrefFor: (b: Book) => string }) => (
    <ul data-testid="shelf">
      {books.map((b) => (
        <li key={b.id} data-href={hrefFor(b)}>
          {b.title}
        </li>
      ))}
    </ul>
  ),
}));

const book = (over: Partial<Book>): Book => ({
  id: over.title ?? 'b',
  title: 'Buch',
  authors: ['Autorin'],
  status: 'reading',
  currentPage: 10,
  pageCount: 200,
  addedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const manga = (over: Partial<Manga>): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Manga',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 10,
  chapters: 100,
  readStatus: 'reading',
  ...over,
});

const renderPage = () => render(<ReadingLibraryPage />);
const rerender = (view: ReturnType<typeof render>) => view.rerender(<ReadingLibraryPage />);
const shelfTitles = () =>
  within(screen.getByTestId('shelf'))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

afterEach(() => {
  cleanup();
  state.books = [];
  state.hiddenBooks = [];
  state.manga = [];
  state.hiddenManga = [];
  state.areas = 'both';
  state.params = new URLSearchParams();
  localStorage.clear();
  navigate.mockReset();
  toggleHidden.mockReset();
  toggleHideManga.mockReset();
});

describe('ReadingLibraryPage', () => {
  it('zeigt ohne Einträge den Leerzustand', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Deine Bibliothek' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Leg dein erstes Buch oder deinen ersten Manga an – hier siehst du dann deinen Lesestand.'
      )
    ).toBeInTheDocument();
  });

  it('stellt Bücher und Manga zusammen ins Regal, Manga zeigen auf den Manga', () => {
    state.books = [book({ title: 'Dune' })];
    state.manga = [manga({ anilistId: 7, title: 'Berserk' })];
    renderPage();
    expect(screen.getByText('2 Titel')).toBeInTheDocument();
    expect(shelfTitles().sort()).toEqual(['Berserk', 'Dune']);
    const berserk = screen.getByText('Berserk');
    expect(berserk.getAttribute('data-href')).toBe('/manga/7');
    expect(screen.getByRole('button', { name: 'Bücher' })).toBeInTheDocument();
  });

  it('zeigt bei nur Büchern keine Manga und keinen Medium-Filter', () => {
    state.areas = 'books';
    state.books = [book({ title: 'Dune' })];
    state.manga = [manga({ title: 'Berserk' })];
    renderPage();
    expect(shelfTitles()).toEqual(['Dune']);
    expect(screen.queryByRole('button', { name: 'Bücher' })).not.toBeInTheDocument();
  });

  it('filtert über Status-Chips und blendet leere Chips aus', () => {
    state.books = [
      book({ title: 'Dune', status: 'completed', completedAt: '2025-03-01' }),
      book({ title: 'Emma', status: 'reading' }),
    ];
    state.manga = [manga({ title: 'Berserk', readStatus: 'reading' })];
    const view = renderPage();
    const tabs = screen.getByRole('tablist');
    expect(within(tabs).queryByText('Abgebrochen')).not.toBeInTheDocument();
    fireEvent.click(within(tabs).getByText('Beendet'));
    expect(state.params.get('status')).toBe('completed');
    rerender(view);
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(shelfTitles()).toEqual(['Dune']);
  });

  it('übernimmt Status und Medium aus alten Links', () => {
    state.params = new URLSearchParams('status=reading&medium=manga');
    state.books = [book({ title: 'Emma' })];
    state.manga = [
      manga({ title: 'Berserk' }),
      manga({ anilistId: 2, title: 'Vagabond', readStatus: 'planned' }),
    ];
    renderPage();
    expect(shelfTitles()).toEqual(['Berserk']);
  });

  it('sucht über Titel und Autor', () => {
    state.books = [book({ title: 'Dune', authors: ['Frank Herbert'] }), book({ title: 'Emma' })];
    state.manga = [manga({ title: 'Berserk' })];
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('In der Bibliothek suchen'), {
      target: { value: 'herbert' },
    });
    expect(shelfTitles()).toEqual(['Dune']);
    expect(screen.getByText('1 Titel')).toBeInTheDocument();
  });

  it('wechselt ins Raster und merkt sich die Ansicht', () => {
    state.books = [book({ title: 'Dune' })];
    state.manga = [manga({ title: 'Berserk' })];
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Rasteransicht' }));
    expect(screen.queryByTestId('shelf')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Berserk' })).toBeInTheDocument();
    expect(screen.getByText('Kap. 10 / 100')).toBeInTheDocument();
    expect(screen.getByText('S. 10 / 200')).toBeInTheDocument();
    expect(localStorage.getItem('readingLibraryView')).toBe('grid');
  });

  it('übernimmt die alte Ansicht und Sortierung des Bücherregals', () => {
    localStorage.setItem('bookShelfView', 'grid');
    localStorage.setItem('bookShelfSort', 'title:0');
    state.books = [book({ title: 'Zorro' }), book({ title: 'Anna' })];
    renderPage();
    const cards = screen.getAllByRole('button', { name: /^(Anna|Zorro)$/ });
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual(['Anna', 'Zorro']);
    expect(localStorage.getItem('readingLibrarySort')).toBe('title:0');
  });

  it('blendet Versteckte über die Aktion wieder ein', () => {
    state.params = new URLSearchParams('status=hidden');
    state.books = [book({ title: 'Emma' })];
    state.hiddenBooks = [book({ title: 'Dune', hidden: true })];
    state.hiddenManga = [manga({ anilistId: 9, title: 'Berserk', hidden: true })];
    renderPage();
    expect(screen.queryByText('Emma')).not.toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Einblenden' });
    expect(buttons).toHaveLength(2);
    for (const b of buttons) fireEvent.click(b);
    expect(toggleHidden).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dune' }));
    expect(toggleHideManga).toHaveBeenCalledWith(9, false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('zeigt Seite für Seite mehr an', () => {
    state.books = Array.from({ length: 50 }, (_, i) => book({ title: `Buch ${i + 1}` }));
    renderPage();
    expect(shelfTitles()).toHaveLength(45);
    fireEvent.click(screen.getByRole('button', { name: /Mehr anzeigen/ }));
    expect(shelfTitles()).toHaveLength(50);
  });
});
