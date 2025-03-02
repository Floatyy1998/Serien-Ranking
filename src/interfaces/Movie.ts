export interface Movie {
  nmr: number;
  begründung: string;
  beschreibung: string;
  genre: {
    genres: string[];
  };
  id: number;
  imdb: {
    imdb_id: string;
  };
  poster: {
    poster: string;
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
  runtime: number;
  title: string;
  wo: {
    wo: string;
  };
  watchlist?: boolean;
  status?: string;
  release_date?: string;
  collection_id?: number;
}
