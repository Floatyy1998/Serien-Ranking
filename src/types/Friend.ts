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
  timestamp?: number; // Alternatives Timestamp-Feld
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
    | 'rating_updated_movie'
    | 'series_rated'
    | 'movie_rated'
    | 'series_added_to_watchlist'
    | 'series_removed_from_watchlist'
    | 'movie_added_to_watchlist'
    | 'movie_removed_from_watchlist';
  itemTitle: string;
  tmdbId?: number; // TMDB ID für Serien/Filme (bevorzugt)
  itemId?: number | string; // Fallback-ID wenn tmdbId fehlt
  itemType?: 'series' | 'movie'; // Typ des Items
  posterPath?: string; // Poster-Pfad aus Activity-Daten
  poster?: string; // Alternativer Poster-Pfad
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
