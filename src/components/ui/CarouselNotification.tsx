import {
  AccessTime,
  Check,
  CheckCircle,
  ChevronRight,
  Close,
  ExpandLess,
  NewReleases,
  PlaylistAdd,
  PlaylistRemove,
  SnoozeOutlined,
  Star,
  StarOutline,
  Stop,
  Tv,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbRef, dbUpdate, paths, userPath } from '../../lib/db/ref';
import { bumpSeriesVersion } from '../../lib/firebase/seriesVersionBump';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { showUndoToast } from '../../lib/toast';
import {
  snoozeNotifications,
  type NotificationCategory,
  type SnoozeOption,
} from '../../lib/settings/notificationSettings';
import { markMultipleSeasonsAsNotified } from '../../lib/validation/newSeasonDetection';
import { getEpisodeAirDate } from '../../utils/episodeDate';
import { formatSeasonDate } from '../../lib/date';
import type { Series } from '../../types/Series';
import './CarouselNotification.css';

const NOTIF_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Startdatum der neuesten Staffel (höchste Staffelnummer mit Episoden). Die
 * NewSeason-Detection triggert schon, sobald TMDB die Staffel *ankündigt* — das
 * erste Ep kann also noch in der Zukunft liegen.
 */
const getNewestSeasonStart = (series: Series): Date | null => {
  if (!series.seasons?.length) return null;
  let target: Series['seasons'][number] | null = null;
  let targetNum = -1;
  for (const season of series.seasons) {
    if (!season?.episodes?.length) continue;
    const num = season.seasonNumber ?? season.season_number ?? 0;
    if (num > targetNum) {
      targetNum = num;
      target = season;
    }
  }
  return target ? getEpisodeAirDate(target.episodes[0]) : null;
};

/** Detail-Zeile der NewSeason-Karte: Staffelnummer + wann sie startet bzw. läuft. */
const newSeasonDetailLabel = (series: Series): string => {
  const base = `Staffel ${series.seasonCount}`;
  const start = getNewestSeasonStart(series);
  if (!start) return `${base} · Starttermin noch offen`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const days = Math.round((startDay.getTime() - today.getTime()) / NOTIF_DAY_MS);

  if (days > 30) return `${base} · ab ${formatSeasonDate(start)}`;
  if (days > 1) return `${base} · in ${days} Tagen (${formatSeasonDate(start)})`;
  if (days === 1) return `${base} · morgen (${formatSeasonDate(start)})`;
  if (days === 0) return `${base} · ab heute`;
  return `${base} · läuft seit ${formatSeasonDate(start)}`;
};

type Variant = 'new-season' | 'completed' | 'inactive' | 'inactive-rewatch' | 'unrated';

interface VariantConfig {
  category: NotificationCategory;
  themeColor: (theme: ReturnType<typeof useTheme>['currentTheme']) => string;
  HeaderIcon: typeof NewReleases;
  DetailIcon: typeof Tv;
  headerText: (count: number) => string;
  detailText: (series: Series) => string;
  actionLabel: string;
  actionDoneLabel: string;
  ActionIcon: typeof PlaylistAdd;
  counterSuffix: string;
  dismissFirebasePath: string;
  /** Watchlist-Update bei Action (für variants die Watchlist-Status togglen). */
  watchlistValue?: boolean;
}

