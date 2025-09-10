export interface Series {
  _id?: string; // MongoDB ObjectId
  begründung: string;
  beschreibung: string;
  episodeCount: number;
  episodeRuntime: number;
  genre: {
    genres: string[];
  };
  id: number;
  tmdbId?: number; // TMDB ID
  imdb: {
    imdb_id: string;
  };
  nextEpisode: {
    episode: number;
    nextEpisode: string;
    nextEpisodes: {
      absoluteNumber?: number;
      aired?: string;
      id: number;
      isMovie?: number;
      lastUpdated?: string;
      number: number;
      runtime?: number;
      seasonNumber: number;
      seriesId?: number;
      watchCount?: number;
      watched?: boolean;
      year?: string;
      name?: string;
      title?: string;
      // Legacy fields für Kompatibilität
      _links?: {
        self: {
          href: string;
        };
        show: {
          href: string;
          name: string;
        };
      };
      airdate?: string;
      airstamp?: string;
      airtime?: string;
      season?: number;
      type?: string;
      url?: string;
    }[];
    season: number;
    title?: string;
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
      episode_number?: number; // TMDB format
      airDate?: string; // Alternative date format
      firstAired?: string; // Another alternative date format
    }[];
  }[];
  title: string;
  tvMaze: {
    tvMazeID: number;
  };
  watchtime: number;
  wo: {
    wo: string;
  };
  watchlist?: boolean;
  release_date: string;
  media_type?: string;
  // Note: userRating is stored in rating[userId], not as separate field
  
  // Additional optional fields from TMDB API or other sources
  overview?: string;
  backdrop?: string;
  name?: string; // Alternative to title
  genres?: { id: number; name: string }[]; // TMDB genre format
  tmdb_id?: number;
  watch_providers?: any; // Provider data from TMDB
  first_air_date?: string;
  status?: string;
  cast?: any[]; // Cast data from TMDB
}
