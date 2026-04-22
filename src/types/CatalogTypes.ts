// ============================================================
// Catalog Types — Shared + User-specific data for the new
// Firebase structure (catalog/series, users/{uid}/series, etc.)
// ============================================================

// --------------- Shared catalog data (stored once) ---------------

export interface CatalogSeries {
  title: string;
  poster: string;
  genres: string[];
  providers: { id: number; logo: string; name: string }[];
  imdbId: string | null;
  woUrl: string | null;
  production: boolean;
  episodeCount: number;
  episodeRuntime: number;
  watchtime: number;
  seasonCount: number;
  lastUpdated: number;
  seasons?: Record<string, CatalogSeason>;
}

export interface CatalogSeason {
  seasonNumber: number;
  episodes: CatalogEpisode[];
}

export interface CatalogEpisode {
  id: number | null;
  name: string;
  airDate: string | null;
  airstamp?: string | null;
  seasonNumber: number;
  episodeNumber: number;
  runtime?: number | null;
}

export interface CatalogMovie {
  title: string;
  poster: string;
  genres: string[];
  providers: { id: number; logo: string; name: string }[];
  imdbId: string | null;
  woUrl: string | null;
  runtime: number;
  status: string | null;
  releaseDate: string | null;
  collectionId: number | null;
  lastUpdated: number;
}

// --------------- User-specific references ---------------

export interface UserSeriesRef {
  rating: Record<string, number>;
  begpirate: string;
  beschreibung?: string;
  hidden?: boolean;
  watchlist?: boolean;
  addedAt?: string;
  legacyNmr?: number;
  rewatch?: {
    active: boolean;
    round: number;
    startedAt?: string;
    lastWatchedAt?: string;
    rewatchedEps?: Record<string, true>;
  };
}

export interface UserMovieRef {
  rating: Record<string, number>;
  begpirate: string;
  beschreibung?: string;
  watchlist?: boolean;
  watched?: boolean;
  watchedAt?: string;
  ratedAt?: string;
  addedAt?: string;
  legacyNmr?: number;
  watchHistory?: Array<{
    timestamp: string;
    rating?: number;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  }>;
}

// --------------- Watch data ---------------

export interface EpisodeWatchData {
  watched?: boolean;
  watchCount?: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
}

export interface SeasonWatchData {
  episodes: Record<string, EpisodeWatchData>;
}

export interface SeriesWatchData {
  seasons: Record<string, SeasonWatchData>;
}
