// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';
import type { GroupedSchedule } from './useCalendarData';

vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isDesktop: true }) }));
vi.mock('./EpisodeCard', () => ({
  SingleEpisodeCard: () => <div data-testid="single-ep" />,
  EpisodeGroupCard: () => <div data-testid="group-ep" />,
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

import { CalendarGrid } from './CalendarGrid';

const ep = (over: Partial<WeeklyEpisode> = {}): WeeklyEpisode => ({
  seriesId: 7,
  seriesTitle: 'Show',
  poster: '/p.jpg',
  seasonNumber: 1,
  episodeNumber: 1,
  episodeName: 'Pilot',
  airDate: '2026-07-01',
  watched: false,
  seasonIndex: 0,
  episodeIndex: 0,
  runtime: 40,
  providerNames: [],
  providers: [],
  ...over,
});

const schedule: GroupedSchedule = new Map([
  ['2026-07-01', [{ seriesId: 7, seriesTitle: 'Show', episodes: [ep()] }]],
  [
    '2026-07-02',
    [
      {
        seriesId: 8,
        seriesTitle: 'Other',
        episodes: [ep({ seriesId: 8 }), ep({ seriesId: 8, episodeNumber: 2 })],
      },
    ],
  ],
]);

afterEach(() => cleanup());

describe('CalendarGrid', () => {
  it('renders a single episode card for days with one episode', () => {
    render(
      <CalendarGrid
        groupedSchedule={schedule}
        todayKey="2026-07-01"
        backdrops={{}}
        expandedGroups={new Set()}
        onToggleGroup={vi.fn()}
        onMarkWatched={vi.fn()}
      />
    );
    expect(screen.getByTestId('single-ep')).toBeInTheDocument();
  });

  it('renders a group card for days with multiple episodes of one series', () => {
    render(
      <CalendarGrid
        groupedSchedule={schedule}
        todayKey="2026-07-01"
        backdrops={{}}
        expandedGroups={new Set()}
        onToggleGroup={vi.fn()}
        onMarkWatched={vi.fn()}
      />
    );
    expect(screen.getByTestId('group-ep')).toBeInTheDocument();
  });

  it('renders a weekday label for each day cell', () => {
    const { container } = render(
      <CalendarGrid
        groupedSchedule={schedule}
        todayKey="2026-07-01"
        backdrops={{}}
        expandedGroups={new Set()}
        onToggleGroup={vi.fn()}
        onMarkWatched={vi.fn()}
      />
    );
    expect(container.querySelectorAll('.cal-day').length).toBe(2);
  });
});
