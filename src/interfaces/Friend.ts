export interface Friend {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  friendsSince: number; // Timestamp
  lastActive?: number;
  isOnline?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
  lastActive?: number;
}

export interface UserSearchResult {
  uid: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserEmail: string;
  toUserEmail: string;
  fromUsername?: string;
  toUsername?: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: number;
  respondedAt?: number;
}

export interface FriendActivity {
  id: string;
  userId: string;
  userName: string;
  type:
    | 'series_added'
    | 'series_deleted'
    | 'movie_added'
    | 'movie_deleted'
    | 'rating_updated'
    | 'episode_watched'
    | 'episodes_watched'
    | 'rating_updated_movie';
  itemTitle: string;
  tmdbId?: number; // TMDB ID für Serien/Filme (bevorzugt)
  rating?: number;
  timestamp: number;
}

export interface FriendStats {
  totalSeries: number;
  totalMovies: number;
  totalWatchtime: number;
  favoriteGenres: string[];
  averageRating: number;
  recentActivity: FriendActivity[];
}
