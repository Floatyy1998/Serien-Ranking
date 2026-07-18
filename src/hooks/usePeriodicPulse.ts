import { useEffect, useState } from 'react';

const AMBIENT_ON = 4000;
const AMBIENT_PERIOD = 18000;

/** Global synchronisierter Deko-Puls: alle Ambient-Animationen atmen gemeinsam. */
export function useAmbientPulse(): boolean {
  const [on, setOn] = useState(() => Date.now() % AMBIENT_PERIOD < AMBIENT_ON);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const loop = () => {
      if (stopped) return;
      const phase = Date.now() % AMBIENT_PERIOD;
      const active = phase < AMBIENT_ON;
      setOn(active && !document.hidden);
      timer = setTimeout(loop, active ? AMBIENT_ON - phase : AMBIENT_PERIOD - phase);
    };
    loop();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  return on;
}

/** True, während der globale Ambient-Puls aktiv ist — für Nicht-React-Loops. */
export function isAmbientPhaseActive(): boolean {
  return Date.now() % AMBIENT_PERIOD < AMBIENT_ON;
}

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
