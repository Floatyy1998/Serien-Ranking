import firebase from 'firebase/compat/app';
import { pushActivityWithLimit } from './activityCleanup';

export interface ActivityLog {
  type:
    | 'series_added'
    | 'series_deleted'
    | 'episode_watched'
    | 'episodes_watched'
    | 'season_watched'
    | 'season_rewatched'
    | 'series_rated'
    | 'movie_added'
    | 'movie_deleted'
    | 'movie_rated'
    | 'rewatch'
    | 'rating_added'
    | 'rating_updated'
    | 'rating_updated_movie'
    | 'watchlist_added'
    | 'watchlist_removed'
    | 'series_added_to_watchlist'
    | 'series_removed_from_watchlist'
    | 'movie_added_to_watchlist'
    | 'movie_removed_from_watchlist';
  // Badge-System Felder
  seriesTitle?: string;
  movieTitle?: string;
  episodeInfo?: string;
  episodeCount?: number;
  seasonNumber?: number;
  // Friend-System Felder
  itemTitle?: string;
  userId?: string;
  userName?: string;
  // Gemeinsame Felder
  rating?: number;
  oldRating?: number;
  tmdbId?: number;
  airDate?: string;
  isRewatch?: boolean;
  batchType?: string;
  timestamp: number;
}

export const logActivity = async (
  userId: string,
  activity: Omit<ActivityLog, 'timestamp'>
) => {
  try {
    // Lade User-Info für Friend-Activity
    const userRef = firebase.database().ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();
    const userName =
      userData?.displayName ||
      userData?.username ||
      userData?.email?.split('@')[0] ||
      'Unbekannt';

    // Erstelle Friend-kompatible Activity für bestehende Friend-Features
    const friendActivity: any = {
      userId,
      userName,
      type: activity.type,
      itemTitle:
        activity.seriesTitle || activity.movieTitle || activity.itemTitle || '',
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    };

    // Nur definierte Felder hinzufügen (Firebase erlaubt keine undefined Werte)
    if (activity.tmdbId !== undefined) {
      friendActivity.tmdbId = activity.tmdbId;
    }
    if (activity.rating !== undefined) {
      friendActivity.rating = activity.rating;
    }

    // Speichere Friend-Activity mit automatischer Limitierung
    await pushActivityWithLimit(userId, friendActivity);

    // Prüfe Badge-System nach neuen Badges
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Spezifische Helper-Funktionen
export const logSeriesAdded = (
  userId: string,
  seriesTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'series_added',
    seriesTitle,
    tmdbId,
  });
};

export const logSeriesDeleted = (
  userId: string,
  seriesTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'series_deleted',
    seriesTitle,
    tmdbId,
  });
};

export const logSeriesRated = (
  userId: string,
  seriesTitle: string,
  rating: number,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'series_rated',
    seriesTitle,
    rating,
    tmdbId,
  });
};

export const logEpisodeWatched = (
  userId: string,
  seriesTitle: string,
  episodeInfo: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'episode_watched',
    seriesTitle,
    episodeInfo,
    tmdbId,
  });
};

export const logMovieAdded = (
  userId: string,
  movieTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'movie_added',
    movieTitle,
    tmdbId,
  });
};

export const logMovieDeleted = (
  userId: string,
  movieTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'movie_deleted',
    movieTitle,
    tmdbId,
  });
};

export const logMovieRated = (
  userId: string,
  movieTitle: string,
  rating: number,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'movie_rated',
    movieTitle,
    rating,
    tmdbId,
  });
};

// Neue Badge-relevante Funktionen
export const logEpisodesWatched = (
  userId: string,
  seriesTitle: string,
  episodeCount: number,
  itemTitle: string,
  tmdbId?: number,
  isRewatch: boolean = false
) => {
  return logActivity(userId, {
    type: 'episodes_watched',
    seriesTitle,
    itemTitle,
    episodeCount,
    tmdbId,
    isRewatch,
  });
};

export const logRewatch = (
  userId: string,
  seriesTitle: string,
  episodeInfo: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'rewatch',
    seriesTitle,
    episodeInfo,
    itemTitle: episodeInfo,
    tmdbId,
    isRewatch: true,
  });
};

export const logRatingAdded = (
  userId: string,
  title: string,
  rating: number,
  tmdbId?: number,
  isMovie: boolean = false
) => {
  return logActivity(userId, {
    type: 'rating_added',
    seriesTitle: isMovie ? undefined : title,
    movieTitle: isMovie ? title : undefined,
    rating,
    tmdbId,
  });
};

export const logWatchlistAdded = (
  userId: string,
  seriesTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'watchlist_added',
    seriesTitle,
    tmdbId,
  });
};

export const logSeriesAddedToWatchlist = (
  userId: string,
  seriesTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'series_added_to_watchlist',
    seriesTitle,
    tmdbId,
  });
};

// Weitere Badge-relevante Funktionen
export const logSeasonWatched = (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeCount: number,
  tmdbId?: number,
  isRewatch: boolean = false
) => {
  return logActivity(userId, {
    type: isRewatch ? 'season_rewatched' : 'season_watched',
    seriesTitle,
    itemTitle: `${seriesTitle} - Staffel ${seasonNumber} komplett (${episodeCount} Episoden)`,
    seasonNumber,
    episodeCount,
    tmdbId,
    isRewatch,
  });
};

export const logWatchlistRemoved = (
  userId: string,
  seriesTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'watchlist_removed',
    seriesTitle,
    tmdbId,
  });
};

export const logSeriesRemovedFromWatchlist = (
  userId: string,
  seriesTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'series_removed_from_watchlist',
    seriesTitle,
    tmdbId,
  });
};

export const logMovieAddedToWatchlist = (
  userId: string,
  movieTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'movie_added_to_watchlist',
    movieTitle,
    tmdbId,
  });
};

export const logMovieRemovedFromWatchlist = (
  userId: string,
  movieTitle: string,
  tmdbId?: number
) => {
  return logActivity(userId, {
    type: 'movie_removed_from_watchlist',
    movieTitle,
    tmdbId,
  });
};

// Erweiterte Rating-Funktion mit alter Bewertung
export const logRatingUpdated = (
  userId: string,
  title: string,
  newRating: number,
  oldRating: number,
  tmdbId?: number,
  isMovie: boolean = false
) => {
  return logActivity(userId, {
    type: 'rating_added',
    seriesTitle: isMovie ? undefined : title,
    movieTitle: isMovie ? title : undefined,
    rating: newRating,
    oldRating,
    tmdbId,
  });
};

// Batch Episode Watching mit erweiterten Optionen
export const logBatchEpisodesWatched = (
  userId: string,
  seriesTitle: string,
  episodes: Array<{
    episodeNumber: number;
    seasonNumber: number;
    airDate?: string;
  }>,
  tmdbId?: number,
  isRewatch: boolean = false,
  batchType?: 'binge' | 'season_complete' | 'multiple'
) => {
  const episodeCount = episodes.length;
  const itemTitle =
    batchType === 'season_complete'
      ? `${seriesTitle} - Staffel ${
          episodes[0]?.seasonNumber
        } komplett (${episodeCount} Episoden)${isRewatch ? ' (Rewatch)' : ''}`
      : `${seriesTitle} - ${episodeCount} Episoden${
          isRewatch ? ' (Rewatch)' : ''
        }`;

  return logActivity(userId, {
    type: 'episodes_watched',
    seriesTitle,
    itemTitle,
    episodeCount,
    tmdbId,
    isRewatch,
    batchType,
    // Für Release Day Detection: Verwende das erste Episode-Datum
    airDate: episodes[0]?.airDate,
  });
};
