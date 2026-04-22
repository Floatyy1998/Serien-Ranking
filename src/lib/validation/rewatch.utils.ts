import type { Series } from '../../types/Series';
import { normalizeEpisodes } from '../episode/seriesMetrics';

type Episode = Series['seasons'][number]['episodes'][number];

export interface NextRewatchEpisode {
  id: number;
  name: string;
  air_date: string;
  seasonNumber: number;
  seasonIndex: number;
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
 * Ein Ep qualifiziert wenn es gesehen ist und noch nicht in der aktuellen
 * Rewatch-Runde (rewatch.rewatchedEps) abgehakt wurde. watchCount ist nicht
 * mehr entkoppelt: der User entscheidet per Swipe welche Eps "done" sind,
 * unabhaengig von der tatsaechlichen View-Zahl.
 * Gibt null zurück wenn: kein aktiver Rewatch, keine Seasons, oder alle Episoden fertig.
 */
export const getNextRewatchEpisode = (series: Series): NextRewatchEpisode | null => {
  if (!series.seasons || series.seasons.length === 0) return null;
  if (!hasActiveRewatch(series)) return null;

  const targetWatchCount = Math.max(2, (series.rewatch?.round || 0) + 1);
  const rewatchedEps = series.rewatch?.rewatchedEps || {};

  for (let sIdx = 0; sIdx < series.seasons.length; sIdx++) {
    const season = series.seasons[sIdx];
    if (!season || typeof season !== 'object') continue;
    const episodes: Episode[] = Array.isArray(season.episodes)
      ? season.episodes
      : season.episodes
        ? Object.values(season.episodes)
        : [];
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      if (!episode || typeof episode !== 'object' || episode.episode_number == null) continue;
      if (!episode.watched) continue;
      const currentWatchCount = episode.watchCount || 1;

      // Ep gilt als "done fuer diese Runde" wenn:
      //  - bereits explizit in rewatchedEps gemarkt, ODER
      //  - watchCount hat das Round-Target bereits erreicht (z.B. beim
      //    Neustart eines Rewatch zaehlen schon vorhandene Rewatches mit)
      const explicitlyDone = episode.id ? !!rewatchedEps[String(episode.id)] : false;
      const impliedDone = currentWatchCount >= targetWatchCount;
      if (explicitlyDone || impliedDone) continue;

      return {
        ...episode,
        seasonNumber: season.seasonNumber,
        seasonIndex: sIdx,
        episodeIndex: i,
        currentWatchCount,
        targetWatchCount,
      };
    }
  }

  return null;
};

/**
 * Berechnet den Rewatch-Fortschritt einer Serie.
 * Zählt gesehene Episoden die in der aktuellen Rewatch-Runde abgehakt wurden.
 * Gibt { current: 0, total: 0 } für leere/uninitialisierte Serien.
 */
export const getRewatchProgress = (series: Series): { current: number; total: number } => {
  if (!series.seasons || series.seasons.length === 0) {
    return { current: 0, total: 0 };
  }

  const rewatchedEps = series.rewatch?.rewatchedEps || {};
  const targetWatchCount = Math.max(2, (series.rewatch?.round || 0) + 1);
  let totalWatchedEpisodes = 0;
  let episodesRewatchedInRound = 0;

  for (const season of series.seasons) {
    const episodes = normalizeEpisodes(season.episodes);
    for (const episode of episodes) {
      if (!episode.watched) continue;
      totalWatchedEpisodes++;
      const explicitlyDone = episode.id ? !!rewatchedEps[String(episode.id)] : false;
      const impliedDone = (episode.watchCount || 1) >= targetWatchCount;
      if (explicitlyDone || impliedDone) episodesRewatchedInRound++;
    }
  }

  return {
    current: episodesRewatchedInRound,
    total: totalWatchedEpisodes,
  };
};

/**
 * Prüft ob mindestens eine Staffel komplett gesehen wurde.
 * Ermöglicht Rewatch auch wenn die Serie noch nicht komplett durch ist.
 * Gibt false zurück für leere Seasons oder Seasons ohne Episoden.
 */
export const hasAnySeasonFullyWatched = (series: Series): boolean => {
  if (!series.seasons || series.seasons.length === 0) return false;

  for (const season of series.seasons) {
    const episodes = normalizeEpisodes(season.episodes);
    if (episodes.length === 0) continue;
    if (episodes.every((ep) => ep.watched)) return true;
  }
  return false;
};

/**
 * Prüft ob alle Episoden einer Serie gesehen wurden und alle den gleichen watchCount haben.
 * Gibt false zurück für: leere Seasons, ungesehene Episoden, inkonsistente watchCounts.
 */
const isSeriesFullyWatched = (series: Series): boolean => {
  if (!series.seasons || series.seasons.length === 0) return false;

  let watchCount: number | null = null;

  for (const season of series.seasons) {
    const episodes = normalizeEpisodes(season.episodes);
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
    const episodes = normalizeEpisodes(season.episodes);
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
 * Gibt 0 zurück für leere/uninitialisierte Serien oder wenn keine Episode gesehen wurde.
 */
export const getMaxWatchCount = (series: Series): number => {
  if (!series.seasons || series.seasons.length === 0) return 0;

  let maxWatchCount = 0;
  for (const season of series.seasons) {
    const episodes = normalizeEpisodes(season.episodes);
    for (const episode of episodes) {
      if (episode.watched) {
        maxWatchCount = Math.max(maxWatchCount, episode.watchCount || 1);
      }
    }
  }
  return maxWatchCount;
};
