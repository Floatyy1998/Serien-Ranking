// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WatchedEpisode } from './EpisodeDataManager';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'layout', 'mode']);
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

const episode: WatchedEpisode = {
  seriesId: 1,
  seriesName: 'Show One',
  seriesPoster: 'p.jpg',
  seasonIndex: 0,
  episodeIndex: 0,
  episodeName: 'Pilot',
  episodeNumber: 1,
  seasonNumber: 1,
  firstWatchedAt: new Date('2024-01-01'),
  watchCount: 1,
  daysAgo: 0,
  dateSource: 'firstWatched',
};

const data = vi.hoisted(() => ({
  isLoading: false,
  totalEpisodes: 1,
}));
vi.mock('./useRecentlyWatched', () => ({
  TIME_RANGES: [{ days: 7, label: '7 Tage' }],
  useRecentlyWatched: () => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    daysToShow: 7,
    isLoading: data.isLoading,
    completingEpisodes: new Set<string>(),
    loadedDateGroups: [{ date: '2024-01-01', displayDate: 'Heute', episodes: [episode] }],
    totalEpisodes: data.totalEpisodes,
    headerHeight: 100,
    headerRef: { current: null },
    handleRewatchEpisode: vi.fn(),
    toggleSeriesExpanded: vi.fn(),
    isSeriesExpanded: () => false,
    handleTimeRangeChange: vi.fn(),
    navigateToSeries: vi.fn(),
    navigateToEpisode: vi.fn(),
    navigateToEpisodeDiscussion: vi.fn(),
    getRelativeDateLabel: () => 'vor 1 Tag',
    groupEpisodesBySeries: () => ({ '1': [episode] }),
  }),
}));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  SkeletonListRow: () => <div data-testid="skeleton" />,
  ScrollToTopButton: () => null,
}));

vi.mock('./RecentlyWatchedComponents', () => ({
  DateGroupHeader: ({ displayDate }: { displayDate: string }) => <div>{displayDate}</div>,
  EmptyState: () => <div data-testid="empty" />,
  EpisodeCountBadge: () => <div data-testid="count-badge" />,
  SearchBar: () => <div data-testid="search-bar" />,
  SeriesAccordion: () => <div data-testid="accordion" />,
  SingleEpisodeCard: ({ episode: ep }: { episode: WatchedEpisode }) => (
    <div data-testid="single-card">{ep.seriesName}</div>
  ),
  TimeRangeChips: () => <div data-testid="chips" />,
}));

import { RecentlyWatchedPage } from './RecentlyWatchedPage';

afterEach(() => {
  cleanup();
  data.isLoading = false;
  data.totalEpisodes = 1;
});

describe('RecentlyWatchedPage', () => {
  it('renders the header, search bar and chips', () => {
    render(<RecentlyWatchedPage />);
    expect(screen.getByText('Verlauf')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('chips')).toBeInTheDocument();
  });

  it('shows the loading skeletons while loading', () => {
    data.isLoading = true;
    render(<RecentlyWatchedPage />);
    expect(screen.getByLabelText('Lade Verlauf')).toBeInTheDocument();
  });

  it('renders the empty state when there are no episodes', () => {
    data.totalEpisodes = 0;
    render(<RecentlyWatchedPage />);
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('renders a single-episode card for a solo watch', () => {
    render(<RecentlyWatchedPage />);
    expect(screen.getByTestId('single-card')).toHaveTextContent('Show One');
    expect(screen.getByText('Heute')).toBeInTheDocument();
  });
});
