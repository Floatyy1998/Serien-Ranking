// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock(
  '@mui/icons-material',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : typeof p === 'symbol' || p === 'then'
              ? undefined
              : () => null,
        has: () => true,
      }
    )
);

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (p: { children?: unknown }) =>
      React.createElement(React.Fragment, null, p.children as never),
  };
});

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

const filters = vi.hoisted(() => ({
  activeTab: 'series' as 'series' | 'movies',
  setActiveTab: vi.fn(),
  activeCategory: 'trending',
  setActiveCategory: vi.fn(),
  selectedGenre: null as number | null,
  setSelectedGenre: vi.fn(),
  showFilters: false,
  setShowFilters: vi.fn(),
  showSearch: false,
  setShowSearch: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
  onlyMyProviders: false,
  setOnlyMyProviders: vi.fn(),
  isRestoring: false,
  isDesktop: false,
  headerHeight: 120,
  genres: [{ id: 1, name: 'Action' }],
  handleItemClick: vi.fn(),
  fetchRecommendationsOnRestoreRef: { current: null as null | (() => void) },
  fetchFromTMDBOnRestoreRef: { current: null as null | (() => void) },
}));
vi.mock('./useDiscoverFilters', () => ({ useDiscoverFilters: () => filters }));

const fetchState = vi.hoisted(() => ({
  results: [],
  loading: false,
  searchResults: [],
  searchLoading: false,
  recommendations: [],
  recommendationsLoading: false,
  addingItem: null,
  snackbar: { open: false, message: '' },
  dialog: { open: false, message: '', type: 'info' },
  setDialog: vi.fn(),
  fetchFromTMDB: vi.fn(),
  fetchRecommendations: vi.fn(),
  addToList: vi.fn(),
  setupScrollListener: () => () => {},
}));
vi.mock('./useDiscoverFetch', () => ({ useDiscoverFetch: () => fetchState }));

vi.mock('./DiscoverContent', () => ({
  DiscoverContent: () => <div data-testid="discover-content" />,
}));

const subs = vi.hoisted(() => ({ activeProviders: new Set<string>() }));
vi.mock('../../hooks/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({
    activeProviders: subs.activeProviders,
    hasAnySubscription: subs.activeProviders.size > 0,
    isOnActiveSub: () => false,
    seriesOverrides: {},
    getSeriesOverride: () => null,
    loading: false,
  }),
}));

vi.mock('../../components/ui', () => ({
  BackButton: () => <button>back</button>,
  Dialog: () => null,
  GradientText: ({ children }: { children?: ReactNode }) => <h1>{children}</h1>,
  LoadingSpinner: () => <div>spinner</div>,
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ScrollToTopButton: () => null,
  Snackbar: () => null,
  TabSwitcher: ({
    tabs,
    onTabChange,
  }: {
    tabs: { id: string; label: string }[];
    onTabChange: (id: string) => void;
  }) => (
    <div>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onTabChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  ),
}));

import { DiscoverPage } from './DiscoverPage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DiscoverPage', () => {
  it('renders the title, categories and content', () => {
    render(<DiscoverPage />);
    expect(screen.getByText('Entdecken')).toBeInTheDocument();
    expect(screen.getByText('Trend')).toBeInTheDocument();
    expect(screen.getByText('Für dich')).toBeInTheDocument();
    expect(screen.getByTestId('discover-content')).toBeInTheDocument();
  });

  it('changes the category when a category button is pressed', () => {
    render(<DiscoverPage />);
    fireEvent.click(screen.getByText('Beliebt'));
    expect(filters.setActiveCategory).toHaveBeenCalledWith('popular');
  });

  it('switches tab via the tab switcher', () => {
    render(<DiscoverPage />);
    fireEvent.click(screen.getByText('Filme'));
    expect(filters.setActiveTab).toHaveBeenCalledWith('movies');
  });

  it('disables the abo filter toggle when there are no active subscriptions', () => {
    subs.activeProviders = new Set();
    render(<DiscoverPage />);
    const toggle = screen.getByLabelText('Nur Titel auf meinen aktiven Abos anzeigen');
    expect(toggle).toBeDisabled();
  });

  it('toggles the abo filter when the user has active subscriptions', () => {
    subs.activeProviders = new Set(['Netflix']);
    render(<DiscoverPage />);
    const toggle = screen.getByLabelText('Nur Titel auf meinen aktiven Abos anzeigen');
    expect(toggle).not.toBeDisabled();
    fireEvent.click(toggle);
    expect(filters.setOnlyMyProviders).toHaveBeenCalled();
    subs.activeProviders = new Set();
  });
});
