import { useEffect, useState } from 'react';

// Dauer-Animationen über Glas-Flächen zwingen den Compositor zu 60fps-Blur-
// Rerastern — periodische Pulse wirken gleich lebendig bei ~10% der Kosten
export function usePeriodicPulse(activeMs: number, idleMs: number, enabled = true): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const cycle = (isActive: boolean) => {
      if (cancelled) return;
      setActive(isActive);
      timer = setTimeout(() => cycle(!isActive), isActive ? activeMs : idleMs);
    };
    cycle(true);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeMs, idleMs, enabled]);

  return enabled && active;
}
