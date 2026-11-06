import {
  AccessTime,
  Check,
  ChevronRight,
  NewReleases,
  PlaylistAdd,
  PlaylistRemove,
  Star,
  StarOutlined,
  Stop,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbRef, dbUpdate, paths, userPath } from '../../../services/db/ref';
import { bumpSeriesVersion } from '../../../services/firebase/seriesVersionBump';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSeriesList, type SeriesNotificationList } from '../../../contexts/SeriesListContext';
import { showUndoToast } from '../../../lib/interaction/toast';
import {
  snoozeNotifications,
  type NotificationCategory,
  type SnoozeOption,
} from '../../../lib/settings/notificationSettings';
import { markMultipleSeasonsAsNotified } from '../../../services/detection/newSeasonDetection';
import { getEpisodeAirDate } from '../../../utils/episodeDate';
import { getImageUrl } from '../../../utils/imageUrl';
import { formatSeasonDate } from '../../../lib/date';
import { calculateSeriesMetrics, getSeriesLastWatchedAt } from '../../../lib/episode/seriesMetrics';
import { formatLastWatched } from '../../../lib/episode/lastWatchedLabel';
import { t } from '../../../services/i18n';
import type { Series } from '../../../types/Series';
import { HintCard, HintDeck, HintProgress } from './HintDeck';
import './CarouselNotification.css';

const NOTIF_DAY_MS = 24 * 60 * 60 * 1000;
const RESOLVE_DELAY_MS = 700;

