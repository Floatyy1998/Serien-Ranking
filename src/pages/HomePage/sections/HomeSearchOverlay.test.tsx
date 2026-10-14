// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HomeSearchOverlay } from './HomeSearchOverlay';

// Reaktiver Location-Store: HomeSearchOverlay ist memo(), ein reines rerender()
// mit gleichen Props wuerde ausbailen — der Store erzwingt das Re-Render selbst.
const { navigateMock, locationStore } = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let snapshot = { pathname: '/', key: 'home-1' };
  return {
    navigateMock: vi.fn(),
    locationStore: {
      get: () => snapshot,
      /** `key` wie im echten Router: Zurueck (POP) bringt denselben Key zurueck. */
      set: (pathname: string, key = pathname) => {
        snapshot = { pathname, key };
        listeners.forEach((l) => l());
      },
      subscribe: (l: () => void) => {
        listeners.add(l);
        return () => {
          listeners.delete(l);
        };
      },
    },
  };
});

vi.mock('react-router-dom', async () => {
  const React = await import('react');
  return {
    useNavigate: () => navigateMock,
    useLocation: () => React.useSyncExternalStore(locationStore.subscribe, locationStore.get),
  };
});
vi.mock('@mui/icons-material', () => ({
  Add: () => null,
  Check: () => null,
  ChevronRight: () => null,
  Close: () => null,
  Person: () => null,
  Search: () => null,
  Star: () => null,
  Visibility: () => null,
}));
vi.mock('../../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
// Konto + eigene Listen je Test umschaltbar (Poster-Aktionen brauchen einen Nutzer).
const state = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  series: [] as unknown[],
  movies: [] as unknown[],
}));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('../../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: state.series, refetchAfterAdd: vi.fn() }),
}));
vi.mock('../../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: state.movies }),
}));
vi.mock('../../../hooks/rating/useCommunityRatings', () => ({
  useCommunityRatingsMap: () => ({}),
  pickDisplayRating: () => null,
}));
vi.mock('../../../hooks/ui/useAndroidBack', () => ({ useAndroidBack: vi.fn() }));
vi.mock('../../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#fff' }));
vi.mock('../../../lib/motion', () => ({ tapScale: {} }));
const api = vi.hoisted(() => ({
  backendFetch: vi.fn<(...a: unknown[]) => Promise<{ ok: boolean }>>(),
}));
vi.mock('../../../services/api/backendApi', () => ({
  backendFetch: (...a: unknown[]) => api.backendFetch(...a),
}));
vi.mock('../../../services/firebase/analytics', () => ({
  trackMovieAdded: vi.fn(),
  trackSeriesAdded: vi.fn(),
  trackRatingSaved: vi.fn(),
}));
vi.mock('../../../features/badges/minimalActivityLogger', () => ({
  logMovieAdded: vi.fn(),
  logSeriesAdded: vi.fn(),
  logRatingAdded: vi.fn(),
}));
const quick = vi.hoisted(() => ({
  markMovieWatched: vi.fn<(...a: unknown[]) => Promise<void>>(async () => {}),
  saveQuickRating: vi.fn<(...a: unknown[]) => Promise<void>>(async () => {}),
}));
vi.mock('../../../services/rating/quickRating', () => ({
  markMovieWatched: (...a: unknown[]) => quick.markMovieWatched(...a),
  saveQuickRating: (...a: unknown[]) => quick.saveQuickRating(...a),
}));
vi.mock('../../../components/ui/overlay/QuickRatingSheet', () => ({
  QuickRatingSheet: (p: {
    isOpen: boolean;
    seriesTitle: string;
    eyebrow?: string;
    onRate: (rating: number) => void;
  }) =>
    p.isOpen ? (
      <div data-testid="quick-rating">
        <span>{p.eyebrow}</span>
        <span>{p.seriesTitle}</span>
        <button type="button" onClick={() => p.onRate(7)}>
          rate
        </button>
      </div>
    ) : null,
}));
vi.mock('../../../components/ui', () => ({
  Snackbar: (p: { open: boolean; message: string }) =>
    p.open ? <div role="status">{p.message}</div> : null,
}));
vi.mock('../../../services/i18n', () => ({ t: (s: string) => s }));
vi.mock('../../Books/components/BookQuickResults', () => ({
  BookQuickResults: (p: { variant: string; onAdded?: (found: 'books' | 'manga') => void }) => (
    <button type="button" onClick={() => p.onAdded?.('books')}>{`book-add-${p.variant}`}</button>
  ),
  BookOverlayIdle: () => <div data-testid="books-idle" />,
}));
vi.mock('../../Manga/components/MangaQuickResults', () => ({
  MangaQuickResults: (p: { variant: string; onAdded?: () => void }) => (
    <button type="button" data-testid={`manga-${p.variant}`} onClick={() => p.onAdded?.()}>
      {`manga-add-${p.variant}`}
    </button>
  ),
  MangaOverlayIdle: () => <div data-testid="manga-idle" />,
}));
vi.mock('../../../hooks/person/usePeopleSearch', () => ({
  usePopularPeople: () => [],
}));
const search = vi.hoisted(() => ({
  people: [] as Array<{ id: number; name: string; profilePath?: string; popularity: number }>,
  peopleFirst: false,
  query: 'breaking',
}));
vi.mock('./useHomeQuickSearch', () => ({
  useHomeQuickSearch: () => ({
    people: search.people,
    peopleFirst: search.peopleFirst,
    query: search.query,
    setQuery: vi.fn(),
    results: [
      { id: 1, type: 'series', title: 'Breaking Bad', year: '2008', poster_path: '/p.jpg' },
      { id: 2, type: 'movie', title: 'Heat', year: '1995', poster_path: '/h.jpg' },
    ],
    loading: false,
    popular: [],
    popularItems: [],
  }),
}));

