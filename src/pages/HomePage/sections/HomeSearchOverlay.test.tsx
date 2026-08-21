// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
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
}));
vi.mock('../../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: [], refetchAfterAdd: vi.fn() }),
}));
vi.mock('../../../contexts/MovieListContext', () => ({ useMovieList: () => ({ movieList: [] }) }));
vi.mock('../../../hooks/useCommunityRatings', () => ({
  useCommunityRatingsMap: () => ({}),
  pickDisplayRating: () => null,
}));
vi.mock('../../../hooks/useAndroidBack', () => ({ useAndroidBack: vi.fn() }));
vi.mock('../../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#fff' }));
vi.mock('../../../lib/motion', () => ({ tapScale: {} }));
vi.mock('../../../services/backendApi', () => ({ backendFetch: vi.fn() }));
vi.mock('../../../services/firebase/analytics', () => ({
  trackMovieAdded: vi.fn(),
  trackSeriesAdded: vi.fn(),
}));
vi.mock('../../../features/badges/minimalActivityLogger', () => ({
  logMovieAdded: vi.fn(),
  logSeriesAdded: vi.fn(),
}));
vi.mock('../../../components/ui', () => ({ Snackbar: () => null }));
vi.mock('../../../services/i18n', () => ({ t: (s: string) => s }));
vi.mock('./useHomeQuickSearch', () => ({
  useHomeQuickSearch: () => ({
    query: 'breaking',
    setQuery: vi.fn(),
    results: [
      { id: 1, type: 'series', title: 'Breaking Bad', year: '2008', poster_path: '/p.jpg' },
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
  cleanup();
});

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
