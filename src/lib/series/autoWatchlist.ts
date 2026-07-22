import type { Series } from '../../types/Series';
import { normalizeSeasons, isEpisodeWatched } from '../episode/seriesMetrics';

type AutoWatchlistSeries = Pick<Series, 'id' | 'watchlist' | 'seasons'>;

export function shouldAutoEnableWatchlist(series: AutoWatchlistSeries | null | undefined): boolean {
  if (!series || series.watchlist) return false;
  const hasAnyWatched = normalizeSeasons(series.seasons).some((s) => {
    const eps = Array.isArray(s.episodes) ? s.episodes : Object.values(s.episodes ?? {});
    return eps.some((ep) => !!ep && isEpisodeWatched(ep));
  });
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
