// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { NavigateFunction } from 'react-router-dom';
import type { useTheme } from '../../contexts/ThemeContext';

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
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
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

vi.mock('../../components/ui', () => ({
  BackButton: () => <button>back</button>,
  Skeleton: () => <div data-testid="skeleton" />,
}));
vi.mock('../../components/ui/FillerChip', () => ({ FillerChip: () => <span>filler</span> }));
vi.mock('../../components/Discussion', () => ({ DiscussionThread: () => <div>thread</div> }));

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
const navigate = vi.fn() as unknown as NavigateFunction;

import {
  HeroSection,
  LoadingState,
  NotFoundState,
  QuickActions,
} from './EpisodeDiscussionComponents';

afterEach(() => cleanup());

describe('EpisodeDiscussion LoadingState / NotFoundState', () => {
  it('renders the loading skeletons', () => {
    render(<LoadingState currentTheme={theme} />);
    expect(screen.getByLabelText('Lade Episodendetails')).toBeInTheDocument();
  });

  it('renders the not-found message and calls onGoBack', () => {
    const onGoBack = vi.fn();
    render(<NotFoundState currentTheme={theme} onGoBack={onGoBack} />);
    expect(screen.getByText('Episode nicht gefunden')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Zurück'));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });
});

describe('EpisodeDiscussion HeroSection', () => {
  it('renders the episode name, badge and rating', () => {
    render(
      <HeroSection
        currentTheme={theme}
        stillPath={null}
        backdropPath={null}
        episodeName="The Pilot"
        seriesTitle="My Show"
        seriesId="1"
        seasonNumber="1"
        episodeNumber="2"
        episodeRating={8}
        episodeAirDate={undefined}
        episodeRuntime={null}
        formattedAirDate={null}
        formattedFirstWatchedAt={null}
        formattedLastWatchedAt={null}
        watchCount={0}
        isWatched={false}
        getStillUrl={() => ''}
        navigate={navigate}
      />
    );
    expect(screen.getByText('The Pilot')).toBeInTheDocument();
    expect(screen.getByText('S1 E2')).toBeInTheDocument();
    expect(screen.getByText('8.0')).toBeInTheDocument();
  });
});

describe('EpisodeDiscussion QuickActions', () => {
  it('calls onToggleWatched when marking as watched', () => {
    const onToggleWatched = vi.fn();
    render(
      <QuickActions
        currentTheme={theme}
        hasUser
        hasSeries
        isWatched={false}
        seriesId="1"
        onToggleWatched={onToggleWatched}
        navigate={navigate}
      />
    );
    fireEvent.click(screen.getByText('Als gesehen markieren'));
    expect(onToggleWatched).toHaveBeenCalledTimes(1);
  });
});
