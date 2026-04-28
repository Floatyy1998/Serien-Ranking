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
  StarOutline,
  Star,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Series } from '../../types/Series';
import { markMultipleSeasonsAsNotified } from '../../lib/validation/newSeasonDetection';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import './CarouselNotification.css';

type Variant = 'new-season' | 'completed' | 'inactive' | 'inactive-rewatch' | 'unrated';

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
  unrated: {
    themeColor: (t) => t.primary,
    HeaderIcon: StarOutline,
    DetailIcon: Star,
    headerText: (n) => `${n} Serie${n > 1 ? 'n' : ''} noch nicht bewertet`,
    detailText: () => 'Staffel fertig geschaut — jetzt bewerten?',
    actionLabel: 'Bewerten',
    actionDoneLabel: 'Bewertet',
    ActionIcon: Star,
    counterSuffix: 'unbewerteten Serien',
    firebasePath: 'unratedSeriesNotifications',
    watchlistValue: true, // not used
  },
};

interface CarouselNotificationProps {
  series: Series[];
  onDismiss: () => void;
  variant: Variant;
  onQuickRate?: (series: Series, onRated: () => void) => void;
}

export const CarouselNotification: React.FC<CarouselNotificationProps> = ({
  series,
  onDismiss,
  variant,
  onQuickRate,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { refetchSeries } = useSeriesList();
  const [isVisible, setIsVisible] = useState(series.length > 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionedIds, setActionedIds] = useState<Set<number>>(new Set());
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  const config = variantConfigs[variant];
  const color = config.themeColor(currentTheme);

  useEffect(() => {
    if (dotsContainerRef.current && series.length > 1) {
      const activeDot = dotsContainerRef.current.children[currentIndex] as HTMLElement;
      activeDot?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, series.length]);

  // Wenn die Liste schrumpft (z. B. nach Entfernen) den Index in den gültigen
  // Bereich klemmen, sonst zeigt series[currentIndex] auf undefined.
  useEffect(() => {
    if (series.length > 0 && currentIndex >= series.length) {
      setCurrentIndex(series.length - 1);
    }
  }, [series.length, currentIndex]);

  const markAsNotified = async (seriesIds: number[]) => {
    if (!user) return;
    if (variant === 'new-season') {
      await markMultipleSeasonsAsNotified(seriesIds, user.uid, series);
    } else {
      const updates: Record<string, { dismissed: boolean; timestamp: number }> = {};
      seriesIds.forEach((id) => {
        // Jitter ±2 Tage, damit Sammel-Dismiss nicht alle gleichzeitig wieder auflebt
        const jitter = (Math.random() - 0.5) * 4 * 24 * 60 * 60 * 1000;
        updates[`users/${user.uid}/${config.firebasePath}/${id}`] = {
          dismissed: true,
          timestamp: Date.now() + jitter,
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
      if (variant === 'unrated') {
        if (onQuickRate) {
          onQuickRate(seriesItem, () => {
            // Callback: wird aufgerufen wenn User tatsächlich geratet hat
            markAsNotified([seriesItem.id]);
            setActionedIds((prev) => new Set(prev).add(seriesItem.id));
            if (currentIndex < series.length - 1) {
              setCurrentIndex(currentIndex + 1);
            }
          });
          return;
        }
        navigate(`/rating/series/${seriesItem.id}`);
        await markAsNotified([seriesItem.id]);
        onDismiss();
        return;
      } else if (variant === 'inactive-rewatch') {
        // Rewatch beenden statt Watchlist ändern
        await firebase.database().ref(`users/${user.uid}/series/${seriesItem.id}/rewatch`).remove();
      } else {
        const watchlistRef = firebase
          .database()
          .ref(`users/${user.uid}/series/${seriesItem.id}/watchlist`);
        await watchlistRef.set(config.watchlistValue);
      }

      setActionedIds((prev) => new Set(prev).add(seriesItem.id));

      setTimeout(() => refetchSeries(), 100);
      await markAsNotified([seriesItem.id]);
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  if (series.length === 0) return null;

  const safeIndex = Math.min(currentIndex, series.length - 1);
  const currentSeries = series[safeIndex];
  if (!currentSeries) return null;
  const isActioned =
    variant === 'new-season'
      ? actionedIds.has(currentSeries.id) || currentSeries.watchlist
      : variant === 'inactive-rewatch' || variant === 'unrated'
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
              <motion.div
                animate={variant !== 'unrated' ? { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ display: 'flex' }}
              >
                <HeaderIcon className="new-icon" style={{ color }} />
              </motion.div>
              <h3>{config.headerText(series.length)}</h3>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={safeIndex}
                className="series-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {currentSeries.poster?.poster && (
                  <img
                    src={currentSeries.poster.poster}
                    alt={currentSeries.title || currentSeries.original_name}
                    loading="lazy"
                    decoding="async"
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
                        color: currentTheme.background.default,
                      }}
                    >
                      Ansehen
                      <ChevronRight />
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            </AnimatePresence>

            {series.length > 1 && (
              <div className="navigation-dots">
                <Tooltip title="Vorherige" arrow>
                  <span>
                    <button
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      disabled={safeIndex === 0}
                      className="nav-button"
                      style={{ color: currentTheme.text.primary + '60' }}
                    >
                      ‹
                    </button>
                  </span>
                </Tooltip>

                <div
                  className="dots"
                  ref={dotsContainerRef}
                  role="tablist"
                  aria-label="Serie auswählen"
                >
                  {series.map((s, index) => (
                    <span
                      key={index}
                      role="tab"
                      aria-selected={index === safeIndex}
                      aria-label={`${s.title || s.original_name || 'Serie'} (${index + 1} von ${series.length})`}
                      tabIndex={0}
                      className={`dot ${index === safeIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCurrentIndex(index);
                        }
                      }}
                      style={{
                        backgroundColor:
                          index === safeIndex ? color : currentTheme.text.primary + '30',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>

                <Tooltip title="Nächste" arrow>
                  <span>
                    <button
                      onClick={() => setCurrentIndex((i) => Math.min(series.length - 1, i + 1))}
                      disabled={safeIndex === series.length - 1}
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
                {safeIndex + 1} von {series.length} {config.counterSuffix}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
