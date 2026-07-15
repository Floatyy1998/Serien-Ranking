import { useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_SLOT_OPTIONS } from '../config/navItems';
import { hapticTap } from '../lib/haptics';
import { isNativeApp } from '../services/nativeShell';
import { useNavSlots } from './useNavConfig';

const MIN_DISTANCE_X = 70;
const MAX_DURATION_MS = 600;
/** Rand-Zone aussparen: dort wohnt die System-Back-Geste (Android/iOS). */
const EDGE_GUARD_PX = 28;

/** Horizontale Scroller (Poster-Reihen etc.) haben Vorrang vor dem Tab-Swipe. */
const startsInHorizontalScroller = (start: EventTarget | null): boolean => {
  let el = start instanceof Element ? start : null;
  while (el && el !== document.body) {
    if (el.scrollWidth > el.clientWidth + 4) {
      const { overflowX } = getComputedStyle(el);
      if (overflowX === 'auto' || overflowX === 'scroll') return true;
    }
    el = el.parentElement;
  }
  return false;
};

interface SwipeHandlers {
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

/**
 * Tab-Wechsel per Swipe in der nativen App: Auf den Haupt-Nav-Seiten wischt
 * man horizontal zwischen den Zielen der unteren Leiste (inkl. „Mehr").
 * Im Browser komplett inaktiv.
 */
export const useSwipeTabNavigation = (): SwipeHandlers => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navSlots = useNavSlots();
  const touch = useRef<{ x: number; y: number; t: number; blocked: boolean } | null>(null);

  const paths = useMemo(() => {
    const slotPaths = navSlots
      .map((id) => NAV_SLOT_OPTIONS.find((o) => o.id === id)?.path)
      .filter((p): p is string => !!p);
    return ['/', ...slotPaths, '/profile'];
  }, [navSlots]);

  if (!isNativeApp()) return {};

  return {
    onTouchStart: (e) => {
      if (e.touches.length !== 1) {
        touch.current = null;
        return;
      }
      const { clientX, clientY } = e.touches[0];
      touch.current = {
        x: clientX,
        y: clientY,
        t: Date.now(),
        blocked:
          clientX < EDGE_GUARD_PX ||
          clientX > window.innerWidth - EDGE_GUARD_PX ||
          startsInHorizontalScroller(e.target),
      };
    },
    onTouchMove: (e) => {
      if (e.touches.length > 1) touch.current = null;
    },
    onTouchEnd: (e) => {
      const start = touch.current;
      touch.current = null;
      if (!start || start.blocked) return;
      if (Date.now() - start.t > MAX_DURATION_MS) return;

      const end = e.changedTouches[0];
      if (!end) return;
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;
      if (Math.abs(dx) < MIN_DISTANCE_X || Math.abs(dx) < Math.abs(dy) * 1.8) return;

      const index = paths.indexOf(pathname);
      if (index === -1) return;
      const target = index + (dx < 0 ? 1 : -1);
      if (target < 0 || target >= paths.length) return;

      hapticTap();
      navigate(paths[target]);
    },
  };
};
