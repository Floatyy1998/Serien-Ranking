// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Series } from '../../types/Series';

const { navigateMock, authValue, seriesDataRef } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  // Stable user identity: child effects key on `user`; a fresh object loops.
  authValue: { user: { uid: 'me' } },
  seriesDataRef: {
    current: { series: null as Series | null, loading: false },
  },
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'layout',
    'layoutId',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragSnapToOrigin',
    'onDragEnd',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
    useReducedMotion: () => true,
    useDragControls: () => ({ start: () => {} }),
  };
});
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '5' }),
  useNavigate: () => navigateMock,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => authValue }));
vi.mock('../../contexts/ThemeContext', () => {
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
vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));
vi.mock('./useSeriesData', () => ({
  useSeriesData: () => ({
    series: seriesDataRef.current.series,
    localSeries: seriesDataRef.current.series ?? undefined,
    tmdbSeries: null,
    isReadOnlyTmdbSeries: false,
    loading: seriesDataRef.current.loading,
    tmdbBackdrop: null,
    providers: null,
    tmdbRating: null,
    imdbRating: null,
    tmdbFirstAirDate: null,
    tmdbOverview: null,
  }),
}));
vi.mock('./useSeriesActions', () => ({
  useSeriesActions: () => ({
    isAdding: false,
    isDeleting: false,
    dialog: { open: false, message: '', type: 'info' },
    setDialog: vi.fn(),
    snackbar: { open: false, message: '' },
    showRewatchDialog: { show: false, type: 'episode', item: null },
    setShowRewatchDialog: vi.fn(),
    handleAddSeries: vi.fn(),
    handleDeleteSeries: vi.fn(),
    handleWatchlistToggle: vi.fn(),
    handleHideToggle: vi.fn(),
    handleEpisodeRewatch: vi.fn(),
    handleEpisodeUnwatch: vi.fn(),
    handleEpisodeQuickToggle: vi.fn(),
    handleStartRewatch: vi.fn(),
    handleStopRewatch: vi.fn(),
  }),
}));
vi.mock('../../hooks/useRecapData', () => ({
  useRecapData: () => ({
    recapEpisodes: [],
    loading: false,
    daysSinceLastWatch: 0,
    dismiss: vi.fn(),
    dismissPermanent: vi.fn(),
    aiRecap: null,
    aiLoading: false,
    aiError: null,
    generateAiRecap: vi.fn(),
    askQuestion: vi.fn(),
    questionAnswer: null,
    questionLoading: false,
  }),
}));
vi.mock('../../hooks/useCharacterDescriptions', () => ({
  useCharacterDescriptions: () => ({
    characters: [],
    loading: false,
    error: null,
    generate: vi.fn(),
    userProgress: null,
    askQuestion: vi.fn(),
    questionAnswer: null,
    questionLoading: false,
  }),
}));
vi.mock('../../hooks/useAnimeFillerData', () => ({
  useAnimeFillerData: () => ({
    enabled: false,
    loading: false,
    data: null,
    reload: vi.fn(),
    fillerByKey: undefined,
  }),
}));
vi.mock('../../hooks/discussionCountHooks', () => ({ useEpisodeDiscussionCounts: () => ({}) }));
vi.mock('./useFriendsSeriesProgress', () => ({
  useFriendsSeriesProgress: () => ({ entries: [] }),
}));
vi.mock('../../lib/rating/rating', () => ({ calculateOverallRating: () => '8.00' }));
vi.mock('../../utils/episodeDate', () => ({ hasEpisodeAired: () => true }));
vi.mock('../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#ffffff' }));
vi.mock('../../hooks/markNextEpisode', () => ({
  findNextEpisode: () => null,
  markNextEpisodeWatched: vi.fn(),
}));
vi.mock('../../lib/date/paceCalculation', () => ({
  calculateWatchingPace: () => ({ shouldShow: false }),
  formatPaceLine: () => '',
}));
vi.mock('../../lib/validation/rewatch.utils', () => ({
  getNextRewatchEpisode: () => null,
  hasActiveRewatch: () => false,
}));
vi.mock('./HeroSection', () => ({ HeroSection: () => <div data-testid="hero" /> }));
vi.mock('./SeasonsSection', () => ({ SeasonsSection: () => <div data-testid="seasons" /> }));
vi.mock('./SeriesDetailDialogs', () => ({
  SeriesDetailDialogs: () => <div data-testid="dialogs" />,
}));
vi.mock('./FriendsProgressStrip', () => ({ FriendsProgressStrip: () => <div /> }));
vi.mock('./CharacterGuide', () => ({ CharacterGuide: () => <div data-testid="char-guide" /> }));
vi.mock('./AnimeFillerBanner', () => ({ AnimeFillerBanner: () => <div /> }));
vi.mock('../../components/detail', () => ({
  CastCrew: () => <div data-testid="cast" />,
  RecommendationsSection: () => <div data-testid="recs" />,
}));
vi.mock('../../components/ui/RecapSheet', () => ({ RecapSheet: () => <div /> }));

import { SeriesDetailPage } from './SeriesDetailPage';

const series = {
  id: 5,
  title: 'Lost',
  seasons: [{ seasonNumber: 0, episodes: [{ id: 1, watched: false, episode_number: 1 }] }],
} as unknown as Series;

beforeEach(() => {
  navigateMock.mockReset();
  seriesDataRef.current = { series: null, loading: false };
});

afterEach(() => cleanup());

describe('SeriesDetailPage', () => {
  it('shows a not-found message when the series is missing', () => {
    seriesDataRef.current = { series: null, loading: false };
    render(<SeriesDetailPage />);
    expect(screen.getByText('Serie nicht gefunden')).toBeInTheDocument();
  });

  it('shows a loading placeholder while data loads', () => {
    seriesDataRef.current = { series: null, loading: true };
    render(<SeriesDetailPage />);
    expect(screen.getByText('Lade...')).toBeInTheDocument();
  });

  it('renders the hero and tab switcher for a loaded series', () => {
    seriesDataRef.current = { series, loading: false };
    render(<SeriesDetailPage />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByText('Info & Episoden')).toBeInTheDocument();
    expect(screen.getByText('Besetzung')).toBeInTheDocument();
    expect(screen.getByTestId('seasons')).toBeInTheDocument();
  });
});
