import type { Series } from '../../types/Series';

export type Finale = 'season' | 'series' | null;

type SeasonLike = Series['seasons'][number];

function findSeason(series: Pick<Series, 'seasons'>, seasonNumber: number): SeasonLike | undefined {
  const seasons = series.seasons ?? [];
  return (
    seasons.find((s) => (s.season_number ?? s.seasonNumber) === seasonNumber) ??
    seasons[seasonNumber - 1]
  );
}

/** War die gerade gesehene Folge die letzte der Staffel oder gleich der ganzen Serie? */
export function detectFinale(
  series: Pick<Series, 'seasons' | 'production'>,
  seasonNumber: number,
  episodeNumber: number
): Finale {
  const season = findSeason(series, seasonNumber);
  const episodes = season?.episodes ?? [];
  if (!episodes.length) return null;
  const lastNumber = episodes.reduce((max, ep, i) => Math.max(max, ep.episode_number ?? i + 1), 0);
  if (episodeNumber < lastNumber) return null;
  const seasons = series.seasons ?? [];
  const isLastSeason = findSeason(series, seasonNumber) === seasons[seasons.length - 1];
  const ended = series.production?.production === false;
  return isLastSeason && ended ? 'series' : 'season';
}
