// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { state } = vi.hoisted(() => ({ state: { episodes: [] as unknown[] } }));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
}));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../contexts/SeriesListContext', () => ({ useSeriesList: () => ({ seriesList: [] }) }));
vi.mock('../../hooks/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({ activeProviders: null, hasAnySubscription: false }),
}));
vi.mock('../../hooks/useEpisodeDragDrop', () => ({
  useEpisodeDragDrop: () => ({
    containerRef: { current: null },
    draggedIndex: null,
    watchlistOrder: [],
  }),
}));
vi.mock('../../hooks/usePersistedState', async () => {
  const React = await import('react');
  return { usePersistedState: (_k: string, init: unknown) => React.useState(init) };
});
vi.mock('../../hooks/useScrollRestore', () => ({ useScrollRestore: () => ({ saveNow: vi.fn() }) }));
vi.mock('../../hooks/useWatchNextEpisodes', () => ({ useWatchNextEpisodes: () => state.episodes }));
vi.mock('./useWatchNextSwipe', () => ({ useWatchNextSwipe: () => ({}) }));
vi.mock('../../services/animeFillerService', () => ({
  buildFillerLookup: () => new Map(),
  readFillerCacheSync: () => null,
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
  WatchNextHeader: (props: { episodeCount: number }) => <div>HEADER {props.episodeCount}</div>,
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
});
