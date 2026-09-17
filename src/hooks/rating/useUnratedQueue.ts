import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { detectUnratedMovies } from '../../lib/validation/unratedMoviesDetection';
import { saveQuickRating } from '../../services/rating/quickRating';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

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
 * Filme (`detectUnratedMovies` über `useMovieList`). Bewerten läuft über
 * `saveQuickRating` — dieselbe Schreibstelle wie Suche und Kalender, inklusive
 * Genre-Fächerung, Film-Zeitstempeln und Wrapped-Eintrag. Der Realtime-Listener
 * rehydriert den State und das Item fällt bei der nächsten Detection raus.
 * Übersprungene Items werden für die Session lokal ausgeblendet.
 */
export const useUnratedQueue = () => {
  const { user } = useAuth() || {};
  const { unratedSeries } = useSeriesList();
  const { movieList } = useMovieList();

  // Session-lokal übersprungene bzw. schon bewertete Keys (optimistisch).
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  // Die Quellobjekte bleiben neben den Karten liegen: `saveQuickRating` braucht
  // Genres, Laufzeit und Anbieter, die Karte selbst nur Titel und Poster.
  const { allItems, sources } = useMemo(() => {
    const sourceByKey = new Map<string, Series | Movie>();
    const items: UnratedQueueItem[] = [];
    unratedSeries.forEach((series) => {
      const item = toItem(series, 'series');
      sourceByKey.set(item.key, series);
      items.push(item);
    });
    detectUnratedMovies(movieList).forEach((movie) => {
      const item = toItem(movie, 'movie');
      sourceByKey.set(item.key, movie);
      items.push(item);
    });
    return { allItems: items, sources: sourceByKey };
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
    async (item: UnratedQueueItem, rating: number, genreRatings?: Record<string, number>) => {
      // Optimistisch ausblenden, egal ob der Write gleich durchgeht.
      dismiss(item.key);
      if (!user || rating <= 0) return;

      try {
        await saveQuickRating(
          user.uid,
          { id: item.id, type: item.type, title: item.title },
          rating,
          sources.get(item.key),
          genreRatings
        );
      } catch (error) {
        console.error('[useUnratedQueue] Failed to save rating:', error);
      }
    },
    [user, dismiss, sources]
  );

  const skip = useCallback((item: UnratedQueueItem) => dismiss(item.key), [dismiss]);

  return {
    items,
    count: items.length,
    rate,
    skip,
  };
};
