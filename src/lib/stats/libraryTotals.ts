/** Lebenslange Gesamtzahlen einer Bibliothek — Quelle fuer die Stats-Seite und
 *  fuer den veroeffentlichten Schnappschuss der Gesamt-Rangliste. */

import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';
import {
  DEFAULT_EPISODE_RUNTIME_MINUTES,
  isEpisodeWatched,
  normalizeEpisodes,
  normalizeSeasons,
} from '../episode/seriesMetrics';
import { isMovieWatched } from '../rating/rating';

export const DEFAULT_MOVIE_RUNTIME_MINUTES = 120;

export interface LibraryTotals {
  /** Serien + Filme, Rewatches mehrfach gezaehlt. */
  watchtimeMinutes: number;
  seriesMinutes: number;
  movieMinutes: number;
  /** Gesehene Folgen, Rewatches mehrfach gezaehlt. */
  episodes: number;
  /** Serien mit mindestens einer gesehenen Folge. */
  seriesStarted: number;
  /** Serien, bei denen jede ausgestrahlte Folge gesehen ist. */
  seriesCompleted: number;
  movies: number;
}

export const EMPTY_LIBRARY_TOTALS: LibraryTotals = {
  watchtimeMinutes: 0,
  seriesMinutes: 0,
  movieMinutes: 0,
  episodes: 0,
  seriesStarted: 0,
  seriesCompleted: 0,
  movies: 0,
};

type Episode = Series['seasons'][number]['episodes'][number];

/** Folgen ohne Datum zaehlen als ausgestrahlt — sonst faellt der halbe
 *  Alt-Bestand aus der Wertung. */
export const countsAsAired = (ep: Episode): boolean => hasEpisodeAired(ep) || !ep.air_date;

/** Wie oft die Folge gesehen wurde; Legacy-Rows ohne watchCount zaehlen als 1. */
export const episodeWatchCount = (ep: Episode): number =>
  ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1;

export const episodeMinutes = (ep: Episode, seriesRuntime: number): number =>
  (ep.runtime || seriesRuntime) * episodeWatchCount(ep);

export interface SeriesTotals {
  watchtimeMinutes: number;
  episodes: number;
  airedEpisodes: number;
  isStarted: boolean;
  isCompleted: boolean;
}

export const computeSeriesTotals = (series: Series): SeriesTotals => {
  const seriesRuntime = series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;
  let watchtimeMinutes = 0;
  let episodes = 0;
  let airedEpisodes = 0;
  let distinctWatched = 0;

  for (const season of normalizeSeasons(series.seasons)) {
    for (const ep of normalizeEpisodes(season.episodes)) {
      if (!countsAsAired(ep)) continue;
      airedEpisodes++;
      if (!isEpisodeWatched(ep)) continue;
      distinctWatched++;
      episodes += episodeWatchCount(ep);
      watchtimeMinutes += episodeMinutes(ep, seriesRuntime);
    }
  }

  return {
    watchtimeMinutes,
    episodes,
    airedEpisodes,
    isStarted: distinctWatched > 0,
    isCompleted: airedEpisodes > 0 && airedEpisodes === distinctWatched,
  };
};

export const computeMovieTotals = (
  movies: Movie[]
): { watchtimeMinutes: number; count: number } => {
  let watchtimeMinutes = 0;
  let count = 0;
  for (const movie of movies) {
    if (!movie || !isMovieWatched(movie)) continue;
    count++;
    watchtimeMinutes += movie.runtime || DEFAULT_MOVIE_RUNTIME_MINUTES;
  }
  return { watchtimeMinutes, count };
};

/** `series` muss die vollstaendige Liste inklusive versteckter Serien sein —
 *  gesehen ist gesehen, auch wenn die Serie ausgeblendet wurde. */
export const computeLibraryTotals = (series: Series[], movies: Movie[]): LibraryTotals => {
  let seriesMinutes = 0;
  let episodes = 0;
  let seriesStarted = 0;
  let seriesCompleted = 0;

  for (const item of series) {
    if (!item) continue;
    const totals = computeSeriesTotals(item);
    seriesMinutes += totals.watchtimeMinutes;
    episodes += totals.episodes;
    if (totals.isStarted) seriesStarted++;
    if (totals.isCompleted) seriesCompleted++;
  }

  const movieTotals = computeMovieTotals(movies);

  return {
    watchtimeMinutes: seriesMinutes + movieTotals.watchtimeMinutes,
    seriesMinutes,
    movieMinutes: movieTotals.watchtimeMinutes,
    episodes,
    seriesStarted,
    seriesCompleted,
    movies: movieTotals.count,
  };
};
