import { useState, useEffect } from 'react';

interface SeasonConfig {
  title: string;
  iconColor: string;
  badgeGradient: string;
  genres?: string;
  keywords?: string;
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

function getSeasonConfig(): SeasonConfig {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  // Valentinstag: Feb 1-14
  if (month === 1 && day <= 14) {
    return {
      title: 'Valentinstag',
      iconColor: '#e91e63',
      badgeGradient: 'linear-gradient(135deg, #e91e63, #f06292)',
      genres: '10749',
    };
  }

  switch (month) {
    // Jan-Feb: Winter-Abende
    case 0:
    case 1:
      return {
        title: 'Winter-Abende',
        iconColor: '#90caf9',
        badgeGradient: 'linear-gradient(135deg, #42a5f5, #90caf9)',
        genres: '18,878',
      };
    // Mar-May: Frühlingsgefühle
    case 2:
    case 3:
    case 4:
      return {
        title: 'Frühlingsgefühle',
        iconColor: '#66bb6a',
        badgeGradient: 'linear-gradient(135deg, #66bb6a, #aed581)',
        genres: '10749,35',
      };
    // Jun-Aug: Sommer-Blockbuster
    case 5:
    case 6:
    case 7:
      return {
        title: 'Sommer-Blockbuster',
        iconColor: '#ffa726',
        badgeGradient: 'linear-gradient(135deg, #ff9800, #ffcc02)',
        genres: '28,12',
      };
    // Sep: Herbst-Krimis
    case 8:
      return {
        title: 'Herbst-Krimis',
        iconColor: '#8d6e63',
        badgeGradient: 'linear-gradient(135deg, #8d6e63, #bcaaa4)',
        genres: '9648,53',
      };
    // Oct: Halloween
    case 9:
      return {
        title: 'Halloween & Grusel',
        iconColor: '#ff6f00',
        badgeGradient: 'linear-gradient(135deg, #ff6f00, #f4511e)',
        genres: '27',
        keywords: '3335',
      };
    // Nov: Herbst-Krimis
    case 10:
      return {
        title: 'Herbst-Krimis',
        iconColor: '#8d6e63',
        badgeGradient: 'linear-gradient(135deg, #8d6e63, #bcaaa4)',
        genres: '9648,53',
      };
    // Dec: Weihnachten
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

const CACHE_KEY = 'seasonal_recommendations_cache';

export const useSeasonalRecommendations = () => {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const config = getSeasonConfig();

  useEffect(() => {
    // Check session cache
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.title === config.title && parsed.items?.length > 0) {
          setItems(parsed.items);
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    const fetchSeasonal = async () => {
      try {
        const apiKey = import.meta.env.VITE_API_TMDB;
        const baseParams = `api_key=${apiKey}&language=de-DE&region=DE&sort_by=popularity.desc&vote_count.gte=100`;
        const genreParam = config.genres ? `&with_genres=${config.genres}` : '';
        const keywordParam = config.keywords ? `&with_keywords=${config.keywords}` : '';

        const [tvResponse, movieResponse] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/discover/tv?${baseParams}${genreParam}${keywordParam}`
          ),
          fetch(
            `https://api.themoviedb.org/3/discover/movie?${baseParams}${genreParam}${keywordParam}`
          ),
        ]);

        const [tvData, movieData] = await Promise.all([tvResponse.json(), movieResponse.json()]);

        const combined: TrendingItem[] = [
          ...(tvData.results || [])
            .slice(0, 10)
            .map(
              (item: {
                id: number;
                name?: string;
                original_name?: string;
                poster_path: string | null;
                vote_average: number;
                vote_count: number;
                first_air_date?: string;
              }) => ({
                type: 'series' as const,
                id: item.id,
                title: item.name || item.original_name || '',
                poster: item.poster_path
                  ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                  : '/placeholder.jpg',
                rating: item.vote_average,
                voteCount: item.vote_count,
                releaseDate: item.first_air_date,
              })
            ),
          ...(movieData.results || [])
            .slice(0, 10)
            .map(
              (item: {
                id: number;
                title?: string;
                original_title?: string;
                poster_path: string | null;
                vote_average: number;
                vote_count: number;
                release_date?: string;
              }) => ({
                type: 'movie' as const,
                id: item.id,
                title: item.title || item.original_title || '',
                poster: item.poster_path
                  ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                  : '/placeholder.jpg',
                rating: item.vote_average,
                voteCount: item.vote_count,
                releaseDate: item.release_date,
              })
            ),
        ];

        combined.sort((a, b) => b.voteCount - a.voteCount);
        const top20 = combined.slice(0, 20);

        setItems(top20);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ title: config.title, items: top20 }));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonal();
  }, [config.title, config.genres, config.keywords]);

  return {
    items,
    loading,
    title: config.title,
    iconColor: config.iconColor,
    badgeGradient: config.badgeGradient,
  };
};
