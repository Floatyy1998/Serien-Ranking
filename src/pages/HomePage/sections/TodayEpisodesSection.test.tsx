// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { TodayEpisodesSection } from './TodayEpisodesSection';

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
  fillerEpisodesFromStatic: () => [],
}));
vi.mock('../../../hooks/useAnimeFillerCatalog', () => ({
  useAnimeFillerCatalog: () => null,
}));
vi.mock('../../../lib/providerMerge', () => ({ resolveProviderOverlay: () => undefined }));
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

interface TodayItem {
  seriesId: string;
  seriesTitle: string;
  poster: string;
  seasonNumber: number;
  episodeNumber: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeId: string;
  episodeName: string;
  watched: boolean;
  runtime: number;
  chipType?: 'season-start' | 'mid-season-return' | 'season-finale' | 'season-break';
}

const episode: TodayItem = {
  seriesId: '1',
  seriesTitle: 'Naruto',
  poster: 'poster.jpg',
  seasonNumber: 1,
  episodeNumber: 1,
  seasonIndex: 0,
  episodeIndex: 0,
  episodeId: 'e1',
  episodeName: 'Enter: Naruto Uzumaki',
  watched: false,
  runtime: 24,
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

const renderT = (props: Partial<typeof baseProps> & { episodes: TodayItem[] }) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <TodayEpisodesSection {...baseProps} {...props} />
    </ThemeProvider>
  );

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe('TodayEpisodesSection', () => {
  it('renders nothing when there are no episodes', () => {
    const { container } = renderT({ episodes: [] });
    expect(container.firstChild).toBeNull();
  });

  it('renders the "Heute Neu" header, series title and episode name', () => {
    renderT({ episodes: [episode] });
    expect(screen.getByText('Heute Neu')).toBeInTheDocument();
    expect(screen.getByText('Naruto')).toBeInTheDocument();
    expect(screen.getByText(/Enter: Naruto Uzumaki/)).toBeInTheDocument();
  });

  it('renders a chip label when the episode has a chipType', () => {
    renderT({ episodes: [{ ...episode, chipType: 'season-finale' }] });
    expect(screen.getByText('season-finale')).toBeInTheDocument();
  });

  it('invokes onComplete when the row completes', () => {
    const onComplete = vi.fn();
    renderT({ episodes: [episode], onComplete });
    fireEvent.click(screen.getByTestId('complete'));
    expect(onComplete).toHaveBeenCalledWith(episode, 'right');
  });
});
