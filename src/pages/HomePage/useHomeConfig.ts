import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Default orders
export const DEFAULT_SECTION_ORDER = [
  'main-actions',
  'quick-actions',
  'secondary-actions',
  'countdown',
  'continue-watching',
  'rewatches',
  'today-episodes',
  'seasonal',
  'trending',
  'top-rated',
  'for-you',
  'stats',
];
export const DEFAULT_FOR_YOU_ORDER = [
  'watch-streak',
  'daily-spin',
  'milestone-box',
  'taste-profile',
  'taste-match',
  'watch-journey',
  'catch-up',
  'hidden-series',
];
export const DEFAULT_MAIN_ACTIONS_ORDER = ['watchlist', 'discover'];
export const DEFAULT_QUICK_ACTIONS_ORDER = ['ratings', 'discover', 'history', 'friends'];
export const DEFAULT_SECONDARY_ACTIONS_ORDER = ['leaderboard', 'badges', 'pets'];

export interface HomeConfig {
  sectionOrder: string[];
  hiddenSections: string[];
  forYouOrder: string[];
  hiddenForYou: string[];
  mainActionsOrder: string[];
  hiddenMainActions: string[];
  quickActionsOrder: string[];
  hiddenQuickActions: string[];
  secondaryActionsOrder: string[];
  hiddenSecondaryActions: string[];
}

export interface UseHomeConfigReturn extends HomeConfig {
  visibleSections: string[];
}

function readCachedConfig(): Partial<HomeConfig> | null {
  try {
    const cached = JSON.parse(localStorage.getItem('homeConfig_cache') || 'null');
    if (!cached) return null;

    // Merge missing default items into cached lists so new features appear automatically
    const merge = (cached: string[] | undefined, defaults: string[]) => {
      if (!cached) return undefined;
      const missing = defaults.filter((id) => !cached.includes(id));
      return missing.length > 0 ? [...cached, ...missing] : cached;
    };

    cached.forYouOrder = merge(cached.forYouOrder, DEFAULT_FOR_YOU_ORDER);
    cached.sectionOrder = merge(cached.sectionOrder, DEFAULT_SECTION_ORDER);

    return cached;
  } catch {
    return null;
  }
}

