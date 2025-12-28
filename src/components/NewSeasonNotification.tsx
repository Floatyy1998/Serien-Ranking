import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewReleases, Close, ChevronRight, Tv, PlaylistAdd, Check } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { Series } from '../types/Series';
import { markMultipleSeasonsAsNotified } from '../lib/validation/newSeasonDetection';
import { useAuth } from '../App';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import './NewSeasonNotification.css';

interface NewSeasonNotificationProps {
  series: Series[];
  onDismiss: () => void;
}

export const NewSeasonNotification: React.FC<NewSeasonNotificationProps> = ({
  series,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth()!;
  const { refetchSeries } = useSeriesList();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addedToWatchlist, setAddedToWatchlist] = useState<Set<number>>(new Set());
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (series.length > 0) {
      setIsVisible(true);
    }
  }, [series]);

  // Auto-scroll to active dot
  useEffect(() => {
    if (dotsContainerRef.current && series.length > 1) {
      const container = dotsContainerRef.current;
      const activeDot = container.children[currentIndex] as HTMLElement;
      if (activeDot) {
        activeDot.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentIndex, series.length]);

  const handleNavigate = (seriesItem: Series) => {
    // Mark this series as notified
    if (user) {
      markMultipleSeasonsAsNotified([seriesItem.id], user.uid);
    }
    navigate(`/series/${seriesItem.id}`);
    onDismiss();
  };

  const handleDismissAll = async () => {
    if (user && series.length > 0) {
      // Mark all series as notified
      await markMultipleSeasonsAsNotified(
        series.map(s => s.id),
        user.uid
      );
    }
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleNext = () => {
    if (currentIndex < series.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAddToWatchlist = async (seriesItem: Series) => {
    if (!user) return;
    
    try {
      // Update watchlist status in Firebase - use direct set like in SeriesDetailPage
      const watchlistRef = firebase.database().ref(`${user.uid}/serien/${seriesItem.nmr}/watchlist`);
      await watchlistRef.set(true);
      
      // Mark as added in local state
      setAddedToWatchlist(prev => new Set(prev).add(seriesItem.id));
      
      // Update the series in the current list
      const updatedIndex = series.findIndex(s => s.id === seriesItem.id);
      if (updatedIndex !== -1) {
        series[updatedIndex].watchlist = true;
      }
      
      // Trigger refetch to ensure UI updates across the app
      setTimeout(() => {
        refetchSeries();
      }, 100);
      
      // Mark as notified since user interacted with it
      await markMultipleSeasonsAsNotified([seriesItem.id], user.uid);
      
      console.log(`✅ Added ${seriesItem.title || seriesItem.original_name} to watchlist`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  if (series.length === 0) return null;

  const currentSeries = series[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="new-season-notification"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.background.default})`,
            borderColor: currentTheme.primary + '40',
            color: currentTheme.text.primary,
          }}
        >
          <button
            className="close-button"
            onClick={handleDismissAll}
            style={{ color: currentTheme.text.primary + '80' }}
          >
            <Close />
          </button>

          <div className="notification-content">
            <div className="notification-header">
              <NewReleases 
                className="new-icon pulse" 
                style={{ color: currentTheme.primary }}
              />
              <h3>Neue Staffel{series.length > 1 ? 'n' : ''} verfügbar!</h3>
            </div>

            <div className="series-info">
              {currentSeries.poster?.poster && (
                <img
                  src={currentSeries.poster.poster}
                  alt={currentSeries.title || currentSeries.original_name}
                  className="series-poster"
                />
              )}
              
              <div className="series-details">
                <h4>{currentSeries.title || currentSeries.original_name || 'Serie'}</h4>
                <p className="season-info">
                  <Tv fontSize="small" />
                  <span>
                    Staffel {currentSeries.seasonCount} ist jetzt verfügbar
                  </span>
                </p>
              </div>

              <div className="action-buttons">
                {!addedToWatchlist.has(currentSeries.id) && !currentSeries.watchlist ? (
                  <button
                    className="watchlist-button"
                    onClick={() => handleAddToWatchlist(currentSeries)}
                    style={{
                      backgroundColor: currentTheme.background.paper,
                      color: currentTheme.text.primary,
                      border: `1px solid ${currentTheme.primary}40`,
                    }}
                  >
                    <PlaylistAdd />
                    <span>Watchlist</span>
                  </button>
                ) : (
                  <button
                    className="watchlist-button added"
                    disabled
                    style={{
                      backgroundColor: currentTheme.status.success + '20',
                      color: currentTheme.status.success,
                      border: `1px solid ${currentTheme.status.success}40`,
                    }}
                  >
                    <Check />
                    <span>Hinzugefügt</span>
                  </button>
                )}

                <button
                  className="view-button"
                  onClick={() => handleNavigate(currentSeries)}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.text.onPrimary,
                  }}
                >
                  Ansehen
                  <ChevronRight />
                </button>
              </div>
            </div>

            {series.length > 1 && (
              <div className="navigation-dots">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="nav-button"
                  style={{ color: currentTheme.text.primary + '60' }}
                >
                  ‹
                </button>
                
                <div className="dots" ref={dotsContainerRef}>
                  {series.map((_, index) => (
                    <span
                      key={index}
                      className={`dot ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                      style={{
                        backgroundColor: index === currentIndex
                          ? currentTheme.primary
                          : currentTheme.text.primary + '30',
                      }}
                    />
                  ))}
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={currentIndex === series.length - 1}
                  className="nav-button"
                  style={{ color: currentTheme.text.primary + '60' }}
                >
                  ›
                </button>
              </div>
            )}

            {series.length > 1 && (
              <p className="counter">
                {currentIndex + 1} von {series.length} neuen Staffeln
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};