// @vitest-environment jsdom
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { ContinueWatchingSection } from './ContinueWatchingSection';

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  seriesList: [] as unknown[],
}));

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
  useSeriesList: () => ({ seriesList: h.seriesList }),
}));
vi.mock('../../../services/animeFillerService', () => ({
  buildFillerLookup: () => new Map(),
  fillerLookupKey: () => '',
  readFillerCacheSync: () => null,
}));
vi.mock('../../../lib/date/paceCalculation', () => ({
  calculateWatchingPace: () => ({ shouldShow: false }),
  formatPaceLine: () => '',
}));
vi.mock('../../../lib/providerMerge', () => ({ resolveProviderOverlay: () => undefined }));
vi.mock('../../../utils/episodeDate', () => ({ hasEpisodeAired: () => true }));
vi.mock('../../../utils/episodeChips', () => ({
  chipLabel: (t: string) => t,
  chipColor: () => '#fff',
}));
vi.mock('../../../components/detail/ProviderLogoLink', () => ({
  ProviderLogoLink: () => <span />,
}));
vi.mock('../../../components/Discussion', () => ({
  EpisodeDiscussionButton: () => <button type="button">discuss</button>,
}));
vi.mock('../../../components/ui/FillerChip', () => ({ FillerChip: () => <span /> }));
vi.mock('../../../components/ui/NowPlayingIndicator', () => ({
  NowPlayingIndicator: () => <span />,
}));
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

interface CWItem {
  type: 'series';
  id: number;
  title: string;
  poster: string;
  progress: number;
  seasons: [];
  episodeRuntime: number;
  nextEpisode: {
    seasonNumber: number;
    episodeNumber: number;
    name: string;
    seasonIndex: number;
    episodeIndex: number;
    episodeId: number;
  };
  airDate: string;
  lastWatchedAt: string;
  genre: { genres: string[] };
  provider: undefined;
}

const item: CWItem = {
  type: 'series',
  id: 1,
  title: 'Breaking Bad',
  poster: 'poster.jpg',
  progress: 50,
  seasons: [],
  episodeRuntime: 45,
  nextEpisode: {
    seasonNumber: 1,
    episodeNumber: 2,
    name: 'Cat in the Bag',
    seasonIndex: 0,
    episodeIndex: 1,
    episodeId: 1001,
  },
  airDate: '2020-01-01',
  lastWatchedAt: '',
  genre: { genres: [] },
  provider: undefined,
};

const baseProps = {
  hiddenEpisodes: new Set<string>(),
  completingEpisodes: new Set<string>(),
  swipingEpisodes: new Set<string>(),
  dragOffsets: {} as Record<string, number>,
  swipeDirections: {} as Record<string, 'left' | 'right'>,
  onSwipeStart: vi.fn(),
  onSwipeDrag: vi.fn(),
  onSwipeEnd: vi.fn(),
  onComplete: vi.fn(),
  onPosterClick: vi.fn(),
};

const renderT = (props: Partial<typeof baseProps> & { items: CWItem[] }) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <ContinueWatchingSection {...baseProps} {...props} />
    </ThemeProvider>
  );

beforeEach(() => {
  h.seriesList = [];
});
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe('ContinueWatchingSection', () => {
  it('renders nothing when there are no items and no waiting watchlist series', () => {
    const { container } = renderT({ items: [] });
    expect(container.firstChild).toBeNull();
  });

  it('renders the empty-watchlist prompt when unwatched aired series are waiting', () => {
    h.seriesList = [{ id: 9, watchlist: false, seasons: [{ episodes: [{ watched: false }] }] }];
    renderT({ items: [] });
    expect(screen.getByText('Weiterschauen')).toBeInTheDocument();
    expect(screen.getByText('Noch nichts zum Weiterschauen')).toBeInTheDocument();
  });

  it('renders the item row with title and next-episode name', () => {
    renderT({ items: [item] });
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText(/Cat in the Bag/)).toBeInTheDocument();
  });

  it('invokes onComplete when the row completes', () => {
    const onComplete = vi.fn();
    renderT({ items: [item], onComplete });
    fireEvent.click(screen.getByTestId('complete'));
    expect(onComplete).toHaveBeenCalledWith(item, 'right');
  });
});
