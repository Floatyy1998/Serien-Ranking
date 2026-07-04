// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { RewatchSection } from './RewatchSection';

const h = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('../../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));
vi.mock('../../../hooks/useTransitionNavigate', () => ({
  useTransitionNavigate: () => h.navigate,
}));
vi.mock('../../../hooks/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({ getSeriesOverride: () => null }),
}));
vi.mock('../../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: [] }),
}));
vi.mock('../../../services/animeFillerService', () => ({
  buildFillerLookup: () => new Map(),
  fillerLookupKey: () => '',
  readFillerCacheSync: () => null,
}));
vi.mock('../../../lib/providerMerge', () => ({ resolveProviderOverlay: () => undefined }));
vi.mock('../../../components/detail/ProviderLogoLink', () => ({
  ProviderLogoLink: () => <span />,
}));
vi.mock('../../../components/Discussion', () => ({
  EpisodeDiscussionButton: () => <button type="button">discuss</button>,
}));
vi.mock('../../../components/ui/FillerChip', () => ({ FillerChip: () => <span /> }));
vi.mock('../../../components/ui', () => ({
  SectionHeader: ({ title, onSeeAll }: { title?: string; onSeeAll?: () => void }) => (
    <div>
      <span>{title}</span>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll}>
          see-all
        </button>
      )}
    </div>
  ),
  SwipeableEpisodeRow: ({
    posterAlt,
    content,
    action,
    onPosterClick,
    onComplete,
  }: {
    posterAlt?: string;
    content?: React.ReactNode;
    action?: React.ReactNode;
    onPosterClick?: () => void;
    onComplete?: (dir: 'left' | 'right') => void;
  }) => (
    <div>
      <img alt={posterAlt} onClick={() => onPosterClick?.()} />
      <div>{content}</div>
      <div>{action}</div>
      <button type="button" data-testid="complete" onClick={() => onComplete?.('right')}>
        complete
      </button>
    </div>
  ),
}));

interface RWItem {
  id: number;
  title: string;
  poster: string;
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  currentWatchCount: number;
  targetWatchCount: number;
  progress: number;
  progressCurrent: number;
  progressTotal: number;
  genre: { genres: string[] };
  provider: undefined;
  episodeRuntime: number;
  lastWatchedAt: string;
}

const episode: RWItem = {
  id: 1,
  title: 'One Piece',
  poster: 'poster.jpg',
  seasonIndex: 0,
  episodeIndex: 1,
  seasonNumber: 1,
  episodeNumber: 2,
  episodeName: 'The Great Swordsman',
  currentWatchCount: 1,
  targetWatchCount: 2,
  progress: 50,
  progressCurrent: 1,
  progressTotal: 2,
  genre: { genres: [] },
  provider: undefined,
  episodeRuntime: 24,
  lastWatchedAt: '',
};

const baseProps = {
  hiddenRewatches: new Set<string>(),
  completingRewatches: new Set<string>(),
  swipingRewatches: new Set<string>(),
  dragOffsets: {} as Record<string, number>,
  swipeDirections: {} as Record<string, 'left' | 'right'>,
  onSwipeStart: vi.fn(),
  onSwipeDrag: vi.fn(),
  onSwipeEnd: vi.fn(),
  onComplete: vi.fn(),
  onPosterClick: vi.fn(),
};

const renderT = (props: Partial<typeof baseProps> & { episodes: RWItem[] }) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <RewatchSection {...baseProps} {...props} />
    </ThemeProvider>
  );

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe('RewatchSection', () => {
  it('renders nothing when there are no episodes', () => {
    const { container } = renderT({ episodes: [] });
    expect(container.firstChild).toBeNull();
  });

  it('renders the Rewatches header, title and watch-count progression', () => {
    renderT({ episodes: [episode] });
    expect(screen.getByText('Rewatches')).toBeInTheDocument();
    expect(screen.getByText('One Piece')).toBeInTheDocument();
    expect(screen.getByText(/The Great Swordsman/)).toBeInTheDocument();
    expect(screen.getByText('1x → 2x')).toBeInTheDocument();
  });

  it('invokes onComplete when the row completes', () => {
    const onComplete = vi.fn();
    renderT({ episodes: [episode], onComplete });
    fireEvent.click(screen.getByTestId('complete'));
    expect(onComplete).toHaveBeenCalledWith(episode, 'right');
  });
});
