/**
 * 🚫 Disabled Unified Activity Logger
 * 
 * Ersetzt das alte unifiedActivityLogger mit Clean Activity Logger Calls.
 * Weiterleitung an das neue System.
 */

import { 
  logEpisodeWatchedClean,
  logBatchEpisodesWatchedClean,
  logSeasonWatchedClean,
  logSeriesAddedClean,
  logMovieAddedClean,
  logRatingClean,
  // logWatchlistAddedClean entfernt
} from './cleanActivityLogger';
import type { EarnedBadge } from './badgeSystem';

// ====================================================================
// 📺 EPISODE & SEASON LOGGING - Weiterleitung an Clean System
// ====================================================================

/**
 * 📺 Episode geschaut - Weiterleitung an Clean System
 */
export const logEpisodeWatchedUnified = async (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  tmdbId: number,
  airDate?: string,
  isRewatch: boolean = false
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Weiterleitung an Clean System (Episode)');
  return await logEpisodeWatchedClean(
    userId,
    seriesTitle,
    seasonNumber,
    episodeNumber,
    tmdbId,
    airDate,
    isRewatch
  );
};

/**
 * 📺 Mehrere Episoden geschaut - Weiterleitung an Clean System
 */
export const logBatchEpisodesWatchedUnified = async (
  userId: string,
  seriesTitle: string,
  episodeCount: number,
  tmdbId: number,
  batchType: 'season' | 'multiple' | 'rewatch' = 'multiple',
  isRewatch: boolean = false,
  airDates?: string[]
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Weiterleitung an Clean System (Batch)');
  return await logBatchEpisodesWatchedClean(
    userId,
    seriesTitle,
    episodeCount,
    tmdbId,
    batchType,
    isRewatch,
    airDates
  );
};

/**
 * 📺 Ganze Staffel geschaut - Weiterleitung an Clean System
 */
export const logSeasonWatchedUnified = async (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeCount: number,
  tmdbId: number,
  isRewatch: boolean = false
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Weiterleitung an Clean System (Season)');
  return await logSeasonWatchedClean(
    userId,
    seriesTitle,
    seasonNumber,
    episodeCount,
    tmdbId,
    isRewatch
  );
};

// ====================================================================
// 📋 WATCHLIST LOGGING - Weiterleitung an Clean System
// ====================================================================

/**
 * 📺 Serie zur Watchlist hinzugefügt - ENTFERNT (Social Badges nutzen jetzt Friends)
 */
export const logSeriesAddedToWatchlistUnified = async (
  _userId: string,
  _seriesTitle: string,
  _tmdbId: number
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Watchlist-Logging entfernt - Social Badges nutzen jetzt Friends');
  return [];
};

/**
 * 🎬 Film zur Watchlist hinzugefügt - ENTFERNT (Social Badges nutzen jetzt Friends)
 */
export const logMovieAddedToWatchlistUnified = async (
  _userId: string,
  _movieTitle: string,
  _tmdbId: number
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Watchlist-Logging entfernt - Social Badges nutzen jetzt Friends');
  return [];
};

// ====================================================================
// ➕ CONTENT ADDING - Weiterleitung an Clean System
// ====================================================================

/**
 * ➕ Serie hinzugefügt - Weiterleitung an Clean System
 */
export const logSeriesAddedUnified = async (
  userId: string,
  seriesTitle: string,
  tmdbId: number,
  _genres?: string[],
  firstAirDate?: string
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Weiterleitung an Clean System (Series Added)');
  return await logSeriesAddedClean(
    userId,
    seriesTitle,
    tmdbId,
    firstAirDate
  );
};

/**
 * ➕ Film hinzugefügt - Weiterleitung an Clean System
 */
export const logMovieAddedUnified = async (
  userId: string,
  movieTitle: string,
  tmdbId: number,
  _genres?: string[],
  releaseDate?: string
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Weiterleitung an Clean System (Movie Added)');
  return await logMovieAddedClean(
    userId,
    movieTitle,
    tmdbId,
    releaseDate
  );
};

// ====================================================================
// ⭐ RATING LOGGING - Weiterleitung an Clean System
// ====================================================================

/**
 * ⭐ Serie bewertet - Weiterleitung an Clean System
 */
export const logSeriesRatedUnified = async (
  userId: string,
  seriesTitle: string,
  rating: number,
  tmdbId: number
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Weiterleitung an Clean System (Series Rating)');
  return await logRatingClean(userId, tmdbId.toString(), seriesTitle, rating, 'series');
};

/**
 * ⭐ Film bewertet - Weiterleitung an Clean System
 */
export const logMovieRatedUnified = async (
  userId: string,
  movieTitle: string,
  rating: number,
  tmdbId: number
): Promise<EarnedBadge[]> => {
  console.log('🔄 Unified Logger: Weiterleitung an Clean System (Movie Rating)');
  return await logRatingClean(userId, tmdbId.toString(), movieTitle, rating, 'movie');
};