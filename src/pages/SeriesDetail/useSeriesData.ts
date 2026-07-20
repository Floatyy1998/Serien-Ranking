import { useEffect, useMemo, useState } from 'react';
import { SUPPORTED_PROVIDERS } from '../../config/menuItems';
import { useSeriesList } from '../../contexts/SeriesListContext';

import type { Series } from '../../types/Series';
import type { TMDBWatchProvider } from './types';
import { getTmdbApiKey, tmdbFetch } from '../../services/tmdbClient';
import { pickProviderRegion, watchRegion } from '../../services/region';
import type { TmdbMediaDetail, TmdbWatchProvidersResponse } from '../../services/tmdb.types';
import { fetchTmdbSeriesFallback } from './fetchTmdbSeriesFallback';

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
        const flatrate = pickProviderRegion(data.results)?.flatrate;
        setProviders(
          Array.isArray(flatrate)
            ? flatrate.filter(
                (p: { provider_name: string }) =>
                  watchRegion !== 'DE' || SUPPORTED_PROVIDERS.has(p.provider_name)
              )
            : []
        );
      })
      .catch(() => {
        setProviders([]);
      });

    // Full fetch if not found locally
    if (!localSeries && !tmdbSeries) {
      setLoading(true);
      fetchTmdbSeriesFallback(id)
        .then((s) => {
          if (s) setTmdbSeries(s);
        })
        .finally(() => setLoading(false));
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
