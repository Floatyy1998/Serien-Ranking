import { useEffect, useState } from 'react';

// Isolated clock component - updates every second without re-rendering parent
export const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      {time.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
      {' • '}
      {time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
    </>
  );
};
