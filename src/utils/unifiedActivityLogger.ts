/**
 * 🏆 Unified Activity System - ALLE BADGE-KATEGORIEN
 *
 * Kombiniert Friend-Activities und Badge-Activities
 * für vollständige Aktivitätsverfolgung mit Badge-Unterstützung
 */

import { logActivity } from './activityLogger';
import {
  logBadgeMarathon,
  logBadgeMovieAdded,
  logBadgeQuickwatch,
  logBadgeRating,
  logBadgeSeriesAdded,
  logBadgeStreak,
  logBadgeWatchlistAdded,
  logBatchEpisodesWatched,
  logEpisodeWatched,
  logSeasonWatched,
} from './badgeActivityLogger';

// ====================================================================
// 📺 EPISODE & SEASON LOGGING (Binge, Marathon, Streak, Quickwatch)
// ====================================================================

/**
 * 📺 Episode geschaut - Dual-Logging (Binge/Quickwatch/Marathon/Streak)
 */
export const logEpisodeWatchedUnified = async (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  tmdbId: number,
  airDate?: string,
  isRewatch: boolean = false
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'episode_watched',
      seriesTitle,
      episodeInfo: `S${seasonNumber}E${episodeNumber}`,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Binge/Quickwatch/Marathon/Streak)
    await logEpisodeWatched(
      userId,
      seriesTitle,
      seasonNumber,
      episodeNumber,
      tmdbId,
      airDate,
      isRewatch
    );
  } catch (error) {
    // Fehler beim Unified Episode-Logging
  }
};

/**
 * 📺 Mehrere Episoden geschaut - Dual-Logging (Binge/Marathon)
 */
export const logBatchEpisodesWatchedUnified = async (
  userId: string,
  seriesTitle: string,
  episodeCount: number,
  tmdbId: number,
  batchType: 'season' | 'multiple' | 'rewatch' = 'multiple',
  isRewatch: boolean = false,
  airDates?: string[]
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'episodes_watched',
      seriesTitle,
      episodeCount,
      tmdbId,
      batchType,
      isRewatch,
    });

    // 2. Badge-Activity für Badge-System (Binge/Marathon)
    await logBatchEpisodesWatched(
      userId,
      seriesTitle,
      episodeCount,
      tmdbId,
      batchType,
      isRewatch,
      airDates
    );
  } catch (error) {
    // Fehler beim Unified Batch-Episode-Logging
  }
};

/**
 * 📺 Ganze Staffel geschaut - Dual-Logging (Binge/Marathon)
 */
export const logSeasonWatchedUnified = async (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeCount: number,
  tmdbId: number,
  isRewatch: boolean = false
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'season_watched',
      seriesTitle,
      seasonNumber,
      episodeCount,
      tmdbId,
      isRewatch,
    });

    // 2. Badge-Activity für Badge-System (Binge/Marathon)
    await logSeasonWatched(
      userId,
      seriesTitle,
      seasonNumber,
      episodeCount,
      tmdbId,
      isRewatch
    );
  } catch (error) {
    // Fehler beim Unified Season-Logging
  }
};

// ====================================================================
// 📋 WATCHLIST LOGGING (Social-Badges)
// ====================================================================

/**
 * 📺 Serie zur Watchlist hinzugefügt - Dual-Logging (Social-Badges)
 */
export const logSeriesAddedToWatchlistUnified = async (
  userId: string,
  seriesTitle: string,
  tmdbId: number
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'series_added_to_watchlist',
      seriesTitle,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Social-Badges)
    await logBadgeWatchlistAdded(userId, seriesTitle, tmdbId, 'series');
  } catch (error) {
    // Fehler beim Unified Watchlist-Logging
  }
};

// ====================================================================
// ➕ CONTENT ADDING (Explorer-Badges)
// ====================================================================

/**
 * ➕ Serie hinzugefügt - Dual-Logging (Explorer-Badges)
 */
export const logSeriesAddedUnified = async (
  userId: string,
  seriesTitle: string,
  tmdbId: number,
  genres?: string[],
  firstAirDate?: string
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'series_added',
      seriesTitle,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Explorer-Badges)
    await logBadgeSeriesAdded(
      userId,
      seriesTitle,
      tmdbId,
      genres,
      firstAirDate
    );
  } catch (error) {}
};

/**
 * 🎬 Film hinzugefügt - Dual-Logging (Explorer-Badges)
 */
