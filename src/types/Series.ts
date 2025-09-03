export interface Series {
  begründung: string;
  beschreibung: string;
  episodeCount: number;
  episodeRuntime: number;
  genre: {
    genres: string[];
  };
  id: number;
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
    episodes: {
      air_date: string;
      id: number;
      name: string;
      watched: boolean;
      watchCount?: number;
      firstWatchedAt?: string;
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
}
