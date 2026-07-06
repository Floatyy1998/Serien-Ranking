// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContext';
import type { EpisodeNavigationInfo } from './useEpisodeDiscussion';

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

vi.mock('../../components/Discussion', () => ({
  DiscussionThread: () => <div data-testid="thread" />,
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

import {
  CrewSection,
  DiscussionSection,
  EpisodeNavigation,
  GuestStarsSection,
  OverviewSection,
} from './EpisodeDiscussionExtras';

const navigation: EpisodeNavigationInfo = {
  hasPrevEpisode: false,
  hasNextEpisode: true,
  prevEpisodeLabel: 'S1 E1',
  nextEpisodeLabel: 'S1 E3',
  goToPrevEpisode: vi.fn(),
  goToNextEpisode: vi.fn(),
  hasPrevInSeason: false,
  hasNextInSeason: true,
  hasNextSeason: false,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EpisodeNavigation', () => {
  it('renders the labels and triggers next navigation', () => {
    render(<EpisodeNavigation currentTheme={theme} navigation={navigation} />);
    expect(screen.getByText('S1 E3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('S1 E3'));
    expect(navigation.goToNextEpisode).toHaveBeenCalledTimes(1);
  });
});

describe('OverviewSection', () => {
  it('renders the overview text', () => {
    render(<OverviewSection currentTheme={theme} episodeOverview="A great episode." />);
    expect(screen.getByText('Handlung')).toBeInTheDocument();
    expect(screen.getByText('A great episode.')).toBeInTheDocument();
  });
});

describe('CrewSection', () => {
  it('returns nothing when there is no crew', () => {
    const { container } = render(<CrewSection currentTheme={theme} directors={[]} writers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders director names', () => {
    render(
      <CrewSection
        currentTheme={theme}
        directors={[{ id: 1, name: 'Jane Doe', job: 'Director', profile_path: null }]}
        writers={[]}
      />
    );
    expect(screen.getByText('Regie')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});

describe('GuestStarsSection', () => {
  it('renders guest star names and characters', () => {
    render(
      <GuestStarsSection
        currentTheme={theme}
        guestStars={[{ id: 1, name: 'Bob', character: 'Hero', profile_path: null }]}
        getProfileUrl={() => ''}
      />
    );
    expect(screen.getByText('Gaststars')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
  });
});

describe('DiscussionSection', () => {
  it('renders the discussion thread', () => {
    render(
      <DiscussionSection
        seriesId="1"
        seasonNumber="1"
        episodeNumber="2"
        seriesTitle="Show"
        episodeName="Pilot"
        posterPath={null}
        isWatched={false}
      />
    );
    expect(screen.getByTestId('thread')).toBeInTheDocument();
  });
});
