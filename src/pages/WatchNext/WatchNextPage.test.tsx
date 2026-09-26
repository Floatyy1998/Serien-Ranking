// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { state } = vi.hoisted(() => ({
  state: {
    episodes: [] as unknown[],
    series: [] as { id: number; watchlist: boolean }[],
    folders: [] as { id: string; name: string; createdAt: number; items: Set<string> }[],
    listFilter: null as string | null,
    seenSeries: [] as { id: number }[][],
    headerProps: null as null | Record<string, unknown>,
  },
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: state.series }),
}));
vi.mock('../../hooks/provider/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({ activeProviders: null, hasAnySubscription: false }),
}));
vi.mock('../../hooks/watch/useEpisodeDragDrop', () => ({
  useEpisodeDragDrop: () => ({
    containerRef: { current: null },
    draggedIndex: null,
    watchlistOrder: [],
  }),
}));
vi.mock('../../hooks/data/usePersistedState', async () => {
  const React = await import('react');
  return {
    usePersistedState: (k: string, init: unknown) =>
      React.useState(k === 'watchNextList' ? state.listFilter : init),
  };
});
vi.mock('../../hooks/ui/useScrollRestore', () => ({
  useScrollRestore: () => ({ saveNow: vi.fn() }),
}));
vi.mock('../../hooks/watch/useWatchNextEpisodes', () => ({
  useWatchNextEpisodes: (series: { id: number }[]) => {
    state.seenSeries.push(series);
    return state.episodes;
  },
}));
vi.mock('./useWatchNextSwipe', () => ({ useWatchNextSwipe: () => ({}) }));
vi.mock('../../hooks/rating/useRatingFolders', () => ({
  useRatingFolders: () => ({ folders: state.folders, loading: false }),
}));
vi.mock('../../services/catalog/animeFillerService', () => ({
  buildFillerLookup: () => new Map(),
  fillerEpisodesFromStatic: () => [],
}));
vi.mock('../../hooks/manga/useAnimeFillerCatalog', () => ({
  useAnimeFillerCatalog: () => null,
}));
vi.mock('../../lib/validation/rewatch.utils', () => ({ hasActiveRewatch: () => false }));
vi.mock('../../components/ui', async () => {
  const React = await import('react');
  return {
    PageLayout: React.forwardRef(function PageLayout(
      props: { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>
    ) {
      return <div ref={ref}>{props.children}</div>;
    }),
    ScrollToTopButton: () => null,
  };
});
vi.mock('./components/WatchNextHeader', () => ({
  WatchNextHeader: (props: { episodeCount: number } & Record<string, unknown>) => {
    state.headerProps = props;
    return <div>HEADER {props.episodeCount}</div>;
  },
}));
vi.mock('./components/RewatchToggle', () => ({ RewatchToggle: () => <div>REWATCH_TOGGLE</div> }));
vi.mock('./components/WatchNextEmptyState', () => ({
  WatchNextEmptyState: () => <div>EMPTY_STATE</div>,
}));
vi.mock('./components/WatchNextEpisodeList', () => ({
  WatchNextEpisodeList: () => <div>EPISODE_LIST</div>,
}));

import { WatchNextPage } from './WatchNextPage';

beforeEach(() => {
  state.episodes = [];
  state.series = [];
  state.folders = [];
  state.listFilter = null;
  state.seenSeries = [];
  state.headerProps = null;
});
afterEach(() => cleanup());

describe('WatchNextPage', () => {
  it('renders the empty state when there are no next episodes', () => {
    render(<WatchNextPage />);
    expect(screen.getByText('EMPTY_STATE')).toBeInTheDocument();
    expect(screen.queryByText('EPISODE_LIST')).not.toBeInTheDocument();
    expect(screen.getByText(/HEADER 0/)).toBeInTheDocument();
  });

  it('renders the episode list when there are next episodes', () => {
    state.episodes = [{ seriesId: 1 }, { seriesId: 2 }];
    render(<WatchNextPage />);
    expect(screen.getByText('EPISODE_LIST')).toBeInTheDocument();
    expect(screen.queryByText('EMPTY_STATE')).not.toBeInTheDocument();
    expect(screen.getByText(/HEADER 2/)).toBeInTheDocument();
  });

  it('offers all lists and filters by the chosen list', () => {
    state.series = [
      { id: 1, watchlist: false },
      { id: 2, watchlist: true },
    ];
    state.folders = [
      { id: 'l1', name: 'Marvel', createdAt: 1, items: new Set(['s_1', 'm_9']) },
      { id: 'l2', name: 'Nur Filme', createdAt: 2, items: new Set(['m_9']) },
    ];
    state.listFilter = 'l1';
    render(<WatchNextPage />);
    expect(state.headerProps?.availableLists).toEqual([
      { id: 'l1', name: 'Marvel' },
      { id: 'l2', name: 'Nur Filme' },
    ]);
    expect(state.headerProps?.listFilter).toBe('l1');
    expect(state.seenSeries[state.seenSeries.length - 1]).toEqual([{ id: 1, watchlist: true }]);
  });

  it('ignores a remembered list that no longer exists', () => {
    state.series = [{ id: 1, watchlist: true }];
    state.listFilter = 'gone';
    render(<WatchNextPage />);
    expect(state.headerProps?.listFilter).toBeNull();
    expect(state.seenSeries[state.seenSeries.length - 1]?.map((s) => s.id)).toEqual([1]);
  });
});