const variantConfigs: Record<Variant, VariantConfig> = {
  'new-season': {
    category: 'new-season',
    themeColor: (t) => t.primary,
    HeaderIcon: NewReleases,
    DetailIcon: Tv,
    headerText: (n) => `${n > 1 ? n + ' neue Staffeln' : 'Neue Staffel'} angekündigt`,
    detailText: (s) => newSeasonDetailLabel(s),
    actionLabel: 'Watchlist',
    actionDoneLabel: 'Hinzugefügt',
    ActionIcon: PlaylistAdd,
    counterSuffix: 'neue Staffeln',
    dismissFirebasePath: '',
    watchlistValue: true,
  },
  completed: {
    category: 'completed',
    themeColor: (t) => t.status.success,
    HeaderIcon: CheckCircle,
    DetailIcon: CheckCircle,
    headerText: (n) => `${n > 1 ? n + ' Serien' : 'Serie'} abgeschlossen`,
    detailText: () => 'Komplett geschaut, keine neuen Folgen',
    actionLabel: 'Entfernen',
    actionDoneLabel: 'Entfernt',
    ActionIcon: PlaylistRemove,
    counterSuffix: 'abgeschlossene Serien',
    dismissFirebasePath: 'completedSeriesNotifications',
    watchlistValue: false,
  },
  inactive: {
    category: 'inactive',
    themeColor: (t) => t.status.warning,
    HeaderIcon: AccessTime,
    DetailIcon: AccessTime,
    headerText: (n) => `${n > 1 ? n + ' inaktive Serien' : 'Inaktive Serie'} auf der Watchlist`,
    detailText: () => 'Länger nicht geschaut',
    actionLabel: 'Entfernen',
    actionDoneLabel: 'Entfernt',
    ActionIcon: PlaylistRemove,
    counterSuffix: 'inaktive Serien',
    dismissFirebasePath: 'inactiveSeriesNotifications',
    watchlistValue: false,
  },
  'inactive-rewatch': {
    category: 'inactive-rewatch',
    themeColor: (t) => t.status.warning,
    HeaderIcon: AccessTime,
    DetailIcon: AccessTime,
    headerText: (n) => (n > 1 ? `${n} inaktive Rewatches` : 'Inaktiver Rewatch'),
    detailText: () => 'Längere Zeit nicht rewatcht',
    actionLabel: 'Beenden',
    actionDoneLabel: 'Beendet',
    ActionIcon: Stop,
    counterSuffix: 'inaktive Rewatches',
    dismissFirebasePath: 'inactiveRewatchNotifications',
  },
  unrated: {
    category: 'unrated',
    themeColor: (t) => t.primary,
    HeaderIcon: StarOutline,
    DetailIcon: Star,
    headerText: (n) => (n > 1 ? `${n} Serien zum Bewerten` : 'Noch nicht bewertet'),
    detailText: () => 'Staffel fertig — wie war sie?',
    actionLabel: 'Bewerten',
    actionDoneLabel: 'Bewertet',
    ActionIcon: Star,
    counterSuffix: 'unbewertete Serien',
    dismissFirebasePath: 'unratedSeriesNotifications',
  },
};

interface CarouselNotificationProps {
  series: Series[];
  onDismiss: () => void;
  variant: Variant;
  /** Wenn gesetzt, wird ein Collapse-Button gezeigt — wird vom Hub gesteuert. */
  onCollapse?: () => void;
}

