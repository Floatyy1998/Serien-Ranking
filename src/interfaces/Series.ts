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
      _links: {
        self: {
          href: string;
        };
        show: {
          href: string;
          name: string;
        };
      };
      airdate: string;
      airstamp: string;
      airtime: string;
      id: number;
      name: string;
      number: number;
      runtime: number;
      season: number;
      type: string;
      url: string;
    }[];
    season: number;
    title: string;
  };
  nmr: number;
  poster: {
    poster: string;
  };
  production: {
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
  recommendation: {
    recommendations: {
      adult: boolean;
      backdrop_path: string;
      first_air_date: string;
      genre_ids: number[];
      id: number;
      imdb_id: string;
      name: string;
      origin_country: string[];
      original_language: string;
      original_name: string;
      overview: string;
      popularity: number;
      poster_path: string;
      production: boolean;
      vote_average: number;
      vote_count: number;
      wo: string;
    }[];
  };
  title: string;
  tvMaze: {
    tvMazeID: number;
  };
  watchtime: number;
  wo: {
    wo: string;
  };
}
