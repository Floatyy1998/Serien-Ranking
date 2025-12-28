import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessTime, Close, ChevronRight, PlaylistRemove } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { Series } from '../types/Series';
import { useAuth } from '../App';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import './NewSeasonNotification.css';

interface InactiveSeriesNotificationProps {
  series: Series[];
  onDismiss: () => void;
}

export const InactiveSeriesNotification: React.FC<InactiveSeriesNotificationProps> = ({
  series,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth()!;
  const { refetchSeries } = useSeriesList();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [removedFromWatchlist, setRemovedFromWatchlist] = useState<Set<number>>(new Set());
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
    // Mark this notification as dismissed for this series
    if (user) {
      markSeriesAsNotified(seriesItem.id);
    }
    navigate(`/series/${seriesItem.id}`);
    onDismiss();
  };

  const markSeriesAsNotified = async (seriesId: number) => {
    if (!user) return;
    try {
      const notificationRef = firebase.database().ref(
        `users/${user.uid}/inactiveSeriesNotifications/${seriesId}`
      );
      await notificationRef.set({
        dismissed: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error marking series as notified:', error);
    }
  };

  const handleDismissAll = async () => {
    if (user && series.length > 0) {
      // Mark all series as notified
      const updates: any = {};
      series.forEach(s => {
        updates[`users/${user.uid}/inactiveSeriesNotifications/${s.id}`] = {
          dismissed: true,
          timestamp: Date.now(),
        };
      });
      await firebase.database().ref().update(updates);
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

  const handleRemoveFromWatchlist = async (seriesItem: Series) => {
    if (!user) return;

    try {
      // Remove from watchlist in Firebase
      const watchlistRef = firebase.database().ref(`${user.uid}/serien/${seriesItem.nmr}/watchlist`);
      await watchlistRef.set(false);

      // Mark as removed in local state
      setRemovedFromWatchlist(prev => new Set(prev).add(seriesItem.id));

      // Update the series in the current list
      const updatedIndex = series.findIndex(s => s.id === seriesItem.id);
      if (updatedIndex !== -1) {
        series[updatedIndex].watchlist = false;
      }

      // Trigger refetch to ensure UI updates across the app
      setTimeout(() => {
        refetchSeries();
      }, 100);

      // Mark as notified since user interacted with it
      await markSeriesAsNotified(seriesItem.id);

      console.log(`✅ Removed ${seriesItem.title || seriesItem.original_name} from watchlist`);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (series.length === 0) return null;

  const currentSeries = series[currentIndex];
  const isRemoved = removedFromWatchlist.has(currentSeries.id) || !currentSeries.watchlist;

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
            background: `linear-gradient(135deg, ${currentTheme.status.warning}20, ${currentTheme.background.default})`,
            borderColor: currentTheme.status.warning + '40',
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
              <AccessTime
                className="new-icon pulse"
                style={{ color: currentTheme.status.warning }}
              />
              <h3>Inaktive Serie{series.length > 1 ? 'n' : ''} auf der Watchlist</h3>
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
                  <AccessTime fontSize="small" />
                  <span>
                    Seit über einem Monat nicht geschaut
                  </span>
                </p>
              </div>

              <div className="action-buttons">
                {!isRemoved ? (
                  <button
                    className="watchlist-button"
                    onClick={() => handleRemoveFromWatchlist(currentSeries)}
                    style={{
                      backgroundColor: currentTheme.background.paper,
                      color: currentTheme.status.warning,
                      border: `1px solid ${currentTheme.status.warning}40`,
                    }}
                  >
                    <PlaylistRemove />
                    <span>Entfernen</span>
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
                    <span>Entfernt</span>
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
                          ? currentTheme.status.warning
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
                {currentIndex + 1} von {series.length} inaktiven Serien
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
