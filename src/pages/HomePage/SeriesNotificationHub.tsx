/**
 * SeriesNotificationHub — Aggregator für alle Serien-bezogenen Notification-Karten.
 *
 * Ersetzt die alte Prio-Queue auf der HomePage (eine Karte zur Zeit, andere versteckt).
 * Stattdessen Tab-Bar: User sieht alle aktiven Kategorien gleichzeitig, kann wechseln.
 *
 * Mini-Mode: wenn User minimiert hat (Session-State), nur kompakter Banner mit Dots
 * + Expand-Arrow. Beim nächsten App-Open wieder Vollanzeige.
 */

import {
  AccessTime,
  AutoStories,
  CheckCircle,
  ExpandMore,
  NewReleases,
  StarOutline,
  SwapHoriz,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { ProactiveRecap } from '../../hooks/useProactiveRecaps';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Series } from '../../types/Series';
import { CarouselNotification } from '../../components/ui/CarouselNotification';
import { ProactiveRecapCard } from './ProactiveRecapCard';
import { ProviderChangeNotification } from '../../components/ui/ProviderChangeNotification';
import { UnsubscribedNewSeasonNotification } from '../../components/ui/UnsubscribedNewSeasonNotification';
import type { ProviderChangeInfo } from '../../contexts/seriesListDetection';
import type { UnsubscribedNewSeasonEntry } from '../../hooks/useUnsubscribedNewSeasons';
import '../../components/ui/CarouselNotification.css';

type CategoryKey =
  | 'recap'
  | 'new-season'
  | 'provider'
  | 'unsubscribed'
  | 'inactive'
  | 'inactive-rewatch'
  | 'completed'
  | 'unrated';

interface CategoryDef {
  key: CategoryKey;
  label: string;
  Icon: typeof NewReleases;
  color: (t: ReturnType<typeof useTheme>['currentTheme']) => string;
}

const CATEGORY_DEFS: CategoryDef[] = [
  { key: 'recap', label: 'Recap', Icon: AutoStories, color: (t) => t.accent || t.primary },
  { key: 'new-season', label: 'Neu', Icon: NewReleases, color: (t) => t.primary },
  {
    key: 'provider',
    label: 'Provider',
    Icon: SwapHoriz,
    color: (t) => t.accent || t.primary,
  },
  {
    key: 'unsubscribed',
    label: 'Abo fehlt',
    Icon: NewReleases,
    color: (t) => t.status.warning,
  },
  { key: 'inactive', label: 'Inaktiv', Icon: AccessTime, color: (t) => t.status.warning },
  {
    key: 'inactive-rewatch',
    label: 'Rewatch',
    Icon: AccessTime,
    color: (t) => t.status.warning,
  },
  {
    key: 'completed',
    label: 'Fertig',
    Icon: CheckCircle,
    color: (t) => t.status.success,
  },
  { key: 'unrated', label: 'Bewerten', Icon: StarOutline, color: (t) => t.primary },
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
}

const MINIMIZED_KEY = 'series-notif-hub-minimized';

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
}) => {
  const { currentTheme } = useTheme();

  // Welche Kategorien haben Inhalt?
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
    ]
  );

  const activeCategories = useMemo(
    () => CATEGORY_DEFS.filter((c) => (categoryCounts[c.key] || 0) > 0),
    [categoryCounts]
  );

  // Minimized-State (Session, kein Firebase): User kann den Hub einklappen
  const [minimized, setMinimized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(MINIMIZED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(MINIMIZED_KEY, minimized ? '1' : '0');
    } catch {
      // ignore
    }
  }, [minimized]);

  // Aktiver Tab — default: erste verfügbare Kategorie
  const [activeKey, setActiveKey] = useState<CategoryKey | null>(null);

  useEffect(() => {
    // Wenn aktive Kategorie verschwindet (z.B. dismissed), wechsle auf erste
    if (!activeKey || (categoryCounts[activeKey] || 0) === 0) {
      setActiveKey(activeCategories[0]?.key ?? null);
    }
  }, [activeKey, activeCategories, categoryCounts]);

  if (activeCategories.length === 0) return null;

  const currentKey =
    activeKey && activeCategories.some((c) => c.key === activeKey)
      ? activeKey
      : activeCategories[0].key;

  // Mini-Mode: kompakter Banner mit Dots
  if (minimized) {
    const totalCount = activeCategories.reduce((sum, c) => sum + (categoryCounts[c.key] || 0), 0);
    return (
      <div className="notif-hub">
        <motion.button
          className="notif-hub-mini"
          onClick={() => setMinimized(false)}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.99 }}
          style={{
            color: currentTheme.text.primary,
            width: '100%',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label={`${totalCount} Benachrichtigungen anzeigen`}
        >
          <div className="notif-hub-mini-dots">
            {activeCategories.slice(0, 5).map((c) => (
              <span
                key={c.key}
                className="notif-hub-mini-dot"
                style={{ background: c.color(currentTheme) }}
              />
            ))}
          </div>
          <span className="notif-hub-mini-text">
            {totalCount} {totalCount === 1 ? 'Hinweis' : 'Hinweise'}
            {activeCategories.length > 1 ? ` in ${activeCategories.length} Kategorien` : ''}
          </span>
          <ExpandMore className="notif-hub-mini-arrow" />
        </motion.button>
      </div>
    );
  }

  // Render der aktiven Kategorie
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
            onCollapse={() => setMinimized(true)}
          />
        );
      case 'provider':
        return (
          <ProviderChangeNotification
            changes={providerChanges}
            onDismiss={onDismissProvider}
            onCollapse={() => setMinimized(true)}
          />
        );
      case 'new-season':
        return (
          <CarouselNotification
            variant="new-season"
            series={seriesWithNewSeasons}
            onDismiss={onDismissNewSeasons}
            onCollapse={() => setMinimized(true)}
          />
        );
      case 'inactive':
        return (
          <CarouselNotification
            variant="inactive"
            series={inactiveSeries}
            onDismiss={onDismissInactive}
            onCollapse={() => setMinimized(true)}
          />
        );
      case 'inactive-rewatch':
        return (
          <CarouselNotification
            variant="inactive-rewatch"
            series={inactiveRewatches}
            onDismiss={onDismissInactiveRewatch}
            onCollapse={() => setMinimized(true)}
          />
        );
      case 'completed':
        return (
          <CarouselNotification
            variant="completed"
            series={completedSeries}
            onDismiss={onDismissCompleted}
            onCollapse={() => setMinimized(true)}
          />
        );
      case 'unrated':
        return (
          <CarouselNotification
            variant="unrated"
            series={unratedSeries}
            onDismiss={onDismissUnrated}
            onCollapse={() => setMinimized(true)}
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
        <div className="notif-hub-tabs" role="tablist" aria-label="Benachrichtigungs-Kategorien">
          {activeCategories.map((c) => {
            const isActive = c.key === currentKey;
            const tabColor = c.color(currentTheme);
            return (
              <button
                key={c.key}
                role="tab"
                aria-selected={isActive}
                className={`notif-hub-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveKey(c.key)}
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
