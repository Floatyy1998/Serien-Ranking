import { useEffect, useMemo, useState } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useMovieList } from '../contexts/MovieListContext';
import { getImageUrl } from '../utils/imageUrl';

interface SeasonConfig {
  title: string;
  iconColor: string;
  badgeGradient: string;
  genres?: string;
  keywords?: string;
}

export interface SeasonalItem {
  type: 'series' | 'movie';
  id: number;
  title: string;
  poster: string;
  rating: number;
  voteCount: number;
  releaseDate?: string;
}

interface TMDBDiscoverItem {
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

function getSeasonConfig(): SeasonConfig {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  if (month === 1 && day <= 14) {
    return {
      title: 'Valentinstag',
      iconColor: '#e91e63',
      badgeGradient: 'linear-gradient(135deg, #e91e63, #f06292)',
      genres: '10749',
    };
  }
  switch (month) {
    case 0:
    case 1:
      return {
        title: 'Winter-Abende',
        iconColor: '#90caf9',
        badgeGradient: 'linear-gradient(135deg, #42a5f5, #90caf9)',
        genres: '18,878',
      };
    case 2:
    case 3:
    case 4:
      return {
        title: 'Frühlingsgefühle',
        iconColor: '#66bb6a',
        badgeGradient: 'linear-gradient(135deg, #66bb6a, #aed581)',
        genres: '10749,35',
      };
    case 5:
    case 6:
    case 7:
      return {
        title: 'Sommer-Blockbuster',
        iconColor: '#ffa726',
        badgeGradient: 'linear-gradient(135deg, #ff9800, #ffcc02)',
        genres: '28,12',
      };
    case 8:
      return {
        title: 'Herbst-Krimis',
        iconColor: '#8d6e63',
        badgeGradient: 'linear-gradient(135deg, #8d6e63, #bcaaa4)',
        genres: '9648,53',
      };
    case 9:
      return {
        title: 'Halloween & Grusel',
        iconColor: '#ff6f00',
        badgeGradient: 'linear-gradient(135deg, #ff6f00, #f4511e)',
        genres: '27',
        keywords: '3335',
      };
    case 10:
      return {
        title: 'Herbst-Krimis',
        iconColor: '#8d6e63',
        badgeGradient: 'linear-gradient(135deg, #8d6e63, #bcaaa4)',
        genres: '9648,53',
      };
    case 11:
      return {
        title: 'Weihnachts-Highlights',
        iconColor: '#c62828',
        badgeGradient: 'linear-gradient(135deg, #c62828, #e53935)',
        keywords: '207317',
      };
    default:
      return {
        title: 'Empfehlungen',
        iconColor: '#7c4dff',
        badgeGradient: 'linear-gradient(135deg, #7c4dff, #b388ff)',
        genres: '18',
      };
  }
}

function mapDiscoverItem(item: TMDBDiscoverItem, type: 'series' | 'movie'): SeasonalItem {
  const title =
    type === 'series'
      ? (item.name ?? item.original_name ?? '')
      : (item.title ?? item.original_title ?? '');
  return {
    type,
    id: item.id,
    title,
    poster: getImageUrl(item.poster_path),
    rating: item.vote_average,
    voteCount: item.vote_count,
    releaseDate: type === 'series' ? item.first_air_date : item.release_date,
  };
}

const CACHE_KEY = 'seasonal_recommendations_v5';

interface UseSeasonalRecommendationsResult {
  items: SeasonalItem[];
  loading: boolean;
  title: string;
  iconColor: string;
  badgeGradient: string;
}

export const useSeasonalRecommendations = (): UseSeasonalRecommendationsResult => {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [rawSeries, setRawSeries] = useState<SeasonalItem[]>([]);
  const [rawMovies, setRawMovies] = useState<SeasonalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const config = useMemo(() => getSeasonConfig(), []);

  useEffect(() => {
    let cancelled = false;

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as {
          title: string;
          series: SeasonalItem[];
          movies: SeasonalItem[];
        };
        if (parsed.title === config.title && parsed.series?.length > 0) {
          setRawSeries(parsed.series);
          setRawMovies(parsed.movies);
          setLoading(false);
          return;
        }
      } catch {
        // Ungültiger Cache – ignorieren
      }
    }

    const fetchSeasonal = async () => {
      try {
        const apiKey = import.meta.env.VITE_API_TMDB;
        const baseUrl = `api_key=${apiKey}&language=de-DE&region=DE&sort_by=popularity.desc`;
        const genreParam = config.genres ? `&with_genres=${config.genres}` : '';
        const keywordParam = config.keywords ? `&with_keywords=${config.keywords}` : '';

        const [tvResponse, movieResponse] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/discover/tv?${baseUrl}&vote_count.gte=100${genreParam}${keywordParam}`
          ),
          fetch(
            `https://api.themoviedb.org/3/discover/movie?${baseUrl}&vote_count.gte=100${genreParam}${keywordParam}`
          ),
        ]);

        const [tvData, movieData] = await Promise.all([tvResponse.json(), movieResponse.json()]);
        if (cancelled) return;

        const series: SeasonalItem[] = (tvData.results ?? []).map((item: TMDBDiscoverItem) =>
          mapDiscoverItem(item, 'series')
        );
        const movies: SeasonalItem[] = (movieData.results ?? []).map((item: TMDBDiscoverItem) =>
          mapDiscoverItem(item, 'movie')
        );

        setRawSeries(series);
        setRawMovies(movies);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ title: config.title, series, movies }));
      } catch {
        if (cancelled) return;
        setRawSeries([]);
        setRawMovies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSeasonal();
    return () => {
      cancelled = true;
    };
  }, [config]);

  const items = useMemo(() => {
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

  return {
    items,
    loading,
    title: config.title,
    iconColor: config.iconColor,
    badgeGradient: config.badgeGradient,
  };
};
