import { useMemo } from 'react';
import type { MovieCountdown } from '../../lib/watch/movieCountdown';
import { useMovieCountdowns } from './useMovieCountdowns';
import { useSeriesCountdowns, type SeriesCountdown } from './useSeriesCountdowns';

export type CountdownItem = SeriesCountdown | MovieCountdown;

export const isMovieCountdown = (item: CountdownItem): item is MovieCountdown =>
  item.type === 'movie-release';

export const countdownKey = (item: CountdownItem): string =>
  isMovieCountdown(item) ? `movie-${item.movieId}` : `series-${item.seriesId}`;

export const countdownPath = (item: CountdownItem): string =>
  isMovieCountdown(item) ? `/movie/${item.movieId}` : `/series/${item.seriesId}`;

export function useCountdowns() {
  const series = useSeriesCountdowns();
  const movies = useMovieCountdowns();

  const countdowns = useMemo<CountdownItem[]>(
    () =>
      [...series.countdowns, ...movies.countdowns].sort(
        (a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title)
      ),
    [series.countdowns, movies.countdowns]
  );

  return {
    countdowns,
    seriesCountdowns: series.countdowns,
    movieCountdowns: movies.countdowns,
    loading: countdowns.length === 0 && (series.loading || movies.loading),
  };
}
