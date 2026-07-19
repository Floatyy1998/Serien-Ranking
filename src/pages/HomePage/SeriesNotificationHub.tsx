/**
 * SeriesNotificationHub — Aggregator für alle Serien-bezogenen Notification-Karten.
 *
 * Ersetzt die alte Prio-Queue auf der HomePage (eine Karte zur Zeit, andere versteckt).
 * Stattdessen Tab-Bar: User sieht alle aktiven Kategorien gleichzeitig, kann wechseln.
 * Karte ist `position: fixed` (siehe CSS) — schwebt über dem Header, schiebt nichts
 * im Page-Flow weg. Schließen via X-Button.
 */

import {
  AccessTime,
  AutoStories,
  CheckCircle,
  MenuBook,
  NewReleases,
  StarOutline,
  SwapHoriz,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { AnimeMangaHandoffNotification } from '../../components/ui/AnimeMangaHandoffNotification';
import { CarouselNotification } from '../../components/ui/CarouselNotification';
import '../../components/ui/CarouselNotification.css';
import { ProviderChangeNotification } from '../../components/ui/ProviderChangeNotification';
import { UnsubscribedNewSeasonNotification } from '../../components/ui/UnsubscribedNewSeasonNotification';
import type { AnimeMangaHandoff, ProviderChangeInfo } from '../../contexts/seriesListDetection';
import { useTheme } from '../../contexts/ThemeContext';
import type { ProactiveRecap } from '../../hooks/useProactiveRecaps';
import type { UnsubscribedNewSeasonEntry } from '../../hooks/useUnsubscribedNewSeasons';
import type { Series } from '../../types/Series';
import { ProactiveRecapCard } from './ProactiveRecapCard';
import { t } from '../../services/i18n';

type CategoryKey =
  | 'recap'
  | 'new-season'
  | 'provider'
  | 'unsubscribed'
  | 'inactive'
  | 'inactive-rewatch'
  | 'completed'
  | 'unrated'
  | 'anime-manga';

interface CategoryDef {
  key: CategoryKey;
  label: string;
  Icon: typeof NewReleases;
  color: (t: ReturnType<typeof useTheme>['currentTheme']) => string;
}

const CATEGORY_DEFS: CategoryDef[] = [
  { key: 'recap', label: 'Recap', Icon: AutoStories, color: (t) => t.accent || t.primary },
  { key: 'new-season', label: t('Neu'), Icon: NewReleases, color: (t) => t.primary },
  {
    key: 'provider',
    label: 'Provider',
    Icon: SwapHoriz,
    color: (t) => t.accent || t.primary,
  },
  {
    key: 'unsubscribed',
    label: t('Abo fehlt'),
    Icon: NewReleases,
    color: (t) => t.status.warning,
  },
  { key: 'inactive', label: t('Inaktiv'), Icon: AccessTime, color: (t) => t.status.warning },
  {
    key: 'inactive-rewatch',
    label: 'Rewatch',
    Icon: AccessTime,
    color: (t) => t.status.warning,
  },
  {
    key: 'completed',
    label: t('Fertig'),
    Icon: CheckCircle,
    color: (t) => t.status.success,
  },
  { key: 'unrated', label: t('Bewerten'), Icon: StarOutline, color: (t) => t.primary },
  {
    key: 'anime-manga',
    label: 'Manga',
    Icon: MenuBook,
    color: (t) => t.accent || t.primary,
  },
];

interface SeriesNotificationHubProps {
  proactiveRecaps: {
    recaps: ProactiveRecap[];
    dismiss: (cacheKey: string) => void;
    fetchRecap: (cacheKey: string) => Promise<void>;
  };
  unsubscribedNewSeasons: UnsubscribedNewSeasonEntry[];
  onDismissUnsubscribed: () => void;
  providerChanges: ProviderChangeInfo[];
  onDismissProvider: () => void;
  seriesWithNewSeasons: Series[];
  onDismissNewSeasons: () => void;
  inactiveSeries: Series[];
  onDismissInactive: () => void;
  inactiveRewatches: Series[];
  onDismissInactiveRewatch: () => void;
  completedSeries: Series[];
  onDismissCompleted: () => void;
  unratedSeries: Series[];
  onDismissUnrated: () => void;
  animeMangaHandoffs: AnimeMangaHandoff[];
  onDismissAnimeManga: () => void;
}

export const SeriesNotificationHub: React.FC<SeriesNotificationHubProps> = ({
  proactiveRecaps,
  unsubscribedNewSeasons,
  onDismissUnsubscribed,
  providerChanges,
  onDismissProvider,
  seriesWithNewSeasons,
  onDismissNewSeasons,
  inactiveSeries,
  onDismissInactive,
  inactiveRewatches,
  onDismissInactiveRewatch,
  completedSeries,
  onDismissCompleted,
  unratedSeries,
  onDismissUnrated,
  animeMangaHandoffs,
  onDismissAnimeManga,
}) => {
  const { currentTheme } = useTheme();

  const categoryCounts = useMemo<Partial<Record<CategoryKey, number>>>(
    () => ({
      recap: proactiveRecaps.recaps.length,
      'new-season': seriesWithNewSeasons.length,
      provider: providerChanges.length,
      unsubscribed: unsubscribedNewSeasons.length,
      inactive: inactiveSeries.length,
      'inactive-rewatch': inactiveRewatches.length,
      completed: completedSeries.length,
      unrated: unratedSeries.length,
      'anime-manga': animeMangaHandoffs.length,
    }),
    [
      proactiveRecaps.recaps.length,
      seriesWithNewSeasons.length,
      providerChanges.length,
      unsubscribedNewSeasons.length,
      inactiveSeries.length,
      inactiveRewatches.length,
      completedSeries.length,
      unratedSeries.length,
      animeMangaHandoffs.length,
    ]
  );

  const activeCategories = useMemo(
    () => CATEGORY_DEFS.filter((c) => (categoryCounts[c.key] || 0) > 0),
    [categoryCounts]
  );

  // Gezeigte Kategorie bleibt stehen, bis sie verschwindet oder der User wechselt —
  // asynchron nachladende Detections tauschen die Karte nicht mehr aus.
  const [shownKey, setShownKey] = useState<CategoryKey | null>(null);

  if (activeCategories.length === 0) return null;

  const currentKey =
    shownKey && activeCategories.some((c) => c.key === shownKey)
      ? shownKey
      : activeCategories[0].key;
  if (currentKey !== shownKey) setShownKey(currentKey);

  const renderActive = () => {
    switch (currentKey) {
      case 'recap':
        return (
          <ProactiveRecapCard
            recaps={proactiveRecaps.recaps}
            onDismiss={proactiveRecaps.dismiss}
            onFetchRecap={proactiveRecaps.fetchRecap}
          />
        );
      case 'unsubscribed':
        return (
          <UnsubscribedNewSeasonNotification
            entries={unsubscribedNewSeasons}
            onDismiss={onDismissUnsubscribed}
          />
        );
      case 'provider':
        return (
          <ProviderChangeNotification changes={providerChanges} onDismiss={onDismissProvider} />
        );
      case 'new-season':
        return (
          <CarouselNotification
            variant="new-season"
            series={seriesWithNewSeasons}
            onDismiss={onDismissNewSeasons}
          />
        );
      case 'inactive':
        return (
          <CarouselNotification
            variant="inactive"
            series={inactiveSeries}
            onDismiss={onDismissInactive}
          />
        );
      case 'inactive-rewatch':
        return (
          <CarouselNotification
            variant="inactive-rewatch"
            series={inactiveRewatches}
            onDismiss={onDismissInactiveRewatch}
          />
        );
      case 'completed':
        return (
          <CarouselNotification
            variant="completed"
            series={completedSeries}
            onDismiss={onDismissCompleted}
          />
        );
      case 'unrated':
        return (
          <CarouselNotification
            variant="unrated"
            series={unratedSeries}
            onDismiss={onDismissUnrated}
          />
        );
      case 'anime-manga':
        return (
          <AnimeMangaHandoffNotification
            handoffs={animeMangaHandoffs}
            onDismiss={onDismissAnimeManga}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="notif-hub">
      {/* Tab-Bar — nur wenn mehr als 1 Kategorie aktiv */}
      {activeCategories.length > 1 && (
        <div
          className="notif-hub-tabs"
          role="tablist"
          aria-label={t('Benachrichtigungs-Kategorien')}
        >
          {activeCategories.map((c) => {
            const isActive = c.key === currentKey;
            const tabColor = c.color(currentTheme);
            return (
              <button
                key={c.key}
                role="tab"
                aria-selected={isActive}
                className={`notif-hub-tab ${isActive ? 'active' : ''}`}
                onClick={() => setShownKey(c.key)}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${tabColor}, ${tabColor}cc)`,
                        color: currentTheme.background.default,
                      }
                    : { color: currentTheme.text.primary }
                }
              >
                <c.Icon />
                <span>{c.label}</span>
                <span className="notif-hub-tab-count">{categoryCounts[c.key]}</span>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {renderActive()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
