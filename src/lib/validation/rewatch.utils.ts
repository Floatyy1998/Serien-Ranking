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
 * Prüft ob eine Serie aktive Rewatches hat
 * Eine Serie hat aktive Rewatches wenn mindestens eine Episode öfter geschaut wurde als andere
 */
export const hasActiveRewatch = (series: Series): boolean => {
  if (!series.seasons || series.seasons.length === 0) return false;

  let maxWatchCount = 0;
  let hasWatchedEpisodes = false;

  // Finde die höchste watchCount in der Serie
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    
    for (const episode of episodes) {
      if (episode.watched) {
        hasWatchedEpisodes = true;
        const watchCount = episode.watchCount || 1;
        maxWatchCount = Math.max(maxWatchCount, watchCount);
      }
    }
  }

  if (!hasWatchedEpisodes || maxWatchCount <= 1) {
    return false;
  }

  // Prüfe ob es Episoden gibt, die weniger oft geschaut wurden als das Maximum
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (episode.watched) {
        const watchCount = episode.watchCount || 1;
        if (watchCount < maxWatchCount) {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  return false;
};

/**
 * Findet die nächste Episode für einen Rewatch
 * Logik: Episoden die am wenigsten oft geschaut wurden haben Priorität
 */
export const getNextRewatchEpisode = (series: Series): NextRewatchEpisode | null => {
  if (!series.seasons || series.seasons.length === 0) return null;
  if (!hasActiveRewatch(series)) return null;

  let maxWatchCount = 0;
  let minWatchCount = Infinity;

  // Finde min und max watchCount
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (episode.watched) {
        const watchCount = episode.watchCount || 1;
        maxWatchCount = Math.max(maxWatchCount, watchCount);
        minWatchCount = Math.min(minWatchCount, watchCount);
      } else {
        minWatchCount = 0; // Ungesehene Episoden haben Priorität
      }
    }
  }

  // Suche die erste Episode mit der niedrigsten watchCount
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      const currentWatchCount = episode.watched ? (episode.watchCount || 1) : 0;
      
      if (currentWatchCount < maxWatchCount) {
        return {
          ...episode,
          seasonNumber: season.seasonNumber,
          episodeIndex: i,
          currentWatchCount,
          targetWatchCount: maxWatchCount,
        };
      }
    }
  }

  return null;
};

/**
 * Prüft ob eine Serie komplett gerewatch wurde
 * (alle Episoden haben die gleiche, maximale watchCount)
 */
export const isRewatchComplete = (series: Series): boolean => {
  if (!hasActiveRewatch(series)) return false;

  let maxWatchCount = 0;
  let hasWatchedEpisodes = false;

  // Finde die höchste watchCount
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      if (episode.watched) {
        hasWatchedEpisodes = true;
        const watchCount = episode.watchCount || 1;
        maxWatchCount = Math.max(maxWatchCount, watchCount);
      }
    }
  }

  if (!hasWatchedEpisodes || maxWatchCount <= 1) return false;

  // Prüfe ob alle Episoden die maximale watchCount haben
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      const currentWatchCount = episode.watched ? (episode.watchCount || 1) : 0;
      if (currentWatchCount < maxWatchCount) {
        return false; // Es gibt noch Episoden die nicht auf dem Maximum sind
      }
    }
  }

  return true;
};

/**
 * Berechnet den Rewatch-Fortschritt einer Serie
 */
export const getRewatchProgress = (series: Series): { current: number, total: number } => {
  if (!series.seasons || series.seasons.length === 0) {
    return { current: 0, total: 0 };
  }

  let maxWatchCount = 0;
  let totalEpisodes = 0;
  let episodesAtMaxCount = 0;

  // Finde die höchste watchCount
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      totalEpisodes++;
      if (episode.watched) {
        const watchCount = episode.watchCount || 1;
        maxWatchCount = Math.max(maxWatchCount, watchCount);
      }
    }
  }

  // Zähle Episoden die bereits die maximale Anzahl erreicht haben
  for (const season of series.seasons) {
    const episodes = toEpisodesArray(season.episodes);
    for (const episode of episodes) {
      const currentWatchCount = episode.watched ? (episode.watchCount || 1) : 0;
      if (currentWatchCount >= maxWatchCount) {
        episodesAtMaxCount++;
      }
    }
  }

  return {
    current: episodesAtMaxCount,
    total: totalEpisodes
  };
};