/**
 * Startdatum der angekündigten Staffel (`seasonCount`). Die NewSeason-Detection
 * triggert schon bei der Ankündigung — das erste Ep kann also noch in der
 * Zukunft liegen, oder die Staffel hat im Katalog noch gar keine Episoden.
 * In dem Fall null: das Datum einer älteren Staffel wäre hier eine Falschaussage
 * ("Staffel 2 · läuft seit <Start von Staffel 1>").
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
  if (!target) return null;
  // `seasonNumber` ist 0-basiert, `seasonCount` zählt ab 1.
  if (typeof series.seasonCount === 'number' && targetNum + 1 < series.seasonCount) return null;
  return getEpisodeAirDate(target.episodes[0]);
};

/** Detail-Zeile der NewSeason-Karte: Staffelnummer + wann sie startet bzw. läuft. */
const newSeasonDetailLabel = (series: Series): string => {
  const base = t('Staffel {staffel}', { staffel: series.seasonCount ?? '' });
  const start = getNewestSeasonStart(series);
  if (!start) return `${base} · ${t('Starttermin noch offen')}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const days = Math.round((startDay.getTime() - today.getTime()) / NOTIF_DAY_MS);

  if (days > 30) return `${base} · ${t('ab {datum}', { datum: formatSeasonDate(start) })}`;
  if (days > 1)
    return `${base} · ${t('in {tage} Tagen ({datum})', { tage: days, datum: formatSeasonDate(start) })}`;
  if (days === 1) return `${base} · ${t('morgen ({datum})', { datum: formatSeasonDate(start) })}`;
  if (days === 0) return `${base} · ${t('ab heute')}`;
  return `${base} · ${t('läuft seit {datum}', { datum: formatSeasonDate(start) })}`;
};

const lastWatchedLabel = (series: Series, fallback: string): string =>
  formatLastWatched(getSeriesLastWatchedAt(series).replace(/^1900-01-01$/, '')) ?? fallback;

type Variant = SeriesNotificationList;

interface VariantConfig {
  category: NotificationCategory;
  themeColor: (theme: ReturnType<typeof useTheme>['currentTheme']) => string;
  HeaderIcon: typeof NewReleases;
  DetailIcon: typeof Tv;
  headerText: (count: number) => string;
  detailText: (series: Series) => string;
  /** Fortschrittsbalken unter dem Titel (geschaute von erschienenen Folgen). */
  showProgress?: boolean;
  actionLabel: string;
  actionDoneLabel: string;
  ActionIcon: typeof PlaylistAdd;
  dismissFirebasePath: string;
  /** Watchlist-Update bei Action (für variants die Watchlist-Status togglen). */
  watchlistValue?: boolean;
  /** Hinweis-Listen, die nach erledigter Aktion für diese Serie hinfällig sind. */
  resolves: SeriesNotificationList[];
}

const variantConfigs: Record<Variant, VariantConfig> = {
  'new-season': {
    category: 'new-season',
    themeColor: (t) => t.primary,
    HeaderIcon: NewReleases,
    DetailIcon: Tv,
    headerText: (n) =>
      n > 1 ? t('{n} neue Staffeln angekündigt', { n }) : t('Neue Staffel angekündigt'),
    detailText: (s) => newSeasonDetailLabel(s),
    actionLabel: t('Watchlist'),
    actionDoneLabel: t('Hinzugefügt'),
    ActionIcon: PlaylistAdd,
    dismissFirebasePath: '',
    watchlistValue: true,
    resolves: ['new-season'],
  },
  inactive: {
    category: 'inactive',
    themeColor: (t) => t.status.warning,
    HeaderIcon: AccessTime,
    DetailIcon: AccessTime,
    headerText: (n) =>
      n > 1
        ? t('{n} inaktive Serien auf der Watchlist', { n })
        : t('Inaktive Serie auf der Watchlist'),
    detailText: (s) => lastWatchedLabel(s, t('Länger nicht geschaut')),
    showProgress: true,
    actionLabel: t('Entfernen'),
    actionDoneLabel: t('Entfernt'),
    ActionIcon: PlaylistRemove,
    dismissFirebasePath: 'inactiveSeriesNotifications',
    watchlistValue: false,
    resolves: ['inactive'],
  },
  'inactive-rewatch': {
    category: 'inactive-rewatch',
    themeColor: (t) => t.status.warning,
    HeaderIcon: AccessTime,
    DetailIcon: AccessTime,
    headerText: (n) => (n > 1 ? t('{n} inaktive Rewatches', { n }) : t('Inaktiver Rewatch')),
    detailText: (s) => lastWatchedLabel(s, t('Längere Zeit nicht rewatcht')),
    actionLabel: t('Beenden'),
    actionDoneLabel: t('Beendet'),
    ActionIcon: Stop,
    dismissFirebasePath: 'inactiveRewatchNotifications',
    resolves: ['inactive-rewatch'],
  },
  unrated: {
    category: 'unrated',
    themeColor: (t) => t.primary,
    HeaderIcon: StarOutlined,
    DetailIcon: Star,
    headerText: (n) => (n > 1 ? t('{n} Serien zum Bewerten', { n }) : t('Noch nicht bewertet')),
    detailText: () => t('Staffel fertig — wie war sie?'),
    actionLabel: t('Bewerten'),
    actionDoneLabel: t('Bewertet'),
    ActionIcon: Star,
    dismissFirebasePath: 'unratedSeriesNotifications',
    resolves: ['unrated'],
  },
};

interface CarouselNotificationProps {
  series: Series[];
  onDismiss: () => void;
  variant: Variant;
  /** Wenn gesetzt, wird ein Collapse-Button gezeigt — wird vom Hub gesteuert. */
  onCollapse?: () => void;
}

const RatingStars: React.FC<{ value: number; themeColor: string }> = ({ value, themeColor }) => (
  <div className="inline-rating-stars">
    <span className="inline-rating-star-row" aria-hidden>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
        const fillPct = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="inline-rating-star-visual">
            <StarOutlined className="inline-rating-star-bg" />
            <span
              className="inline-rating-star-fg"
              style={{ width: `${fillPct * 100}%`, color: themeColor }}
            >
              <Star />
            </span>
          </span>
        );
      })}
    </span>
    {value > 0 && (
      <span className="inline-rating-value" style={{ color: themeColor }}>
        {value.toFixed(1)}
      </span>
    )}
  </div>
);

const RatingSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  onSubmit: (rating: number) => void;
  saving: boolean;
  themeColor: string;
}> = ({ value, onChange, onSubmit, saving, themeColor }) => (
  <div className="inline-rating-row">
    <input
      type="range"
      min="0"
      max="10"
      step="0.1"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={saving}
      className="inline-rating-range"
      aria-label={t('Bewertung')}
      style={{
        background: `linear-gradient(to right, ${themeColor} 0%, ${themeColor} ${value * 10}%, rgba(255,255,255,0.12) ${value * 10}%, rgba(255,255,255,0.12) 100%)`,
      }}
    />
    <button
      type="button"
      className="hint-btn hint-btn--primary inline-rating-submit"
      onClick={() => value > 0 && onSubmit(value)}
      disabled={saving || value <= 0}
    >
      {saving ? '…' : t('Speichern')}
    </button>
  </div>
);

const SPARKLES = [
  { x: '12%', y: '10%', delay: 0 },
  { x: '70%', y: '4%', delay: 0.5 },
  { x: '6%', y: '62%', delay: 1 },
];

interface SeriesHintCardProps {
  series: Series;
  config: VariantConfig;
  variant: Variant;
  color: string;
  actioned: boolean;
  savingRating: boolean;
  onOpen: () => void;
  onAction: () => void;
  onRate: (rating: number) => void;
  onDismiss: () => void;
}

const SeriesHintCard: React.FC<SeriesHintCardProps> = ({
  series,
  config,
  variant,
  color,
  actioned,
  savingRating,
  onOpen,
  onAction,
  onRate,
  onDismiss,
}) => {
  const [ratingValue, setRatingValue] = useState(0);
  const metrics = config.showProgress ? calculateSeriesMetrics(series) : null;
  const { ActionIcon } = config;

  const done = (
    <span className="hint-btn hint-btn--done">
      <Check />
      {config.actionDoneLabel}
    </span>
  );

  return (
    <HintCard
      title={series.title || series.original_name || t('Serie')}
      poster={getImageUrl(series.poster, 'w342', '') || undefined}
      backdrop={getImageUrl(series.backdrop, 'w780', '') || undefined}
      DetailIcon={config.DetailIcon}
      detail={config.detailText(series)}
      onOpen={onOpen}
      onDismiss={onDismiss}
      posterOverlay={
        variant === 'new-season' &&
        SPARKLES.map((s, i) => (
          <motion.span
            key={i}
            className="notif-sparkle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, delay: s.delay }}
            style={{ top: s.y, left: s.x, color }}
          >
            <Star style={{ fontSize: 14 }} />
          </motion.span>
        ))
      }
      extra={
        <>
          {metrics && metrics.totalAiredEpisodes > 0 && (
            <HintProgress
              percent={metrics.progress}
              label={t('{watched}/{total} Episoden', {
                watched: metrics.watchedEpisodes,
                total: metrics.totalAiredEpisodes,
              })}
            />
          )}
          {variant === 'unrated' && !actioned && (
            <RatingStars value={ratingValue} themeColor={color} />
          )}
        </>
      }
      actions={
        variant === 'unrated' ? (
          actioned ? (
            done
          ) : (
            <RatingSlider
              value={ratingValue}
              onChange={setRatingValue}
              onSubmit={onRate}
              saving={savingRating}
              themeColor={color}
            />
          )
        ) : (
          <>
            {actioned ? (
              done
            ) : (
              <button type="button" className="hint-btn hint-btn--ghost" onClick={onAction}>
                <ActionIcon />
                <span>{config.actionLabel}</span>
              </button>
            )}
            <button type="button" className="hint-btn hint-btn--primary" onClick={onOpen}>
              <span>{t('Ansehen')}</span>
              <ChevronRight />
            </button>
          </>
        )
      }
    />
  );
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
  const { refetchSeries, resolveSeriesNotification } = useSeriesList();
  const [actionedIds, setActionedIds] = useState<Set<number>>(new Set());
  const [savingRating, setSavingRating] = useState(false);

  const config = variantConfigs[variant];
  const color = config.themeColor(currentTheme);

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
    navigate(
      variant === 'unrated' ? `/rating/series/${seriesItem.id}` : `/series/${seriesItem.id}`
    );
    resolveSeriesNotification([variant], seriesItem.id);
  };

  const handleDismissOne = (seriesItem: Series) => {
    markAsDismissed([seriesItem.id]);
    resolveSeriesNotification([variant], seriesItem.id);
  };

  const handleDismissAll = async () => {
    await markAsDismissed(series.map((s) => s.id));
    onDismiss();
  };

  const handleSnooze = async (days: SnoozeOption) => {
    if (!user) return;
    const ids = series.map((s) => s.id);
    await snoozeNotifications(config.category, ids, user.uid, days);
    onDismiss();
  };

  const handleAction = async (seriesItem: Series) => {
    if (!user) return;
    try {
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
          showUndoToast(t('{titel} entfernt', { titel: seriesItem.title }), async () => {
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
      setTimeout(() => resolveSeriesNotification(config.resolves, seriesItem.id), RESOLVE_DELAY_MS);
      await markAsDismissed([seriesItem.id]);
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const handleSubmitRating = async (seriesItem: Series, rating: number) => {
    if (!user || savingRating) return;
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
      showUndoToast(t('Bewertet: {rating}/10', { rating }), async () => {
        await ratingRef.remove();
        setActionedIds((prev) => {
          const next = new Set(prev);
          next.delete(seriesItem.id);
          return next;
        });
        setTimeout(() => refetchSeries(), 100);
      });
      setTimeout(() => refetchSeries(), 100);
      setTimeout(() => resolveSeriesNotification(config.resolves, seriesItem.id), RESOLVE_DELAY_MS);
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setSavingRating(false);
    }
  };

  if (series.length === 0) return null;

  const isActioned = (s: Series) =>
    variant === 'new-season'
      ? actionedIds.has(s.id) || !!s.watchlist
      : variant === 'inactive-rewatch' || variant === 'unrated'
        ? actionedIds.has(s.id)
        : actionedIds.has(s.id) || !s.watchlist;

  const multiple = series.length > 1;

  return (
    <HintDeck
      color={color}
      Icon={config.HeaderIcon}
      iconMotion={variant === 'inactive' || variant === 'inactive-rewatch' ? 'wobble' : 'pulse'}
      title={config.headerText(series.length)}
      count={series.length}
      onSnooze={handleSnooze}
      onDismissAll={handleDismissAll}
      onCollapse={onCollapse}
    >
      {series.map((s) => (
        <SeriesHintCard
          key={s.id}
          series={s}
          config={config}
          variant={variant}
          color={color}
          actioned={isActioned(s)}
          savingRating={savingRating}
          onOpen={() => handleNavigate(s)}
          onAction={() => handleAction(s)}
          onRate={(rating) => handleSubmitRating(s, rating)}
          onDismiss={() => (multiple ? handleDismissOne(s) : handleDismissAll())}
        />
      ))}
    </HintDeck>
  );
};
