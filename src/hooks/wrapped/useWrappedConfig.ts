/**
 * Ob Wrapped gerade läuft und für welches Jahr.
 *
 * Der Kalender entscheidet (6.12. bis 31.12., siehe lib/wrapped/wrappedPeriod);
 * `config/wrapped` in Firebase kann es nur vorziehen (`enabled: true`, optional
 * mit `year`) oder anhalten (`paused: true`).
 */

import { useState, useEffect } from 'react';
import { dbRef } from '../../services/db/ref';
import { FEATURES } from '../../config/features';
import { resolveWrapped, type WrappedSwitch } from '../../lib/wrapped/wrappedPeriod';
import { onValue } from '../../services/db/subscribeValue';

interface WrappedConfig {
  enabled: boolean;
  year: number;
  loading: boolean;
}

/** Ohne Eintrag in der Datenbank gilt der lokale Schalter. */
const LOCAL_SWITCH: WrappedSwitch = { enabled: FEATURES.WRAPPED_ENABLED };

export const useWrappedConfig = (): WrappedConfig => {
  const [config, setConfig] = useState<WrappedConfig>(() => ({
    ...resolveWrapped(LOCAL_SWITCH, new Date()),
    loading: true,
  }));

  useEffect(() => {
    const configRef = dbRef('config/wrapped');

    const unsubscribe = onValue(configRef, async (snapshot) => {
      const data = snapshot.val() as WrappedSwitch | null;

      if (data) {
        setConfig({ ...resolveWrapped(data, new Date()), loading: false });
        return;
      }

      // Config existiert nicht - erstelle sie mit Default-Werten
      try {
        await configRef.set({
          enabled: FEATURES.WRAPPED_ENABLED,
          year: FEATURES.WRAPPED_YEAR,
        });
      } catch {
        // Config could not be created in Firebase, using local config
      }
      setConfig({ ...resolveWrapped(LOCAL_SWITCH, new Date()), loading: false });
    });

    return () => configRef.off('value', unsubscribe);
  }, []);

  return config;
};

export default useWrappedConfig;
