import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback } from 'react';
import { useAuth } from '../../../AuthContext';

/**
 * Wartet bis das Backend einen Eintrag fuer eine TMDB-Id unter
 * users/{uid}/{series|movies}/{tmdbId} angelegt hat. Nutzt Firebase-Listener
 * statt Polling — laeuft also exakt so lange wie noetig, max bis timeoutMs.
 */
export function useWaitForBackendItem() {
  const { user } = useAuth() || {};

  return useCallback(
    (type: 'series' | 'movie', tmdbId: number, timeoutMs: number = 60_000): Promise<boolean> => {
      const uid = user?.uid;
      if (!uid) return Promise.resolve(false);
      const path = `users/${uid}/${type === 'series' ? 'series' : 'movies'}/${tmdbId}`;
      const ref = firebase.database().ref(path);

      return new Promise<boolean>((resolve) => {
        let settled = false;
        const cleanup = () => {
          if (settled) return;
          settled = true;
          ref.off('value', handler);
          clearTimeout(timer);
        };
        const handler = (snap: firebase.database.DataSnapshot) => {
          if (snap.exists()) {
            cleanup();
            resolve(true);
          }
        };
        const timer = setTimeout(() => {
          cleanup();
          resolve(false);
        }, timeoutMs);
        ref.on('value', handler);
      });
    },
    [user?.uid]
  );
}
