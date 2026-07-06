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
  fillerEpisodesFromStatic: () => [],
}));
vi.mock('../../../hooks/useAnimeFillerCatalog', () => ({
  useAnimeFillerCatalog: () => null,
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
vi.mock('./ContinueHeroCard', () => ({
  ContinueHeroCard: ({
    item,
    onOpen,
    onMarkWatched,
  }: {
    item: {
      title: string;
      nextEpisode: { seasonNumber: number; episodeNumber: number; name: string };
    };
    onOpen: (i: unknown) => void;
    onMarkWatched: (i: unknown) => void;
  }) => (
    <div>
      <span>{item.title}</span>
      <span>
        S{item.nextEpisode.seasonNumber} E{item.nextEpisode.episodeNumber} {item.nextEpisode.name}
      </span>
      <button type="button" data-testid="hero-open" onClick={() => onOpen(item)}>
        hero-open
      </button>
      <button type="button" data-testid="hero-watched" onClick={() => onMarkWatched(item)}>
        hero-watched
      </button>
    </div>
  ),
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

  it('renders the top item as the canonical hero card', () => {
    renderT({ items: [item] });
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText(/Cat in the Bag/)).toBeInTheDocument();
    // Single item → hero only, no compact row.
    expect(screen.queryByTestId('complete')).not.toBeInTheDocument();
  });

  it('renders remaining items as compact rows below the hero', () => {
    const item2: CWItem = {
      ...item,
      id: 2,
      title: 'Better Call Saul',
      nextEpisode: { ...item.nextEpisode, name: 'Uno' },
    };
    renderT({ items: [item, item2] });
    // Hero = first item, row = second item.
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('Better Call Saul')).toBeInTheDocument();
    expect(screen.getByTestId('complete')).toBeInTheDocument();
  });

  it('invokes onComplete when the hero mark-watched is tapped', () => {
    const onComplete = vi.fn();
    renderT({ items: [item], onComplete });
    fireEvent.click(screen.getByTestId('hero-watched'));
    expect(onComplete).toHaveBeenCalledWith(item, 'right');
  });

  it('invokes onComplete when a compact row completes', () => {
    const item2: CWItem = { ...item, id: 2, title: 'Better Call Saul' };
    const onComplete = vi.fn();
    renderT({ items: [item, item2], onComplete });
    fireEvent.click(screen.getByTestId('complete'));
    expect(onComplete).toHaveBeenCalledWith(item2, 'right');
  });
});