export const logMovieAddedUnified = async (
  userId: string,
  movieTitle: string,
  tmdbId: number,
  genres?: string[],
  releaseDate?: string
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'movie_added',
      movieTitle,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Explorer-Badges)
    await logBadgeMovieAdded(userId, movieTitle, tmdbId, genres, releaseDate);
  } catch (error) {}
};

// ====================================================================
// ⭐ RATING LOGGING (Collector-Badges)
// ====================================================================

/**
 * ⭐ Serie bewertet - Dual-Logging (Collector-Badges)
 */
export const logSeriesRatedUnified = async (
  userId: string,
  seriesTitle: string,
  rating: number,
  tmdbId: number
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'series_rated',
      seriesTitle,
      rating,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Collector-Badges)
    await logBadgeRating(userId, seriesTitle, rating, tmdbId, 'series');
  } catch (error) {}
};

/**
 * ⭐ Film bewertet - Dual-Logging (Collector-Badges)
 */
export const logMovieRatedUnified = async (
  userId: string,
  movieTitle: string,
  rating: number,
  tmdbId: number
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'movie_rated',
      movieTitle,
      rating,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Collector-Badges)
    await logBadgeRating(userId, movieTitle, rating, tmdbId, 'movie');
  } catch (error) {}
};

/**
 * 🎯 Badge-System manuell triggern
 * Für Tests und direkte Badge-Prüfung
 */
export const triggerBadgeCheck = async (
  userId: string,
  activityData: any
): Promise<void> => {
  try {
    // Dynamischer Import um Circular Dependencies zu vermeiden
    const { BadgeSystem } = await import('./badgeSystem');
    const badgeSystem = new BadgeSystem(userId);

    const newBadges = await badgeSystem.checkForNewBadges(activityData);

    if (newBadges.length > 0) {
      // Badge-Benachrichtigungen triggern wenn verfügbar - werden automatisch angezeigt
    }
  } catch (error) {}
};

// ====================================================================
// 🏃‍♂️ MARATHON LOGGING (Marathon-Badges)
// ====================================================================

/**
 * 🏃‍♂️ Marathon-Session - Dual-Logging (Marathon-Badges)
 */
export const logMarathonUnified = async (
  userId: string,
  seriesTitle: string,
  episodeCount: number,
  tmdbId: number,
  duration?: number,
  totalRuntime?: number
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System (als Episode-Batch)
    await logActivity(userId, {
      type: 'episodes_watched',
      seriesTitle,
      episodeCount,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Marathon-Badges)
    await logBadgeMarathon(
      userId,
      seriesTitle,
      episodeCount,
      tmdbId,
      duration,
      totalRuntime
    );
  } catch (error) {
    // Fehler beim Unified Marathon-Logging
  }
};

// ====================================================================
// ⚡ QUICKWATCH LOGGING (Quickwatch-Badges)
// ====================================================================

/**
 * ⚡ Quickwatch - Dual-Logging (Quickwatch-Badges)
 */
export const logQuickwatchUnified = async (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  tmdbId: number,
  airDate: string,
  watchedWithin24h: boolean = true
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System (als normale Episode)
    await logActivity(userId, {
      type: 'episode_watched',
      seriesTitle,
      seasonNumber,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Quickwatch-Badges)
    await logBadgeQuickwatch(
      userId,
      seriesTitle,
      seasonNumber,
      episodeNumber,
      tmdbId,
      airDate,
      watchedWithin24h
    );
  } catch (error) {
    // Fehler beim Unified Quickwatch-Logging
  }
};

// ====================================================================
// 🔥 STREAK LOGGING (Streak-Badges)
// ====================================================================

/**
 * 🔥 Streak - Dual-Logging (Streak-Badges)
 */
export const logStreakUnified = async (
  userId: string,
  seriesTitle: string,
  consecutiveDays: number,
  episodeCount: number,
  tmdbId: number,
  streakType: 'daily' | 'weekly' = 'daily'
): Promise<void> => {
  try {
    // 1. Friend-Activity für Freunde-System (als Episode-Batch)
    await logActivity(userId, {
      type: 'episodes_watched',
      seriesTitle,
      episodeCount,
      tmdbId,
    });

    // 2. Badge-Activity für Badge-System (Streak-Badges)
    await logBadgeStreak(
      userId,
      seriesTitle,
      consecutiveDays,
      episodeCount,
      tmdbId,
      streakType
    );
  } catch (error) {
    // Fehler beim Unified Streak-Logging
  }
};
