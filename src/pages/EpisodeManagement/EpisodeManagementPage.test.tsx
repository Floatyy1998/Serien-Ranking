// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

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
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'mode']);
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

interface EpisodeStub {
  id: number;
  name: string;
  watched: boolean;
}
const state = vi.hoisted(() => ({ hasSeries: true }));
vi.mock('./useEpisodeManagement', () => ({
  useEpisodeManagement: () => ({
    series: state.hasSeries
      ? {
          title: 'Breaking Bad',
          seasons: [{ seasonNumber: 0, episodes: [{ watched: true }, { watched: false }] }],
        }
      : null,
    currentSeason: {
      seasonNumber: 0,
      episodes: [
        { id: 10, name: 'Pilot', watched: true },
        { id: 11, name: 'Cat in the Bag', watched: false },
      ] as EpisodeStub[],
    },
    seriesId: '1',
    selectedSeason: 0,
    setSelectedSeason: vi.fn(),
    handleSwipeLeft: vi.fn(),
    handleSwipeRight: vi.fn(),
    seasonProgress: {
      watchedCount: 1,
      totalCount: 2,
      allWatched: false,
      seasonMinWatchCount: 0,
      progress: 50,
    },
    episodeDiscussionCounts: {} as Record<number, number>,
    isRefreshing: false,
    scrollContainerRef: { current: null },
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    handleEpisodeClick: vi.fn(),
    handleSeasonToggle: vi.fn(),
    handleCatchUp: vi.fn(),
    showCatchUpDialog: false,
    setShowCatchUpDialog: vi.fn(),
    showWatchDialog: false,
    selectedEpisode: null,
    handleWatchDialogIncrease: vi.fn(),
    handleWatchDialogDecrease: vi.fn(),
    closeWatchDialog: vi.fn(),
    quickRatingOpen: false,
    quickRatingSeries: null,
    quickRatingSeasonNumber: 1,
    closeQuickRating: vi.fn(),
    saveQuickRating: vi.fn(),
  }),
}));

vi.mock('../../components/ui', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  CatchUpDialog: () => null,
}));
vi.mock('../../components/ui/QuickRatingSheet', () => ({ QuickRatingSheet: () => null }));
vi.mock('./BulkActionBar', () => ({ BulkActionBar: () => <div data-testid="bulk" /> }));
vi.mock('./EpisodeListItem', () => ({
  EpisodeListItem: ({ episode }: { episode: EpisodeStub }) => (
    <div data-testid="episode">{episode.name}</div>
  ),
}));

vi.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

import { EpisodeManagementPage } from './EpisodeManagementPage';

afterEach(() => {
  cleanup();
  state.hasSeries = true;
});

describe('EpisodeManagementPage', () => {
  it('renders the not-found header when there is no series', () => {
    state.hasSeries = false;
    render(<EpisodeManagementPage />);
    expect(screen.getByText('Serie nicht gefunden')).toBeInTheDocument();
  });

  it('renders the series title, bulk bar and one item per episode', () => {
    render(<EpisodeManagementPage />);
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByTestId('bulk')).toBeInTheDocument();
    expect(screen.getAllByTestId('episode')).toHaveLength(2);
  });

  it('renders a season tab labelled S1', () => {
    render(<EpisodeManagementPage />);
    expect(screen.getByText('S1')).toBeInTheDocument();
  });
});
