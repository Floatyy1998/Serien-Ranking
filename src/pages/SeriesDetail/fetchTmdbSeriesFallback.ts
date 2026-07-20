/**
 * TMDB-Voll-Fallback für Serien, die nicht in der eigenen Liste sind:
 * lädt Details + alle Staffeln und baut daraus ein Series-Objekt im
 * App-Format (watched=false überall). Genutzt von der Detail-Seite
 * (useSeriesData) und der Episoden-Verwaltung, damit beide Seiten
 * dieselben Serien auflösen können.
 */
import type { Series } from '../../types/Series';
import type { TMDBGenre, SeriesSeason } from './types';
import { tmdbFetch } from '../../services/tmdbClient';
import type { TmdbMediaDetail, TmdbSeasonDetail } from '../../services/tmdb.types';

export async function fetchTmdbSeriesFallback(id: string): Promise<Series | null> {
  const hasNonLatin = (text: string) => /[^ -ɏḀ-ỿ]/.test(text);
  try {
    const [data, dataEN] = await Promise.all([
      tmdbFetch<TmdbMediaDetail>(`tv/${id}`, { append_to_response: 'credits,external_ids' }),
      tmdbFetch<TmdbMediaDetail>(`tv/${id}`, { language: 'en-US' }),
    ]);
    if (!data.id) return null;
    const bestName = data.name && !hasNonLatin(data.name) ? data.name : dataEN.name || data.name;

    // Episoden von TMDB holen (deutsche Titel)
    const regularSeasons = (data.seasons || []).filter((s) => s.season_number > 0);
    const seasonsWithEpisodes: SeriesSeason[] = await Promise.all(
      regularSeasons.map(async (season) => {
        try {
          const seasonData = await tmdbFetch<TmdbSeasonDetail>(
            `tv/${id}/season/${season.season_number}`
          );
          return {
            seasonNumber: season.season_number - 1,
            episodes:
              seasonData.episodes?.map((ep) => ({
                id: ep.id,
                name: ep.name || '',
                episode_number: ep.episode_number,
                air_date: ep.air_date || '',
                watched: false,
                watchCount: 0,
              })) || [],
          };
        } catch {
          return { seasonNumber: season.season_number - 1, episodes: [] };
        }
      })
    );

    return {
      id: data.id,
      title: bestName || '',
      name: bestName || '',
      poster: { poster: data.poster_path || '' },
      genre: { genres: data.genres?.map((g: TMDBGenre) => g.name) || [] },
      provider: { provider: [] },
      seasons: seasonsWithEpisodes,
      first_air_date: data.first_air_date,
      status: data.status,
      rating: {},
      watchlist: false,
      overview: data.overview,
      backdrop: data.backdrop_path ?? undefined,
      begründung: '',
      beschreibung: data.overview || '',
      episodeCount: 0,
      episodeRuntime: 0,
      imdb: { imdb_id: data.external_ids?.imdb_id || '' },
      origin_country: data.origin_country || [],
      original_language: data.original_language || '',
      original_name: data.original_name || data.name || '',
      popularity: data.popularity || 0,
      vote_average: data.vote_average || 0,
      vote_count: data.vote_count || 0,
      seasonCount: seasonsWithEpisodes.length || 0,
      watchtime: 0,
      wo: { wo: '' },
      release_date: data.first_air_date || '',
    };
  } catch {
    return null;
  }
}
