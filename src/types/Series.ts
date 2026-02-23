export interface Series {
  begründung: string;
  beschreibung?: string;
  episodeCount: number;
  episodeRuntime: number;
  genre: {
    genres: string[];
  };
  id: number;
  imdb: {
    imdb_id: string;
  };
  nmr: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  poster: {
    poster: string;
  };
  production?: {
    production: boolean;
  };
  provider?: {
    provider: {
      id: number;
      logo: string;
      name: string;
    }[];
  };
  rating: {
    [key: string]: number;
  };
  seasonCount: number;
  seasons: {
    seasonNumber: number;
    season_number?: number; // TMDB format alternative
    episodes: {
      air_date: string;
      id: number;
      name: string;
      watched: boolean;
      watchCount?: number;
      firstWatchedAt?: string;
      lastWatchedAt?: string;
      runtime?: number; // Episodenlänge in Minuten (von TVDB)
      episode_number?: number; // TMDB format
      airDate?: string; // Alternative date format
      firstAired?: string; // Another alternative date format
    }[];
  }[];
  title: string;
  watchtime: number;
  wo: {
    wo: string;
  };
  watchlist?: boolean;
  hidden?: boolean;
  release_date: string;
  media_type?: string;
  // Note: userRating is stored in rating[userId], not as separate field
  
  // Additional optional fields from TMDB API or other sources
  overview?: string;
  backdrop?: string;
  name?: string; // Alternative to title
  genres?: { id: number; name: string }[]; // TMDB genre format
  tmdb_id?: number;
  watch_providers?: Record<string, unknown>; // Provider data from TMDB
  first_air_date?: string;
  status?: string;
  cast?: { id: number; name: string; character?: string; profile_path?: string }[]; // Cast data from TMDB
}
