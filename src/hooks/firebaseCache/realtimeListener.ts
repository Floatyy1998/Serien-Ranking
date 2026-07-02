/**
 * 🔄 Realtime-Listener-Wiring (einzelner .on('value')-Listener).
 * State-Updates laufen über die injizierten Setter des Haupt-Hooks.
 */
import firebase from 'firebase/compat/app';
import type { Dispatch, SetStateAction } from 'react';
import { isNetworkErrorMessage } from './guards';

export interface RealtimeListenerDeps<T> {
  setData: Dispatch<SetStateAction<T | null>>;
  setLastUpdated: Dispatch<SetStateAction<number | null>>;
  setIsStale: Dispatch<SetStateAction<boolean>>;
  setIsOffline: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  saveToCache: (data: T) => Promise<void>;
  loadFromCache: () => Promise<T | null>;
}

/**
 * Hängt den 'value'-Listener an `path`.
 * Gibt die Cleanup-Funktion zurück — oder null, wenn das Setup fehlschlug
 * (Fehler wird über setError gemeldet, wie zuvor).
 */
export function attachRealtimeListener<T>(
  path: string,
  deps: RealtimeListenerDeps<T>
): (() => void) | null {
  const {
    setData,
    setLastUpdated,
    setIsStale,
    setIsOffline,
    setError,
    setLoading,
    saveToCache,
    loadFromCache,
  } = deps;
  try {
    const ref = firebase.database().ref(path);
    const listener = ref.on(
      'value',
      async (snapshot) => {
        if (snapshot.exists()) {
          const newData = snapshot.val();
          setData(newData);
          setLastUpdated(Date.now());
          setIsStale(false);
          setError(null);
          setIsOffline(false); // Successful realtime = online
          // Cache aktualisieren
          await saveToCache(newData);
        } else {
          // !exists kann transient sein wenn Firebase RTDB bei einem
          // Netzwerk-Glitch kurz disconnected ist. NICHT auf Cache
          // zurueckfallen (waere potentiell veraltet — z.B. wenn ein
          // Feld nachtraeglich auf dem Server geloescht wurde aber im
          // IDB-Cache noch existiert). State unveraendert lassen — der
          // naechste echte Snapshot setzt die aktuelle Wahrheit.
        }
        setLoading(false);
      },
      (error) => {
        // Bei Netzwerkfehlern auf Cache zurückfallen
        const errorMessage = error?.message || error?.toString() || '';
        if (isNetworkErrorMessage(errorMessage)) {
          setIsOffline(true);
          loadFromCache().then((cachedData) => {
            if (cachedData) {
              setData(cachedData);
              setIsStale(true);
              setError('Offline - zeige gecachte Daten');
            } else {
              setError('Keine Offline-Daten verfügbar');
            }
            setLoading(false);
          });
        } else {
          setError(errorMessage || 'Firebase Fehler');
          setLoading(false);
        }
      }
    );
    return () => ref.off('value', listener);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Realtime setup failed');
    setLoading(false);
    return null;
  }
}
