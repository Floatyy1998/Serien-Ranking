// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('@mui/icons-material', () => ({ Check: () => null, ExpandMore: () => null }));
vi.mock('../../hooks/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({
    activeProviders: new Set<string>(),
    getSeriesOverride: () => null,
  }),
}));
vi.mock('./useCalendarData', () => ({ contrastTextColor: () => '#000000' }));
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

import { SingleEpisodeCard, EpisodeGroupCard } from './EpisodeCard';

const ep = (over: Partial<WeeklyEpisode> = {}): WeeklyEpisode => ({
  seriesId: 42,
  seriesTitle: 'Severance',
  poster: '/p.jpg',
  seasonNumber: 2,
  episodeNumber: 3,
  episodeName: 'Woe’s Hollow',
  airDate: '2026-07-01',
  watched: false,
  seasonIndex: 1,
  episodeIndex: 2,
  runtime: 45,
  providerNames: [],
  providers: [],
  ...over,
});

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('SingleEpisodeCard', () => {
  it('renders the series title and episode code', () => {
    render(<SingleEpisodeCard ep={ep()} backdropSrc={undefined} onMarkWatched={vi.fn()} />);
    expect(screen.getAllByText('Severance').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/S02E03/).length).toBeGreaterThan(0);
  });

  it('navigates to the episode route when the card is clicked', () => {
    const { container } = render(
      <SingleEpisodeCard ep={ep()} backdropSrc={undefined} onMarkWatched={vi.fn()} />
    );
    const card = container.querySelector('.cal-ep') as HTMLElement;
    fireEvent.click(card);
    expect(navigateMock).toHaveBeenCalledWith('/episode/42/s/2/e/3');
  });

  it('marks the episode watched via the mark button', () => {
    const onMark = vi.fn();
    const { container } = render(
      <SingleEpisodeCard ep={ep()} backdropSrc={undefined} onMarkWatched={onMark} />
    );
    const markBtn = container.querySelector('.cal-ep-mark') as HTMLElement;
    fireEvent.click(markBtn);
    expect(onMark).toHaveBeenCalledWith(42, 1, 2);
  });
});

describe('EpisodeGroupCard', () => {
  const group = {
    seriesId: 42,
    seriesTitle: 'Severance',
    episodes: [ep({ episodeNumber: 3 }), ep({ episodeNumber: 4, episodeIndex: 3 })],
  };

  it('renders the group header with the episode count label', () => {
    render(
      <EpisodeGroupCard
        group={group}
        backdropSrc={undefined}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkWatched={vi.fn()}
      />
    );
    expect(screen.getAllByText(/2 Folgen · 0 gesehen/).length).toBeGreaterThan(0);
  });

  it('toggles expansion when the header is clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <EpisodeGroupCard
        group={group}
        backdropSrc={undefined}
        isExpanded={false}
        onToggle={onToggle}
        onMarkWatched={vi.fn()}
      />
    );
    fireEvent.click(container.querySelector('.cal-ep-group-header') as HTMLElement);
    expect(onToggle).toHaveBeenCalled();
  });

  it('renders the expanded episode list when open', () => {
    render(
      <EpisodeGroupCard
        group={group}
        backdropSrc={undefined}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkWatched={vi.fn()}
      />
    );
    expect(screen.getByText('E04')).toBeInTheDocument();
  });
});