// Eigene Sub-Component damit der Rating-State automatisch beim Index-Wechsel
// resetted (via key={safeIndex} → re-mount), statt setState im useEffect.
const InlineRatingPicker: React.FC<{
  onSubmit: (rating: number) => void;
  saving: boolean;
  themeColor: string;
}> = ({ onSubmit, saving, themeColor }) => {
  const [value, setValue] = useState(0);
  // Stars filled proportionally — value 7.3 → 7 full + partial 8th
  return (
    <div className="inline-rating">
      <div className="inline-rating-stars" aria-hidden>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const fillPct = Math.max(0, Math.min(1, value - (n - 1)));
          return (
            <span key={n} className="inline-rating-star-visual">
              <StarOutline className="inline-rating-star-bg" />
              <span
                className="inline-rating-star-fg"
                style={{
                  width: `${fillPct * 100}%`,
                  color: themeColor,
                }}
              >
                <Star />
              </span>
            </span>
          );
        })}
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="0.1"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        disabled={saving}
        className="inline-rating-range"
        aria-label="Bewertung"
        style={{
          background: `linear-gradient(to right, ${themeColor} 0%, ${themeColor} ${value * 10}%, rgba(255,255,255,0.1) ${value * 10}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
      <div className="inline-rating-row">
        <div className="inline-rating-label">
          {value > 0 ? (
            <>
              <span style={{ color: themeColor, fontWeight: 800, fontSize: '1.05em' }}>
                {value.toFixed(1)}
              </span>{' '}
              / 10
            </>
          ) : (
            'Zieh den Regler zum Bewerten'
          )}
        </div>
        <button
          type="button"
          className="inline-rating-submit"
          onClick={() => value > 0 && onSubmit(value)}
          disabled={saving || value <= 0}
          style={{
            background: value > 0 ? themeColor : 'rgba(255,255,255,0.08)',
            color: value > 0 ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
            cursor: saving || value <= 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '…' : 'Speichern'}
        </button>
      </div>
    </div>
  );
};

const formatRelative = (ts: number): string => {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days < 1) return 'heute erkannt';
  if (days === 1) return 'gestern erkannt';
  if (days < 30) return `vor ${days} Tagen erkannt`;
  const months = Math.floor(days / 30);
  return `vor ${months} Monat${months > 1 ? 'en' : ''} erkannt`;
};

export const CarouselNotification: React.FC<CarouselNotificationProps> = ({
  series,
  onDismiss,
  variant,
  onCollapse,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { refetchSeries } = useSeriesList();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionedIds, setActionedIds] = useState<Set<number>>(new Set());
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const dotsContainerRef = useRef<HTMLDivElement>(null);
  const snoozeMenuRef = useRef<HTMLDivElement>(null);
  // Lazy-init: einmal pro Mount — Date.now() wäre sonst impure im Render-Body.
  const [detectedTimestamp] = useState(() => Date.now() - 1000);

  const config = variantConfigs[variant];
  const color = config.themeColor(currentTheme);

  // Wenn die Liste schrumpft, zeigt series[currentIndex] auf undefined — abgeleiteter
  // safeIndex statt setState im Effect.
  const safeIndex = series.length > 0 ? Math.min(currentIndex, series.length - 1) : 0;

  // KEIN automatischer Mount-Marker mehr: die Karte soll bleiben, bis der User
  // aktiv reagiert (X / Snooze / Aktion). Reagiert er nicht, sieht er sie beim
  // nächsten Reload wieder — fühlt sich vorhersagbarer an als ein versteckter
  // Cooldown nach reinem Sehen. (markInactiveSeriesAsNotified etc. werden noch
  // exportiert, falls wir später einen "Mark all as seen"-Button bauen wollen.)

  // Snooze-Menu: outside-click schließt
  useEffect(() => {
    if (!snoozeOpen) return;
    const onClick = (e: MouseEvent) => {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(e.target as Node)) {
        setSnoozeOpen(false);
      }
    };
    setTimeout(() => window.addEventListener('click', onClick), 0);
    return () => window.removeEventListener('click', onClick);
  }, [snoozeOpen]);

  // Scroll active dot into view
  useEffect(() => {
    if (dotsContainerRef.current && series.length > 1) {
      const activeDot = dotsContainerRef.current.children[safeIndex] as HTMLElement;
      activeDot?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [safeIndex, series.length]);

  const markAsDismissed = async (seriesIds: number[]) => {
    if (!user) return;
    if (variant === 'new-season') {
      await markMultipleSeasonsAsNotified(seriesIds, user.uid, series);
    } else {
      const updates: Record<string, { dismissed: boolean; timestamp: number }> = {};
      seriesIds.forEach((id) => {
        // Jitter ±2 Tage, damit Sammel-Dismiss nicht alle gleichzeitig wieder auflebt
        const jitter = (Math.random() - 0.5) * 4 * 24 * 60 * 60 * 1000;
        updates[`users/${user.uid}/${config.dismissFirebasePath}/${id}`] = {
          dismissed: true,
          timestamp: Date.now() + jitter,
        };
      });
      await dbUpdate(updates);
    }
  };

  const handleNavigate = (seriesItem: Series) => {
    markAsDismissed([seriesItem.id]);
    if (variant === 'unrated') {
      navigate(`/rating/series/${seriesItem.id}`);
    } else {
      navigate(`/series/${seriesItem.id}`);
    }
    onDismiss();
  };

  const handleDismissAll = async () => {
    await markAsDismissed(series.map((s) => s.id));
    onDismiss();
  };

  const handleSnooze = async (days: SnoozeOption) => {
    if (!user) return;
    setSnoozeOpen(false);
    const ids = series.map((s) => s.id);
    await snoozeNotifications(config.category, ids, user.uid, days);
    onDismiss();
  };

  const handleSwipe = (_: unknown, info: PanInfo) => {
    if (series.length <= 1) return;
    const threshold = 60;
    if (info.offset.x > threshold && safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    } else if (info.offset.x < -threshold && safeIndex < series.length - 1) {
      setCurrentIndex(safeIndex + 1);
    }
  };

  const handleAction = async (seriesItem: Series) => {
    if (!user) return;
    try {
      if (variant === 'unrated') {
        // Inline-Rating: wird über handleQuickRate gehandhabt — hier nur Fallback
        navigate(`/rating/series/${seriesItem.id}`);
        await markAsDismissed([seriesItem.id]);
        onDismiss();
        return;
      }
      if (variant === 'inactive-rewatch') {
        await dbRef(userPath(user.uid, 'series', seriesItem.id, 'rewatch')).remove();
        // Rewatch-Stop bumpt serienVersion — analog zu useSeriesActions.handleStopRewatch,
        // damit der Zustand konsistent zum kanonischen „Rewatch beenden" bleibt.
        bumpSeriesVersion(user.uid);
      } else if (config.watchlistValue !== undefined) {
        const prevValue = seriesItem.watchlist;
        await dbRef(userPath(user.uid, 'series', seriesItem.id, 'watchlist')).set(
          config.watchlistValue
        );

        // Undo-Toast (außer für new-season "Hinzufügen" — da ist Undo unklar)
        if (variant !== 'new-season') {
          showUndoToast(`${seriesItem.title} entfernt`, async () => {
            await dbRef(userPath(user.uid, 'series', seriesItem.id, 'watchlist')).set(prevValue);
            setActionedIds((prev) => {
              const next = new Set(prev);
              next.delete(seriesItem.id);
              return next;
            });
            setTimeout(() => refetchSeries(), 100);
          });
        }
      }

      setActionedIds((prev) => new Set(prev).add(seriesItem.id));
      setTimeout(() => refetchSeries(), 100);
      await markAsDismissed([seriesItem.id]);
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const handleSubmitRating = async (rating: number) => {
    if (!user || series.length === 0 || savingRating) return;
    const seriesItem = series[safeIndex];
    setSavingRating(true);
    try {
      // Pfad analog zu useQuickSeasonRating.saveQuickRating:
      // users/{uid}/series/{id}/rating = { genre1: rating, genre2: rating, ... }
      const genres = seriesItem.genre?.genres || [];
      const ratingsToSave: Record<string, number> = {};
      if (genres.length > 0) {
        genres.forEach((g) => {
          ratingsToSave[g] = rating;
        });
      } else {
        ratingsToSave['General'] = rating;
      }

      const ratingRef = dbRef(paths.seriesRating(user.uid, seriesItem.id));
      await ratingRef.set(ratingsToSave);

      setActionedIds((prev) => new Set(prev).add(seriesItem.id));
      await markAsDismissed([seriesItem.id]);
      showUndoToast(`Bewertet: ${rating}/10`, async () => {
        await ratingRef.remove();
        setActionedIds((prev) => {
          const next = new Set(prev);
          next.delete(seriesItem.id);
          return next;
        });
        setTimeout(() => refetchSeries(), 100);
      });
      setTimeout(() => refetchSeries(), 100);
      // Nächstes Item zeigen oder schließen
      if (safeIndex < series.length - 1) {
        setCurrentIndex(safeIndex + 1);
      } else {
        onDismiss();
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setSavingRating(false);
    }
  };

  // Confetti für 'completed' beim ersten Render — lazy init (Math.random ist impure)
  const showConfetti = variant === 'completed';
  const [confettiParticles] = useState(() =>
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      rotate: Math.random() * 360,
      color: ['#4caf50', '#81c784', '#ffd54f', '#ffffff'][i % 4],
      delay: Math.random() * 0.3,
      // Random-End-Y einmalig fixieren, damit das animate-prop pure bleibt
      endY: 220 + Math.random() * 60,
    }))
  );

  // Sparkles für 'new-season'
  const showSparkles = variant === 'new-season';
  const sparkleAngles = useMemo(() => {
    if (!showSparkles) return [];
    return [
      { x: 10, y: 10, delay: 0 },
      { x: 38, y: 4, delay: 0.4 },
      { x: 2, y: 50, delay: 0.8 },
    ];
  }, [showSparkles]);

  if (series.length === 0) return null;
  const currentSeries = series[safeIndex];
  if (!currentSeries) return null;

  const isActioned =
    variant === 'new-season'
      ? actionedIds.has(currentSeries.id) || currentSeries.watchlist
      : variant === 'inactive-rewatch' || variant === 'unrated'
        ? actionedIds.has(currentSeries.id)
        : actionedIds.has(currentSeries.id) || !currentSeries.watchlist;

  const { HeaderIcon, DetailIcon, ActionIcon } = config;

  const cardBackground = `linear-gradient(135deg, ${color}1a 0%, rgba(15, 17, 21, 0.92) 60%)`;
  const glowGradient = `linear-gradient(135deg, ${color}80, ${color}10)`;

  return (
    <motion.div
      className="series-notification"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={
        {
          background: cardBackground,
          color: currentTheme.text.primary,
          '--notif-glow': glowGradient,
        } as React.CSSProperties
      }
    >
      <div className="series-notification-inner">
        {/* Color aura */}
        <div
          className="series-notification-aura"
          style={{ background: `radial-gradient(ellipse, ${color}30, transparent 70%)` }}
        />

        {/* Confetti particles für completed */}
        {showConfetti && (
          <div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
          >
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                className="notif-particle"
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.endY,
                  opacity: 0,
                  rotate: p.rotate,
                }}
                transition={{ duration: 1.6, ease: 'easeOut', delay: p.delay }}
                style={{
                  top: 0,
                  left: '50%',
                  width: 8,
                  height: 8,
                  background: p.color,
                }}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="series-notification-header">
          <div
            className="series-notification-header-icon"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}10)`,
              color,
              boxShadow: `0 4px 14px -2px ${color}40, inset 0 0 0 1px ${color}25`,
            }}
          >
            <motion.div
              animate={
                variant === 'inactive' || variant === 'inactive-rewatch'
                  ? { rotate: [0, -8, 8, -4, 4, 0] }
                  : variant === 'completed'
                    ? { scale: [0.6, 1.2, 1] }
                    : { scale: [1, 1.08, 1] }
              }
              transition={
                variant === 'inactive' || variant === 'inactive-rewatch'
                  ? { duration: 1.8, repeat: Infinity, repeatDelay: 3 }
                  : variant === 'completed'
                    ? { duration: 0.5, ease: 'backOut' }
                    : { duration: 2, repeat: Infinity }
              }
              style={{ display: 'flex' }}
            >
              <HeaderIcon />
            </motion.div>
          </div>
          <h3 className="series-notification-title">{config.headerText(series.length)}</h3>
          {series.length > 1 && (
            <span
              className="series-notification-count-pill"
              style={{
                background: `${color}25`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {series.length}
            </span>
          )}
          {onCollapse && (
            <Tooltip title="Minimieren" arrow>
              <button
                className="series-notification-collapse-btn"
                onClick={onCollapse}
                aria-label="Minimieren"
              >
                <ExpandLess />
              </button>
            </Tooltip>
          )}
          <Tooltip title={series.length > 1 ? 'Alle schließen' : 'Schließen'} arrow>
            <button
              className="series-notification-collapse-btn"
              onClick={handleDismissAll}
              aria-label="Schließen"
            >
              <Close />
            </button>
          </Tooltip>
        </div>

        {/* Series body (swipeable) */}
        <div className="series-notification-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeIndex}
              drag={series.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={handleSwipe}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="series-notification-series">
                <div className="series-notification-poster-wrapper">
                  {currentSeries.poster?.poster ? (
                    <img
                      src={currentSeries.poster.poster}
                      alt={currentSeries.title || currentSeries.original_name}
                      loading="lazy"
                      decoding="async"
                      className="series-notification-poster"
                    />
                  ) : (
                    <div className="series-notification-poster-placeholder">
                      <Tv style={{ fontSize: 22, opacity: 0.4 }} />
                    </div>
                  )}
                  {/* Sparkles für new-season über dem Poster */}
                  {showSparkles &&
                    sparkleAngles.map((s, i) => (
                      <motion.div
                        key={i}
                        className="notif-sparkle"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          repeatDelay: 2.4,
                          delay: s.delay,
                        }}
                        style={{ top: s.y, left: s.x }}
                      >
                        <Star style={{ fontSize: 16 }} />
                      </motion.div>
                    ))}
                </div>
                <div className="series-notification-details">
                  <h4 className="series-notification-name">
                    {currentSeries.title || currentSeries.original_name || 'Serie'}
                  </h4>
                  <p className="series-notification-detail">
                    <DetailIcon />
                    <span>{config.detailText(currentSeries)}</span>
                  </p>
                  <div className="series-notification-timestamp">
                    {formatRelative(detectedTimestamp)}
                  </div>
                </div>
              </div>

              {/* Inline-Rating für unrated — eigener State, key={safeIndex} resetted bei Wechsel */}
              {variant === 'unrated' && !isActioned && (
                <InlineRatingPicker
                  key={safeIndex}
                  onSubmit={handleSubmitRating}
                  saving={savingRating}
                  themeColor={color}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action-Bar */}
          <div className="series-notification-actions">
            {variant !== 'unrated' && (
              <>
                {!isActioned ? (
                  <button
                    className="series-notification-btn series-notification-btn--secondary"
                    onClick={() => handleAction(currentSeries)}
                  >
                    <ActionIcon />
                    <span>{config.actionLabel}</span>
                  </button>
                ) : (
                  <button
                    className="series-notification-btn series-notification-btn--done"
                    disabled
                  >
                    <Check />
                    <span>{config.actionDoneLabel}</span>
                  </button>
                )}
                <button
                  className="series-notification-btn series-notification-btn--primary"
                  onClick={() => handleNavigate(currentSeries)}
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    color: currentTheme.background.default,
                  }}
                >
                  <span>Ansehen</span>
                  <ChevronRight />
                </button>
              </>
            )}
            {variant === 'unrated' && (
              <button
                className="series-notification-btn series-notification-btn--primary"
                onClick={() => handleNavigate(currentSeries)}
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  color: currentTheme.background.default,
                  flex: 1,
                }}
              >
                <span>Details</span>
                <ChevronRight />
              </button>
            )}

            {/* Snooze-Button */}
            <div style={{ position: 'relative' }} ref={snoozeMenuRef}>
              <Tooltip title="Später erinnern" arrow>
                <button
                  className="series-notification-btn series-notification-btn--icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnoozeOpen((p) => !p);
                  }}
                  aria-label="Später erinnern"
                >
                  <SnoozeOutlined />
                </button>
              </Tooltip>
              <AnimatePresence>
                {snoozeOpen && (
                  <motion.div
                    className="snooze-menu"
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="snooze-menu-header">Erinnere mich in</div>
                    <button className="snooze-menu-item" onClick={() => handleSnooze(1)}>
                      <span>
                        <span className="snooze-menu-item-emoji">☕</span>1 Tag
                      </span>
                    </button>
                    <button className="snooze-menu-item" onClick={() => handleSnooze(7)}>
                      <span>
                        <span className="snooze-menu-item-emoji">📅</span>1 Woche
                      </span>
                    </button>
                    <button className="snooze-menu-item" onClick={() => handleSnooze(30)}>
                      <span>
                        <span className="snooze-menu-item-emoji">🌙</span>1 Monat
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Carousel-Navigation */}
          {series.length > 1 && (
            <>
              <div className="series-notification-nav">
                <button
                  className="series-notification-nav-btn"
                  onClick={() => setCurrentIndex(Math.max(0, safeIndex - 1))}
                  disabled={safeIndex === 0}
                  aria-label="Vorherige"
                >
                  ‹
                </button>
                <div
                  className="series-notification-dots"
                  ref={dotsContainerRef}
                  role="tablist"
                  aria-label="Serie auswählen"
                >
                  {series.map((s, index) => (
                    <button
                      key={index}
                      role="tab"
                      aria-selected={index === safeIndex}
                      aria-label={`${s.title || 'Serie'} (${index + 1}/${series.length})`}
                      className={`series-notification-dot ${index === safeIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                      style={
                        index === safeIndex
                          ? ({ ['--dot-color' as string]: color } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <style>
                        {`.series-notification-dot.active::after { background: ${color}; }`}
                      </style>
                    </button>
                  ))}
                </div>
                <button
                  className="series-notification-nav-btn"
                  onClick={() => setCurrentIndex(Math.min(series.length - 1, safeIndex + 1))}
                  disabled={safeIndex === series.length - 1}
                  aria-label="Nächste"
                >
                  ›
                </button>
              </div>
              <p className="series-notification-counter">
                {safeIndex + 1} von {series.length} {config.counterSuffix}
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
