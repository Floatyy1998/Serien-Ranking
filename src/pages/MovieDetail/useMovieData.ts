import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SUPPORTED_PROVIDERS } from '../../config/menuItems';
import { useMovieList } from '../../contexts/MovieListContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { logMovieAdded } from '../../features/badges/minimalActivityLogger';
import type { Movie } from '../../types/Movie';
import { trackMovieAdded, trackMovieDeleted } from '../../services/firebase/analytics';
import { getImageUrl } from '../../utils/imageUrl';
import { getTmdbApiKey, tmdbFetch } from '../../services/tmdbClient';
import type { TmdbMediaDetail, TmdbWatchProvidersResponse } from '../../services/tmdb.types';
import { backendFetch } from '../../services/backendApi';
import { dbRef, paths, updateWithSeriesVersion } from '../../services/db/ref';

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tmdbMovie, setTmdbMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'cast'>('info');
  const [isAdding, setIsAdding] = useState(false);

  const { isMobile } = useDeviceType();

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    message: '',
    type: 'info',
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
  });

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

  const localMovie = useMemo(() => {
    return movieList.find((m: Movie) => m.id === Number(id));
  }, [movieList, id]);

  const movie = localMovie || tmdbMovie;
  const isReadOnlyTmdbMovie = !localMovie && !!tmdbMovie;

  const currentRating = useMemo(() => {
    if (!movie?.rating) return 0;
    // Film-rating ist GENRE-keyed ({ Action: 8, General: 7, ... }), NICHT { uid: wert }.
    // "bewertet/gesehen" = irgendein positiver Wert -> Mittel der positiven Werte.
    const values = Object.values(movie.rating).filter(
      (r) => typeof r === 'number' && r > 0
    ) as number[];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [movie]);

  // "Gesehen" leitet sich aus einer Bewertung ODER dem expliziten watched-Flag
  // ab — so kann ein Film ohne Bewertung als gesehen markiert werden (F1).
  const isWatched = currentRating > 0 || movie?.watched === true;

  const averageRating = useMemo(() => {
    if (!movie?.rating) return 0;
    const ratings = Object.values(movie.rating).filter(
      (r) => typeof r === 'number' && r > 0
    ) as number[];
    if (ratings.length === 0) return 0;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return Math.round(avg * 10) / 10;
  }, [movie]);

  const getBackdropUrl = (backdropPath: string | undefined): string =>
    getImageUrl(backdropPath, 'original', '');

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    const apiKey = getTmdbApiKey();

    if (id && apiKey) {
      tmdbFetch<TmdbMediaDetail>(`movie/${id}`)
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
        .catch(() => {}); // bewusst still: Backdrop/TMDB-Rating sind optionale Anreicherung

      tmdbFetch<TmdbWatchProvidersResponse>(`movie/${id}/watch/providers`, { language: undefined })
        .then((data) => {
          if (data.results?.DE?.flatrate) {
            setProviders(
              data.results.DE.flatrate.filter((p: { provider_name: string }) =>
                SUPPORTED_PROVIDERS.has(p.provider_name)
              )
            );
          }
        })
        .catch(() => {}); // bewusst still: Provider-Anzeige ist optionale Anreicherung
    }

    if (!localMovie && id && apiKey && !tmdbMovie) {
      const hasNonLatin = (text: string) => /[^\u0020-\u024F\u1E00-\u1EFF]/.test(text);
      setLoading(true);
      Promise.all([
        tmdbFetch<TmdbMediaDetail>(`movie/${id}`, {
          append_to_response: 'credits,external_ids',
        }),
        tmdbFetch<TmdbMediaDetail>(`movie/${id}`, { language: 'en-US' }),
      ])
        .then(([data, dataEN]) => {
          const bestTitle =
            data.title && !hasNonLatin(data.title) ? data.title : dataEN.title || data.title;
          if (data.id) {
            const movie: Movie = {
              id: data.id,
              title: bestTitle || '',
              poster: { poster: data.poster_path || '' },
              genre: {
                genres: data.genres?.map((g: TMDBGenre) => g.name) || [],
              },
              provider: { provider: [] },
              release_date: data.release_date,
              runtime: data.runtime ?? 0,
              beschreibung: data.overview,
              overview: data.overview,
              backdrop: data.backdrop_path ?? undefined,
              begründung: '',
              imdb: { imdb_id: data.external_ids?.imdb_id || '' },
              rating: {},
              wo: { wo: '' },
            };
            setTmdbMovie(movie);
          }
        })
        .catch((error) =>
          console.error('Film-Details konnten nicht von TMDB geladen werden:', error)
        )
        .finally(() => setLoading(false));
    }
  }, [localMovie, id, tmdbMovie]);

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
        .catch(() => {}); // bewusst still: IMDB-Rating ist optionale Anreicherung
    }
  }, [movie, localMovie]);

  const handleAddMovie = useCallback(async () => {
    if (!movie || !user) return;

    setIsAdding(true);
    try {
      const response = await backendFetch('/addMovie', {
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

  /**
   * F1: "Gesehen"-Toggle ohne Bewertungs-Umweg. Setzt `watched` (+ `watchedAt`)
   * direkt in der RTDB und bumpt `meta/serienVersion` atomar mit. Die Bewertung
   * (`rating`) bleibt unangetastet. Der Realtime-Listener rehydriert den State.
   */
  const handleToggleWatched = useCallback(async () => {
    if (!movie || !user) return;

    const next = !isWatched;
    try {
      const base = paths.movieItem(user.uid, movie.id);
      // updateWithSeriesVersion hängt den serienVersion-Bump atomar an.
      await updateWithSeriesVersion(user.uid, {
        [`${base}/watched`]: next,
        // Beim Markieren bestehendes watchedAt bewahren, sonst jetzt setzen;
        // beim Zurücknehmen entfernen (null).
        [`${base}/watchedAt`]: next ? movie.watchedAt || new Date().toISOString() : null,
      });
    } catch {
      // best-effort: bei Fehler kurz informieren, State kommt vom Listener
      setDialog({
        open: true,
        message: 'Der Gesehen-Status konnte nicht gespeichert werden.',
        type: 'error',
      });
    }
  }, [movie, user, isWatched]);

  const handleDeleteMovie = useCallback(async () => {
    if (!movie || !user) return;

    try {
      setLoading(true);

      const movieRef = dbRef(paths.movieItem(user.uid, movie.id));
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
    id,
    navigate,
    user,

    movie,
    localMovie,
    tmdbMovie,
    isReadOnlyTmdbMovie,
    loading,

    tmdbBackdrop,
    tmdbRating,
    imdbRating,
    tmdbOverview,
    providers,

    currentRating,
    isWatched,
    averageRating,

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

    handleAddMovie,
    handleDeleteMovie,
    handleToggleWatched,

    getBackdropUrl,
    formatRuntime,
  };
};
