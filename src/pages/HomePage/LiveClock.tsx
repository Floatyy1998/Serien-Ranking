import { useEffect, useState } from 'react';
import { isEnglish, t } from '../../services/i18n';

// Isolated clock component - updates every second without re-rendering parent.
// We also pause the 1s ticker when the tab is hidden — a clock on a background
// tab is invisible anyway and would just burn battery on mobile.
export const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => setTime(new Date());
    const start = () => {
      if (timer) return;
      tick();
      timer = setInterval(tick, 1000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, []);
  const locale = isEnglish() ? 'en-US' : 'de-DE';
  return (
    <>
      {time.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
      {' • '}
      {t('{time} Uhr', {
        time: time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
      })}
    </>
  );
};
