import {
  Check,
  Delete,
  Save,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVeryDissatisfied,
  SentimentVerySatisfied,
  Star,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import { Drama, Heart, Smile, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { genreMenuItems, genreMenuItemsForMovies } from '../config/menuItems';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { logRatingAdded } from '../features/badges/minimalActivityLogger';
import { calculateOverallRating } from '../lib/rating/rating';
import { Movie as MovieType } from '../types/Movie';
import { Series } from '../types/Series';
import { BackButton } from '../components/BackButton';
import './RatingPage.css';

const genreIcons: Record<string, React.ReactNode> = {
  Action: <Zap size={20} />,
  Comedy: <Smile size={20} />,
  Drama: <Drama size={20} />,
  Romance: <Heart size={20} />,
  'Sci-Fi': <Sparkles size={20} />,
  Fantasy: <Sparkles size={20} />,
  Thriller: <TrendingUp size={20} />,
};

const genreColors: Record<string, string> = {
  Action: '#ff6b6b',
  Comedy: '#ffd43b',
  Drama: '#667eea',
  Romance: '#f06292',
  'Sci-Fi': '#4ecdc4',
  Fantasy: '#764ba2',
  Thriller: '#e74c3c',
};

const ratingEmojis = [
  { value: 2, icon: <SentimentVeryDissatisfied />, label: 'Schrecklich', color: '#e74c3c' },
  { value: 4, icon: <SentimentDissatisfied />, label: 'Schlecht', color: '#ff6b6b' },
  { value: 6, icon: <SentimentNeutral />, label: 'Okay', color: '#ffd43b' },
  { value: 8, icon: <SentimentSatisfied />, label: 'Gut', color: '#4cd137' },
  { value: 10, icon: <SentimentVerySatisfied />, label: 'Meisterwerk', color: '#00d2d3' },
];

export const RatingPage = () => {
  const { id, type } = useParams<{ id: string; type: 'series' | 'movie' }>();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'overall' | 'genre'>('overall');
  const [overallRating, setOverallRating] = useState(0);
  const [genreRatings, setGenreRatings] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Get item based on type
  const item =
    type === 'series'
      ? seriesList.find((s: Series) => s.id && s.id.toString() === id)
      : movieList.find((m: MovieType) => m.id && m.id.toString() === id);

  // Initialize ratings from Firebase genre-based structure
  useEffect(() => {
    if (item && user) {
      // Get ALL possible genres based on type (movie or series)
      // Use the complete genre list from menuItems
      const allPossibleGenres =
        type === 'movie'
          ? genreMenuItemsForMovies.filter((g) => g.value !== 'All').map((g) => g.label)
          : genreMenuItems.filter((g) => g.value !== 'All').map((g) => g.label);

      // Initialize ratings object with ALL possible genres set to 0
      const loadedRatings: Record<string, number> = {};
      allPossibleGenres.forEach((genre) => {
        loadedRatings[genre] = 0;
      });

      // If there are saved ratings, load them
      if (item.rating && typeof item.rating === 'object') {
        // Calculate overall rating from saved genre ratings
        const overall = calculateOverallRating(item);
        setOverallRating(parseFloat(overall) || 0);

        // Override with actual saved ratings
        Object.keys(item.rating).forEach((genre) => {
          if (typeof item.rating[genre] === 'number') {
            loadedRatings[genre] = item.rating[genre];
          }
        });
      } else {
        // No rating yet
        setOverallRating(0);
      }

      setGenreRatings(loadedRatings);
    }
  }, [item, user, type]);

  // Calculate average from genre ratings (only non-zero values)
  useEffect(() => {
    if (activeTab === 'genre' && Object.keys(genreRatings).length > 0) {
      // Only calculate average from genres that have been rated (> 0)
      const ratedGenres = Object.values(genreRatings).filter((rating) => rating > 0);
      if (ratedGenres.length > 0) {
        const avg = ratedGenres.reduce((a, b) => a + b, 0) / ratedGenres.length;
        setOverallRating(Math.round(avg * 100) / 100); // Keep 2 decimal places
      } else {
        setOverallRating(0);
      }
    }
  }, [genreRatings, activeTab]);

  const handleRatingChange = (value: number) => {
    setOverallRating(value);
    // Haptic feedback would go here
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleGenreRatingChange = (genre: string, value: number) => {
    setGenreRatings((prev) => ({ ...prev, [genre]: value }));
    // Removed vibration to prevent any potential issues
  };

  const handleSave = async () => {
    if (!user || !item) return;
    setIsSaving(true);

    try {
      let ratingsToSave: { [key: string]: number } = {};

      if (activeTab === 'genre' && Object.keys(genreRatings).length > 0) {
        // Save ONLY genres that have been rated (> 0)
        // This matches desktop behavior
        Object.entries(genreRatings).forEach(([genre, rating]) => {
          if (rating > 0) {
            ratingsToSave[genre] = rating;
          }
        });
      } else {
        // Save overall rating for all genres
        const genres = item.genre?.genres || [];

        if (genres.length > 0 && overallRating > 0) {
          genres.forEach((genre) => {
            ratingsToSave[genre] = overallRating;
          });
        } else if (overallRating > 0) {
          // No genres, save as General
          ratingsToSave['General'] = overallRating;
        }
      }

      // Only save if there are ratings to save
      if (Object.keys(ratingsToSave).length > 0) {
        // Update rating in Firebase using correct path structure
        const ratingRef = firebase
          .database()
          .ref(`${user.uid}/${type === 'series' ? 'serien' : 'filme'}/${item.nmr}/rating`);

        await ratingRef.set(ratingsToSave);

        // Activity-Logging für Friend + Badge-System (wie Desktop)
        if (user?.uid && overallRating > 0) {
          await logRatingAdded(
            user.uid,
            item.title || 'Unbekannter Titel',
            type === 'series' ? 'series' : 'movie',
            overallRating,
            item.id
          );
        }
        
        // Show success snackbar
        setSnackbar({ 
          open: true, 
          message: `Bewertung für "${item.title}" wurde gespeichert!` 
        });
        
        // Hide snackbar after 3 seconds
        setTimeout(() => {
          setSnackbar({ open: false, message: '' });
        }, 3000);
      }
    } catch (error) {
      // Show error snackbar
      setSnackbar({ 
        open: true, 
        message: 'Fehler beim Speichern der Bewertung.' 
      });
      setTimeout(() => {
        setSnackbar({ open: false, message: '' });
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !item) return;
    if (!window.confirm(`Bewertung für ${item.title} wirklich löschen?`)) return;

    setIsSaving(true);

    try {
      // Delete only the rating, not the entire item
      const ratingRef = firebase
        .database()
        .ref(`${user.uid}/${type === 'series' ? 'serien' : 'filme'}/${item.nmr}/rating`);

      await ratingRef.remove();
      
      // Show success snackbar
      setSnackbar({ 
        open: true, 
        message: `Bewertung für "${item.title}" wurde gelöscht!` 
      });
      
      // Hide snackbar after 3 seconds
      setTimeout(() => {
        setSnackbar({ open: false, message: '' });
      }, 3000);
    } catch (error) {
      // Show error snackbar
      setSnackbar({ 
        open: true, 
        message: 'Fehler beim Löschen der Bewertung.' 
      });
      setTimeout(() => {
        setSnackbar({ open: false, message: '' });
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!item) {
    return (
      <div className="mobile-rating-page">
        <div
          className="rating-header"
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          }}
        >
          <BackButton />
          <h1>Nicht gefunden</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="rating-page">
      {/* Compact Header */}
      <div
        className="rating-header"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <BackButton />
        <div className="header-info">
          <h1>{item.title}</h1>
          <div className="rating-badge">
            <Star style={{ fontSize: 16 }} />
            <span>{overallRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          Gesamtbewertung
        </button>
        {Object.keys(genreRatings).length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'genre' ? 'active' : ''}`}
            onClick={() => setActiveTab('genre')}
          >
            Genres
          </button>
        )}
      </div>

      {/* Rating Content */}
      <div className="rating-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overall' ? (
            <motion.div
              key="overall"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="overall-section"
            >
              {/* Main Rating Display */}
              <div className="main-rating">
                <div className="rating-circle">
                  <span className="rating-number">{overallRating.toFixed(1)}</span>
                  <span className="rating-label">von 10</span>
                </div>

                {/* Emoji Indicators */}
                <div className="emoji-indicators">
                  {ratingEmojis.map((emoji) => (
                    <motion.div
                      key={emoji.value}
                      className={`emoji-indicator ${Math.round(overallRating) === emoji.value ? 'active' : ''}`}
                      onClick={() => handleRatingChange(emoji.value)}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        opacity: Math.round(overallRating) === emoji.value ? 1 : 0.3,
                        color: emoji.color
                      }}
                    >
                      {emoji.icon}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Rating Slider */}
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={overallRating}
                  onChange={(e) => handleRatingChange(parseFloat(e.target.value))}
                  className="rating-range"
                  style={{
                    background: `linear-gradient(to right, ${currentTheme.primary} 0%, ${currentTheme.primary} ${overallRating * 10}%, var(--color-background-surface) ${overallRating * 10}%, var(--color-background-surface) 100%)`,
                  }}
                />
                <div className="slider-marks">
                  {[0, 2, 4, 6, 8, 10].map((value) => (
                    <span key={value} className="mark">{value}</span>
                  ))}
                </div>
              </div>

              {/* Quick Select Grid */}
              <div className="quick-select">
                <div className="quick-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <motion.button
                      key={value}
                      className={`quick-btn ${Math.round(overallRating) === value ? 'active' : ''}`}
                      onClick={() => handleRatingChange(value)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {value}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="genre"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="genre-ratings"
            >
              {Object.keys(genreRatings).map((genre) => (
                <div key={genre} className="genre-rating-item">
                  <div className="genre-header">
                    <div className="genre-info">
                      <div
                        className="genre-icon"
                        style={{
                          background: `${genreColors[genre] || '#667eea'}20`,
                          color: genreColors[genre] || '#667eea',
                        }}
                      >
                        {genreIcons[genre] || <Star />}
                      </div>
                      <span className="genre-name">{genre}</span>
                    </div>
                    <span className="genre-value">{genreRatings[genre].toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={genreRatings[genre]}
                    onChange={(e) => handleGenreRatingChange(genre, parseFloat(e.target.value))}
                    className="genre-range"
                    style={{
                      background: `linear-gradient(to right, ${genreColors[genre] || '#667eea'} 0%, ${genreColors[genre] || '#667eea'} ${genreRatings[genre] * 10}%, var(--color-background-surface) ${genreRatings[genre] * 10}%, var(--color-background-surface) 100%)`,
                    }}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <motion.button
          className="action-button delete"
          onClick={handleDelete}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving}
        >
          <Delete />
          <span>Löschen</span>
        </motion.button>

        <motion.button
          className="action-button save"
          onClick={handleSave}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving}
        >
          <Save />
          <span>Speichern</span>
        </motion.button>
      </div>

      {/* Success/Error Snackbar */}
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
          <Check style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{snackbar.message}</span>
        </div>
      )}
    </div>
  );
};
