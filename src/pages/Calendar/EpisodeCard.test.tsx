// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('@mui/icons-material', () => ({
  Check: () => null,
  ExpandMore: () => null,
  Star: () => <span data-testid="star-filled" />,
  StarBorder: () => <span data-testid="star-outline" />,
}));
vi.mock('../../hooks/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({
    activeProviders: new Set<string>(),
    getSeriesOverride: () => null,
    getKnownProviders: () => [],
  }),
}));
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
  userRating: 0,
  ...over,
});

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('SingleEpisodeCard', () => {
  it('renders the series title and episode code', () => {
    render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    expect(screen.getAllByText('Severance').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/S02E03/).length).toBeGreaterThan(0);
  });

  it('navigates to the episode route when the card is clicked', () => {
    const { container } = render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    const card = container.querySelector('.cal-ep') as HTMLElement;
    fireEvent.click(card);
    expect(navigateMock).toHaveBeenCalledWith('/episode/42/s/2/e/3');
  });

  it('shows the own series rating and opens the quick rating sheet', () => {
    const onRate = vi.fn();
    const { container } = render(
      <SingleEpisodeCard
        ep={ep({ userRating: 8.5 })}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={onRate}
      />
    );
    const chip = container.querySelector('.cal-ep-rate') as HTMLElement;
    expect(chip.textContent).toContain('8.5');
    expect(chip.className).toContain('is-rated');
    fireEvent.click(chip);
    expect(onRate).toHaveBeenCalledWith(42);
    // Der Klick darf die Karte nicht mit aufziehen
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('marks an unrated series with an outlined star instead of a value', () => {
    const { container } = render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    const chip = container.querySelector('.cal-ep-rate') as HTMLElement;
    expect(chip.textContent).not.toMatch(/\d/);
    expect(chip.querySelector('[data-testid="star-outline"]')).not.toBeNull();
    expect(chip.className).not.toContain('is-rated');
  });

  it('marks the episode watched via the mark button', () => {
    const onMark = vi.fn();
    const { container } = render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={onMark}
        onRateSeries={vi.fn()}
      />
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
        onRateSeries={vi.fn()}
      />
    );
    expect(screen.getAllByText(/2 Folgen · 0 gesehen/).length).toBeGreaterThan(0);
  });

  it('shows the series rating in the group header', () => {
    const onRate = vi.fn();
    const { container } = render(
      <EpisodeGroupCard
        group={{ ...group, episodes: group.episodes.map((e) => ({ ...e, userRating: 7.25 })) }}
        backdropSrc={undefined}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkWatched={vi.fn()}
        onRateSeries={onRate}
      />
    );
    const chip = container.querySelector('.cal-ep-rate') as HTMLElement;
    expect(chip.textContent).toContain('7.3');
    fireEvent.click(chip);
    expect(onRate).toHaveBeenCalledWith(42);
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
        onRateSeries={vi.fn()}
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
        onRateSeries={vi.fn()}
      />
    );
    expect(screen.getByText('E04')).toBeInTheDocument();
  });
});
