import { useEffect, useState } from 'react';

const getDayKey = (): string => new Date().toDateString();

/**
 * Kalendertag als Schlüssel; wechselt um Mitternacht und invalidiert damit
 * datumsabhängige Memos. Der Minutentakt pausiert, solange der Tab versteckt
 * ist — beim Zurückkommen wird einmal sofort geprüft.
 */
export const useDayKey = (): string => {
  const [dayKey, setDayKey] = useState(getDayKey);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const check = () => setDayKey((prev) => (prev !== getDayKey() ? getDayKey() : prev));
    const start = () => {
      if (!interval) interval = setInterval(check, 60_000);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        check();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, []);

  return dayKey;
};
