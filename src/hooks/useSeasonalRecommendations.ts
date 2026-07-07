import { useEffect, useMemo, useState } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useMovieList } from '../contexts/MovieListContext';
import { isSupportedProvider } from '../config/menuItems';
import { getProviderLogoUrl } from '../lib/providerMerge';
import { normalizeProviderName } from '../services/detection/providerChangeDetection';
import { mapGenreIds } from '../utils/genreMap';
import { getImageUrl } from '../utils/imageUrl';

interface SeasonConfig {
  title: string;
  iconColor: string;
  badgeGradient: string;
  tvGenres?: string;
  movieGenres?: string;
  keywords?: string;
}

export interface SeasonalProvider {
  name: string;
  logo: string;
}

interface RawWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface SeasonalItem {
  type: 'series' | 'movie';
  id: number;
  title: string;
  poster: string;
  rating: number;
  voteCount: number;
  releaseDate?: string;
  genres: string;
  year?: string;
  providers?: SeasonalProvider[];
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
  genre_ids?: number[];
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
      tvGenres: '35',
      movieGenres: '10749',
    };
  }
  switch (month) {
    case 0:
    case 1:
      return {
        title: 'Winter-Abende',
        iconColor: '#90caf9',
        badgeGradient: 'linear-gradient(135deg, #42a5f5, #90caf9)',
        tvGenres: '18|10765',
        movieGenres: '18|878',
      };
    case 2:
    case 3:
    case 4:
      return {
        title: 'Frühlingsgefühle',
        iconColor: '#66bb6a',
        badgeGradient: 'linear-gradient(135deg, #66bb6a, #aed581)',
        tvGenres: '35',
        movieGenres: '10749|35',
      };
    case 5:
    case 6:
    case 7:
      // Classic summer blockbuster trio: Action, Adventure, Sci-Fi.
      // TV: Action&Adventure (10759) + Sci-Fi&Fantasy (10765) — same blockbuster feel
      // for series (Mandalorian, Stranger Things, House of the Dragon, …).
      return {
        title: 'Sommer-Blockbuster',
        iconColor: '#ffa726',
        badgeGradient: 'linear-gradient(135deg, #ff9800, #ffcc02)',
        tvGenres: '10759|10765',
        movieGenres: '28|12|878',
      };
    case 8:
      return {
        title: 'Herbst-Krimis',
        iconColor: '#8d6e63',
        badgeGradient: 'linear-gradient(135deg, #8d6e63, #bcaaa4)',
        tvGenres: '9648|80',
        movieGenres: '9648|53',
      };
    case 9:
      return {
        title: 'Halloween & Grusel',
        iconColor: '#ff6f00',
        badgeGradient: 'linear-gradient(135deg, #ff6f00, #f4511e)',
        tvGenres: '9648',
        movieGenres: '27',
        keywords: '3335',
      };
    case 10:
      return {
        title: 'Herbst-Krimis',
        iconColor: '#8d6e63',
        badgeGradient: 'linear-gradient(135deg, #8d6e63, #bcaaa4)',
        tvGenres: '9648|80',
        movieGenres: '9648|53',
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
        tvGenres: '18',
        movieGenres: '18',
      };
  }
}

function mapDiscoverItem(item: TMDBDiscoverItem, type: 'series' | 'movie'): SeasonalItem {
  const title =
    type === 'series'
      ? (item.name ?? item.original_name ?? '')
      : (item.title ?? item.original_title ?? '');
  const dateStr = type === 'series' ? item.first_air_date : item.release_date;
  return {
    type,
    id: item.id,
    title,
    poster: getImageUrl(item.poster_path, 'w500'),
    rating: item.vote_average,
    voteCount: item.vote_count,
    releaseDate: dateStr,
    genres: mapGenreIds(item.genre_ids ?? []),
    year: dateStr ? dateStr.slice(0, 4) : undefined,
  };
}

const CACHE_KEY = 'seasonal_recommendations_v9';

async function fetchSeasonalProviders(
  type: 'series' | 'movie',
  id: number,
  apiKey: string
): Promise<SeasonalProvider[]> {
  try {
    const path = type === 'series' ? 'tv' : 'movie';
    const res = await fetch(
      `https://api.themoviedb.org/3/${path}/${id}/watch/providers?api_key=${apiKey}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const flatrate = data?.results?.DE?.flatrate;
    if (!Array.isArray(flatrate)) return [];

    const seen = new Set<string>();
    const out: SeasonalProvider[] = [];
    for (const raw of flatrate as RawWatchProvider[]) {
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
  } catch {
    return [];
  }
}

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

  const config = getSeasonConfig();

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
        const tvGenreParam = config.tvGenres ? `&with_genres=${config.tvGenres}` : '';
        const movieGenreParam = config.movieGenres ? `&with_genres=${config.movieGenres}` : '';
        const keywordParam = config.keywords ? `&with_keywords=${config.keywords}` : '';

        const discoverUrl = (kind: 'tv' | 'movie', page: number) => {
          const genreParam = kind === 'tv' ? tvGenreParam : movieGenreParam;
          // TV uses vote_count.gte=50 — TV has fewer-vote shows than movies, so keeping
          // 100 made some genres (Sommer-Action&Adventure) nearly empty.
          const voteFilter = kind === 'tv' ? '&vote_count.gte=50' : '&vote_count.gte=100';
          return `https://api.themoviedb.org/3/discover/${kind}?${baseUrl}${voteFilter}${genreParam}${keywordParam}&page=${page}`;
        };

        const [tv1, tv2, movie1, movie2] = await Promise.all([
          fetch(discoverUrl('tv', 1)),
          fetch(discoverUrl('tv', 2)),
          fetch(discoverUrl('movie', 1)),
          fetch(discoverUrl('movie', 2)),
        ]);

        const [tv1Data, tv2Data, movie1Data, movie2Data] = await Promise.all([
          tv1.json(),
          tv2.json(),
          movie1.json(),
          movie2.json(),
        ]);
        if (cancelled) return;

        const tvResults: TMDBDiscoverItem[] = [
          ...(tv1Data.results ?? []),
          ...(tv2Data.results ?? []),
        ];
        const movieResults: TMDBDiscoverItem[] = [
          ...(movie1Data.results ?? []),
          ...(movie2Data.results ?? []),
        ];

        const baseSeries = tvResults.map((item) => mapDiscoverItem(item, 'series'));
        const baseMovies = movieResults.map((item) => mapDiscoverItem(item, 'movie'));

        const [series, movies] = await Promise.all([
          Promise.all(
            baseSeries.map(async (item) => ({
              ...item,
              providers: await fetchSeasonalProviders('series', item.id, apiKey),
            }))
          ),
          Promise.all(
            baseMovies.map(async (item) => ({
              ...item,
              providers: await fetchSeasonalProviders('movie', item.id, apiKey),
            }))
          ),
        ]);

        if (cancelled) return;
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
  }, [config.title, config.tvGenres, config.movieGenres, config.keywords]);

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
