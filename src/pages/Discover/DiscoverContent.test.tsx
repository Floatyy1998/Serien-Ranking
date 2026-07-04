// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { DiscoverItem } from './discoverItemHelpers';
import type { useTheme } from '../../contexts/ThemeContextDef';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

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
  const skip = new Set(['initial', 'animate', 'exit', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

vi.mock('../../components/ui', () => ({
  LoadingSpinner: ({ text }: { text?: string }) => <div data-testid="spinner">{text}</div>,
}));

vi.mock('./DiscoverItemCard', () => ({
  ItemCard: ({ item }: { item: DiscoverItem }) => <div data-testid="item-card">{item.id}</div>,
}));

const makeTheme = (): Theme => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return make() as Theme;
};
const theme = makeTheme();

const item = (id: number): DiscoverItem => ({
  id,
  title: `T${id}`,
  poster_path: null,
  vote_average: 5,
  type: 'series',
  inList: false,
});

import { DiscoverContent } from './DiscoverContent';

const baseProps = {
  activeCategory: 'trending',
  showSearch: false,
  searchQuery: '',
  isDesktop: false,
  currentTheme: theme,
  results: [] as DiscoverItem[],
  searchResults: [] as DiscoverItem[],
  searchLoading: false,
  recommendations: [] as DiscoverItem[],
  recommendationsLoading: false,
  addingItem: null,
  handleItemClick: vi.fn(),
  addToList: vi.fn(async () => {}),
};

afterEach(() => cleanup());

describe('DiscoverContent', () => {
  it('renders result cards in the default category', () => {
    render(<DiscoverContent {...baseProps} results={[item(1), item(2)]} />);
    expect(screen.getAllByTestId('item-card')).toHaveLength(2);
  });

  it('shows the recommendations loading spinner', () => {
    render(
      <DiscoverContent {...baseProps} activeCategory="recommendations" recommendationsLoading />
    );
    expect(screen.getByTestId('spinner')).toHaveTextContent('Lade Empfehlungen...');
  });

  it('shows the empty recommendations message', () => {
    render(<DiscoverContent {...baseProps} activeCategory="recommendations" />);
    expect(screen.getByText('Keine Empfehlungen verfügbar')).toBeInTheDocument();
  });

  it('prompts for a search term when searching with an empty query', () => {
    render(<DiscoverContent {...baseProps} showSearch />);
    expect(screen.getByText('Gib einen Suchbegriff ein...')).toBeInTheDocument();
  });
});
