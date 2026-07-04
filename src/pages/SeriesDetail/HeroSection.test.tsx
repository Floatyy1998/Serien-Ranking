// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Series } from '../../types/Series';

const { showToastMock } = vi.hoisted(() => ({ showToastMock: vi.fn() }));

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
vi.mock('@mui/icons-material', () => ({
  BookmarkAdd: () => null,
  BookmarkRemove: () => null,
  Delete: () => null,
  PlayCircle: () => null,
  Star: () => null,
  Visibility: () => null,
  VisibilityOff: () => null,
}));
vi.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../contexts/ThemeContextDef', () => {
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
vi.mock('../../components/ui', () => ({ BackButton: () => <button aria-label="back" /> }));
vi.mock('../../components/detail', () => ({
  FriendsWhoHaveThis: () => <div />,
  ProviderBadges: () => <div />,
  VideoGallery: () => <div />,
}));
vi.mock('../../components/recommendations/RecommendButton', () => ({
  RecommendButton: () => <button aria-label="recommend" />,
}));
vi.mock('./RatingsCard', () => ({ RatingsCard: () => <div data-testid="ratings" /> }));
vi.mock('./StatusBadge', () => ({ StatusBadge: () => <span />, NextEpisodeChip: () => <span /> }));
vi.mock('../../lib/providerMerge', () => ({ mergeProviders: () => [] }));
vi.mock('../../lib/anilistProviderFallback', () => ({
  fetchAniListProviderFallback: () => Promise.resolve([]),
  isLikelyAnime: () => false,
}));
vi.mock('../../lib/toast', () => ({ showToast: showToastMock }));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
vi.mock('../../utils/themedPlaceholder', () => ({ buildThemedPlaceholderDataUrl: () => 'ph.jpg' }));

import { HeroSection } from './HeroSection';

const series = {
  id: 5,
  title: 'Lost',
  genre: { genres: ['Drama'] },
  seasons: [],
  watchlist: false,
  hidden: false,
  poster: { poster: '/p.jpg' },
} as unknown as Series;

const baseProps = {
  series,
  localSeries: undefined,
  tmdbSeries: null,
  tmdbBackdrop: null,
  tmdbFirstAirDate: null,
  tmdbRating: null,
  imdbRating: null,
  providers: null,
  overallRating: '0.00',
  progressStats: { watched: 0, total: 0, percentage: 0 },
  paceInfo: null,
  isReadOnlyTmdbSeries: false,
  isAdding: false,
  isDeleting: false,
  isMobile: false,
  currentTheme: { status: { success: '#22c55e' }, accent: '#00a0ff' },
  onAddSeries: vi.fn(),
  onNavigateEpisodes: vi.fn(),
  onNavigateRating: vi.fn(),
  onWatchlistToggle: vi.fn(),
  onHideToggle: vi.fn(),
  onDelete: vi.fn(),
};

beforeEach(() => {
  showToastMock.mockReset();
  baseProps.onNavigateEpisodes = vi.fn();
  baseProps.onNavigateRating = vi.fn();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn() },
  });
});

afterEach(() => cleanup());

describe('HeroSection', () => {
  it('renders the series title and primary action', () => {
    render(<HeroSection {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Lost' })).toBeInTheDocument();
    expect(screen.getByText('Episoden')).toBeInTheDocument();
  });

  it('copies the title to the clipboard when the heading is clicked', () => {
    render(<HeroSection {...baseProps} />);
    fireEvent.click(screen.getByRole('heading', { name: 'Lost' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Lost');
    expect(showToastMock).toHaveBeenCalledWith('Titel kopiert');
  });

  it('invokes the episodes and rating navigation callbacks', () => {
    render(<HeroSection {...baseProps} />);
    fireEvent.click(screen.getByText('Episoden'));
    expect(baseProps.onNavigateEpisodes).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Bewerten'));
    expect(baseProps.onNavigateRating).toHaveBeenCalledTimes(1);
  });
});
