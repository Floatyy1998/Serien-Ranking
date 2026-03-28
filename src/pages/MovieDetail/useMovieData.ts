import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { logMovieAdded } from '../../features/badges/minimalActivityLogger';
import type { Movie } from '../../types/Movie';
import { trackMovieAdded, trackMovieDeleted } from '../../firebase/analytics';
import { getImageUrl } from '../../utils/imageUrl';

/** TMDB genre object */
interface TMDBGenre {
  id: number;
  name: string;
}

/** TMDB watch provider object (compatible with ProviderBadges Provider interface) */
export interface TMDBWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority?: number;
}

export interface DialogState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
}

export interface SnackbarState {
  open: boolean;
  message: string;
}

export const useMovieData = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { movieList } = useMovieList();

  // --- Core state ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tmdbMovie, setTmdbMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'cast'>('info');
  const [isAdding, setIsAdding] = useState(false);

  // --- Responsive state ---
  const { isMobile } = useDeviceType();

  // --- UI feedback state ---
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    message: '',
    type: 'info',
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
  });

  // --- TMDB data state ---
  const [tmdbBackdrop, setTmdbBackdrop] = useState<string | null>(null);
  const [providers, setProviders] = useState<TMDBWatchProvider[] | null>(null);
  const [tmdbRating, setTmdbRating] = useState<{
    vote_average: number;
    vote_count: number;
  } | null>(null);
  const [imdbRating, setImdbRating] = useState<{
    rating: number;
    votes: string;
  } | null>(null);
  const [tmdbOverview, setTmdbOverview] = useState<string | null>(null);

  // --- Derived data ---
  const localMovie = useMemo(() => {
    return movieList.find((m: Movie) => m.id === Number(id));
  }, [movieList, id]);

  const movie = localMovie || tmdbMovie;
  const isReadOnlyTmdbMovie = !localMovie && !!tmdbMovie;

  const currentRating = useMemo(() => {
    if (!movie?.rating || !user?.uid) return 0;
    return movie.rating[user.uid] || 0;
  }, [movie, user]);

  const isWatched = currentRating > 0;

  const averageRating = useMemo(() => {
    if (!movie?.rating) return 0;
    const ratings = Object.values(movie.rating).filter(
      (r) => typeof r === 'number' && r > 0
    ) as number[];
    if (ratings.length === 0) return 0;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return Math.round(avg * 10) / 10;
  }, [movie]);

  // --- Helpers ---
  const getBackdropUrl = (backdropPath: string | undefined): string =>
    getImageUrl(backdropPath, 'original', '');

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // --- TMDB + OMDB fetching ---
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;

    if (id && apiKey) {
      // Fetch backdrop and TMDB rating
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=de-DE`)
        .then((res) => res.json())
        .then((data) => {
          if (data.backdrop_path) {
            setTmdbBackdrop(data.backdrop_path);
          }
          if (data.vote_average && data.vote_count) {
            setTmdbRating({
              vote_average: data.vote_average,
              vote_count: data.vote_count,
            });
          }
          if (data.overview) {
            setTmdbOverview(data.overview);
          }
        })
        .catch(() => {});

      // Fetch providers
      fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.results?.DE?.flatrate) {
            setProviders(data.results.DE.flatrate);
          }
        })
        .catch(() => {});
    }

    // Full fetch if not found locally
    if (!localMovie && id && apiKey && !tmdbMovie) {
      const hasNonLatin = (text: string) => /[^\u0020-\u024F\u1E00-\u1EFF]/.test(text);
      setLoading(true);
      Promise.all([
        fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=de-DE&append_to_response=credits,external_ids`
        ).then((r) => r.json()),
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`).then(
          (r) => r.json()
        ),
      ])
        .then(([data, dataEN]) => {
          const bestTitle =
            data.title && !hasNonLatin(data.title) ? data.title : dataEN.title || data.title;
          if (data.id) {
            const movie: Movie = {
              id: data.id,
              nmr: 0,
              title: bestTitle,
              poster: { poster: data.poster_path },
              genre: {
                genres: data.genres?.map((g: TMDBGenre) => g.name) || [],
              },
              provider: { provider: [] },
              release_date: data.release_date,
              runtime: data.runtime,
              beschreibung: data.overview,
              overview: data.overview,
              backdrop: data.backdrop_path,
              begründung: '',
              imdb: { imdb_id: data.external_ids?.imdb_id || '' },
              rating: {},
              wo: { wo: '' },
            };
            setTmdbMovie(movie);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [localMovie, id, tmdbMovie]);

  // Fetch IMDB rating from OMDb API
  useEffect(() => {
    const omdbKey = import.meta.env.VITE_API_OMDb;
    const imdbId = movie?.imdb?.imdb_id || localMovie?.imdb?.imdb_id;

    if (imdbId && omdbKey) {
      fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            setImdbRating({
              rating: parseFloat(data.imdbRating),
              votes: data.imdbVotes || '0',
            });
          }
        })
        .catch(() => {});
    }
  }, [movie, localMovie]);

  // --- Handlers ---
  const handleAddMovie = useCallback(async () => {
    if (!movie || !user) return;

    setIsAdding(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/addMovie`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: import.meta.env.VITE_USER,
          id: movie.id,
          uuid: user.uid,
        }),
      });

      if (response.ok) {
        let posterPath: string | undefined;
        if (movie.poster && typeof movie.poster === 'object' && movie.poster.poster) {
          posterPath = movie.poster.poster;
        } else if (tmdbMovie && tmdbMovie.poster?.poster) {
          posterPath = tmdbMovie.poster.poster;
        }
        await logMovieAdded(user.uid, movie.title || 'Unbekannter Film', movie.id, posterPath);

        trackMovieAdded(String(movie.id), movie.title || '', 'detail_page');
        setSnackbar({ open: true, message: 'Film erfolgreich hinzugefügt!' });
        setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);

        navigate(`/movie/${movie.id}`);
      } else {
        const data = await response.json();
        if (data.error === 'Film bereits vorhanden') {
          setDialog({
            open: true,
            message: 'Film ist bereits in deiner Liste!',
            type: 'info',
          });
        } else {
          throw new Error('Fehler beim Hinzufügen');
        }
      }
    } catch {
      setDialog({
        open: true,
        message: 'Fehler beim Hinzufügen des Films.',
        type: 'error',
      });
    } finally {
      setIsAdding(false);
    }
  }, [movie, user, tmdbMovie, navigate]);

  const handleDeleteMovie = useCallback(async () => {
    if (!movie || !user) return;

    try {
      setLoading(true);

      const movieRef = firebase.database().ref(`${user.uid}/filme/${movie.nmr}`);
      await movieRef.remove();
      trackMovieDeleted(String(movie.id), movie.title || '');
      setSnackbar({ open: true, message: 'Film erfolgreich gelöscht!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);

      setShowDeleteConfirm(false);
    } catch {
      setDialog({
        open: true,
        message: 'Fehler beim Löschen des Films.',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [movie, user]);

  return {
    // Identifiers
    id,
    navigate,
    user,

    // Movie data
    movie,
    localMovie,
    tmdbMovie,
    isReadOnlyTmdbMovie,
    loading,

    // TMDB enrichment
    tmdbBackdrop,
    tmdbRating,
    imdbRating,
    tmdbOverview,
    providers,

    // Rating data
    currentRating,
    isWatched,
    averageRating,

    // UI state
    activeTab,
    setActiveTab: (tab: 'info' | 'cast') => {
      setActiveTab(tab);
    },
    isMobile,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isAdding,
    dialog,
    setDialog,
    snackbar,

    // Handlers
    handleAddMovie,
    handleDeleteMovie,

    // Helpers
    getBackdropUrl,
    formatRuntime,
  };
};
