/**
 * useHomeLayoutData - Business logic for HomeLayoutPage
 * Manages section ordering, visibility toggles, drag-drop, and Firebase persistence
 */

import { dbRef, paths } from '../../services/db/ref';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelect, hapticWarning } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import {
  defaultHomeConfig,
  sanitizeHomeConfig,
  type HomeConfig,
} from '../../lib/layout/homeLayout';
import type { HomeHiddenKey } from '../../config/homeSections';
import { publishHomeConfig } from '../../services/settings/homeConfigSync';

export {
  DEFAULT_FOR_YOU_ORDER,
  DEFAULT_QUICK_ACTIONS_ORDER,
  DEFAULT_SECONDARY_ACTIONS_ORDER,
  DEFAULT_SECTION_ORDER,
  HEADER_ITEMS,
} from '../../config/homeSections';
export type { HomeConfig };

export const SECTION_LABELS: Record<string, string> = {
  'activity-marquee': t('Freunde-Aktivitäten'),
  'quick-actions': t('Schnellzugriff'),
  'secondary-actions': t('Extras'),
  countdown: t('Countdown'),
  'continue-watching': t('Weiterschauen'),
  rewatches: t('Rewatches'),
  'rewatch-list': t('Nochmal schauen'),
  'today-episodes': t('Heute Neu'),
  'new-on-subs': t('Neu auf deinen Streaming-Anbietern'),
  seasonal: t('Saisonale Empfehlungen'),
  trending: t('Trending'),
  'top-rated': t('Bestbewertet'),
  'for-you': t('Für dich'),
  stats: t('Statistiken'),
};

export const FOR_YOU_LABELS: Record<string, string> = {
  tonight: t('Heute Abend'),
  'watch-streak': t('Watch Streak'),
  'daily-spin': t('Glücksrad'),
  'milestone-box': t('Mystery Box'),
  'taste-profile': t('KI-Empfehlungen'),
  'taste-match': t('Taste Match'),
  'watch-journey': t('Watch Journey'),
  'rating-queue': t('Bewertungs-Queue'),
  'catch-up': t('Backlog'),
  'streaming-reminder': t('Streaming-Erinnerung'),
  'hidden-series': t('Nicht weitergeschaut'),
};

export const QUICK_ACTIONS_LABELS: Record<string, string> = {
  ratings: t('Ratings'),
  discover: t('Entdecken'),
  history: t('Verlauf'),
  friends: t('Freunde'),
};

export const SECONDARY_ACTIONS_LABELS: Record<string, string> = {
  leaderboard: t('Rangliste'),
  badges: t('Badges'),
  pets: t('Pets'),
};

export const HEADER_LABELS: Record<string, string> = {
  'stat-pods': t('Kennzahlen'),
};

export interface ExpandableConfig {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  order: string[];
  onReorder: (newOrder: string[]) => void;
  hiddenItems: string[];
  onToggle: (id: string) => void;
  labels: Record<string, string>;
}

export interface UseHomeLayoutDataResult {
  sectionOrder: string[];
  hiddenSections: string[];
  hiddenHeader: string[];
  handleSectionReorder: (newOrder: string[]) => void;
  handleSectionToggle: (id: string) => void;
  handleHeaderToggle: (id: string) => void;
  handleReset: () => void;
  getExpandableConfig: (sectionId: string) => ExpandableConfig | null;
}

type OrderKey = 'sectionOrder' | 'forYouOrder' | 'quickActionsOrder' | 'secondaryActionsOrder';

export const useHomeLayoutData = (): UseHomeLayoutDataResult => {
  const authContext = useAuth();
  const user = authContext?.user;

  const [config, setConfig] = useState<HomeConfig>(defaultHomeConfig);

  const [forYouExpanded, setForYouExpanded] = useState(false);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  const [secondaryActionsExpanded, setSecondaryActionsExpanded] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Firebase save (debounced)

  const saveConfig = useCallback(
    (next: HomeConfig) => {
      if (!user) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        dbRef(paths.homeConfig(user.uid)).set(next);
      }, 500);
    },
    [user]
  );

  const update = (patch: Partial<HomeConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    publishHomeConfig(next);
    saveConfig(next);
  };

  // Firebase load

  useEffect(() => {
    if (!user) return;
    dbRef(paths.homeConfig(user.uid))
      .once('value')
      .then((snap) => {
        const data = snap.val();
        if (data) setConfig(sanitizeHomeConfig(data));
      })
      .catch(() => {
        // Best effort: schlaegt der Read fehl, bleibt die Standardanordnung.
      });
  }, [user]);

  const makeToggle = (key: HomeHiddenKey) => (id: string) => {
    const hidden = config[key];
    update({ [key]: hidden.includes(id) ? hidden.filter((s) => s !== id) : [...hidden, id] });
    hapticSelect();
  };

  const makeReorder = (key: OrderKey) => (newOrder: string[]) => update({ [key]: newOrder });

  const handleSectionReorder = makeReorder('sectionOrder');
  const handleSectionToggle = makeToggle('hiddenSections');
  const handleForYouReorder = makeReorder('forYouOrder');
  const handleForYouToggle = makeToggle('hiddenForYou');
  const handleQuickActionsReorder = makeReorder('quickActionsOrder');
  const handleQuickActionsToggle = makeToggle('hiddenQuickActions');
  const handleSecondaryActionsReorder = makeReorder('secondaryActionsOrder');
  const handleSecondaryActionsToggle = makeToggle('hiddenSecondaryActions');
  const handleHeaderToggle = makeToggle('hiddenHeader');

  const handleReset = () => {
    update(defaultHomeConfig());
    hapticWarning();
  };

  const {
    forYouOrder,
    hiddenForYou,
    quickActionsOrder,
    hiddenQuickActions,
    secondaryActionsOrder,
    hiddenSecondaryActions,
  } = config;

  const getExpandableConfig = (sectionId: string): ExpandableConfig | null => {
    switch (sectionId) {
      case 'for-you':
        return {
          expanded: forYouExpanded,
          setExpanded: setForYouExpanded,
          order: forYouOrder,
          onReorder: handleForYouReorder,
          hiddenItems: hiddenForYou,
          onToggle: handleForYouToggle,
          labels: FOR_YOU_LABELS,
        };
      case 'quick-actions':
        return {
          expanded: quickActionsExpanded,
          setExpanded: setQuickActionsExpanded,
          order: quickActionsOrder,
          onReorder: handleQuickActionsReorder,
          hiddenItems: hiddenQuickActions,
          onToggle: handleQuickActionsToggle,
          labels: QUICK_ACTIONS_LABELS,
        };
      case 'secondary-actions':
        return {
          expanded: secondaryActionsExpanded,
          setExpanded: setSecondaryActionsExpanded,
          order: secondaryActionsOrder,
          onReorder: handleSecondaryActionsReorder,
          hiddenItems: hiddenSecondaryActions,
          onToggle: handleSecondaryActionsToggle,
          labels: SECONDARY_ACTIONS_LABELS,
        };
      default:
        return null;
    }
  };

  return {
    sectionOrder: config.sectionOrder,
    hiddenSections: config.hiddenSections,
    hiddenHeader: config.hiddenHeader,
    handleSectionReorder,
    handleSectionToggle,
    handleHeaderToggle,
    handleReset,
    getExpandableConfig,
  };
};
