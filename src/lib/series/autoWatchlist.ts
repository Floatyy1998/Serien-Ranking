import type { Series } from '../../types/Series';

type AutoWatchlistSeries = Pick<Series, 'id' | 'watchlist' | 'seasons'>;

export function shouldAutoEnableWatchlist(series: AutoWatchlistSeries | null | undefined): boolean {
  if (!series || series.watchlist) return false;
  const hasAnyWatched = series.seasons?.some((s) => s.episodes?.some((ep) => ep.watched));
  return !hasAnyWatched;
}

export function autoWatchlistUpdates(
  uid: string,
  series: AutoWatchlistSeries | null | undefined
): Record<string, unknown> {
  if (!series || !shouldAutoEnableWatchlist(series)) return {};
  return {
    [`users/${uid}/series/${series.id}/watchlist`]: true,
  };
}
