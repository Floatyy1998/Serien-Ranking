import { Series } from '../../types/Series';

type Episode = Series['seasons'][number]['episodes'][number];

const toEpisodesArray = (episodes: Episode[] | Record<string, Episode>): Episode[] =>
  Array.isArray(episodes) ? episodes : Object.values(episodes || {});

export interface NextRewatchEpisode {
  id: number;
  name: string;
  air_date: string;
  seasonNumber: number;
  episodeIndex: number;
  currentWatchCount: number;
  targetWatchCount: number;
}

/**
 * Prüft ob eine Serie einen aktiven Rewatch hat.
 * Basiert auf dem expliziten rewatch.active Flag.
 */
export const hasActiveRewatch = (series: Series): boolean => {
  return !!series.rewatch?.active;
};

/**
 * Gibt die aktuelle Rewatch-Runde zurück.
 * Basiert auf dem expliziten rewatch.round Feld.
 */
export const getRewatchRound = (series: Series): number => {
  return series.rewatch?.round || 0;
};

/**
 * Findet die nächste Episode für einen Rewatch.
 * Sucht die erste gesehene Episode deren watchCount noch unter der Ziel-Runde liegt.
 */
export const getNextRewatchEpisode = (series: Series): NextRewatchEpisode | null => {
  if (!series.seasons || series.seasons.length === 0) return null;
  if (!hasActiveRewatch(series)) return null;

  // Ensure target is at least 2 — an active rewatch always means "watch again"
  const targetWatchCount = Math.max(2, (series.rewatch?.round || 0) + 1);

  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      if (!episode.watched) continue;
      const currentWatchCount = episode.watchCount || 1;

      if (currentWatchCount < targetWatchCount) {
        return {
          ...episode,
          seasonNumber: season.seasonNumber,
          episodeIndex: i,
          currentWatchCount,
          targetWatchCount,
        };
      }
    }
  }

  return null;
};

/**
 * Prüft ob ein aktiver Rewatch abgeschlossen ist.
 * Alle gesehenen Episoden haben die Ziel-watchCount erreicht.
 */
export const isRewatchComplete = (series: Series): boolean => {
  if (!hasActiveRewatch(series)) return false;

  const targetWatchCount = Math.max(2, (series.rewatch?.round || 0) + 1);

  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (!episode.watched) continue;
      const currentWatchCount = episode.watchCount || 1;
      if (currentWatchCount < targetWatchCount) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Berechnet den Rewatch-Fortschritt einer Serie.
 * Zählt gesehene Episoden die die Ziel-watchCount erreicht haben.
 */
export const getRewatchProgress = (series: Series): { current: number; total: number } => {
  if (!series.seasons || series.seasons.length === 0) {
    return { current: 0, total: 0 };
  }

  const targetWatchCount = Math.max(2, (series.rewatch?.round || 0) + 1);
  let totalWatchedEpisodes = 0;
  let episodesAtTarget = 0;

  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (!episode.watched) continue;
      totalWatchedEpisodes++;
      const currentWatchCount = episode.watchCount || 1;
      if (currentWatchCount >= targetWatchCount) {
        episodesAtTarget++;
      }
    }
  }

  return {
    current: episodesAtTarget,
    total: totalWatchedEpisodes,
  };
};

/**
 * Prüft ob alle Episoden einer Serie gesehen wurden und alle den gleichen watchCount haben.
 * Kein aktiver Rewatch in Arbeit.
 */
export const isSeriesFullyWatched = (series: Series): boolean => {
  if (!series.seasons || series.seasons.length === 0) return false;

  let watchCount: number | null = null;

  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (!episode.watched) return false;
      const epCount = episode.watchCount || 1;
      if (watchCount === null) watchCount = epCount;
      else if (epCount !== watchCount) return false;
    }
  }

  return watchCount !== null && watchCount >= 1;
};

/**
 * Erkennt laufende Rewatches ohne explizites Flag.
 * Wenn gesehene Episoden unterschiedliche watchCounts haben (z.B. manche 2x, manche 1x),
 * läuft ein Rewatch der nie explizit gestartet wurde.
 * Gibt die vermutete Runde zurück (maxWatchCount - 1) oder 0 wenn kein impliziter Rewatch.
 */
export const getImplicitRewatchRound = (series: Series): number => {
  if (!series.seasons || series.seasons.length === 0) return 0;
  if (hasActiveRewatch(series)) return 0; // Hat schon ein explizites Flag
  if (isSeriesFullyWatched(series)) return 0; // Alle gleich → kein laufender Rewatch

  let minWatchCount = Infinity;
  let maxWatchCount = 0;
  let hasWatchedEpisodes = false;

  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (!episode.watched) continue;
      hasWatchedEpisodes = true;
      const count = episode.watchCount || 1;
      minWatchCount = Math.min(minWatchCount, count);
      maxWatchCount = Math.max(maxWatchCount, count);
    }
  }

  if (!hasWatchedEpisodes || maxWatchCount <= 1) return 0;
  if (minWatchCount === maxWatchCount) return 0; // Alle gleich

  return maxWatchCount - 1;
};

/**
 * Berechnet den maxWatchCount über alle gesehenen Episoden.
 */
export const getMaxWatchCount = (series: Series): number => {
  if (!series.seasons || series.seasons.length === 0) return 0;

  let maxWatchCount = 0;
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (episode.watched) {
        maxWatchCount = Math.max(maxWatchCount, episode.watchCount || 1);
      }
    }
  }
  return maxWatchCount;
};
