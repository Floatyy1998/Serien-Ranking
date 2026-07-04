// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SearchResult } from './useSearchPage';

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
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'mode']);
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

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

const data = vi.hoisted(() => ({
  searchQuery: '',
  loading: false,
  searchResults: [] as SearchResult[],
  setSearchQuery: vi.fn(),
  setSearchType: vi.fn(),
}));
vi.mock('./useSearchPage', () => ({
  useSearchPage: () => ({
    searchQuery: data.searchQuery,
    setSearchQuery: data.setSearchQuery,
    searchType: 'all',
    setSearchType: data.setSearchType,
    searchResults: data.searchResults,
    loading: data.loading,
    recentSearches: [],
    popularSearches: [],
    isDesktop: false,
    snackbar: { open: false, message: '' },
    dialog: { open: false, message: '', type: 'info' },
    setDialog: vi.fn(),
    handleItemClick: vi.fn(),
    addToList: vi.fn(),
    pendingAddIds: new Set<string>(),
    removeRecentSearch: vi.fn(),
  }),
}));

vi.mock('../../components/ui', () => ({
  Dialog: () => null,
  Snackbar: () => null,
  ScrollToTopButton: () => null,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  SkeletonRatingsGrid: () => <div data-testid="skeleton-grid" />,
}));

vi.mock('./SearchResultCard', () => ({
  SearchResultCard: ({ item }: { item: SearchResult }) => <div data-testid="result">{item.id}</div>,
}));
vi.mock('./SearchSuggestions', () => ({
  SearchSuggestions: () => <div data-testid="suggestions" />,
}));

const result = (id: number): SearchResult => ({
  id,
  title: `T${id}`,
  type: 'series',
  inList: false,
});

import { SearchPage } from './SearchPage';

afterEach(() => {
  cleanup();
  data.searchQuery = '';
  data.loading = false;
  data.searchResults = [];
  vi.clearAllMocks();
});

describe('SearchPage', () => {
  it('renders the header and suggestions when the query is empty', () => {
    render(<SearchPage />);
    expect(screen.getByText('Suche')).toBeInTheDocument();
    expect(screen.getByTestId('suggestions')).toBeInTheDocument();
  });

  it('propagates typed input to setSearchQuery', () => {
    render(<SearchPage />);
    fireEvent.change(screen.getByPlaceholderText('Suche nach Serien & Filmen...'), {
      target: { value: 'dune' },
    });
    expect(data.setSearchQuery).toHaveBeenCalledWith('dune');
  });

  it('shows the skeleton grid while loading', () => {
    data.loading = true;
    render(<SearchPage />);
    expect(screen.getByTestId('skeleton-grid')).toBeInTheDocument();
  });

  it('renders a result card per match', () => {
    data.searchQuery = 'dune';
    data.searchResults = [result(1), result(2)];
    render(<SearchPage />);
    expect(screen.getAllByTestId('result')).toHaveLength(2);
  });
});
