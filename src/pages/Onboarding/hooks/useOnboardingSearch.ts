import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../App';

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

export interface Genre {
  id: number;
  name: string;
}

const API_KEY = import.meta.env.VITE_API_TMDB;
const BASE = 'https://api.themoviedb.org/3';

export function useOnboardingSearch() {
  const { user } = useAuth() || {};
  const [genres, setGenres] = useState<Genre[]>([]);
  const [suggestions, setSuggestions] = useState<OnboardingItem[]>([]);
  const [searchResults, setSearchResults] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch genres on mount
  useEffect(() => {
    if (!API_KEY) return;
    Promise.all([
      fetch(`${BASE}/genre/tv/list?api_key=${API_KEY}&language=de-DE`).then((r) => r.json()),
      fetch(`${BASE}/genre/movie/list?api_key=${API_KEY}&language=de-DE`).then((r) => r.json()),
    ])
      .then(([tv, movie]) => {
        const seen = new Set<number>();
        const merged: Genre[] = [];
        for (const g of [...(tv.genres || []), ...(movie.genres || [])]) {
          if (!seen.has(g.id)) {
            seen.add(g.id);
            merged.push(g);
          }
        }
        merged.sort((a, b) => a.name.localeCompare(b.name, 'de'));
        setGenres(merged);
      })
      .catch(() => {});
  }, []);

  // Fetch suggestions based on selected genres
  const fetchSuggestions = useCallback(async (selectedGenreIds: number[]) => {
    if (!API_KEY) {
      console.error('TMDB API Key fehlt');
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      let tvItems: OnboardingItem[] = [];
      let movieItems: OnboardingItem[] = [];

      if (selectedGenreIds.length > 0) {
        // Genre-basierte Discovery: Maximal 4 Genres für Performance
        const limitedGenreIds = selectedGenreIds.slice(0, 4);
        console.log('Fetching genre-based suggestions for:', limitedGenreIds);

        const allTvResults: OnboardingItem[] = [];
        const allMovieResults: OnboardingItem[] = [];

        // Pro Genre: 1 Page TV + 1 Page Movie holen
        for (const genreId of limitedGenreIds) {
          const [tvRes, movieRes] = await Promise.all([
            fetch(
              `${BASE}/discover/tv?api_key=${API_KEY}&language=de-DE&with_genres=${genreId}&sort_by=popularity.desc&page=1`
            ).then((r) => r.json()),
            fetch(
              `${BASE}/discover/movie?api_key=${API_KEY}&language=de-DE&with_genres=${genreId}&sort_by=popularity.desc&page=1`
            ).then((r) => r.json()),
          ]);

          // TV items sammeln
          (tvRes.results || []).forEach((item: Record<string, unknown>) => {
            if (item.poster_path && !allTvResults.find((i) => i.id === item.id)) {
              allTvResults.push({
                id: item.id as number,
                title: (item.name || item.title || '') as string,
                name: item.name as string,
                poster_path: item.poster_path as string,
                vote_average: (item.vote_average || 0) as number,
                first_air_date: item.first_air_date as string,
                type: 'series' as const,
              });
            }
          });

          // Movie items sammeln
          (movieRes.results || []).forEach((item: Record<string, unknown>) => {
            if (item.poster_path && !allMovieResults.find((i) => i.id === item.id)) {
              allMovieResults.push({
                id: item.id as number,
                title: (item.title || item.name || '') as string,
                poster_path: item.poster_path as string,
                vote_average: (item.vote_average || 0) as number,
                release_date: item.release_date as string,
                type: 'movie' as const,
              });
            }
          });
        }

        // Sortiere nach Popularität und nimm Top Items
        tvItems = allTvResults.sort((a, b) => b.vote_average - a.vote_average).slice(0, 60);

        movieItems = allMovieResults.sort((a, b) => b.vote_average - a.vote_average).slice(0, 60);
      } else {
        // Fallback: Trending wenn keine Genres gewählt
        console.log('Fetching trending (no genres selected)');
        const [tvRes, movieRes] = await Promise.all([
          fetch(`${BASE}/trending/tv/week?api_key=${API_KEY}&language=de-DE`).then((r) => r.json()),
          fetch(`${BASE}/trending/movie/week?api_key=${API_KEY}&language=de-DE`).then((r) =>
            r.json()
          ),
        ]);

        tvItems = (tvRes.results || [])
          .filter((item: Record<string, unknown>) => item.poster_path)
          .slice(0, 40)
          .map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.name || item.title || '',
            name: item.name as string,
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            first_air_date: item.first_air_date as string,
            type: 'series' as const,
          }));

        movieItems = (movieRes.results || [])
          .filter((item: Record<string, unknown>) => item.poster_path)
          .slice(0, 40)
          .map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.title || item.name || '',
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            release_date: item.release_date as string,
            type: 'movie' as const,
          }));
      }

      // Combine: Series first, then movies
      const combined: OnboardingItem[] = [...tvItems, ...movieItems];

      console.log(
        'Combined suggestions:',
        combined.length,
        'items',
        `(${tvItems.length} series, ${movieItems.length} movies)`
      );
      setSuggestions(combined);
    } catch (error) {
      console.error('Fehler beim Laden der Vorschläge:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search TMDB
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
        const [tvRes, movieRes] = await Promise.all([
          fetch(`${BASE}/search/tv?api_key=${API_KEY}&language=de-DE&query=${encoded}`).then((r) =>
            r.json()
          ),
          fetch(`${BASE}/search/movie?api_key=${API_KEY}&language=de-DE&query=${encoded}`).then(
            (r) => r.json()
          ),
        ]);

        const results: OnboardingItem[] = [
          ...(tvRes.results || []).map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.name || item.title || '',
            name: item.name as string,
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            first_air_date: item.first_air_date as string,
            type: 'series' as const,
          })),
          ...(movieRes.results || []).map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.title || item.name || '',
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            release_date: item.release_date as string,
            type: 'movie' as const,
          })),
        ]
          .sort((a, b) => (b.vote_average as number) - (a.vote_average as number))
          .slice(0, 20);

        setSearchResults(results);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, []);

  // Add item to user's list
  const addToList = useCallback(
    async (item: OnboardingItem): Promise<boolean> => {
      if (!user?.uid) return false;

      const itemKey = `${item.type}-${item.id}`;
      setAddingId(itemKey);

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
            uuid: user.uid,
          }),
        });

        if (response.ok) {
          setAddedIds((prev) => new Set(prev).add(itemKey));
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setAddingId(null);
      }
    },
    [user?.uid]
  );

  // Remove item from added list (client-side only, doesn't delete from backend)
  const removeFromList = useCallback((item: OnboardingItem) => {
    const itemKey = `${item.type}-${item.id}`;
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemKey);
      return next;
    });
  }, []);

  return {
    genres,
    suggestions,
    searchResults,
    loading,
    searchLoading,
    addedIds,
    addingId,
    fetchSuggestions,
    search,
    addToList,
    removeFromList,
    setSearchResults,
  };
}
