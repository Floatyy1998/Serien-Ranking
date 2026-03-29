import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useState } from 'react';
import { useAuth } from '../AuthContext';
import { calculateOverallRating } from '../lib/rating/rating';
import { logRatingAdded } from '../features/badges/minimalActivityLogger';
import { trackRatingSaved } from '../firebase/analytics';
import type { Series } from '../types/Series';

interface QuickRatingState {
  isOpen: boolean;
  series: Series | null;
  seasonNumber: number;
}

/**
 * Prüft ob die gerade markierte Episode die letzte der letzten Staffel ist
 * und ob die Serie noch nicht bewertet wurde.
 */
export function shouldTriggerQuickRate(
  series: Series,
  seasonIndex: number,
  episodeIndex: number
): boolean {
  if (!series.seasons?.length) return false;

  // Nur bei der letzten Staffel triggern
  const lastSeasonIndex = series.seasons.length - 1;
  if (seasonIndex !== lastSeasonIndex) return false;

  // Nur bei der letzten Episode der Staffel
  const lastSeason = series.seasons[lastSeasonIndex];
  const lastEpisodeIndex = (lastSeason.episodes?.length || 0) - 1;
  if (episodeIndex !== lastEpisodeIndex) return false;

  // Nicht triggern wenn bereits bewertet
  const currentRating = calculateOverallRating(series);
  if (parseFloat(currentRating) > 0) return false;

  // Nicht triggern bei aktivem Rewatch
  if (series.rewatch?.active) return false;

  return true;
}

export const useQuickSeasonRating = () => {
  const { user } = useAuth() || {};
  const [state, setState] = useState<QuickRatingState>({
    isOpen: false,
    series: null,
    seasonNumber: 0,
  });

  const showQuickRating = useCallback((series: Series, seasonNumber: number) => {
    setState({ isOpen: true, series, seasonNumber });
  }, []);

  const closeQuickRating = useCallback(() => {
    setState({ isOpen: false, series: null, seasonNumber: 0 });
  }, []);

  const saveQuickRating = useCallback(
    async (rating: number) => {
      if (!user || !state.series) return;

      const series = state.series;
      const genres = series.genre?.genres || [];
      const ratingsToSave: Record<string, number> = {};

      if (genres.length > 0) {
        genres.forEach((genre) => {
          ratingsToSave[genre] = rating;
        });
      } else {
        ratingsToSave['General'] = rating;
      }

      try {
        const ratingRef = firebase.database().ref(`${user.uid}/serien/${series.nmr}/rating`);
        await ratingRef.set(ratingsToSave);

        trackRatingSaved(String(series.id), 'series', rating);

        await logRatingAdded(
          user.uid,
          series.title || 'Unbekannter Titel',
          'series',
          rating,
          series.id
        );
      } catch (error) {
        console.error('Failed to save quick rating:', error);
      }

      closeQuickRating();
    },
    [user, state.series, closeQuickRating]
  );

  return {
    quickRatingOpen: state.isOpen,
    quickRatingSeries: state.series,
    quickRatingSeasonNumber: state.seasonNumber,
    showQuickRating,
    closeQuickRating,
    saveQuickRating,
  };
};
