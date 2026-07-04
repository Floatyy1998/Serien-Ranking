// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { WatchedEpisode } from './EpisodeDataManager';

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
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'layout', 'whileTap']);
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

const disc = vi.hoisted(() => ({ count: 0 }));
vi.mock('../../hooks/discussionCountHooks', () => ({ useDiscussionCount: () => disc.count }));

const episode = (over: Partial<WatchedEpisode> = {}): WatchedEpisode => ({
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
  ...over,
});

import {
  DateGroupHeader,
  EpisodeCountBadge,
  EpisodeDiscussionIndicator,
  SearchBar,
  SingleEpisodeCard,
  TimeRangeChips,
} from './RecentlyWatchedComponents';

afterEach(() => {
  cleanup();
  disc.count = 0;
});

describe('RecentlyWatched SearchBar', () => {
  it('propagates typed input', () => {
    const onSearchChange = vi.fn();
    render(<SearchBar searchQuery="" onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText('Serie suchen...'), {
      target: { value: 'bear' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('bear');
  });
});

describe('RecentlyWatched TimeRangeChips', () => {
  it('calls onTimeRangeChange when a chip is clicked', () => {
    const onTimeRangeChange = vi.fn();
    render(
      <TimeRangeChips
        timeRanges={[{ days: 30, label: '30 Tage' }]}
        daysToShow={7}
        onTimeRangeChange={onTimeRangeChange}
      />
    );
    fireEvent.click(screen.getByText('30 Tage'));
    expect(onTimeRangeChange).toHaveBeenCalledWith(30);
  });
});

describe('RecentlyWatched DateGroupHeader / EpisodeCountBadge', () => {
  it('renders the date and episode count', () => {
    render(<DateGroupHeader displayDate="Heute" episodeCount={5} />);
    expect(screen.getByText('Heute')).toBeInTheDocument();
    expect(screen.getByText('5 Ep.')).toBeInTheDocument();
  });

  it('renders the total episode badge', () => {
    render(<EpisodeCountBadge totalEpisodes={12} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders nothing when there are no episodes', () => {
    const { container } = render(<EpisodeCountBadge totalEpisodes={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('RecentlyWatched SingleEpisodeCard', () => {
  it('renders series info and triggers rewatch', () => {
    const onRewatch = vi.fn();
    const { container } = render(
      <SingleEpisodeCard
        episode={episode()}
        isCompleting={false}
        onRewatch={onRewatch}
        onNavigateToSeries={vi.fn()}
        onNavigateToEpisode={vi.fn()}
        onNavigateToDiscussion={vi.fn()}
      />
    );
    expect(screen.getByText('Show One')).toBeInTheDocument();
    fireEvent.click(container.querySelector('.rw-rewatch-btn') as HTMLElement);
    expect(onRewatch).toHaveBeenCalledTimes(1);
  });
});

describe('RecentlyWatched EpisodeDiscussionIndicator', () => {
  it('renders nothing when the discussion count is zero', () => {
    const { container } = render(
      <EpisodeDiscussionIndicator seriesId={1} seasonNumber={1} episodeNumber={1} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the count and reacts to clicks when there are discussions', () => {
    disc.count = 4;
    const onClick = vi.fn();
    render(
      <EpisodeDiscussionIndicator
        seriesId={1}
        seasonNumber={1}
        episodeNumber={1}
        onClick={onClick}
      />
    );
    expect(screen.getByText('4')).toBeInTheDocument();
    fireEvent.click(screen.getByText('4'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
