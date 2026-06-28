/**
 * CountUp - Animates a number from 0 to `value` on mount. Falls back to the
 * static value when reduced motion is requested. Supports a decimal display.
 */

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: number;
  /** Render with one decimal place (e.g. average ratings) */
  decimals?: 0 | 1;
  durationMs?: number;
}

export const CountUp = ({ value, decimals = 0, durationMs = 900 }: CountUpProps) => {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, reduce]);

  return <>{decimals === 1 ? display.toFixed(1) : Math.round(display)}</>;
};
