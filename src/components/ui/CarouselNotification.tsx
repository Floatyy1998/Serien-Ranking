import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NewReleases,
  CheckCircle,
  AccessTime,
  Close,
  ChevronRight,
  Tv,
  PlaylistAdd,
  PlaylistRemove,
  Check,
  Stop,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { Series } from '../../types/Series';
import { markMultipleSeasonsAsNotified } from '../../lib/validation/newSeasonDetection';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import './CarouselNotification.css';

type Variant = 'new-season' | 'completed' | 'inactive' | 'inactive-rewatch';

interface VariantConfig {
  themeColor: (theme: ReturnType<typeof useTheme>['currentTheme']) => string;
  HeaderIcon: typeof NewReleases;
  DetailIcon: typeof Tv;
  headerText: (count: number) => string;
  detailText: (series: Series) => string;
  actionLabel: string;
  actionDoneLabel: string;
  ActionIcon: typeof PlaylistAdd;
  counterSuffix: string;
  firebasePath: string;
  watchlistValue: boolean;
}

const variantConfigs: Record<Variant, VariantConfig> = {
  'new-season': {
    themeColor: (t) => t.primary,
    HeaderIcon: NewReleases,
    DetailIcon: Tv,
    headerText: (n) => `Neue Staffel${n > 1 ? 'n' : ''} verfügbar!`,
    detailText: (s) => `Staffel ${s.seasonCount} ist jetzt verfügbar`,
    actionLabel: 'Watchlist',
    actionDoneLabel: 'Hinzugefügt',
    ActionIcon: PlaylistAdd,
    counterSuffix: 'neuen Staffeln',
    firebasePath: '',
    watchlistValue: true,
  },
  completed: {
    themeColor: (t) => t.status.success,
    HeaderIcon: CheckCircle,
    DetailIcon: CheckCircle,
    headerText: (n) => `Serie${n > 1 ? 'n' : ''} abgeschlossen`,
    detailText: () => 'Komplett geschaut, keine neuen Folgen geplant',
    actionLabel: 'Entfernen',
    actionDoneLabel: 'Entfernt',
    ActionIcon: PlaylistRemove,
    counterSuffix: 'abgeschlossenen Serien',
    firebasePath: 'completedSeriesNotifications',
    watchlistValue: false,
  },
  inactive: {
    themeColor: (t) => t.status.warning,
    HeaderIcon: AccessTime,
    DetailIcon: AccessTime,
    headerText: (n) => `Inaktive Serie${n > 1 ? 'n' : ''} auf der Watchlist`,
    detailText: () => 'Seit über einem Monat nicht geschaut',
    actionLabel: 'Entfernen',
    actionDoneLabel: 'Entfernt',
    ActionIcon: PlaylistRemove,
    counterSuffix: 'inaktiven Serien',
    firebasePath: 'inactiveSeriesNotifications',
    watchlistValue: false,
  },
  'inactive-rewatch': {
    themeColor: (t) => t.status.warning,
    HeaderIcon: AccessTime,
    DetailIcon: AccessTime,
    headerText: (n) => `Inaktive${n > 1 ? 'r' : ''} Rewatch${n > 1 ? 'es' : ''}`,
    detailText: () => 'Seit über einem Monat nicht rewatcht',
    actionLabel: 'Beenden',
    actionDoneLabel: 'Beendet',
    ActionIcon: Stop,
    counterSuffix: 'inaktiven Rewatches',
    firebasePath: 'inactiveRewatchNotifications',
    watchlistValue: true, // not used for rewatch
  },
};

interface CarouselNotificationProps {
  series: Series[];
  onDismiss: () => void;
  variant: Variant;
}

