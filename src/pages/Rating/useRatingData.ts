import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { genreMenuItems, genreMenuItemsForMovies } from '../../config/menuItems';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { logRatingAdded } from '../../features/badges/minimalActivityLogger';
import { calculateOverallRating } from '../../lib/rating/rating';
import { WatchActivityService } from '../../services/watchActivityService';
import { Movie as MovieType } from '../../types/Movie';
import { trackRatingSaved, trackRatingDeleted } from '../../firebase/analytics';
import { Series } from '../../types/Series';

export interface UseRatingDataResult {
  item: (Series | MovieType) | undefined;
  type: 'series' | 'movie' | undefined;
  activeTab: 'overall' | 'genre';
  setActiveTab: React.Dispatch<React.SetStateAction<'overall' | 'genre'>>;
  overallRating: number;
  genreRatings: Record<string, number>;
  isSaving: boolean;
  snackbar: { open: boolean; message: string };
  handleRatingChange: (value: number) => void;
  handleGenreRatingChange: (genre: string, value: number) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

export const useRatingData = (): UseRatingDataResult => {
  const { id, type } = useParams<{ id: string; type: 'series' | 'movie' }>();
  const { user } = useAuth()!;
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [activeTab, setActiveTab] = useState<'overall' | 'genre'>('overall');
  const [overallRating, setOverallRating] = useState(0);
  const [genreRatings, setGenreRatings] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Get item based on type
  const item =
    type === 'series'
      ? seriesList.find((s: Series) => s.id && s.id.toString() === id)
      : movieList.find((m: MovieType) => m.id && m.id.toString() === id);

  // Initialize ratings from Firebase genre-based structure
  useEffect(() => {
    if (item && user) {
      const allPossibleGenres =
        type === 'movie'
          ? genreMenuItemsForMovies.filter((g) => g.value !== 'All').map((g) => g.label)
          : genreMenuItems.filter((g) => g.value !== 'All').map((g) => g.label);

      const loadedRatings: Record<string, number> = {};
      allPossibleGenres.forEach((genre) => {
        loadedRatings[genre] = 0;
      });

      if (item.rating && typeof item.rating === 'object') {
        const overall = calculateOverallRating(item);
        setOverallRating(parseFloat(overall) || 0);

        Object.keys(item.rating).forEach((genre) => {
          if (typeof item.rating[genre] === 'number') {
            loadedRatings[genre] = item.rating[genre];
          }
        });
      } else {
        setOverallRating(0);
      }

      setGenreRatings(loadedRatings);
    }
  }, [item, user, type]);

  // Calculate average from genre ratings (only non-zero values)
  useEffect(() => {
    if (activeTab === 'genre' && Object.keys(genreRatings).length > 0) {
      const ratedGenres = Object.values(genreRatings).filter((rating) => rating > 0);
      if (ratedGenres.length > 0) {
        const avg = ratedGenres.reduce((a, b) => a + b, 0) / ratedGenres.length;
        setOverallRating(Math.round(avg * 100) / 100);
      } else {
        setOverallRating(0);
      }
    }
  }, [genreRatings, activeTab]);

  const handleRatingChange = (value: number) => {
    setOverallRating(value);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleGenreRatingChange = (genre: string, value: number) => {
    setGenreRatings((prev) => ({ ...prev, [genre]: value }));
  };

  const showSnackbar = (message: string) => {
    setSnackbar({ open: true, message });
    setTimeout(() => {
      setSnackbar({ open: false, message: '' });
    }, 3000);
  };

  const handleSave = async () => {
    if (!user || !item) return;
    setIsSaving(true);

    try {
      let ratingsToSave: { [key: string]: number } = {};

      if (activeTab === 'genre' && Object.keys(genreRatings).length > 0) {
        Object.entries(genreRatings).forEach(([genre, rating]) => {
          if (rating > 0) {
            ratingsToSave[genre] = rating;
          }
        });
      } else {
        const genres = item.genre?.genres || [];

        if (genres.length > 0 && overallRating > 0) {
          genres.forEach((genre) => {
            ratingsToSave[genre] = overallRating;
          });
        } else if (overallRating > 0) {
          ratingsToSave['General'] = overallRating;
        }
      }

      if (Object.keys(ratingsToSave).length > 0) {
        const ratingRef = firebase
          .database()
          .ref(`${user.uid}/${type === 'series' ? 'serien' : 'filme'}/${item.nmr}/rating`);

        await ratingRef.set(ratingsToSave);

        // Wrapped 2026: Fuer Filme auch ratedAt und watchedAt speichern
        if (type === 'movie') {
          const movieItem = item as MovieType;
          const now = new Date().toISOString();
          const movieRef = firebase.database().ref(`${user.uid}/filme/${item.nmr}`);

          await movieRef.child('ratedAt').set(now);

          if (!movieItem.watchedAt) {
            await movieRef.child('watchedAt').set(now);
          }

          WatchActivityService.logMovieWatch(
            user.uid,
            movieItem.id,
            movieItem.title,
            movieItem.runtime,
            overallRating,
            movieItem.genre?.genres,
            movieItem.provider?.provider?.map((p) => p.name)
          );
        }

        // Activity-Logging fuer Friend + Badge-System
        if (user?.uid && overallRating > 0) {
          await logRatingAdded(
            user.uid,
            item.title || 'Unbekannter Titel',
            type === 'series' ? 'series' : 'movie',
            overallRating,
            item.id
          );
        }

        trackRatingSaved(String(item.id), type || 'unknown', overallRating);
        showSnackbar(`Bewertung für "${item.title}" wurde gespeichert!`);
      }
    } catch (error) {
      showSnackbar('Fehler beim Speichern der Bewertung.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !item) return;
    if (!window.confirm(`Bewertung für ${item.title} wirklich löschen?`)) return;

    setIsSaving(true);

    try {
      const ratingRef = firebase
        .database()
        .ref(`${user.uid}/${type === 'series' ? 'serien' : 'filme'}/${item.nmr}/rating`);

      await ratingRef.remove();
      trackRatingDeleted(String(item.id), type || 'unknown');
      showSnackbar(`Bewertung für "${item.title}" wurde gelöscht!`);
    } catch (error) {
      showSnackbar('Fehler beim Löschen der Bewertung.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    item,
    type,
    activeTab,
    setActiveTab,
    overallRating,
    genreRatings,
    isSaving,
    snackbar,
    handleRatingChange,
    handleGenreRatingChange,
    handleSave,
    handleDelete,
  };
};
