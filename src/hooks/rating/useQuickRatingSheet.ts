import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { t } from '../../services/i18n';
import { saveQuickRating, type QuickRatingItem } from '../../services/rating/quickRating';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';

export interface QuickRatingTarget extends QuickRatingItem {
  /** Bestehende Gesamtbewertung, damit das Sheet nicht bei 0 startet. */
  userRating?: number;
}

export interface QuickRatingSheetState {
  open: boolean;
  title: string;
  /** Sheet ging direkt nach „als gesehen markiert" auf. */
  afterWatched: boolean;
  initialRating: number;
  /** Genres des Titels — Grundlage der aufklappbaren Detailstufe. */
  genres: string[];
  /** Serie oder Film — beide haben eigene Genre-Listen. */
  mediaType: 'series' | 'movie';
  /** TMDB-ID für den Freundes-Reiter. */
  itemId: number | undefined;
  /** Bereits gespeicherte Bewertung je Genre. */
  genreRatings: Record<string, number>;
}

interface Options {
  onSaved?: (message: string) => void;
  onError?: (message: string) => void;
}

/** Stabile Leerwerte — sonst startet das Sheet bei jedem Render neu. */
const EMPTY_GENRES: string[] = [];
const EMPTY_RATINGS: Record<string, number> = {};

/**
 * Zustand und Speichern des Schnellbewertungs-Sheets für Suchtreffer. Die
 * Genres kommen aus der eigenen Liste (siehe `services/quickRating`).
 */
export function useQuickRatingSheet({ onSaved, onError }: Options = {}) {
  const { user } = useAuth() || {};
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [target, setTarget] = useState<{ item: QuickRatingTarget; afterWatched: boolean } | null>(
    null
  );

  const findOwned = useCallback(
    (item: QuickRatingItem): Series | Movie | undefined =>
      item.type === 'series'
        ? allSeriesList.find((s) => s.id === item.id)
        : movieList.find((m) => m.id === item.id),
    [allSeriesList, movieList]
  );

  const openQuickRating = useCallback((item: QuickRatingTarget, afterWatched = false) => {
    setTarget({ item, afterWatched });
  }, []);

  const closeQuickRating = useCallback(() => setTarget(null), []);

  const save = useCallback(
    async (rating: number, genreRatings?: Record<string, number>) => {
      const current = target;
      setTarget(null);
      if (!current || !user || rating <= 0) return;
      const { item } = current;
      try {
        await saveQuickRating(user.uid, item, rating, findOwned(item), genreRatings);
        onSaved?.(t('Bewertung für "{title}" wurde gespeichert!', { title: item.title }));
      } catch (error) {
        console.error('Failed to save quick rating:', error);
        onError?.(t('Fehler beim Speichern der Bewertung.'));
      }
    },
    [target, user, findOwned, onSaved, onError]
  );

  const quickRating = useMemo<QuickRatingSheetState>(() => {
    const owned = target ? findOwned(target.item) : undefined;
    const stored = owned?.rating;
    return {
      open: target !== null,
      title: target?.item.title ?? '',
      afterWatched: target?.afterWatched ?? false,
      // Eine Nachkommastelle wie auf der Karte — der Regler arbeitet in 0,1-Schritten.
      initialRating: Math.round((target?.item.userRating ?? 0) * 10) / 10,
      genres: owned?.genre?.genres ?? EMPTY_GENRES,
      mediaType: target?.item.type ?? 'series',
      itemId: target?.item.id,
      genreRatings:
        stored && typeof stored === 'object' ? (stored as Record<string, number>) : EMPTY_RATINGS,
    };
  }, [target, findOwned]);

  return { quickRating, openQuickRating, closeQuickRating, saveQuickRating: save };
}
