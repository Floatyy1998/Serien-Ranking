import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useMovieList } from '../contexts/MovieListContext';
import { dbRef, paths } from '../services/db/ref';
import { detectUnratedMovies } from '../lib/validation/unratedMoviesDetection';
import { logRatingAdded } from '../features/badges/minimalActivityLogger';
import { trackRatingSaved } from '../services/firebase/analytics';
import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';

export interface UnratedQueueItem {
  key: string; // stable `${type}-${id}` key for React lists + skip tracking
  id: number;
  type: 'series' | 'movie';
  title: string;
  posterPath: string;
  genres: string[];
}

function toItem(source: Series | Movie, type: 'series' | 'movie'): UnratedQueueItem {
  return {
    key: `${type}-${source.id}`,
    id: Number(source.id),
    type,
    title: source.title || 'Unbekannter Titel',
    posterPath: source.poster?.poster || '',
    genres: source.genre?.genres || [],
  };
}

/**
 * F8 — Schnell-Bewertungs-Queue. Bündelt „gesehen aber unbewertet" für Serien
 * (aus der bereits laufenden `detectUnratedSeries`, via `useSeriesList`) und
 * Filme (`detectUnratedMovies` über `useMovieList`). Bewerten schreibt die
 * genre-gefächerte Bewertung direkt in die RTDB — der Realtime-Listener
 * rehydriert den State und das Item fällt bei der nächsten Detection raus.
 * Übersprungene Items werden für die Session lokal ausgeblendet.
 */
export const useUnratedQueue = () => {
  const { user } = useAuth() || {};
  const { unratedSeries } = useSeriesList();
  const { movieList } = useMovieList();

  // Session-lokal übersprungene bzw. schon bewertete Keys (optimistisch).
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  const allItems = useMemo<UnratedQueueItem[]>(() => {
    const seriesItems = unratedSeries.map((s) => toItem(s, 'series'));
    const movieItems = detectUnratedMovies(movieList).map((m) => toItem(m, 'movie'));
    return [...seriesItems, ...movieItems];
  }, [unratedSeries, movieList]);

  const items = useMemo(
    () => allItems.filter((it) => !dismissedKeys.has(it.key)),
    [allItems, dismissedKeys]
  );

  const dismiss = useCallback((key: string) => {
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const rate = useCallback(
    async (item: UnratedQueueItem, rating: number) => {
      // Optimistisch ausblenden, egal ob der Write gleich durchgeht.
      dismiss(item.key);
      if (!user || rating <= 0) return;

      const ratingsToSave: Record<string, number> = {};
      if (item.genres.length > 0) {
        item.genres.forEach((genre) => {
          ratingsToSave[genre] = rating;
        });
      } else {
        ratingsToSave['General'] = rating;
      }

      const ratingPath =
        item.type === 'series'
          ? paths.seriesRating(user.uid, item.id)
          : paths.movieRating(user.uid, item.id);
      try {
        await dbRef(ratingPath).set(ratingsToSave);

        trackRatingSaved(String(item.id), item.type, rating);
        await logRatingAdded(user.uid, item.title, item.type, rating, item.id);
      } catch (error) {
        console.error('[useUnratedQueue] Failed to save rating:', error);
      }
    },
    [user, dismiss]
  );

  const skip = useCallback((item: UnratedQueueItem) => dismiss(item.key), [dismiss]);

  return {
    items,
    count: items.length,
    rate,
    skip,
  };
};
