import { useState, useEffect, useMemo } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../contexts/MovieListProvider';

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
}

interface TrendingItem {
  type: 'series' | 'movie';
  id: number;
  title: string;
  poster: string;
  rating: number;
  voteCount: number;
  releaseDate?: string;
}

export const useTMDBTrending = () => {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [rawSeries, setRawSeries] = useState<TrendingItem[]>([]);
  const [rawMovies, setRawMovies] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const apiKey = import.meta.env.VITE_API_TMDB;

        const [tvResponse, movieResponse] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=de-DE&region=DE`
          ),
          fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=de-DE&region=DE`
          ),
        ]);

        const [tvData, movieData] = await Promise.all([tvResponse.json(), movieResponse.json()]);

        setRawSeries(
          (tvData.results || []).map((item: TMDBTrendingItem) => ({
            type: 'series' as const,
            id: item.id,
            title: item.name || item.original_name,
            poster: item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : '/placeholder.jpg',
            rating: item.vote_average,
            voteCount: item.vote_count,
            releaseDate: item.first_air_date,
          }))
        );

        setRawMovies(
          (movieData.results || []).map((item: TMDBTrendingItem) => ({
            type: 'movie' as const,
            id: item.id,
            title: item.title || item.original_title,
            poster: item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : '/placeholder.jpg',
            rating: item.vote_average,
            voteCount: item.vote_count,
            releaseDate: item.release_date,
          }))
        );
      } catch {
        setRawSeries([]);
        setRawMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
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

  return { trending, loading };
};
