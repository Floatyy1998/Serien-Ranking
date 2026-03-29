import { useState, useEffect, useMemo } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useMovieList } from '../contexts/MovieListContext';
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
}

interface UseTMDBTrendingResult {
  trending: TrendingItem[];
  loading: boolean;
  error: Error | null;
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
        const apiKey = import.meta.env.VITE_API_TMDB;
        if (!apiKey) {
          throw new Error('VITE_API_TMDB ist nicht konfiguriert');
        }
        const [tvResponse, movieResponse] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=de-DE&region=DE`
          ),
          fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=de-DE&region=DE`
          ),
        ]);
        if (!tvResponse.ok || !movieResponse.ok) {
          throw new Error(
            `TMDB API Fehler: TV=${tvResponse.status}, Movie=${movieResponse.status}`
          );
        }
        const [tvData, movieData] = await Promise.all([tvResponse.json(), movieResponse.json()]);
        if (cancelled) return;
        setRawSeries(
          (tvData.results ?? []).map((item: TMDBTrendingItem) => mapTMDBItem(item, 'series'))
        );
        setRawMovies(
          (movieData.results ?? []).map((item: TMDBTrendingItem) => mapTMDBItem(item, 'movie'))
        );
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
