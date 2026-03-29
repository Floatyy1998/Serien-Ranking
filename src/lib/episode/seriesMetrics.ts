import { hasEpisodeAired } from '../../utils/episodeDate';
import type { Series } from '../../types/Series';

export const DEFAULT_EPISODE_RUNTIME_MINUTES = 45;

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

/** Normalizes seasons to an array regardless of storage format. */
export const normalizeSeasons = (seasons: Series['seasons'] | undefined): Season[] => {
  if (!seasons) return [];
  return Array.isArray(seasons) ? seasons : Object.values(seasons);
};

/** Normalizes episodes to an array regardless of storage format.
 *  Filters out null/undefined entries and malformed episodes (missing episode_number). */
export const normalizeEpisodes = (
  episodes: Episode[] | Record<string, Episode> | undefined
): Episode[] => {
  if (!episodes) return [];
  const arr = Array.isArray(episodes) ? episodes : Object.values(episodes);
  return arr.filter(
    (ep): ep is Episode => !!ep && typeof ep === 'object' && ep.episode_number != null
  );
};

/**
 * Returns true if an episode counts as "watched" under any of the legacy
 * storage formats (boolean, number 1, string "true", watchCount, or
 * firstWatchedAt timestamp).
 */
export const isEpisodeWatched = (ep: {
  firstWatchedAt?: string;
  watched?: boolean | number | string;
  watchCount?: number;
}): boolean =>
  !!(
    ep.firstWatchedAt ||
    ep.watched === true ||
    ep.watched === 1 ||
    ep.watched === 'true' ||
    (ep.watchCount && ep.watchCount > 0)
  );

export interface SeriesMetrics {
  totalAiredEpisodes: number;
  watchedEpisodes: number;
  remainingEpisodes: number;
  /** 0–100, already rounded */
  progress: number;
}

/**
 * Calculates aired/watched/remaining episode counts and progress for a series.
 * Single source of truth — replaces the same computation duplicated across
 * useContinueWatching, useWatchNextEpisodes, useTodayEpisodes, etc.
 */
export const calculateSeriesMetrics = (series: Series): SeriesMetrics => {
  let totalAiredEpisodes = 0;
  let watchedEpisodes = 0;

  for (const season of normalizeSeasons(series.seasons)) {
    for (const ep of normalizeEpisodes(season.episodes)) {
      if (hasEpisodeAired(ep)) {
        totalAiredEpisodes++;
        if (ep.watched) watchedEpisodes++;
      }
    }
  }

  const remainingEpisodes = totalAiredEpisodes - watchedEpisodes;
  const progress =
    totalAiredEpisodes > 0 ? Math.round((watchedEpisodes / totalAiredEpisodes) * 100) : 0;

  return { totalAiredEpisodes, watchedEpisodes, remainingEpisodes, progress };
};

/**
 * Returns the most recent watch timestamp across all episodes.
 * Checks both `lastWatchedAt` and `firstWatchedAt`.
 */
export const getSeriesLastWatchedAt = (series: Series): string => {
  let latest = '';
  for (const season of normalizeSeasons(series.seasons)) {
    for (const ep of normalizeEpisodes(season.episodes)) {
      if (!ep.watched) continue;
      const ts = ep.lastWatchedAt || ep.firstWatchedAt || '';
      if (ts && ts > latest) latest = ts;
    }
  }
  return latest || '1900-01-01';
};
