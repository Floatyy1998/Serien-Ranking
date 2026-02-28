export interface Movie {
  nmr: number;
  begründung: string;
  beschreibung?: string;
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
  media_type?: string;
  // Note: userRating is stored in rating[userId], not as separate field
  // watched status is derived from rating[userId] > 0

  // Additional optional fields from TMDB API
  overview?: string;
  backdrop?: string;
  watched?: boolean;
  genres?: { id: number; name: string }[]; // TMDB genre format

  // ========================================
  // Wrapped 2026 - Zeitliche Metadaten
  // ========================================
  addedAt?: string; // Wann zur Sammlung hinzugefügt (ISO-Datum)
  watchedAt?: string; // Wann angeschaut (ISO-Datum)
  ratedAt?: string; // Wann bewertet (ISO-Datum)

  // Watch-Historie für Rewatches (optional, für detaillierte Wrapped-Analyse)
  watchHistory?: {
    timestamp: string;
    rating?: number;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  }[];
}
