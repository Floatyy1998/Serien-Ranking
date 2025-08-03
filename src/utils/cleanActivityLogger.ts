/**
 * 🧹 Clean Activity Logger
 * 
 * Ersetzt das alte unifiedActivityLogger System.
 * NUR Friend-Activities für das Freunde-System + Badge-Check über Offline-System.
 * Keine Badge-Activities mehr in Firebase.
 */

import firebase from 'firebase/compat/app';
import { getOfflineBadgeSystem } from './offlineBadgeSystem';
// import { badgeCounterService } from './badgeCounterService'; // Nicht mehr benötigt
import type { EarnedBadge } from './badgeSystem';

// 📝 Activity Types für Friend-System
interface ActivityLog {
  type: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * 🏠 Core Activity Logger - NUR für Friend-Activities
 */
const logActivity = async (userId: string, activityData: Omit<ActivityLog, 'timestamp'>): Promise<void> => {
  try {
    const activityRef = firebase.database().ref(`activities/${userId}`).push();
    await activityRef.set({
      ...activityData,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (error) {
    console.error('❌ Error logging friend activity:', error);
  }
};

/**
 * 📺 Episode geschaut - NUR Friend-Activity + Offline Badge-Check
 */
export const logEpisodeWatchedClean = async (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  tmdbId: number,
  airDate?: string,
  isRewatch: boolean = false
): Promise<EarnedBadge[]> => {
  try {
    // NUR Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'episode_watched',
      seriesTitle,
      seasonNumber,
      episodeNumber,
      tmdbId,
      isRewatch,
      airDate
    });

    // Badge-Check über Offline System
    const badgeSystem = getOfflineBadgeSystem(userId);
    return await badgeSystem.checkForNewBadges();
  } catch (error) {
    console.error('❌ Error in clean episode logging:', error);
    return [];
  }
};

/**
 * 📺 Batch Episodes geschaut - NUR Friend-Activity + Offline Badge-Check
 */
export const logBatchEpisodesWatchedClean = async (
  userId: string,
  seriesTitle: string,
  episodeCount: number,
  tmdbId: number,
  batchType: string,
  isRewatch: boolean = false,
  airDates?: string | string[]
): Promise<EarnedBadge[]> => {
  try {
    // NUR Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'episodes_watched',
      seriesTitle,
      episodeCount,
      tmdbId,
      batchType,
      isRewatch,
      airDate: Array.isArray(airDates) ? airDates[0] : airDates
    });

    // Badge-Check über Offline System
    const badgeSystem = getOfflineBadgeSystem(userId);
    return await badgeSystem.checkForNewBadges();
  } catch (error) {
    console.error('❌ Error in clean batch episode logging:', error);
    return [];
  }
};

/**
 * 📺 Staffel geschaut - NUR Friend-Activity + Offline Badge-Check
 */
export const logSeasonWatchedClean = async (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeCount: number,
  tmdbId: number,
  isRewatch: boolean = false
): Promise<EarnedBadge[]> => {
  try {
    // NUR Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: isRewatch ? 'season_rewatched' : 'season_watched',
      seriesTitle,
      seasonNumber,
      episodeCount,
      tmdbId,
      isRewatch
    });

    // Badge-Check über Offline System
    const badgeSystem = getOfflineBadgeSystem(userId);
    return await badgeSystem.checkForNewBadges();
  } catch (error) {
    console.error('❌ Error in clean season logging:', error);
    return [];
  }
};

/**
 * 📋 Serie hinzugefügt - NUR Friend-Activity + Social Counter + Offline Badge-Check
 */
export const logSeriesAddedClean = async (
  userId: string,
  seriesTitle: string,
  tmdbId: number,
  firstAirDate?: string
): Promise<EarnedBadge[]> => {
  try {
    // NUR Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'series_added',
      seriesTitle,
      tmdbId,
      firstAirDate
    });

    // Social Badges nutzen jetzt Friends statt Sammlungs-Counter

    // Badge-Check über Offline System
    const badgeSystem = getOfflineBadgeSystem(userId);
    return await badgeSystem.checkForNewBadges();
  } catch (error) {
    console.error('❌ Error in clean series adding:', error);
    return [];
  }
};

/**
 * 🎬 Film hinzugefügt - NUR Friend-Activity + Social Counter + Offline Badge-Check
 */
export const logMovieAddedClean = async (
  userId: string,
  movieTitle: string,
  tmdbId: number,
  releaseDate?: string
): Promise<EarnedBadge[]> => {
  try {
    // NUR Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: 'movie_added',
      movieTitle,
      tmdbId,
      releaseDate
    });

    // Social Badges nutzen jetzt Friends statt Sammlungs-Counter

    // Badge-Check über Offline System
    const badgeSystem = getOfflineBadgeSystem(userId);
    return await badgeSystem.checkForNewBadges();
  } catch (error) {
    console.error('❌ Error in clean movie adding:', error);
    return [];
  }
};

/**
 * ⭐ Bewertung abgegeben - NUR Friend-Activity + Offline Badge-Check
 */
export const logRatingClean = async (
  userId: string,
  tmdbId: string,
  title: string,
  rating: number,
  contentType: 'series' | 'movie'
): Promise<EarnedBadge[]> => {
  try {
    // NUR Friend-Activity für Freunde-System
    await logActivity(userId, {
      type: contentType === 'series' ? 'series_rated' : 'movie_rated',
      [contentType === 'series' ? 'seriesTitle' : 'movieTitle']: title,
      rating,
      tmdbId: parseInt(tmdbId)
    });

    // Badge-Check über Offline System
    const badgeSystem = getOfflineBadgeSystem(userId);
    return await badgeSystem.checkForNewBadges();
  } catch (error) {
    console.error('❌ Error in clean rating logging:', error);
    return [];
  }
};

// Watchlist-Logging entfernt - Social Badges nutzen jetzt Friends statt Watchlist