const MOTION_ONLY = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'layout',
  'drag',
]);
const strip = (props: Record<string, unknown>): React.HTMLAttributes<HTMLDivElement> => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(props)) if (!MOTION_ONLY.has(k)) out[k] = props[k];
  return out as React.HTMLAttributes<HTMLDivElement>;
};
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => <div {...strip(props)} /> }
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

afterEach(() => {
  locationStore.set('/', 'home-1');
  navigateMock.mockClear();
  state.user = null;
  state.series = [];
  state.movies = [];
  api.backendFetch.mockReset();
  quick.markMovieWatched.mockClear();
  quick.saveQuickRating.mockClear();
  search.people = [];
  search.peopleFirst = false;
  search.query = 'breaking';
  localStorage.clear();
  cleanup();
});

const cardOf = (title: string) =>
  [...document.querySelectorAll('.hso__card')].find(
    (c) => c.querySelector('.hso__card-title')?.textContent === title
  ) as HTMLElement;

const overlay = (): HTMLElement | null => document.querySelector('.hso');

describe('HomeSearchOverlay Detail-Rückkehr', () => {
  it('parkt statt zu schließen, während eine Detailseite offen ist', () => {
    const onClose = vi.fn();
    render(<HomeSearchOverlay open onClose={onClose} />);
    expect(screen.getByText('Breaking Bad')).toBeTruthy();
    expect(overlay()?.style.display).toBe('');

    act(() => locationStore.set('/series/1', 'detail-1'));
    expect(onClose).not.toHaveBeenCalled();
    expect(overlay()?.style.display).toBe('none');
    expect(screen.getByText('Breaking Bad')).toBeTruthy();

    // Zurueck = POP auf denselben History-Eintrag.
    act(() => locationStore.set('/', 'home-1'));
    expect(overlay()?.style.display).toBe('');
    expect(screen.getByText('Breaking Bad')).toBeTruthy();
  });

  it('schließt bei jeder anderen Route', () => {
    const onClose = vi.fn();
    render(<HomeSearchOverlay open onClose={onClose} />);
    act(() => locationStore.set('/ratings', 'ratings-1'));
    expect(onClose).toHaveBeenCalled();
  });

  it('schließt beim Home-Button der Detailseite (neuer History-Eintrag)', () => {
    const onClose = vi.fn();
    render(<HomeSearchOverlay open onClose={onClose} />);
    act(() => locationStore.set('/series/1', 'detail-1'));
    expect(onClose).not.toHaveBeenCalled();

    // Home-Button pusht einen NEUEN Home-Eintrag statt zurueckzugehen.
    act(() => locationStore.set('/', 'home-2'));
    expect(onClose).toHaveBeenCalled();
    expect(overlay()?.style.display).toBe('none');
  });

  it('navigiert beim Treffer-Klick, ohne sich selbst zu schließen', () => {
    const onClose = vi.fn();
    render(<HomeSearchOverlay open onClose={onClose} />);
    act(() => {
      screen
        .getByText('Breaking Bad')
        .closest('.hso__card')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(navigateMock).toHaveBeenCalledWith('/series/1');
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('HomeSearchOverlay Poster-Aktionen', () => {
  it('zeigt den Gesehen-Button nur bei Filmen', () => {
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    expect(cardOf('Heat').querySelector('.hso__watched')).not.toBeNull();
    expect(cardOf('Breaking Bad').querySelector('.hso__watched')).toBeNull();
    expect(cardOf('Heat').querySelector('.hso__add')).not.toBeNull();
  });

  it('fügt den Film hinzu, markiert ihn als gesehen und öffnet die Schnellbewertung', async () => {
    state.user = { uid: 'u1' };
    api.backendFetch.mockResolvedValue({ ok: true });
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(cardOf('Heat').querySelector('.hso__watched') as HTMLElement);
    });
    expect(api.backendFetch).toHaveBeenCalledWith(
      '/addMovie',
      expect.objectContaining({ method: 'POST' })
    );
    expect(quick.markMovieWatched).toHaveBeenCalledWith('u1', 2);
    expect(navigateMock).not.toHaveBeenCalled();
    const sheet = screen.getByTestId('quick-rating');
    expect(sheet).toHaveTextContent('Als gesehen markiert');
    expect(sheet).toHaveTextContent('Heat');
    // Optimistisch: Auge weg, Bewerten-Button da.
    expect(cardOf('Heat').querySelector('.hso__watched')).toBeNull();
    expect(cardOf('Heat').querySelector('.hso__rate')).not.toBeNull();
  });

  it('meldet, wenn das Hinzufügen am Backend scheitert', async () => {
    state.user = { uid: 'u1' };
    api.backendFetch.mockResolvedValue({ ok: false });
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(cardOf('Breaking Bad').querySelector('.hso__add') as HTMLElement);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Fehler beim Hinzufügen der Serie.');
  });

  it('meldet, wenn der Titel schon in der Liste ist', async () => {
    state.user = { uid: 'u1' };
    api.backendFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Film bereits vorhanden' }),
    } as { ok: boolean });
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(cardOf('Heat').querySelector('.hso__add') as HTMLElement);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Film ist bereits in deiner Liste!');
  });

  it('markiert einen Film aus der Liste ohne Backend-Aufruf als gesehen', async () => {
    state.user = { uid: 'u1' };
    state.movies = [{ id: 2, title: 'Heat', rating: {}, genre: { genres: ['Krimi'] } }];
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(cardOf('Heat').querySelector('.hso__watched') as HTMLElement);
    });
    expect(api.backendFetch).not.toHaveBeenCalled();
    expect(quick.markMovieWatched).toHaveBeenCalledWith('u1', 2);
  });

  it('zeigt bei Titeln aus der Liste die eigene Note und speichert über das Sheet', async () => {
    state.user = { uid: 'u1' };
    const owned = {
      id: 1,
      title: 'Breaking Bad',
      rating: { Drama: 8 },
      genre: { genres: ['Drama'] },
    };
    state.series = [owned];
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    const rate = cardOf('Breaking Bad').querySelector('.hso__rate') as HTMLElement;
    expect(rate).toHaveTextContent('8');
    fireEvent.click(rate);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('quick-rating')).toHaveTextContent('In deiner Liste');
    await act(async () => {
      fireEvent.click(screen.getByText('rate'));
    });
    expect(quick.saveQuickRating).toHaveBeenCalledWith(
      'u1',
      { id: 1, type: 'series', title: 'Breaking Bad', userRating: 8 },
      7,
      owned,
      undefined
    );
    expect(screen.queryByTestId('quick-rating')).toBeNull();
  });
});

