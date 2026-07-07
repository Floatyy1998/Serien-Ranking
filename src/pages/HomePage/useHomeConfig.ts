import { dbRef, paths } from '../../services/db/ref';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Default orders
export const DEFAULT_SECTION_ORDER = [
  'activity-marquee',
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
  'rating-queue',
  'catch-up',
  'streaming-reminder',
  'hidden-series',
];
export const DEFAULT_QUICK_ACTIONS_ORDER = ['ratings', 'discover', 'history', 'friends'];
export const DEFAULT_SECONDARY_ACTIONS_ORDER = ['leaderboard', 'badges', 'pets'];

export interface HomeConfig {
  sectionOrder: string[];
  hiddenSections: string[];
  forYouOrder: string[];
  hiddenForYou: string[];
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

    // Merge missing default items into cached lists so new features appear
    // at their intended position (not just appended at the end).
    const merge = (cached: string[] | undefined, defaults: string[]) => {
      if (!cached) return undefined;
      const out = [...cached];
      for (let i = 0; i < defaults.length; i += 1) {
        const id = defaults[i];
        if (out.includes(id)) continue;
        let insertAt = out.length;
        for (let j = i + 1; j < defaults.length; j += 1) {
          const idx = out.indexOf(defaults[j]);
          if (idx !== -1) {
            insertAt = idx;
            break;
          }
        }
        out.splice(insertAt, 0, id);
      }
      return out;
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
          // Insert each missing default before the next default that's
          // already present, so new sections land at their intended slot
          // rather than at the bottom of every existing user's layout.
          for (let i = 0; i < defaults.length; i += 1) {
            const id = defaults[i];
            if (valid.includes(id)) continue;
            let insertAt = valid.length;
            for (let j = i + 1; j < defaults.length; j += 1) {
              const idx = valid.indexOf(defaults[j]);
              if (idx !== -1) {
                insertAt = idx;
                break;
              }
            }
            valid.splice(insertAt, 0, id);
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

  // Load homeConfig from Firebase (background sync).
  // setAppReady('homeConfig') wird in mehreren Faellen gefeuert, damit der
  // Splashscreen nicht haengt, falls Firebase RTDB nicht antwortet:
  //   1) Cached Config in localStorage → sofort ready (Firebase laeuft im Hintergrund)
  //   2) Firebase-once antwortet → ready
  //   3) Hard-Timeout 2.5s → ready, egal ob Firebase noch laeuft
  //   4) Firebase wirft → ready (.catch)
  useEffect(() => {
    if (!uid) {
      window.setAppReady?.('homeConfig', true);
      return;
    }
    // 1) Wenn wir schon einen Cache haben, ist die App "bereit zum Rendern".
    //    Firebase darf im Hintergrund nachladen, blockiert aber nicht den Splash.
    const hasCache = (() => {
      try {
        return !!localStorage.getItem('homeConfig_cache');
      } catch {
        return false;
      }
    })();
    if (hasCache) {
      window.setAppReady?.('homeConfig', true);
    }

    let done = false;
    const markReady = () => {
      if (done) return;
      done = true;
      window.setAppReady?.('homeConfig', true);
    };

    // 3) Hard-Timeout: spaetestens nach 2.5s ist homeConfig "ready",
    //    egal ob Firebase noch antwortet
    const timeoutId = window.setTimeout(markReady, 2500);

    dbRef(paths.homeConfig(uid))
      .once('value')
      .then((snap) => {
        const data = snap.val();
        if (data) applyConfigData(data);
      })
      .catch((err) => {
        console.warn('[homeConfig] firebase fetch failed', err);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        markReady();
      });

    return () => {
      window.clearTimeout(timeoutId);
    };
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
    quickActionsOrder,
    hiddenQuickActions,
    secondaryActionsOrder,
    hiddenSecondaryActions,
    visibleSections,
  };
}
