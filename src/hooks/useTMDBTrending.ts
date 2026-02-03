import { useState, useEffect } from 'react';

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
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const apiKey = import.meta.env.VITE_API_TMDB;
        
        // Fetch both TV and movie trending for the week
        const [tvResponse, movieResponse] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=de-DE&region=DE`),
          fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=de-DE&region=DE`)
        ]);

        const [tvData, movieData] = await Promise.all([
          tvResponse.json(),
          movieResponse.json()
        ]);

        // Combine and sort by popularity
        const combinedItems: TrendingItem[] = [
          ...tvData.results.slice(0, 10).map((item: TMDBTrendingItem) => ({
            type: 'series' as const,
            id: item.id,
            title: item.name || item.original_name,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/placeholder.jpg',
            rating: item.vote_average,
            voteCount: item.vote_count,
            releaseDate: item.first_air_date
          })),
          ...movieData.results.slice(0, 10).map((item: TMDBTrendingItem) => ({
            type: 'movie' as const,
            id: item.id,
            title: item.title || item.original_title,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/placeholder.jpg',
            rating: item.vote_average,
            voteCount: item.vote_count,
            releaseDate: item.release_date
          }))
        ];

        // Sort by vote count (popularity) and take top 20
        combinedItems.sort((a, b) => b.voteCount - a.voteCount);
        setTrending(combinedItems.slice(0, 20));
      } catch (error) {
        // console.error('Error fetching trending:', error);
        setTrending([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return { trending, loading };
};