describe('HomeSearchOverlay Personen und Manga', () => {
  const pedro = { id: 1253360, name: 'Pedro Pascal', profilePath: '/p.jpg', popularity: 10 };

  it('stellt passende Personen vor die Titel und öffnet ihre Seite, ohne zu schließen', () => {
    search.people = [pedro];
    search.peopleFirst = true;
    const onClose = vi.fn();
    render(<HomeSearchOverlay open onClose={onClose} />);
    const person = screen.getByRole('button', { name: 'Pedro Pascal' });
    const firstCard = cardOf('Breaking Bad');
    expect(
      person.compareDocumentPosition(firstCard) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.click(person);
    expect(navigateMock).toHaveBeenCalledWith('/person/1253360');

    act(() => locationStore.set('/person/1253360', 'person-1'));
    expect(onClose).not.toHaveBeenCalled();
    expect(overlay()?.style.display).toBe('none');
  });

  it('setzt weniger passende Personen hinter die Titel', () => {
    search.people = [pedro];
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    const person = screen.getByRole('button', { name: 'Pedro Pascal' });
    expect(
      cardOf('Heat').compareDocumentPosition(person) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('blendet Personen im Serien-Filter aus und zeigt sie im Personen-Filter allein', () => {
    search.people = [pedro];
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Serien' }));
    expect(screen.queryByRole('button', { name: 'Pedro Pascal' })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Personen' })[0]);
    expect(screen.getByRole('button', { name: 'Pedro Pascal' })).toBeTruthy();
    expect(screen.queryByText('Breaking Bad')).toBeNull();
  });

  it('zeigt Manga als Reihe in „Alle“ und als Raster im Manga-Filter', () => {
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    expect(screen.getByTestId('manga-row')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Manga' }));
    expect(screen.getByTestId('manga-grid')).toBeTruthy();
    expect(screen.queryByText('Breaking Bad')).toBeNull();
  });

  it('parkt auch auf einer Manga-Detailseite', () => {
    const onClose = vi.fn();
    render(<HomeSearchOverlay open onClose={onClose} />);
    act(() => locationStore.set('/manga/30013', 'manga-1'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

const stored = (key: string): unknown => JSON.parse(localStorage.getItem(key) || 'null');

describe('HomeSearchOverlay Suchverlauf', () => {
  it('zeigt im Bücher-Filter den Bücher-Verlauf statt der Serien-Begriffe', () => {
    search.query = '';
    localStorage.setItem('recentSearches', JSON.stringify(['Breaking Bad']));
    localStorage.setItem('bookRecentSearches', JSON.stringify(['Stephen King', 'Der Hobbit']));
    render(<HomeSearchOverlay open onClose={vi.fn()} initialFilter="books" />);
    expect(screen.getByText('Zuletzt gesucht')).toBeTruthy();
    expect(screen.getByText('Stephen King')).toBeTruthy();
    expect(screen.getByText('Der Hobbit')).toBeTruthy();
    expect(screen.queryByText('Breaking Bad')).toBeNull();
    expect(screen.getByTestId('books-idle')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Alle' }));
    expect(screen.getByText('Breaking Bad')).toBeTruthy();
    expect(screen.queryByText('Stephen King')).toBeNull();
  });

  it('entfernt per x nur aus dem Bücher-Verlauf', () => {
    search.query = '';
    localStorage.setItem('recentSearches', JSON.stringify(['Dune']));
    localStorage.setItem('bookRecentSearches', JSON.stringify(['Dune', 'Tolkien']));
    render(<HomeSearchOverlay open onClose={vi.fn()} initialFilter="books" />);
    const row = screen.getByText('Dune').closest('.hso__recent-row') as HTMLElement;
    fireEvent.click(row.querySelector('.hso__recent-remove') as HTMLElement);
    expect(screen.queryByText('Dune')).toBeNull();
    expect(stored('bookRecentSearches')).toEqual(['Tolkien']);
    expect(stored('recentSearches')).toEqual(['Dune']);
  });

  it('merkt sich die Buchsuche beim Öffnen eines Buchs im Bücher-Verlauf', () => {
    search.query = 'stephen king';
    render(<HomeSearchOverlay open onClose={vi.fn()} homePath="/books" initialFilter="books" />);
    act(() => locationStore.set('/books', 'books-1'));
    act(() => locationStore.set('/books/OL123W', 'book-1'));
    expect(stored('bookRecentSearches')).toEqual(['stephen king']);
    expect(stored('recentSearches')).toBeNull();
  });

  it('merkt sich die Buchsuche auch beim direkten Hinzufügen', () => {
    search.query = 'tolkien';
    render(<HomeSearchOverlay open onClose={vi.fn()} initialFilter="books" />);
    fireEvent.click(screen.getByRole('button', { name: 'book-add-grid' }));
    expect(stored('bookRecentSearches')).toEqual(['tolkien']);
    expect(stored('recentSearches')).toBeNull();
  });

  it('trägt Bücher-Funde aus „Alle“ zusätzlich in den Bücher-Verlauf ein', () => {
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    act(() => locationStore.set('/books/OL123W', 'book-1'));
    expect(stored('recentSearches')).toEqual(['breaking']);
    expect(stored('bookRecentSearches')).toEqual(['breaking']);
  });

  it('lässt Serien-Treffer im allgemeinen Verlauf', () => {
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    fireEvent.click(cardOf('Breaking Bad'));
    act(() => locationStore.set('/series/1', 'detail-1'));
    expect(stored('recentSearches')).toEqual(['breaking']);
    expect(stored('bookRecentSearches')).toBeNull();
  });

  it('merkt sich Manga-Suchen im Manga-Verlauf', () => {
    search.query = 'one piece';
    render(<HomeSearchOverlay open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Manga' }));
    fireEvent.click(screen.getByRole('button', { name: 'manga-add-grid' }));
    expect(stored('mangaRecentSearches')).toEqual(['one piece']);
    expect(stored('recentSearches')).toBeNull();
  });
});
