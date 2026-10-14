import { useEffect, type RefObject } from 'react';

const AXIS_DECIDE_PX = 6;

const scrollsHorizontally = (el: HTMLElement) => {
  if (el.scrollWidth <= el.clientWidth) return false;
  const { overflowX } = getComputedStyle(el);
  return overflowX === 'auto' || overflowX === 'scroll';
};

/** `touch-action: pan-y` allein lässt iOS bei schrägem Wischen mitscrollen — seitlich begonnene Gesten werden hier festgehalten. */
export function useSwipeAxisLock(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    let start: { x: number; y: number } | null = null;
    let horizontal: boolean | null = null;

    const onStart = (e: TouchEvent) => {
      horizontal = null;
      start = null;
      if (e.touches.length !== 1) return;
      for (let el = e.target as HTMLElement | null; el && el !== node; el = el.parentElement) {
        if (scrollsHorizontally(el)) return;
      }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 1) return;
      if (horizontal === null) {
        const dx = Math.abs(e.touches[0].clientX - start.x);
        const dy = Math.abs(e.touches[0].clientY - start.y);
        if (Math.max(dx, dy) < AXIS_DECIDE_PX) return;
        horizontal = dx > dy;
      }
      if (horizontal && e.cancelable) e.preventDefault();
    };

    node.addEventListener('touchstart', onStart, { passive: true });
    node.addEventListener('touchmove', onMove, { passive: false });
    return () => {
      node.removeEventListener('touchstart', onStart);
      node.removeEventListener('touchmove', onMove);
    };
  }, [ref, enabled]);
}
