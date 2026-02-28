import { Series } from '../../types/Series';

/**
 * Entfernt Episoden mit gleichem air_date in unterschiedlichen Staffeln, aber nur wenn die IDs unterschiedlich sind.
 * Wird für WatchlistDialog und SeriesListItem verwendet, damit überall die gleiche Logik gilt.
 */
export function cleanOverlappingEpisodes(series: Series) {
  if (!series.seasons || series.seasons.length <= 1) return series.seasons || [];

  // Mappe air_date auf Map von Staffelnummern zu Set von Episoden-IDs
  const airDateMap = new Map<string, Map<number, Set<number>>>();
  for (const season of series.seasons) {
    if (!season.episodes) continue;
    for (const episode of season.episodes) {
      if (!episode.air_date) continue;
      if (!airDateMap.has(episode.air_date)) {
        airDateMap.set(episode.air_date, new Map());
      }
      const seasonMap = airDateMap.get(episode.air_date)!;
      if (!seasonMap.has(season.seasonNumber)) {
        seasonMap.set(season.seasonNumber, new Set());
      }
      seasonMap.get(season.seasonNumber)!.add(episode.id);
    }
  }

  // Entferne Episoden, deren air_date in einer anderen Staffel vorkommt und deren ID unterschiedlich ist
  return series.seasons.map((season) => {
    if (!season.episodes) return season;
    const cleanedEpisodes = season.episodes.filter((episode) => {
      if (!episode.air_date) return true;
      const seasonMap = airDateMap.get(episode.air_date);
      if (!seasonMap) return true;
      // Wenn das Datum in mehreren Staffeln vorkommt
      if (seasonMap.size > 1) {
        // Ermittle die niedrigste Staffelnummer, die dieses air_date hat
        const minSeason = Math.min(...Array.from(seasonMap.keys()));
        // Entferne die Episode nur aus der Staffel mit der niedrigsten Staffelnummer
        if (season.seasonNumber === minSeason) {
          return false;
        }
      }
      return true;
    });
    if (cleanedEpisodes.length === 0) {
      // Logging für Debugging: Staffel nach Filterung leer
      // eslint-disable-next-line no-console
      // console.warn('[cleanOverlappingEpisodes] Staffel nach Filterung leer:', {
      //   seriesTitle: series.title,
      //   seasonNumber: season.seasonNumber,
      //   originalEpisodes: season.episodes.length,
      //   filteredEpisodes: cleanedEpisodes.length,
      // });
    }
    return {
      ...season,
      episodes: cleanedEpisodes,
    };
  });
}
