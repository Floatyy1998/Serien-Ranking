import firebase from 'firebase/compat/app';

export interface ActivityLog {
  type:
    | 'series_added'
    | 'series_deleted'
    | 'episode_watched'
    | 'series_rated'
    | 'movie_added'
    | 'movie_deleted'
    | 'movie_rated';
  seriesTitle?: string;
  movieTitle?: string;
  episodeInfo?: string;
  rating?: number;
  tmdbId?: number;
  timestamp: number;
}

export const logActivity = async (
  userId: string,
  activity: Omit<ActivityLog, 'timestamp'>
) => {
  try {
    const activityWithTimestamp: ActivityLog = {
      ...activity,
      timestamp: Date.now(),
    };

    const activitiesRef = firebase.database().ref(`activities/${userId}`);
    await activitiesRef.push(activityWithTimestamp);
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