export const CarouselNotification: React.FC<CarouselNotificationProps> = ({
  series,
  onDismiss,
  variant,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth()!;
  const { refetchSeries } = useSeriesList();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionedIds, setActionedIds] = useState<Set<number>>(new Set());
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  const config = variantConfigs[variant];
  const color = config.themeColor(currentTheme);

  useEffect(() => {
    if (series.length > 0) setIsVisible(true);
  }, [series]);

  useEffect(() => {
    if (dotsContainerRef.current && series.length > 1) {
      const activeDot = dotsContainerRef.current.children[currentIndex] as HTMLElement;
      activeDot?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, series.length]);

  const markAsNotified = async (seriesIds: number[]) => {
    if (!user) return;
    if (variant === 'new-season') {
      await markMultipleSeasonsAsNotified(seriesIds, user.uid, series);
    } else {
      const updates: Record<string, { dismissed: boolean; timestamp: number }> = {};
      seriesIds.forEach((id) => {
        updates[`users/${user.uid}/${config.firebasePath}/${id}`] = {
          dismissed: true,
          timestamp: Date.now(),
        };
      });
      await firebase.database().ref().update(updates);
    }
  };

  const handleNavigate = (seriesItem: Series) => {
    markAsNotified([seriesItem.id]);
    navigate(`/series/${seriesItem.id}`);
    onDismiss();
  };

  const handleDismissAll = async () => {
    await markAsNotified(series.map((s) => s.id));
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleAction = async (seriesItem: Series) => {
    if (!user) return;
    try {
      if (variant === 'inactive-rewatch') {
        // Rewatch beenden statt Watchlist ändern
        await firebase.database().ref(`${user.uid}/serien/${seriesItem.nmr}/rewatch`).remove();
      } else {
        const watchlistRef = firebase
          .database()
          .ref(`${user.uid}/serien/${seriesItem.nmr}/watchlist`);
        await watchlistRef.set(config.watchlistValue);
      }

      setActionedIds((prev) => new Set(prev).add(seriesItem.id));

      const idx = series.findIndex((s) => s.id === seriesItem.id);
      if (idx !== -1) series[idx].watchlist = config.watchlistValue;

      setTimeout(() => refetchSeries(), 100);
      await markAsNotified([seriesItem.id]);
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  if (series.length === 0) return null;

  const currentSeries = series[currentIndex];
  const isActioned =
    variant === 'new-season'
      ? actionedIds.has(currentSeries.id) || currentSeries.watchlist
      : variant === 'inactive-rewatch'
        ? actionedIds.has(currentSeries.id)
        : actionedIds.has(currentSeries.id) || !currentSeries.watchlist;

  const { HeaderIcon, DetailIcon, ActionIcon } = config;

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
              <HeaderIcon className="new-icon pulse" style={{ color }} />
              <h3>{config.headerText(series.length)}</h3>
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
                  <DetailIcon fontSize="small" />
                  <span>{config.detailText(currentSeries)}</span>
                </p>
              </div>

              <div className="action-buttons">
                {!isActioned ? (
                  <Tooltip title={config.actionLabel} arrow>
                    <button
                      className="watchlist-button"
                      onClick={() => handleAction(currentSeries)}
                      style={{
                        backgroundColor: currentTheme.background.paper,
                        color: variant === 'new-season' ? currentTheme.text.primary : color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      <ActionIcon />
                      <span>{config.actionLabel}</span>
                    </button>
                  </Tooltip>
                ) : (
                  <Tooltip title={config.actionDoneLabel} arrow>
                    <span>
                      <button
                        className="watchlist-button added"
                        disabled
                        style={{
                          backgroundColor: currentTheme.status.success + '20',
                          color: currentTheme.status.success,
                          border: `1px solid ${currentTheme.status.success}40`,
                        }}
                      >
                        {variant === 'new-season' && <Check />}
                        <span>{config.actionDoneLabel}</span>
                      </button>
                    </span>
                  </Tooltip>
                )}

                <Tooltip title="Serie ansehen" arrow>
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
                </Tooltip>
              </div>
            </div>

            {series.length > 1 && (
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

                <div className="dots" ref={dotsContainerRef}>
                  {series.map((_, index) => (
                    <span
                      key={index}
                      className={`dot ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                      style={{
                        backgroundColor:
                          index === currentIndex ? color : currentTheme.text.primary + '30',
                      }}
                    />
                  ))}
                </div>

                <Tooltip title="Nächste" arrow>
                  <span>
                    <button
                      onClick={() => setCurrentIndex((i) => Math.min(series.length - 1, i + 1))}
                      disabled={currentIndex === series.length - 1}
                      className="nav-button"
                      style={{ color: currentTheme.text.primary + '60' }}
                    >
                      ›
                    </button>
                  </span>
                </Tooltip>
              </div>
            )}

            {series.length > 1 && (
              <p className="counter">
                {currentIndex + 1} von {series.length} {config.counterSuffix}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
