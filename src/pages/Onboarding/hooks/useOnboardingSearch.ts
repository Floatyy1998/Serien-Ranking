import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { CURATED_GENRES } from '../genres';

export interface OnboardingItem {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  type: 'series' | 'movie';
  number_of_seasons?: number;
}

const API_KEY = import.meta.env.VITE_API_TMDB;
const BASE = 'https://api.themoviedb.org/3';
const hasNonLatin = (text: string) => /[^ -ɏḀ-ỿ]/.test(text);

export function useOnboardingSearch() {
  const { user } = useAuth() || {};
  const { refetchAfterAdd } = useSeriesList();
  const [suggestions, setSuggestions] = useState<OnboardingItem[]>([]);
  const [searchResults, setSearchResults] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback(async (selectedSlugs: string[]) => {
    if (!API_KEY) {
      console.error('TMDB API Key fehlt');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const selectedGenres = CURATED_GENRES.filter((g) => selectedSlugs.includes(g.slug));
      const tvBuckets: OnboardingItem[] = [];
      const movieBuckets: OnboardingItem[] = [];

      const targets =
        selectedGenres.length > 0
          ? selectedGenres.slice(0, 4).map((g) => ({ tvId: g.tvId, movieId: g.movieId }))
          : [null];

      for (const t of targets) {
        const tvUrl = t
          ? `${BASE}/discover/tv?api_key=${API_KEY}&language=de-DE&with_genres=${t.tvId}&sort_by=popularity.desc&page=1`
          : `${BASE}/trending/tv/week?api_key=${API_KEY}&language=de-DE`;
        const movieUrl = t
          ? `${BASE}/discover/movie?api_key=${API_KEY}&language=de-DE&with_genres=${t.movieId}&sort_by=popularity.desc&page=1`
          : `${BASE}/trending/movie/week?api_key=${API_KEY}&language=de-DE`;

        const [tvRes, movieRes] = await Promise.all([
          fetch(tvUrl).then((r) => r.json()),
          fetch(movieUrl).then((r) => r.json()),
        ]);

        for (const item of tvRes.results || []) {
          if (!item.poster_path) continue;
          if (tvBuckets.find((i) => i.id === item.id)) continue;
          tvBuckets.push({
            id: item.id,
            title: item.name || item.title || '',
            name: item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            first_air_date: item.first_air_date,
            type: 'series',
          });
        }
        for (const item of movieRes.results || []) {
          if (!item.poster_path) continue;
          if (movieBuckets.find((i) => i.id === item.id)) continue;
          movieBuckets.push({
            id: item.id,
            title: item.title || item.name || '',
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            release_date: item.release_date,
            type: 'movie',
          });
        }
      }

      tvBuckets.sort((a, b) => b.vote_average - a.vote_average);
      movieBuckets.sort((a, b) => b.vote_average - a.vote_average);
      setSuggestions([...tvBuckets.slice(0, 60), ...movieBuckets.slice(0, 60)]);
    } catch (e) {
      console.error('Fehler beim Laden der Vorschläge:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(query.trim());
        const [tvDE, tvEN, movieDE, movieEN] = await Promise.all([
          fetch(`${BASE}/search/tv?api_key=${API_KEY}&language=de-DE&query=${encoded}`).then((r) =>
            r.json()
          ),
          fetch(`${BASE}/search/tv?api_key=${API_KEY}&language=en-US&query=${encoded}`).then((r) =>
            r.json()
          ),
          fetch(`${BASE}/search/movie?api_key=${API_KEY}&language=de-DE&query=${encoded}`).then(
            (r) => r.json()
          ),
          fetch(`${BASE}/search/movie?api_key=${API_KEY}&language=en-US&query=${encoded}`).then(
            (r) => r.json()
          ),
        ]);
        const enTvMap = new Map<number, string>();
        for (const item of tvEN.results || []) enTvMap.set(item.id, item.name || item.title || '');
        const enMovieMap = new Map<number, string>();
        for (const item of movieEN.results || [])
          enMovieMap.set(item.id, item.title || item.name || '');

        const results: OnboardingItem[] = [
          ...(tvDE.results || [])
            .filter((it: { poster_path?: unknown }) => it.poster_path)
            .map((item: Record<string, unknown>) => {
              const deName = (item.name || item.title || '') as string;
              const enName = enTvMap.get(item.id as number);
              const title = hasNonLatin(deName) && enName ? enName : deName;
              return {
                id: item.id as number,
                title,
                name: title,
                poster_path: item.poster_path as string,
                vote_average: (item.vote_average || 0) as number,
                first_air_date: item.first_air_date as string,
                type: 'series' as const,
              };
            }),
          ...(movieDE.results || [])
            .filter((it: { poster_path?: unknown }) => it.poster_path)
            .map((item: Record<string, unknown>) => {
              const deTitle = (item.title || item.name || '') as string;
              const enTitle = enMovieMap.get(item.id as number);
              const title = hasNonLatin(deTitle) && enTitle ? enTitle : deTitle;
              return {
                id: item.id as number,
                title,
                poster_path: item.poster_path as string,
                vote_average: (item.vote_average || 0) as number,
                release_date: item.release_date as string,
                type: 'movie' as const,
              };
            }),
        ]
          .sort((a, b) => b.vote_average - a.vote_average)
          .slice(0, 24);

        setSearchResults(results);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, []);

  const addToList = useCallback(
    async (item: OnboardingItem): Promise<boolean> => {
      const uid = user?.uid;
      if (!uid) return false;
      const endpoint =
        item.type === 'series'
          ? `${import.meta.env.VITE_BACKEND_API_URL}/add`
          : `${import.meta.env.VITE_BACKEND_API_URL}/addMovie`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: import.meta.env.VITE_USER,
            id: item.id,
            uuid: uid,
          }),
        });
        if (response.ok && item.type === 'series') {
          await refetchAfterAdd(item.id);
        }
        return response.ok;
      } catch {
        return false;
      }
    },
    [user?.uid, refetchAfterAdd]
  );

  return {
    suggestions,
    searchResults,
    loading,
    searchLoading,
    fetchSuggestions,
    search,
    addToList,
    setSearchResults,
  };
}
