/**
 * Hook to read Wrapped config from Firebase
 * Falls back to local config if Firebase config doesn't exist
 */

import { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { FEATURES } from '../config/features';

interface WrappedConfig {
  enabled: boolean;
  year: number;
  loading: boolean;
}

export const useWrappedConfig = (): WrappedConfig => {
  const [config, setConfig] = useState<WrappedConfig>({
    enabled: FEATURES.WRAPPED_ENABLED,
    year: FEATURES.WRAPPED_YEAR,
    loading: true,
  });

  useEffect(() => {
    const configRef = firebase.database().ref('config/wrapped');

    const unsubscribe = configRef.on('value', async (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setConfig({
          enabled: data.enabled ?? FEATURES.WRAPPED_ENABLED,
          year: data.year ?? FEATURES.WRAPPED_YEAR,
          loading: false,
        });
      } else {
        // Config existiert nicht - erstelle sie mit Default-Werten
        try {
          await configRef.set({
            enabled: FEATURES.WRAPPED_ENABLED,
            year: FEATURES.WRAPPED_YEAR,
          });
        } catch (err) {
          // Config could not be created in Firebase, using local config
        }

        setConfig({
          enabled: FEATURES.WRAPPED_ENABLED,
          year: FEATURES.WRAPPED_YEAR,
          loading: false,
        });
      }
    });

    return () => configRef.off('value', unsubscribe);
  }, []);

  return config;
};

export default useWrappedConfig;