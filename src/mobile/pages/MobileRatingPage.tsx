import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBack,
  Star,
  Delete,
  Save,
  Movie,
  Tv,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
} from '@mui/icons-material';
import {
  Zap,
  Smile,
  Drama,
  Heart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Series } from '../../types/Series';
import { Movie as MovieType } from '../../types/Movie';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { calculateOverallRating } from '../../lib/rating/rating';
import { logRatingAdded } from '../../features/badges/minimalActivityLogger';
import { genreMenuItemsForMovies, genreMenuItems } from '../../config/menuItems';
import './MobileRatingPage.css';

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

export const MobileRatingPage: React.FC = () => {
  const { id, type } = useParams<{ id: string; type: 'series' | 'movie' }>();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { getMobilePageStyle } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'overall' | 'genre'>('overall');
  const [overallRating, setOverallRating] = useState(0);
  const [genreRatings, setGenreRatings] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  
  // Get item based on type  
  const item = type === 'series' 
    ? seriesList.find((s: Series) => s.id.toString() === id)
    : movieList.find((m: MovieType) => m.id.toString() === id);

  // Initialize ratings from Firebase genre-based structure
  useEffect(() => {
    if (item && user) {
      console.log('Item type:', type);
      console.log('Item genres from object:', item.genre?.genres);
      
      // Get ALL possible genres based on type (movie or series)
      // Use the complete genre list from menuItems
      const allPossibleGenres = type === 'movie' 
        ? genreMenuItemsForMovies.filter(g => g.value !== 'All').map(g => g.label)
        : genreMenuItems.filter(g => g.value !== 'All').map(g => g.label);
      
      console.log('All possible genres for', type, ':', allPossibleGenres);
      
      // Initialize ratings object with ALL possible genres set to 0
      const loadedRatings: Record<string, number> = {};
      allPossibleGenres.forEach(genre => {
        loadedRatings[genre] = 0;
      });
      
      // If there are saved ratings, load them
      if (item.rating && typeof item.rating === 'object') {
        // Calculate overall rating from saved genre ratings
        const overall = calculateOverallRating(item);
        setOverallRating(parseFloat(overall) || 0);
        
        // Override with actual saved ratings
        Object.keys(item.rating).forEach(genre => {
          if (typeof item.rating[genre] === 'number') {
            loadedRatings[genre] = item.rating[genre];
          }
        });
      } else {
        // No rating yet
        setOverallRating(0);
      }
      
      console.log('Loaded ratings:', loadedRatings);
      setGenreRatings(loadedRatings);
    }
  }, [item, user, type]);

  // Calculate average from genre ratings (only non-zero values)
  useEffect(() => {
    if (activeTab === 'genre' && Object.keys(genreRatings).length > 0) {
      // Only calculate average from genres that have been rated (> 0)
      const ratedGenres = Object.values(genreRatings).filter(rating => rating > 0);
      if (ratedGenres.length > 0) {
        const avg = ratedGenres.reduce((a, b) => a + b, 0) / ratedGenres.length;
        setOverallRating(Math.round(avg * 10) / 10);
      } else {
        setOverallRating(0);
      }
    }
  }, [genreRatings, activeTab]);

  // Handle swipe between tabs
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeTab === 'overall') {
        setActiveTab('genre');
      } else if (diff < 0 && activeTab === 'genre') {
        setActiveTab('overall');
      }
    }
  };

  const handleRatingChange = (value: number) => {
    setOverallRating(value);
    // Haptic feedback would go here
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleGenreRatingChange = (genre: string, value: number) => {
    setGenreRatings(prev => ({ ...prev, [genre]: value }));
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
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
          genres.forEach(genre => {
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
      }
      
      navigate(-1);
    } catch (error) {
      console.error('Error saving rating:', error);
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
      
      navigate(-1);
    } catch (error) {
      console.error('Error deleting rating:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!item) {
    return (
      <div className="mobile-rating-page">
        <div className="rating-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowBack />
          </button>
          <h1>Nicht gefunden</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-rating-page" style={getMobilePageStyle()}>
      {/* Native Header */}
      <div className="rating-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowBack />
        </button>
        <div className="header-content">
          <div className="title-row">
            {type === 'series' ? <Tv /> : <Movie />}
            <h1>{item.title}</h1>
          </div>
          <p>Bewertung</p>
        </div>
      </div>

      {/* Current Rating Display */}
      <div className="current-rating">
        <motion.div 
          className="rating-display"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          key={overallRating}
        >
          <Star className="star-icon" />
          <span className="rating-value">{overallRating.toFixed(1)}</span>
          <span className="rating-max">/10</span>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      {Object.keys(genreRatings).length > 0 && (
        <div className="tab-navigation">
          <button
            className={`tab ${activeTab === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveTab('overall')}
          >
            Gesamt
          </button>
          <button
            className={`tab ${activeTab === 'genre' ? 'active' : ''}`}
            onClick={() => setActiveTab('genre')}
          >
            Nach Genre
          </button>
        </div>
      )}

      {/* Rating Content */}
      <div 
        className="rating-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'overall' ? (
            <motion.div
              key="overall"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overall-rating"
            >
              {/* Emoji Rating Selector */}
              <div className="emoji-selector">
                {ratingEmojis.map(emoji => (
                  <motion.button
                    key={emoji.value}
                    className={`emoji-button ${Math.round(overallRating) === emoji.value ? 'active' : ''}`}
                    onClick={() => handleRatingChange(emoji.value)}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      borderColor: Math.round(overallRating) === emoji.value ? emoji.color : 'transparent',
                      background: Math.round(overallRating) === emoji.value ? `${emoji.color}20` : 'transparent',
                    }}
                  >
                    <div style={{ color: emoji.color }}>
                      {emoji.icon}
                    </div>
                    <span>{emoji.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Rating Slider */}
              <div className="rating-slider">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={overallRating}
                  onChange={(e) => handleRatingChange(parseFloat(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              {/* Quick Rating Buttons */}
              <div className="quick-ratings">
                <h3>Schnellbewertung</h3>
                <div className="quick-buttons">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(value => (
                    <motion.button
                      key={value}
                      className={`quick-button ${Math.round(overallRating) === value ? 'active' : ''}`}
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
              {Object.keys(genreRatings).map(genre => (
                <div key={genre} className="genre-rating-item">
                  <div className="genre-header">
                    <div className="genre-info">
                      <div 
                        className="genre-icon"
                        style={{ 
                          background: `${genreColors[genre] || '#667eea'}20`,
                          color: genreColors[genre] || '#667eea'
                        }}
                      >
                        {genreIcons[genre] || <Star />}
                      </div>
                      <span className="genre-name">{genre}</span>
                    </div>
                    <span 
                      className="genre-value"
                      style={{ color: genreColors[genre] || '#667eea' }}
                    >
                      {(genreRatings[genre] || 0).toFixed(1)}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={genreRatings[genre] || 0}
                    onChange={(e) => handleGenreRatingChange(genre, parseFloat(e.target.value))}
                    className="genre-slider"
                    style={{
                      background: `linear-gradient(to right, ${genreColors[genre] || '#667eea'} 0%, ${genreColors[genre] || '#667eea'} ${(genreRatings[genre] || 0) * 10}%, rgba(255, 255, 255, 0.1) ${(genreRatings[genre] || 0) * 10}%, rgba(255, 255, 255, 0.1) 100%)`
                    }}
                  />
                </div>
              ))}

              <div className="average-display">
                <span>Durchschnitt (nur bewertete Genres)</span>
                <div className="average-value">
                  <Star />
                  <span>{overallRating.toFixed(1)}</span>
                </div>
              </div>
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
    </div>
  );
};