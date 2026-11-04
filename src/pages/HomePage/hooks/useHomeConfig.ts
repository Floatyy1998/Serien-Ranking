import { dbRef, paths } from '../../../services/db/ref';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sanitizeHomeConfig, type HomeConfig } from '../../../lib/layout/homeLayout';
import { subscribeHomeConfig } from '../../../services/settings/homeConfigSync';

export {
  DEFAULT_FOR_YOU_ORDER,
  DEFAULT_QUICK_ACTIONS_ORDER,
  DEFAULT_SECONDARY_ACTIONS_ORDER,
  DEFAULT_SECTION_ORDER,
} from '../../../config/homeSections';
export type { HomeConfig };

export interface UseHomeConfigReturn extends HomeConfig {
  visibleSections: string[];
}

function readCachedConfig(): unknown {
  try {
    return JSON.parse(localStorage.getItem('homeConfig_cache') || 'null');
  } catch {
    return null;
  }
}

export function useHomeConfig(uid: string | undefined): UseHomeConfigReturn {
  const [config, setConfig] = useState<HomeConfig>(() => sanitizeHomeConfig(readCachedConfig()));

  const applyConfigData = useCallback((data: Record<string, unknown>) => {
    setConfig(sanitizeHomeConfig(data));
    try {
      localStorage.setItem('homeConfig_cache', JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => subscribeHomeConfig((next) => setConfig(sanitizeHomeConfig(next))), []);

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
        else {
          // Kein gespeichertes Layout: trotzdem einen Cache-Marker setzen.
          // Ohne den griff der Schnellpfad oben NIE, und jeder Start wartete
          // erneut auf diesen Firebase-Roundtrip — gemessen ~700 ms nach dem
          // Login, und homeConfig ist regelmaessig das letzte Flag.
          try {
            localStorage.setItem('homeConfig_cache', '{}');
          } catch {
            /* Quota-fragil — dann bleibt es beim Roundtrip */
          }
        }
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

  const visibleSections = useMemo(
    () => config.sectionOrder.filter((id) => !config.hiddenSections.includes(id)),
    [config.sectionOrder, config.hiddenSections]
  );

  return useMemo(() => ({ ...config, visibleSections }), [config, visibleSections]);
}
