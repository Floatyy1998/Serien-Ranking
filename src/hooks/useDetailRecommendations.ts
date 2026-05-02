import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useMovieList } from '../contexts/MovieListContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { trackMovieAdded, trackSeriesAdded } from '../firebase/analytics';
import { logMovieAdded, logSeriesAdded } from '../features/badges/minimalActivityLogger';
import type { DiscoverItem } from '../pages/Discover/discoverItemHelpers';

interface UseDetailRecommendationsResult {
  items: DiscoverItem[];
  loading: boolean;
  error: string | null;
  addingId: number | null;
  addToList: (item: DiscoverItem) => Promise<boolean>;
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

/**
 * Lädt TMDB-Empfehlungen + ähnliche Titel für eine Serie/einen Film und filtert
 * Einträge heraus, die der Nutzer bereits in seiner Liste hat.
 */
export const useDetailRecommendations = (
  id: string | number | undefined,
  mediaType: 'tv' | 'movie',
  enabled = true
): UseDetailRecommendationsResult => {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { user } = useAuth() || {};
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Stable lookup set – ändert sich nur wenn sich die User-Liste ändert
  const ownedIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const owned = new Set<number>();
    const list = mediaType === 'tv' ? allSeriesList : movieList;
    list.forEach((entry) => {
      if (entry?.id != null) owned.add(Number(entry.id));
    });
    ownedIdsRef.current = owned;
  }, [allSeriesList, movieList, mediaType]);

  const fetchRecs = useCallback(async () => {
    if (!id || !enabled) return;
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ api_key: apiKey, language: 'de-DE' });
      const [recRes, simRes] = await Promise.all([
        fetch(`${TMDB_BASE}/${mediaType}/${id}/recommendations?${params}`),
        fetch(`${TMDB_BASE}/${mediaType}/${id}/similar?${params}`),
      ]);
      const [recData, simData] = await Promise.all([
        recRes.ok ? recRes.json() : { results: [] },
        simRes.ok ? simRes.json() : { results: [] },
      ]);

      type TmdbItem = Omit<DiscoverItem, 'type' | 'inList'>;
      const recommendations: TmdbItem[] = recData?.results ?? [];
      const similar: TmdbItem[] = simData?.results ?? [];

      // Recommendations bevorzugen, dann similar dazu mischen
      const seen = new Set<number>();
      const merged: TmdbItem[] = [];
      [...recommendations, ...similar].forEach((entry) => {
        if (!entry?.id) return;
        if (seen.has(entry.id)) return;
        if (ownedIdsRef.current.has(Number(entry.id))) return;
        if (!entry.poster_path) return;
        seen.add(entry.id);
        merged.push(entry);
      });

      // Sortiere nach Bewertung × log(votes) – stabilere Reihenfolge als reine Popularität
      merged.sort((a, b) => {
        const aScore = (a.vote_average ?? 0) * Math.log10((a.vote_count ?? 0) + 10);
        const bScore = (b.vote_average ?? 0) * Math.log10((b.vote_count ?? 0) + 10);
        return bScore - aScore;
      });

      const enriched: DiscoverItem[] = merged.slice(0, 20).map((entry) => ({
        ...entry,
        type: mediaType === 'tv' ? 'series' : 'movie',
        inList: false,
      }));

      setItems(enriched);
    } catch (err) {
      console.error('useDetailRecommendations failed:', err);
      setError('Empfehlungen konnten nicht geladen werden');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [id, mediaType, enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchRecs();
  }, [fetchRecs, enabled]);

  const addToList = useCallback(
    async (item: DiscoverItem): Promise<boolean> => {
      if (!user) return false;
      setAddingId(item.id);
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

        if (!response.ok) return false;

        const title = item.title || item.name || 'Unbekannt';
        if (item.type === 'series') {
          trackSeriesAdded(String(item.id), title, 'detail-recommendations');
          await logSeriesAdded(user.uid, title, item.id, item.poster_path ?? undefined);
        } else {
          trackMovieAdded(String(item.id), title, 'detail-recommendations');
          await logMovieAdded(user.uid, title, item.id, item.poster_path ?? undefined);
        }

        setItems((prev) => prev.filter((entry) => entry.id !== item.id));
        return true;
      } catch (err) {
        console.error('Failed to add recommendation:', err);
        return false;
      } finally {
        setAddingId(null);
      }
    },
    [user]
  );

  return { items, loading, error, addingId, addToList };
};
