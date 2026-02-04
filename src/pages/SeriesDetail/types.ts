import { Series } from '../../types/Series';

/** Episode type from the Series seasons structure */
export type SeriesEpisode = Series['seasons'][number]['episodes'][number];

/** Season type from the Series seasons structure */
export type SeriesSeason = Series['seasons'][number];

/** TMDB season object returned from /tv/{id} endpoint */
export interface TMDBSeason {
  air_date: string | null;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

/** TMDB episode object returned from /tv/{id}/season/{season_number} endpoint */
export interface TMDBEpisode {
  air_date: string | null;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
}

/** TMDB genre object */
export interface TMDBGenre {
  id: number;
  name: string;
}

/** TMDB watch provider object (compatible with ProviderBadges Provider interface) */
export interface TMDBWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority?: number;
}
