/**
 * useHomeQuickSearch — schlanke Such-Logik für den Inline-Dropdown auf dem
 * Homescreen (Spotlight-Style). Bewusst NICHT useSearchPage: das würde `?q=` in
 * die Home-URL schreiben (History-Spam). Hier nur lokaler Query-State und ein
 * debounced TMDB-Multi-Search (Serien, Filme und Personen parallel); den Verlauf
 * führt services/settings/recentSearches.
 */
import { useEffect, useRef, useState } from 'react';
import { peopleLeadResults, type PersonHit } from '../../../lib/person/personSearch';
import { rankSearchResults } from '../../../lib/text/searchRelevance';
import { tmdbFetch } from '../../../services/api/tmdbClient';
import { searchPeople } from '../../../services/api/tmdbPeople';

export interface QuickResult {
  id: number;
  type: 'series' | 'movie';
  title: string;
  poster_path?: string;
  year: string;
  vote_average?: number;
  popularity?: number;
}

interface TmdbListResponse {
  results?: Array<{
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    poster_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    popularity?: number;
    media_type?: string;
  }>;
}

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
  people: PersonHit[];
  peopleFirst: boolean;
  loading: boolean;
  popular: string[];
  /** „Beliebt" als konkrete Titel mit Postern (leer, bis TMDB aufgelöst hat). */
  popularItems: QuickResult[];
}

/**
 * @param active Erst wenn true (Overlay offen), werden die „Beliebt"-Poster
 *               aufgelöst — Nutzer, die die Suche nie öffnen, kosten keine Requests.
 * @param searchMedia false: nur der Query-State, keine TMDB-Suche (Lesen-Suche).
 */
export function useHomeQuickSearch(active = true, searchMedia = true): UseHomeQuickSearchResult {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuickResult[]>([]);
  const [people, setPeople] = useState<{ hits: PersonHit[]; first: boolean }>({
    hits: [],
    first: false,
  });
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || !searchMedia) {
      setResults([]);
      setPeople({ hits: [], first: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const [tv, mv, hits] = await Promise.all([
          tmdbFetch<TmdbListResponse>('search/tv', { query: q, page: 1 }),
          tmdbFetch<TmdbListResponse>('search/movie', { query: q, page: 1 }),
          searchPeople(q).catch(() => [] as PersonHit[]),
        ]);
        if (id !== reqId.current) return; // veraltete Antwort verwerfen

        const tag = (arr: TmdbListResponse['results'], type: 'series' | 'movie') =>
          (arr || []).map((r) => ({ ...r, type }));

        const merged: QuickResult[] = rankSearchResults(
          [...tag(tv.results, 'series'), ...tag(mv.results, 'movie')],
          q
        )
          .map((r) => ({
            id: r.id,
            type: r.type,
            title: (r.type === 'series' ? r.name || r.title : r.title || r.name) || '',
            poster_path: r.poster_path || undefined,
            vote_average: r.vote_average,
            popularity: r.popularity,
            year: (r.first_air_date || r.release_date || '').slice(0, 4),
          }))
          .filter((r) => r.title)
          .slice(0, 18);
        setResults(merged);
        setPeople({
          hits,
          first: peopleLeadResults(hits, [...(tv.results || []), ...(mv.results || [])], q),
        });
      } catch {
        if (id === reqId.current) {
          setResults([]);
          setPeople({ hits: [], first: false });
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMedia]);

  return {
    query,
    setQuery,
    results,
    people: people.hits,
    peopleFirst: people.first,
    loading,
    popular: POPULAR_SEARCHES,
    popularItems,
  };
}
