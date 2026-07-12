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
    media_type?: string;
  }>;
}

const RECENT_KEY = 'recentSearches';
const MAX_RECENT = 6;
// 12 Titel, damit die „Beliebt"-Reihe auch auf 2K-Screens die Breite füllt.
const POPULAR_SEARCHES = [
  'Breaking Bad',
  'The Last of Us',
  'Dune',
  'Oppenheimer',
  'Wednesday',
  'Stranger Things',
  'House of the Dragon',
  'Arcane',
  'Interstellar',
  'Severance',
  'The Bear',
  'One Piece',
];

// Session-Cache für die „Beliebt"-Poster: einmal auflösen, dann für jedes
// erneute Öffnen des Overlays wiederverwenden (spart TMDB-Requests).
let popularCache: QuickResult[] | null = null;

export interface UseHomeQuickSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: QuickResult[];
  loading: boolean;
  recent: string[];
  popular: string[];
  /** „Beliebt" als konkrete Titel mit Postern (leer, bis TMDB aufgelöst hat). */
  popularItems: QuickResult[];
  saveRecent: (q: string) => void;
  removeRecent: (term: string) => void;
}

/**
 * @param active Erst wenn true (Overlay offen), werden die „Beliebt"-Poster
 *               aufgelöst — Nutzer, die die Suche nie öffnen, kosten keine Requests.
 */
export function useHomeQuickSearch(active = true): UseHomeQuickSearchResult {
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
  const [popularItems, setPopularItems] = useState<QuickResult[]>(() => popularCache ?? []);
  // Monoton steigende Request-ID: verwirft veraltete Antworten (Race bei schnellem Tippen).
  const reqId = useRef(0);

  // „Beliebt" = TMDB-Trending der Woche (2 Seiten ≈ 40 Titel, 2 Requests).
  // Füllt auch große Screens mit mehreren Poster-Reihen statt einer einzelnen.
  useEffect(() => {
    if (!active || popularCache) return;
    let alive = true;
    (async () => {
      try {
        const [p1, p2] = await Promise.all([
          tmdbFetch<TmdbListResponse>('trending/all/week', { page: 1 }),
          tmdbFetch<TmdbListResponse>('trending/all/week', { page: 2 }),
        ]);
        const items: QuickResult[] = [...(p1.results || []), ...(p2.results || [])]
          .filter((r) => r.poster_path && (r.media_type === 'tv' || r.media_type === 'movie'))
          .map((r) => ({
            id: r.id,
            type: r.media_type === 'tv' ? ('series' as const) : ('movie' as const),
            title: (r.media_type === 'tv' ? r.name || r.title : r.title || r.name) || '',
            poster_path: r.poster_path || undefined,
            vote_average: r.vote_average,
            year: (r.first_air_date || r.release_date || '').slice(0, 4),
          }))
          .filter((r) => r.title);
        // Seiten können sich überlappen — nach type+id deduplizieren.
        const seen = new Set<string>();
        const deduped = items.filter((r) => {
          const key = `${r.type}-${r.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (deduped.length > 0) popularCache = deduped;
        if (alive) setPopularItems(deduped);
      } catch {
        // best-effort — Fallback bleiben die Text-Chips
      }
    })();
    return () => {
      alive = false;
    };
  }, [active]);

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
    popularItems,
    saveRecent,
    removeRecent,
  };
}
