/**
 * SeriesNotificationHub — Aggregator für alle Serien-bezogenen Notification-Karten.
 *
 * Liegt IM Seitenfluss (kein position:fixed mehr — die schwebende Karte hat
 * nach längerer Abwesenheit den halben Homescreen überdeckt). Bei kleinem
 * Rückstau (1 Kategorie, ≤3 Einträge) erscheint direkt die Karte; sonst
 * startet der Hub als schmales Mini-Banner und expandiert erst auf Tap zur
 * Tab-Karte. So überlappt nie etwas und der Rückstau frisst nur eine Zeile.
 */

import {
  AccessTime,
  AutoStories,
  CheckCircle,
  ExpandLess,
  ExpandMore,
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

  // null = automatisch: kleiner Rückstau klappt direkt auf, großer startet
  // als Mini-Banner (v.a. beim Öffnen nach längerer Abwesenheit).
  const [expanded, setExpanded] = useState<boolean | null>(null);

  if (activeCategories.length === 0) return null;

  const totalCount = activeCategories.reduce((sum, c) => sum + (categoryCounts[c.key] || 0), 0);
  const autoExpand = activeCategories.length === 1 && totalCount <= 3;
  const isExpanded = expanded ?? autoExpand;
  // Aus dem Mini-Banner expandiert → Collapse-Weg zurück anbieten (in der
  // Tab-Zeile, die dann auch bei nur einer Kategorie erscheint).
  const startedMini = !autoExpand;

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

  if (!isExpanded) {
    return (
      <div className="notif-hub">
        <motion.button
          type="button"
          className="notif-hub-mini"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', color: currentTheme.text.primary }}
        >
          <span className="notif-hub-mini-dots" aria-hidden>
            {activeCategories.slice(0, 5).map((c) => (
              <span
                key={c.key}
                className="notif-hub-mini-dot"
                style={{ background: c.color(currentTheme) }}
              />
            ))}
          </span>
          <span className="notif-hub-mini-text">
            {totalCount === 1
              ? t('1 Hinweis zu deinen Serien')
              : t('{n} Hinweise zu deinen Serien', { n: totalCount })}
          </span>
          <ExpandMore style={{ fontSize: 18, opacity: 0.6, flexShrink: 0 }} />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="notif-hub">
      {/* Tab-Bar — bei mehreren Kategorien oder als Rückweg zum Mini-Banner */}
      {(activeCategories.length > 1 || startedMini) && (
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
                <span>{t(c.label)}</span>
                <span className="notif-hub-tab-count">{categoryCounts[c.key]}</span>
              </button>
            );
          })}
          {startedMini && (
            <button
              className="notif-hub-tab notif-hub-tab--collapse"
              aria-label={t('Einklappen')}
              onClick={() => setExpanded(false)}
              style={{ marginLeft: 'auto', color: currentTheme.text.primary }}
            >
              <ExpandLess />
            </button>
          )}
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
