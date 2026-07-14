import { useEffect, useMemo, useState } from 'react';
import { SUPPORTED_PROVIDERS } from '../../config/menuItems';
import { useSeriesList } from '../../contexts/SeriesListContext';

import type { Series } from '../../types/Series';
import type { TMDBGenre, TMDBWatchProvider, SeriesSeason } from './types';
import { getTmdbApiKey, tmdbFetch } from '../../services/tmdbClient';
import type {
  TmdbMediaDetail,
  TmdbSeasonDetail,
  TmdbWatchProvidersResponse,
} from '../../services/tmdb.types';

interface UseSeriesDataResult {
  series: Series | null;
  localSeries: Series | undefined;
  tmdbSeries: Series | null;
  isReadOnlyTmdbSeries: boolean;
  loading: boolean;
  tmdbBackdrop: string | null;
  providers: TMDBWatchProvider[] | null;
  tmdbRating: { vote_average: number; vote_count: number } | null;
  imdbRating: { rating: number; votes: string } | null;
  tmdbFirstAirDate: string | null;
  tmdbOverview: string | null;
}

export const useSeriesData = (id: string | undefined): UseSeriesDataResult => {
  const { seriesList, hiddenSeriesList } = useSeriesList();

  const [tmdbSeries, setTmdbSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(false);
  const [tmdbBackdrop, setTmdbBackdrop] = useState<string | null>(null);
  const [providers, setProviders] = useState<TMDBWatchProvider[] | null>(null);
  const [tmdbRating, setTmdbRating] = useState<{ vote_average: number; vote_count: number } | null>(
    null
  );
  const [imdbRating, setImdbRating] = useState<{ rating: number; votes: string } | null>(null);
  const [tmdbFirstAirDate, setTmdbFirstAirDate] = useState<string | null>(null);
  const [tmdbOverview, setTmdbOverview] = useState<string | null>(null);

  // Find the series locally first (also check hidden series so detail page works for them)
  const localSeries = useMemo(() => {
    return (
      seriesList.find((s: Series) => s.id.toString() === id) ||
      hiddenSeriesList.find((s: Series) => s.id.toString() === id)
    );
  }, [seriesList, hiddenSeriesList, id]);

  // Fetch from TMDB - always for backdrop and full data if not found locally
  useEffect(() => {
    const apiKey = getTmdbApiKey();
    if (!id || !apiKey) return;

    // Backdrop/Rating immer von TMDB holen (auch für lokal vorhandene Serien).
    tmdbFetch<TmdbMediaDetail>(`tv/${id}`)
      .then((data) => {
        if (data.backdrop_path) {
          setTmdbBackdrop(data.backdrop_path);
        }
        if (data.vote_average && data.vote_count) {
          setTmdbRating({
            vote_average: data.vote_average,
            vote_count: data.vote_count,
          });
        }
        if (data.first_air_date) {
          setTmdbFirstAirDate(data.first_air_date);
        }
        if (data.overview) {
          setTmdbOverview(data.overview);
        }
      })
      .catch(() => {
        // Handle error silently
      });

    // Fetch providers — IMMER setState (auch []), damit `null` = „noch nicht
    // geladen" von `[]` = „geladen, keine DE-Flatrate" unterscheidbar bleibt.
    // Sonst blockt der AniList-Provider-Fallback (Guard `providers === null`)
    // dauerhaft bei Serien ohne DE-Flatrate.
    tmdbFetch<TmdbWatchProvidersResponse>(`tv/${id}/watch/providers`, { language: undefined })
      .then((data) => {
        const flatrate = data.results?.DE?.flatrate;
        setProviders(
          Array.isArray(flatrate)
            ? flatrate.filter((p: { provider_name: string }) =>
                SUPPORTED_PROVIDERS.has(p.provider_name)
              )
            : []
        );
      })
      .catch(() => {
        setProviders([]);
      });

    // Full fetch if not found locally
    if (!localSeries && !tmdbSeries) {
      const hasNonLatin = (text: string) => /[^\u0020-\u024F\u1E00-\u1EFF]/.test(text);
      const fetchFullData = async () => {
        setLoading(true);
        try {
          const [data, dataEN] = await Promise.all([
            tmdbFetch<TmdbMediaDetail>(`tv/${id}`, { append_to_response: 'credits,external_ids' }),
            tmdbFetch<TmdbMediaDetail>(`tv/${id}`, { language: 'en-US' }),
          ]);
          const bestName =
            data.name && !hasNonLatin(data.name) ? data.name : dataEN.name || data.name;
          if (data.id) {
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
                  return {
                    seasonNumber: season.season_number - 1,
                    episodes: [],
                  };
                }
              })
            );

            // TMDB-Daten in unseren Series-Typ überführen
            const series: Series = {
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
              // Required fields with defaults
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
            setTmdbSeries(series);
          }
        } catch {
          // Handle error silently
        } finally {
          setLoading(false);
        }
      };
      fetchFullData();
    }
  }, [localSeries, id, tmdbSeries]); // Remove loading dependency, add tmdbSeries to prevent re-fetching

  const series = localSeries || tmdbSeries;

  // Fetch IMDB rating from OMDb API
  useEffect(() => {
    const omdbKey = import.meta.env.VITE_API_OMDb;
    const imdbId = series?.imdb?.imdb_id || localSeries?.imdb?.imdb_id;

    if (imdbId && omdbKey) {
      fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            setImdbRating({
              rating: parseFloat(data.imdbRating),
              votes: data.imdbVotes || '0',
            });
          }
        })
        .catch(() => {
          // Handle error silently
        });
    }
  }, [series, localSeries]);

  const isReadOnlyTmdbSeries = !localSeries && !!tmdbSeries;

  return {
    series: series || null,
    localSeries,
    tmdbSeries,
    isReadOnlyTmdbSeries,
    loading,
    tmdbBackdrop,
    providers,
    tmdbRating,
    imdbRating,
    tmdbFirstAirDate,
    tmdbOverview,
  };
};
