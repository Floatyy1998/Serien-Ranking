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

vi.mock('../../hooks/discussionCountHooks', () => ({ useDiscussionCount: () => 0 }));

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

const episodes = [episode(), episode({ episodeIndex: 1, episodeNumber: 2, episodeName: 'Second' })];

import { SeriesAccordion } from './SeriesAccordion';

const baseProps = {
  seriesId: 1,
  episodes,
  dateKey: '2024-01-01',
  completingEpisodes: new Set<string>(),
  relativeDateLabel: 'vor 1 Tag',
  onToggle: vi.fn(),
  onRewatch: vi.fn(),
  onNavigateToSeries: vi.fn(),
  onNavigateToEpisode: vi.fn(),
  onNavigateToDiscussion: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SeriesAccordion', () => {
  it('renders the series name and episode count in the header', () => {
    render(<SeriesAccordion {...baseProps} isExpanded={false} />);
    expect(screen.getByText('Show One')).toBeInTheDocument();
    expect(screen.getByText('2 Episoden')).toBeInTheDocument();
  });

  it('calls onToggle when the header is clicked', () => {
    render(<SeriesAccordion {...baseProps} isExpanded={false} />);
    fireEvent.click(screen.getByText('Show One'));
    expect(baseProps.onToggle).toHaveBeenCalledWith('2024-01-01', 1);
  });

  it('renders episode rows when expanded', () => {
    render(<SeriesAccordion {...baseProps} isExpanded />);
    expect(screen.getByText(/Second/)).toBeInTheDocument();
  });
});
