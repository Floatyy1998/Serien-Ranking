import { useEffect, useState } from 'react';

/** Aktuelle Stunde; prüft minütlich, pausiert bei verstecktem Tab. */
export function useCurrentHour(): number {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const check = () => {
      const next = new Date().getHours();
      setHour((prev) => (prev !== next ? next : prev));
    };
    const start = () => {
      if (!timer) timer = setInterval(check, 60000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
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

  return hour;
}
