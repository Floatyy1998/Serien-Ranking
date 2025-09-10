import { MobileBackButton } from '../components/MobileBackButton';
import { MobileDialog } from '../components/MobileDialog';
import {
  Delete,
  Info,
  People,
  Star,
  Visibility,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, memo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { Movie } from '../../types/Movie';
import { logMovieAdded } from '../../features/badges/minimalActivityLogger';
import { useTheme } from '../../contexts/ThemeContext';
import { MobileCastCrew } from '../components/MobileCastCrew';
import { MobileProviderBadges } from '../components/MobileProviderBadges';
import { motion } from 'framer-motion';

export const MobileMovieDetailPage = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { movieList } = useMovieList();
  const { currentTheme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tmdbMovie, setTmdbMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'cast'>('info');
  const [dialog, setDialog] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning'; onConfirm?: () => void }>({ open: false, message: '', type: 'info' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Find the movie locally first
  const localMovie = useMemo(() => {
    return movieList.find((m: Movie) => m.id === Number(id));
  }, [movieList, id]);

  // State for backdrop from TMDB
  const [tmdbBackdrop, setTmdbBackdrop] = useState<string | null>(null);
  // State for providers
  const [providers, setProviders] = useState<any>(null);

  // Fetch from TMDB - always for backdrop and full data if not found locally
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    
    // ALWAYS fetch backdrop and providers from TMDB
    if (id && apiKey) {
      // Fetch backdrop
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=de-DE`)
        .then(res => res.json())
        .then(data => {
          if (data.backdrop_path) {
            setTmdbBackdrop(data.backdrop_path);
          }
        })
        .catch(() => {});
      
      // Fetch providers
      fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`)
        .then(res => res.json())
        .then(data => {
          if (data.results?.DE?.flatrate) {
            setProviders(data.results.DE.flatrate);
          }
        })
        .catch(() => {});
    }
    
    // Full fetch if not found locally
    if (!localMovie && id && apiKey && !tmdbMovie) {
      setLoading(true);
      fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=de-DE&append_to_response=credits`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            // Transform TMDB data to match our Movie type
            const movie: Movie = {
              id: data.id,
              nmr: 0, // No nmr for non-user movies
              title: data.title,
              poster: { poster: data.poster_path },
              genre: { genres: data.genres?.map((g: any) => g.name) || [] },
              provider: { provider: [] },
              release_date: data.release_date,
              runtime: data.runtime,
              beschreibung: data.overview,
              overview: data.overview,
              backdrop: data.backdrop_path,
              // Required fields with defaults
              begründung: '',
              imdb: { imdb_id: '' },
              rating: {},
              wo: { wo: '' }
            };
            setTmdbMovie(movie);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [localMovie, id, tmdbMovie]); // Add tmdbMovie to prevent re-fetching

  // Use local movie if available, otherwise use TMDB movie
  const movie = localMovie || tmdbMovie;

  // Check if this is a TMDB-only movie (not in user's list)
  const isReadOnlyTmdbMovie = !localMovie && !!tmdbMovie;
  const [isAdding, setIsAdding] = useState(false);

  // Get user rating
  const currentRating = useMemo(() => {
    if (!movie?.rating || !user?.uid) return 0;
    return movie.rating[user.uid] || 0;
  }, [movie, user]);


  // Get backdrop URL - use actual backdrop field or TMDB backdrop
  const getBackdropUrl = (backdropPath: string | undefined): string => {
    if (!backdropPath) return '';
    if (backdropPath.startsWith('http')) return backdropPath;
    // Use original size for best quality on 2K/4K monitors
    return `https://image.tmdb.org/t/p/original${backdropPath}`;
  };

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!movie?.rating) return 0;
    const ratings = Object.values(movie.rating).filter(
      (r) => typeof r === 'number' && r > 0
    ) as number[];
    if (ratings.length === 0) return 0;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return Math.round(avg * 10) / 10;
  }, [movie]);

  // Format runtime
  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };


  const handleAddMovie = useCallback(async () => {
    if (!movie || !user) return;

    setIsAdding(true);
    try {
      const response = await fetch(
        'https://serienapi.konrad-dinges.de/addMovie',
        {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: import.meta.env.VITE_USER,
            id: movie.id,
            uuid: user.uid,
          }),
        }
      );

      if (response.ok) {
        // Activity-Logging für Friend + Badge-System (wie Desktop)
        await logMovieAdded(
          user.uid,
          movie.title || 'Unbekannter Film',
          movie.id
        );
        
        // Show success snackbar
        setSnackbar({ open: true, message: 'Film erfolgreich hinzugefügt!' });
        setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
        
        // Navigate to the movie detail page with the movie data
        navigate(`/movie/${movie.id}`);
      } else {
        const data = await response.json();
        if (data.error === 'Film bereits vorhanden') {
          setDialog({ open: true, message: 'Film ist bereits in deiner Liste!', type: 'info' });
        } else {
          throw new Error('Fehler beim Hinzufügen');
        }
      }
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Hinzufügen des Films.', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [movie, user]);

  const handleDeleteMovie = useCallback(async () => {
    if (!movie || !user) return;

    try {
      setLoading(true);

      // Delete movie from Firebase
      const movieRef = firebase
        .database()
        .ref(`${user.uid}/filme/${movie.nmr}`);

      await movieRef.remove();

      // Show success message
      setSnackbar({ open: true, message: 'Film erfolgreich gelöscht!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
      
      // Movie will be removed from list automatically via Firebase listener
      // No navigation needed - stay on current page
      setShowDeleteConfirm(false);
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Löschen des Films.', type: 'error' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [movie, user, navigate]);


  if (!movie && !loading) {
    const apiKey = import.meta.env.VITE_API_TMDB;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
          Film nicht gefunden
        </h2>
        {!apiKey && (
          <p style={{ color: currentTheme.text.secondary, maxWidth: '400px' }}>
            Dieser Film ist nicht in deiner Liste. Um Filme von Freunden
            anzuzeigen, wird ein TMDB API-Schlüssel benötigt.
          </p>
        )}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '8px',
            color: currentTheme.text.primary,
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Zurück
        </button>
      </div>
    );
  }

  if (loading || !movie) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <p>Lade...</p>
      </div>
    );
  }

  const isWatched = currentRating > 0;

  return (
    <div
    >
      {/* Hero Section with Backdrop */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '400px',
          overflow: 'hidden',
        }}
      >
        {tmdbBackdrop ? (
          <img
            src={getBackdropUrl(tmdbBackdrop)}
            alt={movie.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              opacity: 0.5,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background:
                `linear-gradient(135deg, ${currentTheme.status.error}33 0%, ${currentTheme.status.warning}33 100%)`,
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: `linear-gradient(to top, ${currentTheme.background.default} 0%, transparent 100%)`,
          }}
        />

        {/* Header Buttons */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(20px + env(safe-area-inset-top))',
            left: '20px',
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <MobileBackButton 
            style={{
              backdropFilter: 'blur(10px)',
            }}
          />

          {/* Show Add button for TMDB movies, Delete button for user's movies */}
          {isReadOnlyTmdbMovie ? (
            <button
              onClick={handleAddMovie}
              disabled={isAdding}
              style={{
                background: isAdding
                  ? `${currentTheme.status.success}88`
                  : `${currentTheme.status.success}CC`,
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: currentTheme.text.primary,
                fontSize: '24px',
                cursor: isAdding ? 'not-allowed' : 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
              }}
            >
              {isAdding ? '...' : '+'}
            </button>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: `${currentTheme.status.error}CC`,
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: currentTheme.text.primary,
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
              }}
            >
              <Delete />
            </button>
          )}
        </div>

        {/* Movie Info Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              margin: '0 0 8px 0',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {movie.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              opacity: 0.9,
              marginBottom: '8px',
            }}
          >
            {movie.release_date && (
              <span>{new Date(movie.release_date).getFullYear()}</span>
            )}
            {movie.runtime && <span>• {formatRuntime(movie.runtime)}</span>}
            {averageRating > 0 && (
              <span style={{ color: '#ffd700' }}>
                • ⭐ {averageRating}
              </span>
            )}
          </div>

          {/* Provider Badges unter der Info-Zeile */}
          {((movie.provider?.provider && movie.provider.provider.length > 0) || providers) && (
            <div style={{ marginBottom: '16px' }}>
              <MobileProviderBadges
                providers={(movie.provider?.provider && movie.provider.provider.length > 0) ? movie.provider.provider : providers}
                size="large"
                maxDisplay={6}
                showNames={false}
              />
            </div>
          )}

          {/* User Rating */}
          {isWatched && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: 'rgba(76, 209, 55, 0.2)',
                border: '1px solid rgba(76, 209, 55, 0.4)',
                borderRadius: '20px',
                fontSize: '13px',
              }}
            >
              <Visibility style={{ fontSize: '16px' }} />
              Gesehen • {currentRating}/10
            </div>
          )}

        </div>
      </div>

      {/* Action Buttons - for user's movies */}
      {!isReadOnlyTmdbMovie && (
        <div style={{ padding: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/rating/movie/${movie.id}`)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: isWatched
                ? 'rgba(255, 215, 0, 0.2)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: isWatched
                ? '1px solid rgba(255, 215, 0, 0.4)'
                : 'none',
              borderRadius: '12px',
              color: currentTheme.text.primary,
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Star />
            {isWatched ? `Bewertung ändern (${currentRating})` : 'Bewerten'}
          </motion.button>
        </div>
      )}

      {/* Add button for TMDB movies as full-width button at the bottom */}
      {isReadOnlyTmdbMovie && (
        <div style={{ padding: '20px' }}>
          <button
            onClick={handleAddMovie}
            disabled={isAdding}
            style={{
              width: '100%',
              padding: '16px',
              background: isAdding
                ? 'rgba(0, 212, 170, 0.5)'
                : 'linear-gradient(135deg, rgba(0, 212, 170, 0.8) 0%, rgba(0, 180, 216, 0.8) 100%)',
              border: '1px solid rgba(0, 212, 170, 0.5)',
              borderRadius: '12px',
              color: currentTheme.text.primary,
              fontSize: '16px',
              fontWeight: 600,
              cursor: isAdding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isAdding ? 0.7 : 1,
            }}
          >
            {isAdding ? 'Wird hinzugefügt...' : 'Film hinzufügen'}
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 20px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1,
            padding: '10px',
            background:
              activeTab === 'info'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: activeTab === 'info' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Info style={{ fontSize: '18px' }} />
          Info
        </button>

        <button
          onClick={() => setActiveTab('cast')}
          style={{
            flex: 1,
            padding: '10px',
            background:
              activeTab === 'cast'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: activeTab === 'cast' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <People style={{ fontSize: '18px' }} />
          Besetzung
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'cast' ? (
        <MobileCastCrew
          tmdbId={movie.id}
          mediaType="movie"
          seriesData={movie}
        />
      ) : (
      <div style={{ padding: '20px' }}>
        {/* Overview */}
        {(movie.beschreibung || movie.overview) && (
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Info style={{ fontSize: '18px' }} />
              Handlung
            </h3>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              {movie.beschreibung}
            </p>
          </div>
        )}

        {/* Genres */}
        {movie.genre?.genres && movie.genre.genres.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
              }}
            >
              Genres
            </h3>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {movie.genre.genres.map((genre: string) => (
                <span
                  key={genre}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Budget not available in current data structure */}
          {false && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: '0 0 4px 0',
                }}
              >
                Budget
              </p>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Budget N/A
              </p>
            </div>
          )}

          {/* Revenue not available in current data structure */}
          {false && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: '0 0 4px 0',
                }}
              >
                Einspielergebnis
              </p>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Revenue N/A
              </p>
            </div>
          )}

          {/* Original language not available in current data structure */}
          {false && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: '0 0 4px 0',
                }}
              >
                Originalsprache
              </p>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Language N/A
              </p>
            </div>
          )}

          {movie.status && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: '0 0 4px 0',
                }}
              >
                Status
              </p>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {movie.status === 'Released' ? 'Veröffentlicht' : movie.status}
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Delete Confirmation Dialog */}
      <MobileDialog
        open={showDeleteConfirm && !isReadOnlyTmdbMovie}
        onClose={() => setShowDeleteConfirm(false)}
        title="Film löschen?"
        message={`Möchtest du "${movie?.title}" wirklich aus deiner Sammlung entfernen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        type="warning"
        actions={[
          { label: 'Abbrechen', onClick: () => setShowDeleteConfirm(false), variant: 'secondary' },
          { label: 'Löschen', onClick: handleDeleteMovie, variant: 'primary' }
        ]}
      />

      {/* Success Snackbar */}
      {snackbar.open && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: currentTheme.status.success,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: 'calc(100% - 40px)',
            transition: 'all 0.3s ease-out',
          }}
        >
          <Star style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{snackbar.message}</span>
        </div>
      )}

      {/* Dialog for other alerts */}
      <MobileDialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
});

MobileMovieDetailPage.displayName = 'MobileMovieDetailPage';
