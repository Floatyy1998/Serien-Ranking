// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { NextEpisode } from '../../../hooks/useWatchNextEpisodes';
import type { useEpisodeDragDrop } from '../../../hooks/useEpisodeDragDrop';
import type { useWatchNextSwipe } from '../useWatchNextSwipe';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('../../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: true }) }));
vi.mock('../../../components/Discussion', () => ({
  EpisodeDiscussionButton: () => <div data-testid="discussion-btn" />,
}));
vi.mock('../../../components/detail/ProviderLogoLink', () => ({
  ProviderLogoLink: () => <div data-testid="provider-logo" />,
}));
vi.mock('../../../components/ui/FillerChip', () => ({ FillerChip: () => <span>filler</span> }));
vi.mock('../../../services/animeFillerService', () => ({
  fillerLookupKey: (s: number, e: number) => `${s}-${e}`,
}));
vi.mock('../../../utils/episodeChips', () => ({
  chipColor: () => '#abc',
  chipLabel: (t: string) => `LABEL_${t}`,
}));

// Lightweight SwipeableEpisodeRow: renders the passed content + action and exposes
// a button that triggers the row's onComplete handler.
vi.mock('../../../components/ui', () => ({
  SwipeableEpisodeRow: (props: {
    itemKey: string;
    content: React.ReactNode;
    action: React.ReactNode;
    onComplete: (dir: string) => void;
  }) => (
    <div data-testid={`row-${props.itemKey}`}>
      {props.content}
      {props.action}
      <button data-testid={`complete-${props.itemKey}`} onClick={() => props.onComplete('right')}>
        done
      </button>
    </div>
  ),
}));

const navigateMock = vi.fn();

import { WatchNextEpisodeList } from './WatchNextEpisodeList';

const makeEpisode = (over: Partial<NextEpisode>): NextEpisode =>
  ({
    seriesId: 1,
    seriesTitle: 'Show A',
    poster: '/p.jpg',
    seasonNumber: 0,
    episodeNumber: 1,
    episodeName: 'Pilot',
    isRewatch: false,
    currentWatchCount: 0,
    targetWatchCount: 0,
    remainingEpisodes: 3,
    progress: 40,
    currentSeasonOf: 'Staffel 1',
    estimatedMinutesLeft: 90,
    ...over,
  }) as unknown as NextEpisode;

const getEpisodeKey = (ep: NextEpisode) => `${ep.seriesId}-${ep.seasonNumber}-${ep.episodeNumber}`;

const makeSwipe = (over: Record<string, unknown> = {}) =>
  ({
    swipingEpisodes: new Set<string>(),
    completingEpisodes: new Set<string>(),
    hiddenEpisodes: new Set<string>(),
    dragOffsets: {},
    swipeDirections: {},
    getEpisodeKey,
    handleSwipeDragStart: vi.fn(),
    handleSwipeDrag: vi.fn(),
    handleSwipeCleanup: vi.fn(),
    handleEpisodeComplete: vi.fn(),
    ...over,
  }) as unknown as ReturnType<typeof useWatchNextSwipe>;

const dragDrop = {
  draggedIndex: null,
  currentTouchIndex: null,
  handleDragStart: vi.fn(),
  handleDragOver: vi.fn(),
  handleDrop: vi.fn(),
  handleTouchStart: vi.fn(),
  handleTouchMove: vi.fn(),
  handleTouchEnd: vi.fn(),
} as unknown as ReturnType<typeof useEpisodeDragDrop>;

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

describe('WatchNextEpisodeList', () => {
  it('renders a row for each episode', () => {
    const episodes = [
      makeEpisode({ seriesId: 1, seriesTitle: 'Show A' }),
      makeEpisode({ seriesId: 2, seriesTitle: 'Show B', episodeNumber: 2 }),
    ];
    render(
      <WatchNextEpisodeList
        episodes={episodes}
        fillerByEpisode={new Map()}
        showSwipeHint={false}
        editModeActive={false}
        swipe={makeSwipe()}
        dragDrop={dragDrop}
      />
    );
    expect(screen.getByText('Show A')).toBeInTheDocument();
    expect(screen.getByText('Show B')).toBeInTheDocument();
  });

  it('hides episodes whose key is in hiddenEpisodes', () => {
    const hidden = makeEpisode({ seriesId: 1, seriesTitle: 'Hidden Show' });
    const visible = makeEpisode({ seriesId: 2, seriesTitle: 'Visible Show', episodeNumber: 5 });
    render(
      <WatchNextEpisodeList
        episodes={[hidden, visible]}
        fillerByEpisode={new Map()}
        showSwipeHint={false}
        editModeActive={false}
        swipe={makeSwipe({ hiddenEpisodes: new Set([getEpisodeKey(hidden)]) })}
        dragDrop={dragDrop}
      />
    );
    expect(screen.queryByText('Hidden Show')).not.toBeInTheDocument();
    expect(screen.getByText('Visible Show')).toBeInTheDocument();
  });

  it('shows the "Weiterschauen" separator between a rewatch and a normal episode', () => {
    const episodes = [
      makeEpisode({ seriesId: 1, seriesTitle: 'Rewatch Show', isRewatch: true }),
      makeEpisode({ seriesId: 2, seriesTitle: 'Normal Show', isRewatch: false, episodeNumber: 4 }),
    ];
    render(
      <WatchNextEpisodeList
        episodes={episodes}
        fillerByEpisode={new Map()}
        showSwipeHint={false}
        editModeActive={false}
        swipe={makeSwipe()}
        dragDrop={dragDrop}
      />
    );
    expect(screen.getByText('Weiterschauen')).toBeInTheDocument();
  });

  it('calls handleEpisodeComplete when a row completes', () => {
    const episode = makeEpisode({ seriesId: 7, seriesTitle: 'Complete Me' });
    const swipe = makeSwipe();
    render(
      <WatchNextEpisodeList
        episodes={[episode]}
        fillerByEpisode={new Map()}
        showSwipeHint={false}
        editModeActive={false}
        swipe={swipe}
        dragDrop={dragDrop}
      />
    );
    fireEvent.click(screen.getByTestId(`complete-${getEpisodeKey(episode)}`));
    expect(swipe.handleEpisodeComplete).toHaveBeenCalledWith(episode, 'right');
  });
});
