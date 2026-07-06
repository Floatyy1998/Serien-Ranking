// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { PreparedItem } from './useRatingsData';

const { theme, dataRef } = vi.hoisted(() => ({
  theme: {
    primary: '#3355ff',
    accent: '#22d3ee',
    background: { default: '#000000', surface: '#111111' },
    text: { primary: '#ffffff' },
  },
  dataRef: {
    current: {
      user: { uid: 'me' } as { uid: string } | null,
      activeTab: 'series' as 'series' | 'movies',
      itemsToRender: [] as PreparedItem[],
      currentItems: [] as PreparedItem[],
      seriesCount: 0,
      moviesCount: 0,
      stats: { count: 0, average: 0 },
      filters: {},
      handleTabChange: vi.fn(),
      handleQuickFilterChange: vi.fn(),
      handleGridClick: vi.fn(),
      scrollRef: { current: null },
      quickFilter: null as unknown,
    },
  },
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: theme, getMobilePageBackground: () => '#000000' }),
}));
vi.mock('./useRatingsData', () => ({ useRatingsData: () => dataRef.current }));
vi.mock('./RatingItemCard', () => ({
  RatingItemCard: ({ item }: { item: PreparedItem }) => <div>{item.title}</div>,
}));
vi.mock('./RatingsEmptyState', () => ({
  RatingsEmptyState: () => <div data-testid="empty" />,
}));
vi.mock('./RatingsHeader', () => ({ RatingsHeader: () => <div data-testid="header" /> }));
vi.mock('../../components/ui', () => ({
  QuickFilter: () => <div data-testid="quick-filter" />,
  ScrollToTopButton: () => null,
  SkeletonRatingsGrid: () => <div data-testid="skeleton" />,
}));

import { RatingsPage } from './RatingsPage';

const sampleItem: PreparedItem = {
  id: 1,
  title: 'Dark',
  posterUrl: '',
  rating: 8,
  progress: 0,
  isMovie: false,
  watchlist: false,
  providers: [],
};

beforeEach(() => {
  dataRef.current.user = { uid: 'me' };
  dataRef.current.itemsToRender = [];
  dataRef.current.currentItems = [];
});

afterEach(() => cleanup());

describe('RatingsPage', () => {
  it('renders the skeleton grid while the user is loading', () => {
    dataRef.current.user = null;
    render(<RatingsPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders the grid of rating cards', () => {
    dataRef.current.itemsToRender = [sampleItem];
    render(<RatingsPage />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the empty state when there are no items at all', () => {
    dataRef.current.itemsToRender = [];
    dataRef.current.currentItems = [];
    render(<RatingsPage />);
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });
});
