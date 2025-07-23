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

    console.log('Activity logged:', activityWithTimestamp);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Spezifische Helper-Funktionen
export const logSeriesAdded = (userId: string, seriesTitle: string) => {
  return logActivity(userId, {
    type: 'series_added',
    seriesTitle,
  });
};

export const logSeriesDeleted = (userId: string, seriesTitle: string) => {
  return logActivity(userId, {
    type: 'series_deleted',
    seriesTitle,
  });
};

export const logSeriesRated = (
  userId: string,
  seriesTitle: string,
  rating: number
) => {
  return logActivity(userId, {
    type: 'series_rated',
    seriesTitle,
    rating,
  });
};

export const logEpisodeWatched = (
  userId: string,
  seriesTitle: string,
  episodeInfo: string
) => {
  return logActivity(userId, {
    type: 'episode_watched',
    seriesTitle,
    episodeInfo,
  });
};

export const logMovieAdded = (userId: string, movieTitle: string) => {
  return logActivity(userId, {
    type: 'movie_added',
    movieTitle,
  });
};

export const logMovieDeleted = (userId: string, movieTitle: string) => {
  return logActivity(userId, {
    type: 'movie_deleted',
    movieTitle,
  });
};

export const logMovieRated = (
  userId: string,
  movieTitle: string,
  rating: number
) => {
  return logActivity(userId, {
    type: 'movie_rated',
    movieTitle,
    rating,
  });
};