export function useHomeConfig(uid: string | undefined): UseHomeConfigReturn {
  const cachedConfig = readCachedConfig();

  const [sectionOrder, setSectionOrder] = useState<string[]>(
    cachedConfig?.sectionOrder || DEFAULT_SECTION_ORDER
  );
  const [hiddenSections, setHiddenSections] = useState<string[]>(
    cachedConfig?.hiddenSections || []
  );
  const [forYouOrder, setForYouOrder] = useState<string[]>(
    cachedConfig?.forYouOrder || DEFAULT_FOR_YOU_ORDER
  );
  const [hiddenForYou, setHiddenForYou] = useState<string[]>(cachedConfig?.hiddenForYou || []);
  const [mainActionsOrder, setMainActionsOrder] = useState<string[]>(
    cachedConfig?.mainActionsOrder || DEFAULT_MAIN_ACTIONS_ORDER
  );
  const [hiddenMainActions, setHiddenMainActions] = useState<string[]>(
    cachedConfig?.hiddenMainActions || []
  );
  const [quickActionsOrder, setQuickActionsOrder] = useState<string[]>(
    cachedConfig?.quickActionsOrder || DEFAULT_QUICK_ACTIONS_ORDER
  );
  const [hiddenQuickActions, setHiddenQuickActions] = useState<string[]>(
    cachedConfig?.hiddenQuickActions || []
  );
  const [secondaryActionsOrder, setSecondaryActionsOrder] = useState<string[]>(
    cachedConfig?.secondaryActionsOrder || DEFAULT_SECONDARY_ACTIONS_ORDER
  );
  const [hiddenSecondaryActions, setHiddenSecondaryActions] = useState<string[]>(
    cachedConfig?.hiddenSecondaryActions || []
  );

  // Stable reference via useCallback to avoid useEffect re-runs
  const applyConfigData = useCallback((data: Record<string, unknown>) => {
    const applyList = (
      key: string,
      defaults: string[],
      validLabels: Set<string>,
      setter: (v: string[]) => void,
      addMissing: boolean
    ) => {
      if (data?.[key]) {
        const valid = (data[key] as string[]).filter((id) => validLabels.has(id));
        if (addMissing) {
          for (const id of defaults) {
            if (!valid.includes(id)) valid.push(id);
          }
        }
        setter(valid);
      }
    };
    const sectionSet = new Set(DEFAULT_SECTION_ORDER);
    applyList('sectionOrder', DEFAULT_SECTION_ORDER, sectionSet, setSectionOrder, true);
    applyList('hiddenSections', DEFAULT_SECTION_ORDER, sectionSet, setHiddenSections, false);
    applyList(
      'forYouOrder',
      DEFAULT_FOR_YOU_ORDER,
      new Set(DEFAULT_FOR_YOU_ORDER),
      setForYouOrder,
      true
    );
    applyList(
      'hiddenForYou',
      DEFAULT_FOR_YOU_ORDER,
      new Set(DEFAULT_FOR_YOU_ORDER),
      setHiddenForYou,
      false
    );
    applyList(
      'mainActionsOrder',
      DEFAULT_MAIN_ACTIONS_ORDER,
      new Set(DEFAULT_MAIN_ACTIONS_ORDER),
      setMainActionsOrder,
      true
    );
    applyList(
      'hiddenMainActions',
      DEFAULT_MAIN_ACTIONS_ORDER,
      new Set(DEFAULT_MAIN_ACTIONS_ORDER),
      setHiddenMainActions,
      false
    );
    applyList(
      'quickActionsOrder',
      DEFAULT_QUICK_ACTIONS_ORDER,
      new Set(DEFAULT_QUICK_ACTIONS_ORDER),
      setQuickActionsOrder,
      true
    );
    applyList(
      'hiddenQuickActions',
      DEFAULT_QUICK_ACTIONS_ORDER,
      new Set(DEFAULT_QUICK_ACTIONS_ORDER),
      setHiddenQuickActions,
      false
    );
    applyList(
      'secondaryActionsOrder',
      DEFAULT_SECONDARY_ACTIONS_ORDER,
      new Set(DEFAULT_SECONDARY_ACTIONS_ORDER),
      setSecondaryActionsOrder,
      true
    );
    applyList(
      'hiddenSecondaryActions',
      DEFAULT_SECONDARY_ACTIONS_ORDER,
      new Set(DEFAULT_SECONDARY_ACTIONS_ORDER),
      setHiddenSecondaryActions,
      false
    );

    // Cache to localStorage for instant loading next time
    try {
      localStorage.setItem('homeConfig_cache', JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, []); // setter-Funktionen sind stabil, daher leeres Dependency-Array

  // Load homeConfig from Firebase (background sync)
  useEffect(() => {
    if (!uid) {
      window.setAppReady?.('homeConfig', true);
      return;
    }
    firebase
      .database()
      .ref(`users/${uid}/homeConfig`)
      .once('value')
      .then((snap) => {
        const data = snap.val();
        if (data) applyConfigData(data);
        window.setAppReady?.('homeConfig', true);
      });
  }, [uid, applyConfigData]);

  // Memoize derived value to avoid re-computation on unrelated renders
  const visibleSections = useMemo(
    () => sectionOrder.filter((id) => !hiddenSections.includes(id)),
    [sectionOrder, hiddenSections]
  );

  return {
    sectionOrder,
    hiddenSections,
    forYouOrder,
    hiddenForYou,
    mainActionsOrder,
    hiddenMainActions,
    quickActionsOrder,
    hiddenQuickActions,
    secondaryActionsOrder,
    hiddenSecondaryActions,
    visibleSections,
  };
}
