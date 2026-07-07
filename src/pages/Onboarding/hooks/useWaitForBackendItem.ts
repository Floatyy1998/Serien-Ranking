import type firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dbRef, paths } from '../../../services/db/ref';

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
      const path = type === 'series' ? paths.seriesItem(uid, tmdbId) : paths.movieItem(uid, tmdbId);
      const ref = dbRef(path);

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
