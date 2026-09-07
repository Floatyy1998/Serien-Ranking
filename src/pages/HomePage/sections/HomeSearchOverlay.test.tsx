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
  Close: () => null,
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
vi.mock('../../../components/ui', () => ({ Snackbar: () => null }));
vi.mock('../../../services/i18n', () => ({ t: (s: string) => s }));
vi.mock('./useHomeQuickSearch', () => ({
  useHomeQuickSearch: () => ({
    query: 'breaking',
    setQuery: vi.fn(),
    results: [
      { id: 1, type: 'series', title: 'Breaking Bad', year: '2008', poster_path: '/p.jpg' },
      { id: 2, type: 'movie', title: 'Heat', year: '1995', poster_path: '/h.jpg' },
    ],
    loading: false,
    recent: [],
    popular: [],
    popularItems: [],
    saveRecent: vi.fn(),
    removeRecent: vi.fn(),
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
      owned
    );
    expect(screen.queryByTestId('quick-rating')).toBeNull();
  });
});
