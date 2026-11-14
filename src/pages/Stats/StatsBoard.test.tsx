// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FormattedTime, StatsData } from './useStatsData';

vi.mock('./StatsComponents', () => ({ AnimatedRing: () => <svg data-testid="ring" /> }));
vi.mock('./useStatsData', () => ({ formatTimeDetailed: (m: number) => `${m} Min` }));

import { StatsCounting, StatsFigures, StatsHero, StatsProgress, StatsRanking } from './StatsBoard';

const stats = {
  progress: 60,
  watchedEpisodes: 1200,
  watchedEpisodesAll: 1500,
  hiddenSeries: 3,
  hiddenWatchedEpisodes: 300,
  totalEpisodes: 2000,
  totalSeries: 40,
  totalMovies: 12,
  watchedMovies: 9,
  completedSeries: 8,
  lastWeekWatched: 17,
  seriesMinutes: 150,
  movieMinutes: 50,
  avgSeriesRating: 7.1,
  avgMovieRating: 0,
} as unknown as StatsData;

const timeData: FormattedTime = {
  value: '2',
  unit: 'Jahre',
  details: '14 Tage',
  breakdown: [
    { value: 2, unit: 'Jahre' },
    { value: 14, unit: 'Tage' },
  ],
};

afterEach(() => cleanup());

describe('StatsBoard', () => {
  it('zeigt die Schauzeit in ihren Teilen und den Anteil von Serien und Filmen', () => {
    render(<StatsHero stats={stats} timeData={timeData} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('150 Min')).toBeInTheDocument();
    expect(screen.getByText('75 %')).toBeInTheDocument();
    expect(screen.getByText('25 %')).toBeInTheDocument();
  });

  it('rechnet den Fortschritt nur aus den sichtbaren Serien', () => {
    render(<StatsProgress stats={stats} color="#3355ff" />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('1.200')).toBeInTheDocument();
    expect(screen.getByText('von 2.000')).toBeInTheDocument();
    expect(screen.getByText('8 von 40 Serien fertig')).toBeInTheDocument();
  });

  it('zählt bei den gesehenen Folgen ausgeblendete Serien mit', () => {
    render(<StatsFigures stats={stats} />);
    expect(screen.getByText('1.500')).toBeInTheDocument();
    expect(screen.getByText('Folgen gesehen')).toBeInTheDocument();
    expect(screen.getByText('7.1')).toBeInTheDocument();
    expect(screen.queryByText('Ø Film-Wertung')).not.toBeInTheDocument();
  });

  it('listet die Rangliste mit Platz und Anzahl', () => {
    render(
      <StatsRanking
        title="Streaming-Dienste"
        items={[
          { name: 'Netflix', count: 250 },
          { name: 'Disney Plus', count: 99 },
        ]}
      />
    );
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('zeigt keine leere Rangliste', () => {
    const { container } = render(<StatsRanking title="Top Genres" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('erklärt die Zählweise nur, wenn Serien ausgeblendet sind', () => {
    const onOpenHidden = vi.fn();
    const { rerender, container } = render(
      <StatsCounting stats={stats} onOpenHidden={onOpenHidden} />
    );
    fireEvent.click(screen.getByText('Ausgeblendete Serien ansehen'));
    expect(onOpenHidden).toHaveBeenCalledTimes(1);
    rerender(
      <StatsCounting
        stats={{ ...stats, hiddenSeries: 0 } as StatsData}
        onOpenHidden={onOpenHidden}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
