/**
 * useHomeQuickSearch — schlanke Such-Logik für den Inline-Dropdown auf dem
 * Homescreen (Spotlight-Style). Bewusst NICHT useSearchPage: das würde `?q=` in
 * die Home-URL schreiben (History-Spam). Hier nur lokaler Query-State, ein
 * debounced TMDB-Multi-Search (Serien + Filme parallel) und ein
 * localStorage-Verlauf.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { tmdbFetch } from '../../../services/tmdbClient';

export interface QuickResult {
  id: number;
  type: 'series' | 'movie';
  title: string;
  poster_path?: string;
  year: string;
  vote_average?: number;
}

interface TmdbListResponse {
  results?: Array<{
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    popularity?: number;
  }>;
}

const RECENT_KEY = 'recentSearches';
const MAX_RECENT = 6;
const POPULAR_SEARCHES = ['Breaking Bad', 'The Last of Us', 'Dune', 'Oppenheimer', 'Wednesday'];

export interface UseHomeQuickSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: QuickResult[];
  loading: boolean;
  recent: string[];
  popular: string[];
  saveRecent: (q: string) => void;
  removeRecent: (term: string) => void;
}

export function useHomeQuickSearch(): UseHomeQuickSearchResult {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuickResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  // Monoton steigende Request-ID: verwirft veraltete Antworten (Race bei schnellem Tippen).
  const reqId = useRef(0);

  const saveRecent = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    setRecent((prev) => {
      const updated = [term, ...prev.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(
        0,
        MAX_RECENT
      );
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        /* Quota — ignorieren */
      }
      return updated;
    });
  }, []);

  const removeRecent = useCallback((term: string) => {
    setRecent((prev) => {
      const updated = prev.filter((s) => s !== term);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const [tv, mv] = await Promise.all([
          tmdbFetch<TmdbListResponse>('search/tv', { query: q, page: 1 }),
          tmdbFetch<TmdbListResponse>('search/movie', { query: q, page: 1 }),
        ]);
        if (id !== reqId.current) return; // veraltete Antwort verwerfen

        const map = (arr: TmdbListResponse['results'], type: 'series' | 'movie'): QuickResult[] =>
          (arr || []).map((r) => ({
            id: r.id,
            type,
            title: (type === 'series' ? r.name || r.title : r.title || r.name) || '',
            poster_path: r.poster_path || undefined,
            vote_average: r.vote_average,
            year: (r.first_air_date || r.release_date || '').slice(0, 4),
          }));

        const merged = [...map(tv.results, 'series'), ...map(mv.results, 'movie')]
          .filter((r) => r.title)
          .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          .slice(0, 18);
        setResults(merged);
      } catch {
        if (id === reqId.current) setResults([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
    recent,
    popular: POPULAR_SEARCHES,
    saveRecent,
    removeRecent,
  };
}
