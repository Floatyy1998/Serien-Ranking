import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack, Star, StarBorder,
  Info, Delete,
  Visibility, VisibilityOff
} from '@mui/icons-material';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useAuth } from '../../App';
import { Movie } from '../../types/Movie';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

export const MobileMovieDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { movieList } = useMovieList();
  const [userRating, setUserRating] = useState<number>(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tmdbMovie, setTmdbMovie] = useState<Movie | null>(null);
  
  // Find the movie locally first
  const localMovie = useMemo(() => {
    return movieList.find((m: Movie) => m.id === Number(id));
  }, [movieList, id]);

  // Fetch from TMDB if not found locally
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!localMovie && id && apiKey && !tmdbMovie) {
      setLoading(true);
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=de-DE&append_to_response=credits`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            // Transform TMDB data to match our Movie type
            const movie: Movie = {
              id: data.id,
              nmr: 0, // No nmr for non-user movies
              title: data.title,
              poster: { poster: data.poster_path },
              backdrop: data.backdrop_path,
              overview: data.overview,
              genre: { genres: data.genres?.map((g: any) => g.name) || [] },
              provider: { provider: [] },
              release_date: data.release_date,
              runtime: data.runtime,
              rating: null,
              watched: false
            };
            setTmdbMovie(movie);
          }
        })
        .catch(err => console.error('Error fetching movie from TMDB:', err))
        .finally(() => setLoading(false));
    }
  }, [localMovie, id, tmdbMovie]); // Add tmdbMovie to prevent re-fetching

  // Use local movie if available, otherwise use TMDB movie
  const movie = localMovie || tmdbMovie;
  
  // Check if this is a TMDB-only movie (not in user's list)
  const isReadOnlyTmdbMovie = !localMovie && !!tmdbMovie;

  // Get user rating
  const currentRating = useMemo(() => {
    if (!movie?.rating || !user?.uid) return 0;
    return movie.rating[user.uid] || 0;
  }, [movie, user]);

  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  // Get backdrop URL
  const getBackdropUrl = (backdropPath: string | undefined): string => {
    if (!backdropPath) return '';
    if (backdropPath.startsWith('http')) return backdropPath;
    return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
  };

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!movie?.rating) return 0;
    const ratings = Object.values(movie.rating).filter(r => typeof r === 'number' && r > 0) as number[];
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

  const handleRatingSubmit = async () => {
    if (!movie || !user || userRating === 0) return;
    
    try {
      setLoading(true);
      
      // Update rating in Firebase using correct path
      const ratingRef = firebase
        .database()
        .ref(`${user.uid}/filme/${movie.nmr}/rating/${user.uid}`);
      
      await ratingRef.set(userRating);
      
      setShowRatingModal(false);
      setUserRating(0);
    } catch (error) {
      console.error('Error updating movie rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async () => {
    if (!movie || !user) return;
    
    try {
      setLoading(true);
      
      // Delete movie from Firebase
      const movieRef = firebase
        .database()
        .ref(`${user.uid}/filme/${movie.nmr}`);
      
      await movieRef.remove();
      
      // Navigate back after successful deletion
      navigate(-1);
    } catch (error) {
      console.error('Error deleting movie:', error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const toggleWatched = async () => {
    if (!movie || !user) return;
    
    const newRating = currentRating > 0 ? 0 : 7; // Default rating when marking as watched
    
    try {
      setLoading(true);
      
      // Update rating in Firebase using correct path
      const ratingRef = firebase
        .database()
        .ref(`${user.uid}/filme/${movie.nmr}/rating/${user.uid}`);
      
      await ratingRef.set(newRating);
    } catch (error) {
      console.error('Error toggling movie watched status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!movie && !loading) {
    const apiKey = import.meta.env.VITE_API_TMDB;
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Film nicht gefunden</h2>
        {!apiKey && (
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px' }}>
            Dieser Film ist nicht in deiner Liste. 
            Um Filme von Freunden anzuzeigen, wird ein TMDB API-Schlüssel benötigt.
          </p>
        )}
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Zurück
        </button>
      </div>
    );
  }
  
  if (loading || !movie) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000', 
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p>Lade...</p>
      </div>
    );
  }

  const isWatched = currentRating > 0;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: 'white'
    }}>
      {/* Hero Section with Backdrop */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '400px',
        overflow: 'hidden'
      }}>
        {movie.poster?.poster ? (
          <img 
            src={getBackdropUrl(movie.poster?.poster)}
            alt={movie.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.5
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 154, 0, 0.2) 100%)'
          }} />
        )}
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(to top, #000 0%, transparent 100%)'
        }} />
        
        {/* Header Buttons */}
        <div style={{
          position: 'absolute',
          top: 'calc(20px + env(safe-area-inset-top))',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'rgba(0, 0, 0, 0.5)', 
              backdropFilter: 'blur(10px)',
              border: 'none', 
              color: 'white', 
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
          >
            <ArrowBack />
          </button>
          
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            style={{ 
              background: 'rgba(220, 53, 69, 0.8)', 
              backdropFilter: 'blur(10px)',
              border: 'none', 
              color: 'white', 
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
          >
            <Delete />
          </button>
        </div>

        {/* Movie Info Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <img 
              src={getImageUrl(movie.poster)}
              alt={movie.title}
              style={{
                width: '120px',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            />
            
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: '26px', 
                margin: '0 0 8px 0',
                fontWeight: 700
              }}>
                {movie.title}
              </h1>
              
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '16px'
              }}>
                {movie.release_date && (
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                )}
                {movie.runtime && (
                  <span>• {formatRuntime(movie.runtime)}</span>
                )}
                {/* No TMDB rating available in current data structure */}
              </div>
              
              {/* Rating */}
              {averageRating > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <Star style={{ fontSize: '20px', color: '#ffd700' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>{averageRating}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    ({Object.keys(movie.rating || {}).filter(uid => movie.rating![uid] > 0).length} Bewertungen)
                  </span>
                </div>
              )}
              
              {/* User Rating */}
              {isWatched && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: 'rgba(76, 209, 55, 0.2)',
                  border: '1px solid rgba(76, 209, 55, 0.4)',
                  borderRadius: '20px',
                  fontSize: '13px'
                }}>
                  <Visibility style={{ fontSize: '16px' }} />
                  Gesehen • {currentRating}/10
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons - only for user's movies */}
          {!isReadOnlyTmdbMovie && (
            <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowRatingModal(true)}
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
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Star style={{ fontSize: '20px' }} />
              {isWatched ? `Bewertung ändern (${currentRating})` : 'Bewerten'}
            </button>
            
            <button
              onClick={toggleWatched}
              disabled={loading}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {isWatched ? <VisibilityOff style={{ fontSize: '20px' }} /> : <Visibility style={{ fontSize: '20px' }} />}
              {isWatched ? 'Ungesehen' : 'Gesehen'}
            </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Overview */}
        {(movie.beschreibung || movie.overview) && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Info style={{ fontSize: '18px' }} />
              Handlung
            </h3>
            <p style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              {movie.beschreibung || movie.overview}
            </p>
          </div>
        )}

        {/* Genres */}
        {movie.genre?.genres && movie.genre.genres.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              Genres
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {movie.genre.genres.map((genre: string) => (
                <span
                  key={genre}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Budget not available in current data structure */}
          {false && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 4px 0'
              }}>
                Budget
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: 0
              }}>
                Budget N/A
              </p>
            </div>
          )}
          
          {/* Revenue not available in current data structure */}
          {false && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 4px 0'
              }}>
                Einspielergebnis
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: 0
              }}>
                Revenue N/A
              </p>
            </div>
          )}
          
          {/* Original language not available in current data structure */}
          {false && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 4px 0'
              }}>
                Originalsprache
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: 0
              }}>
                Language N/A
              </p>
            </div>
          )}
          
          {movie.status && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 4px 0'
              }}>
                Status
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: 0
              }}>
                {movie.status === 'Released' ? 'Veröffentlicht' : movie.status}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              Film bewerten
            </h2>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                <button
                  key={rating}
                  onClick={() => setUserRating(rating)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: rating <= (userRating || currentRating) ? '#ffd700' : 'rgba(255, 255, 255, 0.3)',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0 2px'
                  }}
                >
                  {rating <= (userRating || currentRating) ? <Star /> : <StarBorder />}
                </button>
              ))}
            </div>
            
            <div style={{
              fontSize: '24px',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              {userRating || currentRating} / 10
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setUserRating(0);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={loading || userRating === 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: (loading || userRating === 0) 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: (loading || userRating === 0) ? 'not-allowed' : 'pointer',
                  opacity: (loading || userRating === 0) ? 0.5 : 1
                }}
              >
                {loading ? 'Speichere...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              margin: '0 0 16px 0',
              textAlign: 'center'
            }}>
              Film löschen?
            </h2>
            
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '0 0 24px 0',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              Möchtest du "{movie?.title}" wirklich aus deiner Sammlung entfernen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteMovie}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: loading 
                    ? 'rgba(220, 53, 69, 0.5)'
                    : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Lösche...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};