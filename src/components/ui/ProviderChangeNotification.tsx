import { Close, ChevronRight, SwapHoriz, Add } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import './CarouselNotification.css';

interface ProviderChangeInfo {
  series: {
    id: number;
    title: string;
    original_name?: string;
    poster?: { poster: string };
  };
  addedProviders: string[];
  removedProviders: string[];
}

interface ProviderChangeNotificationProps {
  changes: ProviderChangeInfo[];
  onDismiss: () => void;
}

export const ProviderChangeNotification: React.FC<ProviderChangeNotificationProps> = ({
  changes,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [isVisible, setIsVisible] = useState(changes.length > 0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const color = currentTheme.accent || currentTheme.primary;

  const markAsDismissed = async (seriesIds: number[]) => {
    if (!user) return;
    const updates: Record<string, { dismissed: boolean; timestamp: number }> = {};
    seriesIds.forEach((id) => {
      updates[`users/${user.uid}/providerChangeNotifications/${id}`] = {
        dismissed: true,
        timestamp: Date.now(),
      };
    });
    await firebase.database().ref().update(updates);
  };

  const handleNavigate = (change: ProviderChangeInfo) => {
    markAsDismissed([change.series.id]);
    navigate(`/series/${change.series.id}`);
    onDismiss();
  };

  const handleDismissAll = async () => {
    await markAsDismissed(changes.map((c) => c.series.id));
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (changes.length === 0) return null;

  const current = changes[currentIndex];
  const hasAdded = current.addedProviders.length > 0;
  const hasRemoved = current.removedProviders.length > 0;

  let detailText = '';
  if (hasAdded && hasRemoved) {
    detailText = `Jetzt auf ${current.addedProviders.join(', ')} · Nicht mehr auf ${current.removedProviders.join(', ')}`;
  } else if (hasAdded) {
    detailText = `Jetzt auch auf ${current.addedProviders.join(', ')} verfügbar`;
  } else if (hasRemoved) {
    detailText = `Nicht mehr auf ${current.removedProviders.join(', ')} verfügbar`;
  }

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
            background: `linear-gradient(135deg, ${color}20, ${currentTheme.background.default})`,
            borderColor: color + '40',
            color: currentTheme.text.primary,
          }}
        >
          <Tooltip title="Alle schließen" arrow>
            <button
              className="close-button"
              onClick={handleDismissAll}
              style={{ color: currentTheme.text.primary + '80' }}
            >
              <Close />
            </button>
          </Tooltip>

          <div className="notification-content">
            <div className="notification-header">
              {hasAdded ? (
                <Add className="new-icon" style={{ color }} />
              ) : (
                <SwapHoriz className="new-icon" style={{ color }} />
              )}
              <h3>
                Provider-{changes.length > 1 ? 'Änderungen' : 'Änderung'}
                {changes.length > 1 ? ` (${changes.length})` : ''}
              </h3>
            </div>

            <div className="series-info">
              {current.series.poster?.poster && (
                <img
                  src={current.series.poster.poster}
                  alt={current.series.title || current.series.original_name}
                  loading="lazy"
                  decoding="async"
                  className="series-poster"
                />
              )}

              <div className="series-details">
                <h4>{current.series.title || current.series.original_name || 'Serie'}</h4>
                <p className="season-info">
                  <SwapHoriz fontSize="small" />
                  <span>{detailText}</span>
                </p>
              </div>

              <div className="action-buttons">
                <Tooltip title="Serie ansehen" arrow>
                  <button
                    className="view-button"
                    onClick={() => handleNavigate(current)}
                    style={{
                      backgroundColor: currentTheme.primary,
                      color: currentTheme.background.default,
                    }}
                  >
                    Ansehen
                    <ChevronRight />
                  </button>
                </Tooltip>
              </div>
            </div>

            {changes.length > 1 && (
              <div className="navigation-dots">
                <Tooltip title="Vorherige" arrow>
                  <span>
                    <button
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                      className="nav-button"
                      style={{ color: currentTheme.text.primary + '60' }}
                    >
                      ‹
                    </button>
                  </span>
                </Tooltip>

                <div className="dots" role="tablist" aria-label="Provider-Änderung auswählen">
                  {changes.map((_, index) => (
                    <span
                      key={index}
                      role="tab"
                      aria-selected={index === currentIndex}
                      tabIndex={0}
                      className={`dot ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCurrentIndex(index);
                        }
                      }}
                      style={{
                        backgroundColor:
                          index === currentIndex ? color : currentTheme.text.primary + '30',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>

                <Tooltip title="Nächste" arrow>
                  <span>
                    <button
                      onClick={() => setCurrentIndex((i) => Math.min(changes.length - 1, i + 1))}
                      disabled={currentIndex === changes.length - 1}
                      className="nav-button"
                      style={{ color: currentTheme.text.primary + '60' }}
                    >
                      ›
                    </button>
                  </span>
                </Tooltip>
              </div>
            )}

            {changes.length > 1 && (
              <p className="counter">
                {currentIndex + 1} von {changes.length} Provider-Änderungen
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
