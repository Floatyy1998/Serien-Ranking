/**
 * Geteilte, bewusst schlanke TMDB-Response-Shapes für den `tmdbClient`.
 * Nur die Felder, die die App tatsächlich liest — kein Voll-Mapping der API.
 */

export interface TmdbGenreRef {
  id: number;
  name: string;
}

export interface TmdbProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority?: number;
}

/** `movie/{id}` bzw. `tv/{id}` (mit optionalem append_to_response=credits,external_ids). */
export interface TmdbMediaDetail {
  id?: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genres?: TmdbGenreRef[];
  external_ids?: { imdb_id?: string };
  // TV-spezifisch
  status?: string;
  seasons?: Array<{ season_number: number; episode_count?: number }>;
  origin_country?: string[];
  original_language?: string;
  original_name?: string;
}

/** `tv/{id}/season/{n}`. */
export interface TmdbSeasonDetail {
  episodes?: Array<{
    id: number;
    name?: string;
    episode_number: number;
    air_date?: string | null;
  }>;
}

/** `.../watch/providers`. */
export interface TmdbWatchProvidersResponse {
  results?: Record<string, { flatrate?: TmdbProvider[] } | undefined>;
}
