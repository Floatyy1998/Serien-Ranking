/**
 * Online/Offline-Event-Handling (Reconnect-Sync).
 * Der State (isStale, data, isOffline) bleibt im Haupt-Hook — hier lebt nur
 * der Event-Wiring-Effect plus die pure Refetch-Entscheidung.
 */
import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';

/** Nach einem Reconnect nur refetchen, wenn die Daten stale sind oder fehlen. */
export function shouldRefetchOnReconnect(isStale: boolean, data: unknown): boolean {
  return isStale || !data;
}

export interface ReconnectSyncParams<T> {
  syncOnReconnect: boolean;
  isStale: boolean;
  data: T | null;
  refetch: () => Promise<void>;
  setIsOffline: Dispatch<SetStateAction<boolean>>;
  setIsStale: Dispatch<SetStateAction<boolean>>;
}

export function useReconnectSync<T>({
  syncOnReconnect,
  isStale,
  data,
  refetch,
  setIsOffline,
  setIsStale,
}: ReconnectSyncParams<T>): void {
  useEffect(() => {
    if (!syncOnReconnect) return;
    const handleOnline = () => {
      setIsOffline(false);
      if (shouldRefetchOnReconnect(isStale, data)) {
        refetch();
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      setIsStale(true);
    };
    // Initiale Offline-Status setzen — External-Sync mit dem Network-Status
    // des Browsers, legitimer Setup-Effect.

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOnReconnect, isStale, data, refetch, setIsOffline, setIsStale]);
}
