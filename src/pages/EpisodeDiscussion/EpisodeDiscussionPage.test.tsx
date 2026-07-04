// @vitest-environment jsdom
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
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragSnapToOrigin',
    'onDragEnd',
  ]);
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

vi.mock('../../hooks/useAnimeFillerData', () => ({
  useAnimeFillerData: () => ({ fillerByKey: new Map() }),
}));
vi.mock('../../services/animeFillerService', () => ({ fillerLookupKey: () => 'k' }));

const disc = vi.hoisted(() => ({
  loading: false,
  isNotFound: false,
}));
vi.mock('./useEpisodeDiscussion', () => ({
  useEpisodeDiscussion: () => ({
    seriesId: '1',
    seasonNumber: '1',
    episodeNumber: '1',
    navigate: vi.fn(),
    loading: disc.loading,
    isNotFound: disc.isNotFound,
    series: { id: 1, seasons: [] },
    seriesInfo: {},
    hasUser: true,
    hasSeries: true,
    isWatched: false,
    episodeName: 'Ep',
    episodeOverview: '',
    episodeAirDate: '',
    episodeRuntime: null,
    episodeRating: 0,
    stillPath: null,
    guestStars: [],
    directors: [],
    writers: [],
    seriesTitle: 'Show',
    formattedAirDate: null,
    formattedFirstWatchedAt: null,
    formattedLastWatchedAt: null,
    watchCount: 0,
    navigation: {
      hasPrevEpisode: false,
      hasNextEpisode: false,
      prevEpisodeLabel: '',
      nextEpisodeLabel: '',
      goToPrevEpisode: vi.fn(),
      goToNextEpisode: vi.fn(),
      hasPrevInSeason: false,
      hasNextInSeason: false,
      hasNextSeason: false,
    },
    handleToggleWatched: vi.fn(),
    nextEpisodeTransition: null,
    getStillUrl: () => '',
    getProfileUrl: () => '',
  }),
}));

vi.mock('./EpisodeDiscussionComponents', () => ({
  LoadingState: () => <div data-testid="loading" />,
  NotFoundState: () => <div data-testid="not-found" />,
  HeroSection: () => <div data-testid="hero" />,
  QuickActions: () => <div data-testid="quick-actions" />,
  EpisodeNavigation: () => <div data-testid="nav" />,
  OverviewSection: () => <div data-testid="overview" />,
  CrewSection: () => <div data-testid="crew" />,
  GuestStarsSection: () => <div data-testid="guests" />,
  DiscussionSection: () => <div data-testid="discussion" />,
}));

import { EpisodeDiscussionPage } from './EpisodeDiscussionPage';

afterEach(() => {
  cleanup();
  disc.loading = false;
  disc.isNotFound = false;
});

describe('EpisodeDiscussionPage', () => {
  it('renders the full layout in the normal state', () => {
    render(<EpisodeDiscussionPage />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    expect(screen.getByTestId('discussion')).toBeInTheDocument();
  });

  it('renders the loading state', () => {
    disc.loading = true;
    render(<EpisodeDiscussionPage />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument();
  });

  it('renders the not-found state', () => {
    disc.isNotFound = true;
    render(<EpisodeDiscussionPage />);
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });
});
