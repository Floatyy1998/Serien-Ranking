import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

export const READING_AREA = /^\/(manga|books|reading)(\/|$)/;
/** Detailseiten, die man von /ratings aus öffnet — die Rückkehr von dort ändert die Herkunft nicht. */
const DETAIL = /^\/(series|movie|rating|books|manga)\/[^/]+$/;
const KEY = 'ratingsFromReading';

const listeners = new Set<() => void>();
let lastPath: string | null = null;

const read = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

const write = (fromReading: boolean) => {
  try {
    sessionStorage.setItem(KEY, fromReading ? '1' : '0');
  } catch {
    /* egal */
  }
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Wer /ratings von einer Lese-Seite aus betritt, kommt mit Home zurück zu /reading. */
export function noteRouteChange(previous: string | null, next: string): void {
  if (next !== '/ratings' || !previous || previous === '/ratings' || DETAIL.test(previous)) return;
  write(READING_AREA.test(previous));
}

/** Einmal in der App eingehängt: merkt sich, woher man auf die Bewertungsseite kam. */
export function useRatingsOriginTracker(): void {
  const { pathname } = useLocation();
  useEffect(() => {
    noteRouteChange(lastPath, pathname);
    lastPath = pathname;
  }, [pathname]);
}

export const useRatingsFromReading = (): boolean => useSyncExternalStore(subscribe, read, read);
