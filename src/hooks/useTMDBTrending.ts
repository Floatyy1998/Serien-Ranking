import { useState, useEffect, useMemo } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useMovieList } from '../contexts/MovieListContext';
import { isSupportedProvider } from '../config/menuItems';
import { getProviderLogoUrl } from '../lib/providerMerge';
import { normalizeProviderName } from '../services/detection/providerChangeDetection';
import { getTmdbApiKey, tmdbFetch } from '../services/tmdbClient';
import { pickProviderRegion, watchRegion } from '../services/region';
import type { TmdbWatchProvidersResponse } from '../services/tmdb.types';
import { mapGenreIds } from '../utils/genreMap';
import { getImageUrl } from '../utils/imageUrl';

interface TMDBTrendingItem {
  id: number;
  name?: string;
  original_name?: string;
  title?: string;
  original_title?: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  first_air_date?: string;
  release_date?: string;
  genre_ids?: number[];
}

export interface TrendingProvider {
  name: string;
  logo: string;
}

interface RawWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TrendingItem {
  type: 'series' | 'movie';
  id: number;
  title: string;
  poster: string;
  rating: number;
  voteCount: number;
  releaseDate?: string;
  genres: string;
  year?: string;
  providers?: TrendingProvider[];
}

interface UseTMDBTrendingResult {
  trending: TrendingItem[];
  loading: boolean;
  error: Error | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de';

// Resolve a raw TMDB "DE flatrate" array to app providers (name + local logo).
// Pure — used for both the cached backend payload and the direct-TMDB fallback.
function resolveProviders(flatrate: RawWatchProvider[] | undefined): TrendingProvider[] {
  if (!Array.isArray(flatrate)) return [];
  const seen = new Set<string>();
  const out: TrendingProvider[] = [];
  for (const raw of flatrate) {
    const normalized = normalizeProviderName(raw.provider_name);
    if (!normalized || !isSupportedProvider(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    const logo =
      getProviderLogoUrl(normalized) ??
      (raw.logo_path ? `https://image.tmdb.org/t/p/w92${raw.logo_path}` : '');
    if (!logo) continue;
    out.push({ name: normalized, logo });
  }
  return out;
}

// Fallback only: direct per-item TMDB providers call, used when the cached
// backend /trending endpoint is unavailable.
async function fetchProviders(type: 'series' | 'movie', id: number): Promise<TrendingProvider[]> {
  try {
    const path = type === 'series' ? 'tv' : 'movie';
    // Wie zuvor OHNE language-Param (watch/providers ist sprachneutral).
    const data = await tmdbFetch<TmdbWatchProvidersResponse>(`${path}/${id}/watch/providers`, {
      language: undefined,
    });
    return resolveProviders(pickProviderRegion(data?.results)?.flatrate);
  } catch {
    // HTTP- wie Netzwerkfehler → wie bisher leere Provider-Liste.
    return [];
  }
}

function mapTMDBItem(item: TMDBTrendingItem, type: 'series' | 'movie'): TrendingItem {
  const title =
    type === 'series'
      ? (item.name ?? item.original_name ?? '')
      : (item.title ?? item.original_title ?? '');
  const dateStr = type === 'series' ? item.first_air_date : item.release_date;
  const genres = mapGenreIds(item.genre_ids ?? []);
  return {
    type,
    id: item.id,
    title,
    poster: getImageUrl(item.poster_path, 'w500'),
    rating: item.vote_average,
    voteCount: item.vote_count,
    releaseDate: dateStr,
    genres,
    year: dateStr ? dateStr.slice(0, 4) : undefined,
  };
}

export const useTMDBTrending = (): UseTMDBTrendingResult => {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [rawSeries, setRawSeries] = useState<TrendingItem[]>([]);
  const [rawMovies, setRawMovies] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTrending = async () => {
      setError(null);
      try {
        // Fast path: one cached backend request (trending + providers),
        // replacing ~40 per-item TMDB /watch/providers round-trips.
        try {
          const res = await fetch(`${BACKEND_URL}/trending`);
          if (res.ok) {
            const data = await res.json();
            const tv: (TMDBTrendingItem & { providers?: RawWatchProvider[] })[] = Array.isArray(
              data?.tv
            )
              ? data.tv
              : [];
            const movie: (TMDBTrendingItem & { providers?: RawWatchProvider[] })[] = Array.isArray(
              data?.movie
            )
              ? data.movie
              : [];
            if (tv.length || movie.length) {
              if (cancelled) return;
              setRawSeries(
                tv.map((item) => ({
                  ...mapTMDBItem(item, 'series'),
                  providers: resolveProviders(item.providers),
                }))
              );
              setRawMovies(
                movie.map((item) => ({
                  ...mapTMDBItem(item, 'movie'),
                  providers: resolveProviders(item.providers),
                }))
              );
              return;
            }
          }
        } catch {
          // backend unavailable → fall through to the direct-TMDB path below
        }

        if (!getTmdbApiKey()) {
          throw new Error('VITE_API_TMDB ist nicht konfiguriert');
        }
        // HTTP-Fehler werfen jetzt in tmdbFetch (statt des früheren
        // `!res.ok`-Throws) und landen wie zuvor im äußeren catch.
        const [tvData, movieData] = await Promise.all([
          tmdbFetch<{ results?: TMDBTrendingItem[] }>('trending/tv/week', { region: watchRegion }),
          tmdbFetch<{ results?: TMDBTrendingItem[] }>('trending/movie/week', {
            region: watchRegion,
          }),
        ]);
        if (cancelled) return;

        const baseSeries: TrendingItem[] = (tvData.results ?? []).map((item) =>
          mapTMDBItem(item, 'series')
        );
        const baseMovies: TrendingItem[] = (movieData.results ?? []).map((item) =>
          mapTMDBItem(item, 'movie')
        );

        // Fallback läuft für ALLE Nutzer gleichzeitig, wenn das Backend down ist —
        // Provider-Badges nur für die Top-Items nachladen statt ~40 Calls/Nutzer.
        const PROVIDER_ENRICH_LIMIT = 5;
        const [seriesWithProviders, moviesWithProviders] = await Promise.all([
          Promise.all(
            baseSeries.map(async (item, idx) => ({
              ...item,
              providers: idx < PROVIDER_ENRICH_LIMIT ? await fetchProviders('series', item.id) : [],
            }))
          ),
          Promise.all(
            baseMovies.map(async (item, idx) => ({
              ...item,
              providers: idx < PROVIDER_ENRICH_LIMIT ? await fetchProviders('movie', item.id) : [],
            }))
          ),
        ]);

        if (cancelled) return;
        setRawSeries(seriesWithProviders);
        setRawMovies(moviesWithProviders);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setRawSeries([]);
        setRawMovies([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  const trending = useMemo(() => {
    const seriesIds = new Set(allSeriesList.map((s) => s.id));
    const movieIds = new Set(movieList.map((m) => m.id));
    const filteredSeries = rawSeries.filter((i) => !seriesIds.has(i.id));
    const filteredMovies = rawMovies.filter((i) => !movieIds.has(i.id));
    const targetEach = 10;
    const sCount = Math.min(filteredSeries.length, targetEach);
    const mCount = Math.min(filteredMovies.length, targetEach);
    const seriesFinal = sCount + Math.min(filteredSeries.length - sCount, targetEach - mCount);
    const movieFinal = mCount + Math.min(filteredMovies.length - mCount, targetEach - sCount);
    const combined = [
      ...filteredSeries.slice(0, seriesFinal),
      ...filteredMovies.slice(0, movieFinal),
    ];
    combined.sort((a, b) => b.voteCount - a.voteCount);
    return combined.slice(0, 20);
  }, [rawSeries, rawMovies, allSeriesList, movieList]);

  return { trending, loading, error };
};
