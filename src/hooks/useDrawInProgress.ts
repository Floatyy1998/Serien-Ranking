import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * D1 — treibt die Draw-In-Animation des Fortschritts-Rings per
 * requestAnimationFrame: schreibt `--prog` (0–100) direkt ans Element,
 * von aktuellem Wert zum Ziel mit Ease-Out. Bewusst JS statt CSS-@property —
 * das Animieren registrierter Custom Properties in Pseudo-Element-Gradients
 * lief in der Praxis nicht zuverlässig (Owner-Repro auf dem Dev-Server).
 *
 * Respektiert prefers-reduced-motion (dann sofort Zielwert). Ohne matchMedia
 * (z. B. jsdom in Tests) wird ebenfalls sofort gesetzt.
 */
export function useDrawInProgress(
  ref: RefObject<HTMLElement | null>,
  target: number,
  duration = 1200
): void {
  const currentRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const instant =
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = currentRef.current;
    const delta = target - from;

    if (instant || Math.abs(delta) < 0.5) {
      currentRef.current = target;
      el.style.setProperty('--prog', String(target));
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + delta * eased;
      currentRef.current = v;
      el.style.setProperty('--prog', v.toFixed(2));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, target, duration]);
}
