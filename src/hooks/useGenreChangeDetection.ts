import { useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { startGenreChangeDetection } from '../utils/genreChangeDetection';

/**
 * Hook für automatische Genre-Änderungserkennung
 */
export const useGenreChangeDetection = () => {
  const { user } = useAuth()!;
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.uid) return;

    const runGenreCheck = async () => {
      try {
        await startGenreChangeDetection(user.uid);
        lastCheckRef.current = Date.now();
      } catch (error) {
        console.error('❌ Fehler bei Genre-Prüfung beim App-Start:', error);
      }
    }; // Einmalige Prüfung nach 5 Sekunden beim App-Start
    const initialTimeout = setTimeout(() => {
      runGenreCheck();
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
    };
  }, [user?.uid]);
};
