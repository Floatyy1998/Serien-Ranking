import { useEffect, useCallback, type RefObject } from 'react';

interface MagneticOptions {
  /** Strength of the magnetic pull (default: 0.3, range 0-1) */
  strength?: number;
  /** Max distance in px from center before effect kicks in (default: 80) */
  maxDistance?: number;
  /** Return-to-center transition duration in ms (default: 300) */
  returnDuration?: number;
}

/**
 * Applies a magnetic pull effect to an element — it subtly moves toward the cursor
 * when hovering nearby. Desktop-only (requires pointer: fine).
 *
 * Respects prefers-reduced-motion.
 */
export function useMagneticEffect(
  ref: RefObject<HTMLElement | null>,
  options: MagneticOptions = {}
): void {
  const { strength = 0.3, maxDistance = 80, returnDuration = 300 } = options;

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < maxDistance) {
        const pull = (1 - distance / maxDistance) * strength;
        el.style.transform = `translate(${deltaX * pull}px, ${deltaY * pull}px)`;
        el.style.transition = 'transform 0.1s ease-out';
      }
    },
    [ref, strength, maxDistance]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0px, 0px)';
    el.style.transition = `transform ${returnDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
  }, [ref, returnDuration]);

  useEffect(() => {
    // Desktop-only check
    const isFinPointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFinPointer || prefersReducedMotion || !ref.current) return;

    const el = ref.current;
    const parent = el.parentElement || document;

    parent.addEventListener('mousemove', handleMouseMove as EventListener);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove as EventListener);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, handleMouseMove, handleMouseLeave]);
}
