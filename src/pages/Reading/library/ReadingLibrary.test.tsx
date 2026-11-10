// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLibrary } from '../../../lib/reading/library';
import type { ReadingAreas } from '../../../lib/reading/readingMedium';
import { usesArea } from '../../../lib/reading/readingMedium';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { ReadingLibrary } from './ReadingLibrary';

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
const bulk = vi.hoisted(() => ({
  busy: false,
  setStatus: vi.fn(async () => true),
  setOwned: vi.fn(async () => true),
  setHidden: vi.fn(async () => true),
}));

vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ toggleHideManga }),
}));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
      background: { default: '#000', dialog: '#111' },
      status: { success: '#0f0', warning: '#ff0' },
      border: { default: '#333' },
    },
  }),
}));
vi.mock('../../../hooks/ui/useReadingAreas', () => ({ useReadingAreas: () => state.areas }));
vi.mock('../../../hooks/ui/useDrawInProgress', () => ({ useDrawInProgress: () => {} }));
vi.mock('../../Books/hooks/useBookActions', () => ({
  useBookActions: () => ({ toggleHidden }),
}));
vi.mock('./useLibraryBulk', () => ({ useLibraryBulk: () => bulk }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useSearchParams: () => [
    state.params,
    (next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => {
      state.params = typeof next === 'function' ? next(state.params) : next;
    },
  ],
}));
vi.mock('../../../components/ui', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children?: ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));
vi.mock('../../../components/ui/selection/ChoiceSheet', () => ({ ChoiceSheet: () => null }));
vi.mock('../../Books/components/BookCover', () => ({ BookCover: () => null }));
vi.mock('../../Books/components/Bookshelf', () => ({
  Bookshelf: ({
    books,
    hrefFor,
    selection,
  }: {
    books: Book[];
    hrefFor: (b: Book) => string;
    selection?: unknown;
  }) => (
    <ul data-testid="shelf" data-selecting={selection ? 'true' : undefined}>
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

const Harness = ({ search = '' }: { search?: string }) => (
  <ReadingLibrary
    search={search}
    items={buildLibrary({
      books: state.books,
      hiddenBooks: state.hiddenBooks,
      manga: state.manga,
      hiddenManga: state.hiddenManga,
      showBooks: usesArea(state.areas, 'books'),
      showManga: usesArea(state.areas, 'manga'),
      uid: 'u1',
    })}
  />
);

const renderTab = (search?: string) => render(<Harness search={search} />);
const rerender = (view: ReturnType<typeof render>) => view.rerender(<Harness />);
const shelfTitles = () =>
  within(screen.getByTestId('shelf'))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);
const openFilters = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Filter & Sortierung' }));

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
  bulk.setOwned.mockClear();
});

describe('ReadingLibrary', () => {
  it('zeigt ohne Einträge einen Hinweis', () => {
    renderTab();
    expect(
      screen.getByText(
        'Leg dein erstes Buch oder deinen ersten Manga an – hier siehst du dann deinen Lesestand.'
      )
    ).toBeInTheDocument();
  });

  it('stellt Bücher und Manga zusammen ins Regal, Manga zeigen auf den Manga', () => {
    state.books = [book({ title: 'Dune' })];
    state.manga = [manga({ anilistId: 7, title: 'Berserk' })];
    renderTab();
    expect(shelfTitles().sort()).toEqual(['Berserk', 'Dune']);
    expect(screen.getByText('Berserk').getAttribute('data-href')).toBe('/manga/7');
    openFilters();
    expect(screen.getByRole('button', { name: 'Bücher' })).toBeInTheDocument();
  });

  it('zeigt bei nur Büchern keine Manga und keinen Medium-Filter', () => {
    state.areas = 'books';
    state.books = [book({ title: 'Dune' })];
    state.manga = [manga({ title: 'Berserk' })];
    renderTab();
    expect(shelfTitles()).toEqual(['Dune']);
    openFilters();
    expect(screen.queryByRole('button', { name: 'Bücher' })).not.toBeInTheDocument();
  });

  it('filtert über den Filter-Knopf und blendet leere Status aus', () => {
    state.books = [
      book({ title: 'Dune', status: 'completed', completedAt: '2025-03-01' }),
      book({ title: 'Emma', status: 'reading' }),
    ];
    state.manga = [manga({ title: 'Berserk', readStatus: 'reading' })];
    const view = renderTab();
    openFilters();
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).queryByText('Abgebrochen')).not.toBeInTheDocument();
    fireEvent.click(within(sheet).getByText('Beendet'));
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
    renderTab();
    expect(shelfTitles()).toEqual(['Berserk']);
  });

  it('sucht über Titel und Autor aus dem Seitenkopf', () => {
    state.books = [book({ title: 'Dune', authors: ['Frank Herbert'] }), book({ title: 'Emma' })];
    state.manga = [manga({ title: 'Berserk' })];
    renderTab('herbert');
    expect(shelfTitles()).toEqual(['Dune']);
    expect(screen.getByText('1 Titel')).toBeInTheDocument();
  });

  it('wechselt ins Raster und merkt sich die Ansicht', () => {
    state.books = [book({ title: 'Dune' })];
    state.manga = [manga({ title: 'Berserk' })];
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Rasteransicht' }));
    expect(screen.queryByTestId('shelf')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Berserk' })).toBeInTheDocument();
    expect(localStorage.getItem('readingLibraryView')).toBe('grid');
  });

  it('übernimmt die alte Ansicht und Sortierung des Bücherregals', () => {
    localStorage.setItem('bookShelfView', 'grid');
    localStorage.setItem('bookShelfSort', 'title:0');
    state.books = [book({ title: 'Zorro' }), book({ title: 'Anna' })];
    renderTab();
    const cards = screen.getAllByRole('button', { name: /^(Anna|Zorro)$/ });
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual(['Anna', 'Zorro']);
    expect(localStorage.getItem('readingLibrarySort')).toBe('title:0');
  });

  it('blendet Versteckte über die Aktion wieder ein', () => {
    state.params = new URLSearchParams('status=hidden');
    state.books = [book({ title: 'Emma' })];
    state.hiddenBooks = [book({ title: 'Dune', hidden: true })];
    state.hiddenManga = [manga({ anilistId: 9, title: 'Berserk', hidden: true })];
    renderTab();
    expect(screen.queryByText('Emma')).not.toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Einblenden' });
    expect(buttons).toHaveLength(2);
    for (const b of buttons) fireEvent.click(b);
    expect(toggleHidden).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dune' }));
    expect(toggleHideManga).toHaveBeenCalledWith(9, false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('zeigt Seite für Seite mehr an', () => {
    state.books = Array.from({ length: 70 }, (_, i) => book({ title: `Buch ${i + 1}` }));
    renderTab();
    expect(shelfTitles()).toHaveLength(60);
    fireEvent.click(screen.getByRole('button', { name: /Mehr anzeigen/ }));
    expect(shelfTitles()).toHaveLength(70);
  });

  it('wählt im Auswahlmodus alle gefilterten Titel aus und markiert sie als Besitz', async () => {
    localStorage.setItem('readingLibraryView', 'grid');
    state.books = [book({ title: 'Dune' }), book({ title: 'Hyperion' }), book({ title: 'Emma' })];
    renderTab('e');
    fireEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    expect(screen.getByText('Titel antippen zum Auswählen')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Alle$/ }));
    const titles = ['Dune', 'Hyperion', 'Emma'].filter((title) =>
      screen.queryByRole('checkbox', { name: title, checked: true })
    );
    expect(titles.length).toBeGreaterThan(0);
    expect(
      screen.getByText(`${titles.length} von ${titles.length} ausgewählt`)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Im Besitz' }));
    await Promise.resolve();
    const [items, owned] = bulk.setOwned.mock.calls[0] as unknown as [{ title: string }[], boolean];
    expect(items.map((i) => i.title).sort()).toEqual(titles.sort());
    expect(owned).toBe(true);
  });

  it('tippt im Auswahlmodus einzelne Karten an, statt sie zu öffnen', () => {
    localStorage.setItem('readingLibraryView', 'grid');
    state.books = [book({ title: 'Dune' }), book({ title: 'Emma' })];
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Dune' }));
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'Dune' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('1 von 2 ausgewählt')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Auswahl beenden' })[0]);
    expect(screen.queryByText('1 von 2 ausgewählt')).not.toBeInTheDocument();
  });

  it('wählt im Regal aus, ohne ins Raster zu wechseln', () => {
    state.books = [book({ title: 'Dune' }), book({ title: 'Emma' })];
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    expect(screen.getByTestId('shelf')).toBeInTheDocument();
    expect(screen.getByTestId('shelf')).toHaveAttribute('data-selecting', 'true');
  });
});
